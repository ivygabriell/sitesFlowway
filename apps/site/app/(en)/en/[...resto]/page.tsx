import { notFound } from 'next/navigation';

// Todo endereço fora do mapa desta língua cai na 404 dela, com o lang certo e a casca.
export default function Resto() {
  notFound();
}
