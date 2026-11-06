import { NextResponse } from 'next/server';
import { rota } from '@/lib/idioma';
import { dentroDoLimite, entregarPedido, lerPedido } from '@/lib/pedidoDeContato';
import { FalhaContato, lerFormulario, PRIVADO } from '@/lib/contato/protocolo';
import { receberContato, metodoNaoPermitido } from '@/lib/contato/servidor';

export const runtime = 'nodejs';
export async function POST(req: Request) {
  let corpo: FormData;
  try { corpo = await lerFormulario(req, false); }
  catch (e) {
    const status = e instanceof FalhaContato ? e.status : 400;
    if (req.headers.get('accept')?.includes('application/json')) return NextResponse.json({ ok: false }, { status, headers: PRIVADO });
    return NextResponse.redirect(new URL(`${rota('contato', 'pt')}?estado=falha`, req.url), 303);
  }
  if (corpo.has('versao')) {
    if (corpo.get('versao') !== 'contato-b.1') return NextResponse.json({ ok: false }, { status: 422, headers: PRIVADO });
    return receberContato(req, undefined, corpo);
  }
  // O fluxo sem versão mantém JSON/303 e a entrega deliberadamente indisponível.
  const idioma = corpo.get('idioma') === 'en' ? 'en' : 'pt';
  const responder = (status: number) => {
    if (req.headers.get('accept')?.includes('application/json')) return NextResponse.json({ ok: status === 200 }, { status });
    const estado = status === 200 ? 'enviado' : 'falha';
    return NextResponse.redirect(new URL(`${rota('contato', idioma)}?estado=${estado}`, req.url), 303);
  };
  if (corpo.get('site')) return responder(200);
  const pedido = lerPedido(corpo);
  if (!pedido) return responder(400);
  const endereco = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconhecido';
  if (!dentroDoLimite(endereco)) return responder(429);
  return responder((await entregarPedido(pedido)) ? 200 : 503);
}
export const GET = () => metodoNaoPermitido();
export const HEAD = GET;
export const OPTIONS = GET;
export const PUT = GET;
export const PATCH = GET;
export const DELETE = GET;
