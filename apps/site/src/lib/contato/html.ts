import { contato } from '@/conteudo/contato';
import { t, type Idioma } from '@/conteudo/textos';
import { rota } from '@/lib/idioma';
import type { Pedido } from '@/lib/pedidoDeContato';
import { CAMPOS, PRIVADO } from './protocolo';

export type EstadoHtml = { status: number; idioma: Idioma; acao: string; estado: string; pedido: Pedido; intencao: string; chave: string; repetirAte: string | null; agora: number; codigo?: string; campos?: Record<string, string>; retryAfter?: number };
const escapar = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function responderContatoHtml(e: EstadoHtml): Response {
  const en = e.idioma === 'en';
  const tecnico = (pt: string, ingles: string) => en ? ingles : pt;
  const oculto = (nome: string, valor: string) => `<input type="hidden" name="${nome}" value="${escapar(valor)}">`;
  const comuns = oculto('versao', 'contato-b.1') + oculto('idioma', e.idioma) + oculto('site', '') + oculto('intencao', e.intencao);
  const copia = CAMPOS.map(c => oculto(c, e.pedido[c])).join('');
  const resumo = `<dl>${CAMPOS.map(c => `<dt>${escapar(t(contato.formulario[c], e.idioma))}</dt><dd>${escapar(e.pedido[c])}</dd>`).join('')}</dl>`;
  const formulario = (campos: string, botao: string) => `<form method="post" action="/api/contato" class="formulario-contato">${comuns}${campos}<button type="submit">${escapar(botao)}</button></form>`;
  const editar = () => formulario(CAMPOS.map(c => {
    const erro = e.campos?.[c];
    const atributos = `id="pedido-${c}" name="${c}" maxlength="${c === 'mensagem' ? 5000 : 200}"${c !== 'empresa' ? ' required' : ''}${erro ? ` aria-invalid="true" aria-describedby="erro-${c}"` : ''}`;
    return `<div class="formulario-campo"><label for="pedido-${c}">${escapar(t(contato.formulario[c], e.idioma))}</label>${erro ? `<p id="erro-${c}">${escapar(erro)}</p>` : ''}${c === 'mensagem' ? `<textarea ${atributos} rows="5">${escapar(e.pedido[c])}</textarea>` : `<input type="text" ${atributos} value="${escapar(e.pedido[c])}">`}</div>`;
  }).join('') + oculto('acao', 'revisar'), tecnico('Revisar', 'Review'));
  let conteudo: string;
  if (e.estado === 'aceito') {
    conteudo = `<p role="status" tabindex="-1" autofocus>${tecnico('Envio aceito pelo serviço.', 'Submission accepted by the delivery service.')}</p>`;
  } else if (e.estado === 'recebido') {
    conteudo = `<p role="status">${tecnico('Requisição recebida.', 'Request received.')}</p>`;
  } else if (e.acao === 'enviar') {
    const podeRepetir = !!e.repetirAte && !!e.intencao && !!e.chave && e.agora + (e.retryAfter ?? 2) * 1000 < Date.parse(e.repetirAte) - 30000;
    conteudo = `<p role="alert" tabindex="-1" autofocus>${tecnico('Resultado pendente. Esta resposta não exclui aceitação de uma tentativa anterior. Conserve esta cópia para conferência manual com a equipe.', 'Result pending. This response does not exclude acceptance of an earlier attempt. Keep this copy for manual verification with the team.')}</p>${resumo}<p>${escapar(e.codigo ?? 'RESULTADO_INCERTO')}</p>`;
    if (podeRepetir) conteudo += `<p>${tecnico('Aguarde pelo menos', 'Wait at least')} ${e.retryAfter ?? 2} ${tecnico('segundos antes de repetir o mesmo envio. Limite:', 'seconds before repeating this same submission. Deadline:')} ${escapar(e.repetirAte!)}</p>${formulario(copia + oculto('acao', 'enviar') + oculto('confirmar', 'true') + oculto('chave', e.chave), tecnico('Repetir o mesmo envio após a espera', 'Repeat the same submission after waiting'))}`;
    else conteudo += comuns + copia + oculto('chave', e.chave);
  } else if (e.estado === 'revisao') {
    conteudo = `${resumo}${formulario(copia + oculto('acao', 'enviar') + oculto('confirmar', 'true') + oculto('chave', e.chave), tecnico('Confirmar e enviar', 'Confirm and send'))}<details><summary>${tecnico('Ajustar', 'Edit')}</summary>${editar()}</details>`;
  } else {
    conteudo = `<div class="formulario-erros" role="alert" tabindex="-1" autofocus><h2>${escapar(t(contato.formulario.problema, e.idioma))}</h2><p>${escapar(e.codigo ?? 'VALIDACAO')}</p><ul>${Object.entries(e.campos ?? {}).map(([c, erro]) => `<li><a href="#pedido-${escapar(c)}">${escapar(erro)}</a></li>`).join('')}</ul></div>${editar()}`;
  }
  const html = `<!doctype html><html lang="${e.idioma}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${e.status >= 400 ? 'Erro: ' : ''}Floway — ${tecnico('Contato', 'Contact')}</title><style>body{font:1rem system-ui;max-width:48rem;margin:2rem auto;padding:0 1rem;overflow-wrap:anywhere}label,input,textarea{display:block}input,textarea{box-sizing:border-box;width:100%;font:inherit}button,summary{margin:1rem 0}dd{white-space:pre-wrap;margin:0 0 1rem}nav{display:flex;gap:1rem}input[type=hidden]{display:none}</style></head><body><header><nav aria-label="${tecnico('Navegação', 'Navigation')}"><a href="${rota('inicio', e.idioma)}">Floway</a><a href="${rota('privacidade', e.idioma)}">${escapar(t(contato.formulario.aviso.link, e.idioma))}</a></nav></header><main><h1>${tecnico('Contato', 'Contact')}</h1>${conteudo}</main></body></html>`;
  return new Response(html, { status: e.status, headers: { ...PRIVADO, 'Content-Type': 'text/html; charset=utf-8', ...(e.retryAfter ? { 'Retry-After': String(e.retryAfter) } : {}), 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'" } });
}
