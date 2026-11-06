import { obterContatoServidor } from '@/lib/contato/servidor';
import { PaginaContato } from '@/paginas/PaginaContato';
import { metadadosDaPagina } from '@/seo/paginas';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = metadadosDaPagina('contato', 'en');

export default async function Pagina({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { estado } = await searchParams;
  return <PaginaContato servidor={obterContatoServidor('en')} estado={estado} />;
}
