import { Inicio } from '@/paginas/Inicio';
import { metadadosDaPagina } from '@/seo/paginas';

export const metadata = metadadosDaPagina('inicio', 'en');

export default function Pagina() {
  return <Inicio idioma="en" />;
}
