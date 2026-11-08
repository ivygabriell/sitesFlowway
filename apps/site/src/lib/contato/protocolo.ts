import type { Pedido } from '@/lib/pedidoDeContato';
import type { Idioma } from '@/conteudo/textos';

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const CAMPOS = ['nome', 'empresa', 'contato', 'mensagem'] as const;
export const PRIVADO = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex' };
export class FalhaContato extends Error {
  constructor(public status: number, public codigo: string, public campos?: Record<string, string>) { super(codigo); }
}
export function objeto(v: unknown): v is Record<string, unknown> { return v !== null && typeof v === 'object' && !Array.isArray(v); }
export function somente(v: Record<string, unknown>, nomes: readonly string[]) { return Object.keys(v).every(k => nomes.includes(k)); }
export function idiomaValido(v: unknown): v is Idioma { return v === 'pt' || v === 'en'; }
export function texto(v: unknown, min: number, max: number): v is string { return typeof v === 'string' && v.trim().length >= min && v.trim().length <= max; }

export async function lerBytes(req: Pick<Request, 'body'>, prazoMs = 2000): Promise<Uint8Array> {
  const leitor = req.body?.getReader();
  if (!leitor) return new Uint8Array();
  let temporizador: ReturnType<typeof setTimeout>;
  const prazo = new Promise<never>((_, rejeitar) => { temporizador = setTimeout(() => rejeitar(new FalhaContato(400, 'CORPO_INVALIDO')), prazoMs); });
  const partes: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await Promise.race([leitor.read(), prazo]);
      if (done) break;
      total += value.byteLength;
      if (total > 65536) { void leitor.cancel().catch(() => {}); throw new FalhaContato(413, 'CORPO_EXCESSIVO'); }
      partes.push(value);
    }
  } catch (e) {
    void leitor.cancel().catch(() => {});
    if (e instanceof FalhaContato) throw e;
    throw new FalhaContato(400, 'CORPO_INVALIDO');
  } finally { clearTimeout(temporizador!); leitor.releaseLock(); }
  const bytes = new Uint8Array(total);
  let posicao = 0;
  for (const parte of partes) { bytes.set(parte, posicao); posicao += parte.byteLength; }
  return bytes;
}
export function validarFormulario(corpo: FormData) {
  const vistos = new Set<string>();
  for (const [campo, valor] of corpo) {
    if (vistos.has(campo) || ![...CAMPOS, 'idioma', 'site', 'versao', 'intencao', 'acao', 'confirmar', 'chave'].includes(campo) || typeof valor !== 'string') throw new FalhaContato(422, 'VALIDACAO');
    vistos.add(campo);
  }
}
export async function lerFormulario(req: Request, estrito = true): Promise<FormData> {
  const tipo = req.headers.get('content-type') ?? '';
  const mime = tipo.split(';')[0].trim().toLowerCase();
  if (mime !== 'application/x-www-form-urlencoded' && mime !== 'multipart/form-data') throw new FalhaContato(415, 'TIPO_NAO_SUPORTADO');
  const bytes = await lerBytes(req);
  try {
    if (mime === 'application/x-www-form-urlencoded') {
      const s = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      // URLSearchParams tolera escapes quebrados; o protocolo não.
      for (const parte of s.split('&')) for (const item of parte.split('=')) decodeURIComponent(item.replace(/\+/g, ' '));
    }
    const corpo = await new Response(bytes as BodyInit, { headers: { 'content-type': tipo } }).formData();
    if (estrito) validarFormulario(corpo);
    return corpo;
  } catch (e) {
    if (e instanceof FalhaContato) throw e;
    throw new FalhaContato(400, 'CORPO_INVALIDO');
  }
}

// JSON.parse aceita chaves repetidas. A varredura lexical verifica cada objeto antes dele.
export function lerJson(textoJson: string): unknown {
  const objetos: (Set<string> | null)[] = [];
  try {
    for (let i = 0; i < textoJson.length; i++) {
      const c = textoJson[i];
      if (c === '{') objetos.push(new Set());
      else if (c === '[') objetos.push(null);
      else if (c === '}' || c === ']') objetos.pop();
      else if (c === '"') {
        const inicio = i++;
        for (; i < textoJson.length; i++) { if (textoJson[i] === '\\') i++; else if (textoJson[i] === '"') break; }
        let proximo = i + 1;
        while (/\s/.test(textoJson[proximo] ?? '') && proximo < textoJson.length) proximo++;
        if (textoJson[proximo] === ':') {
          const nome = JSON.parse(textoJson.slice(inicio, i + 1));
          const chaves = objetos[objetos.length - 1];
          if (chaves?.has(nome)) throw new FalhaContato(422, 'VALIDACAO');
          chaves?.add(nome);
        }
      }
    }
    return JSON.parse(textoJson);
  } catch (e) { if (e instanceof FalhaContato) throw e; throw new FalhaContato(400, 'CORPO_INVALIDO'); }
}

export function validarPedido(corpo: FormData): Pedido {
  const campos: Record<string, string> = {};
  const pedido = {} as Pedido;
  for (const campo of CAMPOS) {
    const valor = corpo.get(campo) ?? '';
    if (typeof valor !== 'string') { campos[campo] = 'TIPO_INVALIDO'; continue; }
    pedido[campo] = valor.trim();
    if (campo !== 'empresa' && !pedido[campo]) campos[campo] = 'OBRIGATORIO';
    else if (pedido[campo].length > (campo === 'mensagem' ? 5000 : 200)) campos[campo] = 'LIMITE_EXCEDIDO';
  }
  if (Object.keys(campos).length) throw new FalhaContato(422, 'VALIDACAO', campos);
  return pedido;
}
export type EntradaConversa = { idioma: Idioma; turnoId: string; historico: { papel: 'usuario' | 'assistente'; texto: string }[]; mensagem: string };
export function validarConversa(entrada: unknown): EntradaConversa {
  const falhar = (): never => { throw new FalhaContato(422, 'VALIDACAO'); };
  if (!objeto(entrada) || !somente(entrada, ['idioma', 'turnoId', 'historico', 'mensagem'])) return falhar();
  if (!idiomaValido(entrada.idioma) || typeof entrada.turnoId !== 'string' || !UUID.test(entrada.turnoId) || !texto(entrada.mensagem, 1, 2000) || !Array.isArray(entrada.historico) || entrada.historico.length > 18 || entrada.historico.length % 2) return falhar();
  let total = entrada.mensagem.trim().length;
  const historico: EntradaConversa['historico'] = entrada.historico.map((h, i) => {
    const papel = i % 2 ? 'assistente' : 'usuario';
    if (!objeto(h) || !somente(h, ['papel', 'texto']) || h.papel !== papel || !texto(h.texto, 1, papel === 'usuario' ? 2000 : 1500)) return falhar();
    total += h.texto.trim().length;
    return { papel, texto: h.texto.trim() };
  });
  if (total > 10000) return falhar();
  return { idioma: entrada.idioma, turnoId: entrada.turnoId, historico, mensagem: entrada.mensagem.trim() };
}

// O prazo cobre conexão e corpo, mesmo se o fetch injetado não respeitar AbortSignal.
export async function requisitarJson(url: string, init: RequestInit, fetchImpl: typeof fetch, prazoMs: number): Promise<{ status: number; dados: unknown }> {
  const controle = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const prazo = new Promise<never>((_, rejeitar) => {
    timer = setTimeout(() => { rejeitar(new Error('PRAZO_EXCEDIDO')); controle.abort(); }, prazoMs);
  });
  try {
    return await Promise.race([prazo, (async () => {
      const resposta = await fetchImpl(url, { ...init, signal: controle.signal, redirect: 'error' });
      const bytes = await lerBytes(resposta, prazoMs);
      const dados = lerJson(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      return { status: resposta.status, dados };
    })()]);
  } finally { clearTimeout(timer!); }
}
