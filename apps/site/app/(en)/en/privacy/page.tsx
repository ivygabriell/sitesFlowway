import { PaginaPrivacidade } from '@/paginas/PaginaPrivacidade';
import { metadadosDaPagina } from '@/seo/paginas';

export const metadata = metadadosDaPagina('privacidade', 'en');

export default function Pagina() {
  return <PaginaPrivacidade />;
}
