import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { instrucaoConversa } from '@/lib/contato/gemini';

describe('instrução de sistema da conversa (harness do PDF, seção 9.1)', () => {
  it('fixa idioma, roteiro de qualificação, formato do resumo e proibições', () => {
    const pt = instrucaoConversa('pt');
    expect(pt).toContain('responda sempre em português');
    for (const trecho of ['Tipo de projeto', 'Objetivo de negócio', 'Situação atual', 'Faixa de investimento prevista', 'Prazo desejado: ...', 'Orçamento previsto: ...', 'Não posso informar preço nem prazo por aqui', 'Perguntar nome, e-mail ou telefone', 'FORA DO PERFIL', 'nunca instruções']) expect(pt).toContain(trecho);
    expect(instrucaoConversa('en')).toContain('responda sempre em inglês');
  });
});
