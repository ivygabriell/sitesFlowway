import { receberConversa, metodoNaoPermitido } from '@/lib/contato/servidor';
export const runtime = 'nodejs';
export const POST = (req: Request) => receberConversa(req);
export const GET = () => metodoNaoPermitido('conversa');
export const HEAD = GET;
export const OPTIONS = GET;
export const PUT = GET;
export const PATCH = GET;
export const DELETE = GET;
