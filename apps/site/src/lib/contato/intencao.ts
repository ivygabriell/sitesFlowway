import 'server-only';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type { Idioma } from '@/conteudo/textos';
import { assinaturaConfigurada, type Configuracao } from './configuracao';
import { FalhaContato, objeto, somente, UUID, lerJson } from './protocolo';

const TTL = 23 * 3600000;
export type IntencaoValidada = { chave: string; expiraEm: string; canal: string };
const assinar = (payload: string, c: Configuracao) => createHmac('sha256', c.segredo).update(`v1.${payload}`).digest();
export function criarIntencao(idioma: Idioma, configuracao: Configuracao, agora: number): string {
  if (!assinaturaConfigurada(configuracao) || !['pt', 'en'].includes(idioma) || !Number.isFinite(agora)) throw new FalhaContato(503, 'ENTREGA_INDISPONIVEL');
  const payload = Buffer.from(JSON.stringify({ v: 1, id: randomUUID(), idioma, emitidaEm: new Date(agora).toISOString(), expiraEm: new Date(agora + TTL).toISOString(), canal: configuracao.canal })).toString('base64url');
  return `v1.${payload}.${assinar(payload, configuracao).toString('base64url')}`;
}
export function validarIntencao(token: string, idioma: Idioma, configuracao: Configuracao, agora: number): IntencaoValidada {
  const invalida = (): never => { throw new FalhaContato(401, 'INTENCAO_INVALIDA'); };
  if (!assinaturaConfigurada(configuracao) || typeof token !== 'string' || token.length > 1024 || !Number.isFinite(agora)) return invalida();
  const partes = /^v1\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(token);
  if (!partes) return invalida();
  const [, payload, assinatura] = partes;
  const recebida = Buffer.from(assinatura, 'base64url');
  const esperada = assinar(payload, configuracao);
  if (recebida.toString('base64url') !== assinatura || recebida.length !== esperada.length || !timingSafeEqual(recebida, esperada)) return invalida();
  let dados: unknown;
  try {
    const bytes = Buffer.from(payload, 'base64url');
    if (bytes.toString('base64url') !== payload) return invalida();
    dados = lerJson(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch { return invalida(); }
  if (!objeto(dados) || !somente(dados, ['v', 'id', 'idioma', 'emitidaEm', 'expiraEm', 'canal']) || dados.v !== 1 || typeof dados.id !== 'string' || !UUID.test(dados.id) || dados.idioma !== idioma || !['pt', 'en'].includes(idioma) || dados.canal !== configuracao.canal || typeof dados.emitidaEm !== 'string' || typeof dados.expiraEm !== 'string') return invalida();
  const emitida = Date.parse(dados.emitidaEm), expira = Date.parse(dados.expiraEm);
  if (!Number.isFinite(emitida) || !Number.isFinite(expira) || new Date(emitida).toISOString() !== dados.emitidaEm || new Date(expira).toISOString() !== dados.expiraEm || expira - emitida !== TTL || emitida > agora) return invalida();
  if (expira <= agora) throw new FalhaContato(410, 'INTENCAO_EXPIRADA');
  return { chave: `contato/${dados.id}`, expiraEm: dados.expiraEm, canal: dados.canal as string };
}
