import { PaginaTrabalhos } from '@/paginas/PaginaTrabalhos';
import { metadadosDaPagina } from '@/seo/paginas';

export const metadata = metadadosDaPagina('trabalhos', 'en');

export default function Pagina() {
  return <PaginaTrabalhos />;
}
