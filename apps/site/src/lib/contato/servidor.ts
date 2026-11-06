import 'server-only';
import { randomUUID } from 'node:crypto';
import type { Idioma } from '@/conteudo/textos';
import type { Pedido } from '@/lib/pedidoDeContato';
import { envioConfigurado, iaConfigurada, lerConfiguracao, origemSegura, type Configuracao } from './configuracao';
import { criarIntencao, validarIntencao, type IntencaoValidada } from './intencao';
import { entregarResend } from './resend';
import { conversarGemini } from './gemini';
import { responderContatoHtml } from './html';
import { CAMPOS, FalhaContato, PRIVADO, idiomaValido, lerBytes, lerFormulario, lerJson, validarConversa, validarFormulario, validarPedido } from './protocolo';

export type ContatoServidorDTO = { versao: 'contato-b.1'; intencao: string | null; chave: string | null; repetirAte: string | null; conversaDisponivel: boolean; envioDisponivel: boolean };
type Dependencias = { configuracao: Configuracao; fetch: typeof fetch; agora: () => number };
const dependenciasPadrao = (): Dependencias => ({ configuracao: lerConfiguracao(), fetch: globalThis.fetch, agora: Date.now });

export function obterContatoServidor(idioma: Idioma): ContatoServidorDTO {
  const configuracao = lerConfiguracao();
  const envioDisponivel = configuracao.envioAtivo && envioConfigurado(configuracao);
  const dto: ContatoServidorDTO = { versao: 'contato-b.1', intencao: null, chave: null, repetirAte: null, conversaDisponivel: iaConfigurada(configuracao), envioDisponivel };
  if (envioDisponivel) {
    const agora = Date.now();
    dto.intencao = criarIntencao(idioma, configuracao, agora);
    const intencao = validarIntencao(dto.intencao, idioma, configuracao, agora);
    dto.chave = intencao.chave;
    dto.repetirAte = intencao.expiraEm;
  }
  return dto;
}

function validarOrigem(req: Request, c: Configuracao) {
  if (!origemSegura(c.origem)) throw new FalhaContato(503, 'ENTREGA_INDISPONIVEL');
  if (req.headers.get('origin') !== c.origem || new URL(req.url).origin !== c.origem) throw new FalhaContato(403, 'ORIGEM_INVALIDA');
}

// Contenção por instância: sem proxy aprovado, todos compartilham o bucket desconhecido.
// Não é deduplicação nem cota por pessoa/global; nunca confiar em XFF livre.
const tentativas = new Map<string, number[]>();
function admitir(tipo: 'envio' | 'ia', origem: string, agora: number): number | null {
  const janela = 600000;
  for (const [chave, tempos] of tentativas) {
    const validos = tempos.filter(t => agora - t < janela);
    if (validos.length) tentativas.set(chave, validos); else tentativas.delete(chave);
  }
  const chave = `${tipo}:${origem}:desconhecido`;
  const tempos = tentativas.get(chave) ?? [];
  if (tempos.length >= (tipo === 'envio' ? 5 : 10)) return Math.max(1, Math.ceil((tempos[0] + janela - agora) / 1000));
  tentativas.set(chave, [...tempos, agora]);
  return null;
}
export function metodoNaoPermitido(tipo: 'contato' | 'conversa' = 'contato'): Response {
  const requestId = randomUUID();
  const codigo = 'METODO_NAO_PERMITIDO';
  const dados = tipo === 'conversa' ? { erro: { codigo, mensagem: 'Método não permitido.', repetivel: false }, requestId } : { ok: false, estado: 'falha', codigo, repetivel: false, requestId };
  return Response.json(dados, { status: 405, headers: { ...PRIVADO, Allow: 'POST' } });
}

export async function receberContato(req: Request, deps = dependenciasPadrao(), formulario?: FormData): Promise<Response> {
  const requestId = randomUUID();
  let corpo = formulario;
  let idioma: Idioma = formulario?.get('idioma') === 'en' ? 'en' : 'pt';
  let intencao: IntencaoValidada | null = null;
  let possivelEfeito = false;
  const valor = (campo: string) => typeof corpo?.get(campo) === 'string' ? corpo.get(campo) as string : '';
  const responder = (status: number, dados: Record<string, unknown>, retryAfter?: number) => {
    if (req.headers.get('accept')?.includes('application/json')) return Response.json({ ...dados, requestId }, { status, headers: { ...PRIVADO, ...(retryAfter ? { 'Retry-After': String(retryAfter) } : {}) } });
    const pedido = Object.fromEntries(CAMPOS.map(c => [c, valor(c).trim()])) as Pedido;
    return responderContatoHtml({ status, idioma, pedido, acao: valor('acao'), estado: String(dados.estado ?? 'falha'), codigo: typeof dados.codigo === 'string' ? dados.codigo : undefined, campos: dados.campos as Record<string, string> | undefined, intencao: valor('intencao'), chave: intencao?.chave ?? (valor('chave') || req.headers.get('idempotency-key') || ''), repetirAte: intencao?.expiraEm ?? null, agora: deps.agora(), retryAfter });
  };
  try {
    validarOrigem(req, deps.configuracao);
    corpo ??= await lerFormulario(req, false);
    if (corpo.get('idioma') === 'en') idioma = 'en';
    validarFormulario(corpo);
    if (corpo.get('versao') !== 'contato-b.1' || !idiomaValido(corpo.get('idioma')) || !['revisar', 'enviar'].includes(valor('acao'))) throw new FalhaContato(422, 'VALIDACAO');
    if (valor('site')) return responder(202, { ok: true, estado: 'recebido' });
    if (!envioConfigurado(deps.configuracao)) return responder(503, { ok: false, estado: 'falha', codigo: 'ENTREGA_INDISPONIVEL', repetivel: true }, 30);
    intencao = validarIntencao(valor('intencao'), idioma, deps.configuracao, deps.agora());
    const pedido = validarPedido(corpo);
    if (valor('acao') === 'revisar') return responder(200, { ok: true, estado: 'revisao', pedido });
    if (valor('confirmar') !== 'true') throw new FalhaContato(422, 'VALIDACAO', { confirmar: 'OBRIGATORIO' });
    const chaveHeader = req.headers.get('idempotency-key');
    const chaveCampo = corpo.get('chave');
    if ((chaveHeader !== null && chaveHeader !== intencao.chave) || (chaveCampo !== null && chaveCampo !== intencao.chave) || (chaveHeader === null && chaveCampo === null)) throw new FalhaContato(422, 'CHAVE_INVALIDA');
    if (Date.parse(intencao.expiraEm) - deps.agora() <= 30000) throw new FalhaContato(410, 'INTENCAO_EXPIRADA');
    const retryAfter = admitir('envio', deps.configuracao.origem, deps.agora());
    if (retryAfter) return responder(429, { ok: false, estado: 'falha', codigo: 'LIMITE_ATINGIDO', repetivel: true }, retryAfter);
    possivelEfeito = true;
    const resultado = await entregarResend(pedido, intencao, deps);
    if (resultado.estado === 'aceito') return responder(200, { ok: true, estado: 'aceito', repetirAte: intencao.expiraEm });
    return responder(resultado.status, { ok: false, estado: resultado.estado, codigo: resultado.codigo, repetivel: resultado.repetivel, ...(resultado.estado === 'incerto' ? { repetirAte: intencao.expiraEm } : {}) }, resultado.retryAfter);
  } catch (e) {
    if (possivelEfeito) return responder(202, { ok: false, estado: 'incerto', codigo: 'RESULTADO_INCERTO', repetirAte: intencao?.expiraEm ?? null }, 2);
    const falha = e instanceof FalhaContato ? e : new FalhaContato(500, 'ERRO_INTERNO');
    return responder(falha.status, { ok: false, estado: 'falha', codigo: falha.codigo, ...(falha.campos ? { campos: falha.campos } : {}), repetivel: falha.status === 503 }, falha.status === 503 ? 30 : undefined);
  }
}

export async function receberConversa(req: Request, deps = dependenciasPadrao()): Promise<Response> {
  const requestId = randomUUID();
  let idioma: Idioma = 'pt';
  const erro = (status: number, codigo: string, retryAfter?: number) => {
    const mensagens = idioma === 'en' ? { indisponivel: 'Use the simple form.', timeout: 'The response took too long. Text preserved.', outro: 'Unable to process this conversation.' } : { indisponivel: 'Use o formulário simples.', timeout: 'A resposta demorou. Texto preservado.', outro: 'Não foi possível processar esta conversa.' };
    return Response.json({ erro: { codigo, mensagem: codigo === 'IA_INDISPONIVEL' ? mensagens.indisponivel : codigo === 'IA_TIMEOUT' ? mensagens.timeout : mensagens.outro, repetivel: status === 429 }, requestId }, { status, headers: { ...PRIVADO, ...(retryAfter ? { 'Retry-After': String(retryAfter) } : {}) } });
  };
  try {
    validarOrigem(req, deps.configuracao);
    if (!req.headers.get('accept')?.includes('application/json')) throw new FalhaContato(406, 'RESPOSTA_NAO_SUPORTADA');
    if (req.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new FalhaContato(415, 'TIPO_NAO_SUPORTADO');
    const bytes = await lerBytes(req);
    let json: string;
    try { json = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { throw new FalhaContato(400, 'CORPO_INVALIDO'); }
    const entrada = validarConversa(lerJson(json));
    idioma = entrada.idioma;
    if (!iaConfigurada(deps.configuracao)) return erro(503, 'IA_INDISPONIVEL');
    const retryAfter = admitir('ia', deps.configuracao.origem, deps.agora());
    if (retryAfter) return erro(429, 'LIMITE_ATINGIDO', retryAfter);
    const resultado = await conversarGemini(entrada, deps);
    if (resultado.status !== 200) return erro(resultado.status, resultado.codigo);
    return Response.json({ turnoId: entrada.turnoId, resposta: resultado.resposta, mensagemSugerida: resultado.mensagemSugerida }, { headers: PRIVADO });
  } catch (e) {
    if (e instanceof FalhaContato) return erro(e.status, e.codigo === 'ENTREGA_INDISPONIVEL' ? 'IA_INDISPONIVEL' : e.codigo);
    return erro(500, 'ERRO_INTERNO');
  }
}
