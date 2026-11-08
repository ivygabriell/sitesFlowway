import 'server-only';
import type { Pedido } from '@/lib/pedidoDeContato';
import { envioConfigurado, type Configuracao } from './configuracao';
import type { IntencaoValidada } from './intencao';
import { objeto, requisitarJson, UUID } from './protocolo';

export type ResultadoEntrega =
  | { estado: 'aceito'; status: 200 }
  | { estado: 'incerto'; status: 202 | 409; codigo: 'RESULTADO_INCERTO' | 'ENVIO_EM_ANDAMENTO'; retryAfter: number; repetivel: true }
  | { estado: 'falha'; status: 410 | 409 | 502 | 503; codigo: string; retryAfter?: number; repetivel: boolean };
const incerto = (): ResultadoEntrega => ({ estado: 'incerto', status: 202, codigo: 'RESULTADO_INCERTO', retryAfter: 2, repetivel: true });
export async function entregarResend(pedido: Pedido, intencao: IntencaoValidada, dependencias: { configuracao: Configuracao; fetch: typeof fetch; agora: () => number }): Promise<ResultadoEntrega> {
  const c = dependencias.configuracao;
  // Desligar novas intenções não revoga repetições de intenções já assinadas.
  if (!envioConfigurado(c) || intencao.canal !== c.canal) return { estado: 'falha', status: 503, codigo: 'ENTREGA_INDISPONIVEL', repetivel: true, retryAfter: 30 };
  if (!Number.isFinite(Date.parse(intencao.expiraEm)) || Date.parse(intencao.expiraEm) - dependencias.agora() <= 30000) return { estado: 'falha', status: 410, codigo: 'INTENCAO_EXPIRADA', repetivel: false };
  // Template e ordem dos campos são fixos para este canal; não adicionar valores voláteis.
  const body = JSON.stringify({ from: c.remetente, to: [c.destino], subject: 'Contato Floway', text: `Nome: ${pedido.nome}\nEmpresa: ${pedido.empresa}\nContato: ${pedido.contato}\n\n${pedido.mensagem}` });
  try {
    const { status, dados } = await requisitarJson('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${c.resendKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': intencao.chave }, body }, dependencias.fetch, 8000);
    if (status === 200 && objeto(dados) && typeof dados.id === 'string' && UUID.test(dados.id)) return { estado: 'aceito', status: 200 };
    if (!objeto(dados)) return incerto();
    if (status === 409 && dados.name === 'concurrent_idempotent_requests') return { estado: 'incerto', status: 409, codigo: 'ENVIO_EM_ANDAMENTO', retryAfter: 2, repetivel: true };
    if (status === 409 && dados.name === 'invalid_idempotent_request') return { estado: 'falha', status: 409, codigo: 'INTENCAO_JA_UTILIZADA', repetivel: false };
    if (status === 429 && dados.name === 'rate_limit_exceeded') return { estado: 'falha', status: 503, codigo: 'ENTREGA_INDISPONIVEL', repetivel: true, retryAfter: 30 };
    const recusas: Record<number, readonly string[]> = {
      400: ['validation_error', 'invalid_idempotency_key'],
      401: ['validation_error', 'missing_api_key', 'restricted_api_key'],
      403: ['validation_error', 'invalid_permission', 'restricted_api_key', 'suspended_api_key'],
      422: ['invalid_attachment', 'invalid_parameter', 'missing_required_field', 'missing_required_parameter'],
    };
    if (typeof dados.name === 'string' && recusas[status]?.includes(dados.name)) return { estado: 'falha', status: 502, codigo: 'ENTREGA_RECUSADA', repetivel: false };
    return incerto();
  } catch { return incerto(); }
}
