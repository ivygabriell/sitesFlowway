import { NextResponse } from 'next/server';
import { rota } from '@/lib/idioma';
import { dentroDoLimite, entregarPedido, lerPedido } from '@/lib/pedidoDeContato';

// Com JavaScript, o formulário pede JSON e lê o status; sem JavaScript, volta à página da língua com o estado na URL.
export async function POST(req: Request) {
  const corpo = await req.formData().catch(() => new FormData());
  const idioma = corpo.get('idioma') === 'en' ? 'en' : 'pt';

  const responder = (status: number) => {
    if (req.headers.get('accept')?.includes('application/json')) return NextResponse.json({ ok: status === 200 }, { status });
    const estado = status === 200 ? 'enviado' : 'falha';
    return NextResponse.redirect(new URL(`${rota('contato', idioma)}?estado=${estado}`, req.url), 303);
  };

  // Campo-isca preenchido: descarta e responde como se tivesse dado certo, para o robô não aprender.
  if (corpo.get('site')) return responder(200);

  const pedido = lerPedido(corpo);
  if (!pedido) return responder(400);

  const endereco = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconhecido';
  if (!dentroDoLimite(endereco)) return responder(429);

  return responder((await entregarPedido(pedido)) ? 200 : 503);
}
