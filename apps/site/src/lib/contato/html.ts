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
  const mensagemErro = (campo: string, codigo: string) => {
    const f = contato.formulario;
    if (codigo === 'OBRIGATORIO' && ['nome', 'contato', 'mensagem'].includes(campo)) return `${t(f.erro, e.idioma)} ${t(f.preencher[campo as 'nome' | 'contato' | 'mensagem'], e.idioma)}`;
    return `${t(f.erro, e.idioma)} ${t(campo === 'mensagem' ? f.limiteMensagem : f.limiteCampo, e.idioma)}`;
  };
  const editar = () => formulario(CAMPOS.map(c => {
    const erro = e.campos?.[c] ? mensagemErro(c, e.campos[c]) : undefined;
    const atributos = `id="pedido-${c}" name="${c}"${erro ? ` aria-invalid="true" aria-describedby="erro-${c}"` : ''}`;
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
    conteudo = `<div class="formulario-erros" tabindex="-1" autofocus><h2 role="alert">${escapar(t(contato.formulario.problema, e.idioma))}</h2><p>${escapar(e.codigo ?? 'VALIDACAO')}</p><ul>${Object.entries(e.campos ?? {}).map(([c, erro]) => `<li><a href="#pedido-${escapar(c)}">${escapar(mensagemErro(c, erro))}</a></li>`).join('')}</ul></div>${editar()}`;
  }
  const html = `<!doctype html><html lang="${e.idioma}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${e.status >= 400 ? 'Erro: ' : ''}Floway — ${tecnico('Contato', 'Contact')}</title><style>*{box-sizing:border-box}body{margin:0;padding:24px 30px;background:#f7f7f5;color:#121212;font:18px/1.4 system-ui;overflow-wrap:anywhere}nav{display:flex;gap:24px;font:12px monospace}a{color:inherit;text-decoration-color:#002fa7;text-underline-offset:4px}.frase-contato{font-size:clamp(24px,2.2vw,44px);line-height:1;letter-spacing:-.02em;text-transform:uppercase;margin:32px 0}.pedido-contato{max-width:760px;margin:32px auto}label,input,textarea{display:block}label,dt{font:12px/1.5 monospace;text-transform:uppercase}input,textarea{width:100%;padding:8px 0;border:0;border-bottom:1px solid #121212;background:transparent;color:inherit;font:inherit}input[type=hidden]{display:none}.formulario-campo{margin:16px 0}button,summary{min-height:44px;margin:12px 0;padding:8px;border:0;background:transparent;color:inherit;text-decoration:underline;text-decoration-color:#002fa7;font:13px monospace;cursor:pointer}dd{white-space:pre-wrap;margin:4px 0 20px}ul{padding:0;list-style:none}.formulario-erros a{display:block;min-height:44px;padding:12px 0}.formulario-erros h2{font:18px system-ui}.formulario-erros p,.formulario-campo p{font:13px monospace}.formulario-erros:focus,:focus-visible{outline:2px solid #002fa7;outline-offset:4px}.rodape{text-align:center;font:14px/1.4 Georgia,serif;margin-top:32px}.rodape i{font-size:12px}details{margin:16px 0}@media(max-width:899px){body{padding:18px}.frase-contato{font-size:24px}.rodape{font-size:12px}}</style></head><body><header><nav aria-label="${tecnico('Navegação', 'Navigation')}"><a href="${rota('inicio', e.idioma)}">Floway</a><a href="${rota('privacidade', e.idioma)}">${escapar(t(contato.formulario.aviso.link, e.idioma))}</a></nav></header><main><h1 class="frase-contato">${escapar(t(contato.frase, e.idioma))}</h1><section class="pedido-contato">${conteudo}</section></main><footer class="rodape"><p><i>${escapar(t(contato.rodape.especialidades.rotulo, e.idioma))}</i> ${escapar(t(contato.rodape.especialidades.valor, e.idioma))}</p><p><i>${escapar(t(contato.rodape.localizacao.rotulo, e.idioma))}</i> ${escapar(t(contato.rodape.localizacao.valor, e.idioma))} · ${escapar(t(contato.rodape.instagram.valor, e.idioma))} · ${escapar(t(contato.rodape.direitos, e.idioma))}</p></footer></body></html>`;
  return new Response(html, { status: e.status, headers: { ...PRIVADO, 'Content-Type': 'text/html; charset=utf-8', ...(e.retryAfter ? { 'Retry-After': String(e.retryAfter) } : {}), 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'" } });
}
