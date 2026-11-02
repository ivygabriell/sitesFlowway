export type Pedido = { nome: string; empresa: string; contato: string; mensagem: string };

const MAXIMOS: Record<keyof Pedido, number> = { nome: 200, empresa: 200, contato: 200, mensagem: 5000 };
const OBRIGATORIOS: (keyof Pedido)[] = ['nome', 'contato', 'mensagem'];

// Devolve o pedido limpo, ou null se faltar campo obrigatório ou algum passar do tamanho.
export function lerPedido(corpo: FormData): Pedido | null {
  const campo = (nome: keyof Pedido) => String(corpo.get(nome) ?? '').trim();
  const pedido: Pedido = { nome: campo('nome'), empresa: campo('empresa'), contato: campo('contato'), mensagem: campo('mensagem') };
  if (OBRIGATORIOS.some((c) => !pedido[c])) return null;
  if ((Object.keys(MAXIMOS) as (keyof Pedido)[]).some((c) => pedido[c].length > MAXIMOS[c])) return null;
  return pedido;
}

const LIMITE = 5;
const JANELA_MS = 10 * 60 * 1000;
const envios = new Map<string, number[]>();

// shortcut: memória por instância do servidor; na publicação (C5), trocar por um armazenamento comum se houver várias instâncias.
export function dentroDoLimite(endereco: string, agora = Date.now()): boolean {
  for (const [chave, tempos] of envios) {
    const validos = tempos.filter((t) => agora - t < JANELA_MS);
    if (validos.length) envios.set(chave, validos);
    else envios.delete(chave);
  }
  const tempos = envios.get(endereco) ?? [];
  if (tempos.length >= LIMITE) return false;
  envios.set(endereco, [...tempos, agora]);
  return true;
}

export const limparLimite = () => envios.clear();

// shortcut: o serviço de e-mail ainda não foi escolhido (spec, seção 2), então todo envio real responde falha e
// nunca finge que entregou. Quando houver serviço, a entrega entra aqui, com o destino só em variável de ambiente.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function entregarPedido(_pedido: Pedido): Promise<boolean> {
  return false;
}
