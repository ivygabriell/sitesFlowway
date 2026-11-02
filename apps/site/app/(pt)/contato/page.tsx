import { PaginaContato } from '@/paginas/PaginaContato';
import { metadadosDaPagina } from '@/seo/paginas';

export const metadata = metadadosDaPagina('contato', 'pt');

export default async function Pagina({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { estado } = await searchParams;
  return <PaginaContato estado={estado} />;
}
