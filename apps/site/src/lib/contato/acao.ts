'use server';

import { headers } from 'next/headers';
import { lerConfiguracao, origemSegura } from './configuracao';
import { FalhaContato, idiomaValido } from './protocolo';
import { obterContatoServidor, type ContatoServidorDTO } from './servidor';

// Emenda 1 do contato-b.1 (processo/contrato-api.md, registro 008): a Início é estática e recebe o DTO do contato daqui,
// só no clique de "Iniciar um projeto". O argumento chega por POST direto, então é entrada não confiável: um argumento só,
// "pt" ou "en". O Next deixa passar requisição sem Origin; aqui ela precisa ser igual à origem configurada, como nas
// rotas. Erros só com o código (FalhaContato), sem token, sem log, sem notFound/redirect.
export async function emitirContato(...args: unknown[]): Promise<ContatoServidorDTO> {
  const [idioma] = args;
  if (args.length !== 1 || !idiomaValido(idioma)) throw new FalhaContato(422, 'VALIDACAO');
  const { origem } = lerConfiguracao();
  if (!origemSegura(origem) || (await headers()).get('origin') !== origem) throw new FalhaContato(403, 'ORIGEM_INVALIDA');
  return obterContatoServidor(idioma);
}
