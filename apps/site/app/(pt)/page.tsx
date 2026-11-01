import { Inicio } from '@/paginas/Inicio';
import { metadadosDaPagina } from '@/seo/paginas';

export const metadata = metadadosDaPagina('inicio', 'pt');

export default function Pagina() {
  return <Inicio />;
}
