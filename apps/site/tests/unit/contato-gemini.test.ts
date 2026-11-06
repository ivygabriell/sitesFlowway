// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { conversarGemini } from '@/lib/contato/gemini';
import { lerConfiguracao } from '@/lib/contato/configuracao';

const configuracao = lerConfiguracao({ CONTATO_IA_ATIVA: 'true', CONTATO_IA_CONTROLES_APROVADOS: 'true', CONTATO_ORIGEM: 'https://floway.example', GEMINI_API_KEY: 'teste', GEMINI_MODELO: 'modelo-aprovado-no-teste', GEMINI_API_VERSAO: 'v1beta' });
const entrada = { idioma: 'pt' as const, turnoId: '10000000-0000-4000-8000-000000000001', historico: [{ papel: 'usuario' as const, texto: 'Um site' }, { papel: 'assistente' as const, texto: 'Qual objetivo?' }], mensagem: 'Apresentar serviços' };
const retorno = (saida = { resposta: 'Qual público o site deve atender?', mensagemSugerida: null as string | null }, extras = {}) => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(saida) }] } }], usageMetadata: { candidatesTokenCount: 50, thoughtsTokenCount: 100 }, ...extras });
afterEach(() => vi.useRealTimers());

describe('Gemini conta e responde sem entrega', () => {
  it('conta requisição completa e limita saída estruturada incluindo pensamento', async () => {
    const chamadas: { url: string; body: Record<string, unknown> }[] = [];
    const fetchFalso: typeof fetch = async (url, init) => {
      chamadas.push({ url: String(url), body: JSON.parse(String(init?.body)) });
      return Response.json(chamadas.length === 1 ? { totalTokens: 8192 } : retorno());
    };
    const r = await conversarGemini(entrada, { configuracao, fetch: fetchFalso });
    expect(r).toMatchObject({ status: 200, resposta: 'Qual público o site deve atender?', mensagemSugerida: null });
    expect(chamadas).toHaveLength(2);
    expect(chamadas[0].url).toMatch(/:countTokens$/);
    expect(chamadas[1].url).toMatch(/:generateContent$/);
    const geracao = chamadas[1].body;
    expect(chamadas[0].body.generateContentRequest).toEqual({ model: 'models/modelo-aprovado-no-teste', ...geracao });
    expect(geracao.generationConfig).toMatchObject({ maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 1024 }, candidateCount: 1, responseMimeType: 'application/json' });
    expect(geracao).not.toHaveProperty('tools');
    expect(geracao.contents).toEqual([{ role: 'user', parts: [{ text: 'Um site' }] }, { role: 'model', parts: [{ text: 'Qual objetivo?' }] }, { role: 'user', parts: [{ text: 'Apresentar serviços' }] }]);
  });
  it('não gera com contagem excessiva/ilegível e não chama sem modelo/ativação', async () => {
    for (const totalTokens of [8193, null, -1]) {
      const f = vi.fn(async () => Response.json({ totalTokens }));
      expect((await conversarGemini(entrada, { configuracao, fetch: f })).status).not.toBe(200);
      expect(f).toHaveBeenCalledTimes(1);
    }
    for (const c of [lerConfiguracao({}), { ...configuracao, modelo: '' }, { ...configuracao, controlesIA: false }, { ...configuracao, apiVersao: '' }]) {
      const f = vi.fn();
      expect(await conversarGemini(entrada, { configuracao: c, fetch: f })).toMatchObject({ status: 503, codigo: 'IA_INDISPONIVEL' });
      expect(f).not.toHaveBeenCalled();
    }
  });
  it('rejeita bloqueio, truncamento, tipos, promessas, sensíveis e teto combinado', async () => {
    const ruins = [retorno({ resposta: '', mensagemSugerida: null }), retorno({ resposta: 'Entregaremos em 5 dias por R$ 500', mensagemSugerida: null }), retorno({ resposta: 'Informe sua senha e CPF', mensagemSugerida: null }), retorno({ resposta: 'Seu pedido foi enviado.', mensagemSugerida: null }), retorno(undefined, { candidates: [{ finishReason: 'MAX_TOKENS' }] }), retorno(undefined, { promptFeedback: { blockReason: 'SAFETY' } }), retorno(undefined, { usageMetadata: { candidatesTokenCount: 1000, thoughtsTokenCount: 1049 } }), retorno(undefined, { usageMetadata: {} })];
    for (const saida of ruins) {
      let n = 0;
      const f = vi.fn(async () => Response.json(++n === 1 ? { totalTokens: 100 } : saida));
      expect(await conversarGemini(entrada, { configuracao, fetch: f })).toMatchObject({ status: 502, codigo: 'IA_RESPOSTA_INVALIDA' });
      expect(f).toHaveBeenCalledTimes(2);
    }
  });
  it.each(['O preço será 100 reais.', 'Prazo de entrega: amanhã.', 'Your project is available immediately.', 'Seu pedido foi aceito.', 'Send your bank details.'])('não exibe promessa ou pedido sensível: %s', async resposta => {
    let n = 0;
    const f: typeof fetch = async () => Response.json(++n === 1 ? { totalTokens: 100 } : retorno({ resposta, mensagemSugerida: null }));
    expect(await conversarGemini(entrada, { configuracao, fetch: f })).toMatchObject({ status: 502, codigo: 'IA_RESPOSTA_INVALIDA' });
  });
  it.each([3000, 15000])('encerra contagem/geração no prazo %i sem retentar', async prazo => {
    vi.useFakeTimers();
    let n = 0;
    const f = vi.fn(async () => {
      if (prazo === 15000 && ++n === 1) return Response.json({ totalTokens: 100 });
      return new Promise<Response>(() => {});
    });
    const p = conversarGemini(entrada, { configuracao, fetch: f });
    await vi.advanceTimersByTimeAsync(prazo);
    expect(await p).toMatchObject({ status: 504, codigo: 'IA_TIMEOUT' });
    expect(f).toHaveBeenCalledTimes(prazo === 3000 ? 1 : 2);
  });
});
