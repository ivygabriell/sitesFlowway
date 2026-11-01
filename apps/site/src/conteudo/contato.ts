import type { Textos } from './textos';

// Contato e rodapé da Início (spec 4.3, linhas Contato e Rodapé). Só o CTA tem inglês aprovado (plano, tarefa 13):
// sem `en`, a página em /en mostra o português, e a trava de publicação aponta cada texto.
const contato = {
  // 22 palavras.
  frase: {
    pt: 'Na Floway, estratégia e desenvolvimento caminham juntos. Unimos visão criativa, engenharia de software e inteligência artificial para transformar desafios em soluções inteligentes.',
  },
  cta: { pt: 'Iniciar um projeto →', en: 'Start a project →' },
  // Cada linha com o rótulo em itálico, como o protótipo 07. Sem e-mail nem telefone: o convite leva ao formulário.
  rodape: {
    especialidades: {
      rotulo: { pt: 'especialidades' },
      valor: { pt: 'Estratégia digital, desenvolvimento web, inteligência artificial, automações e experiências digitais' },
    },
    localizacao: { rotulo: { pt: 'localização' }, valor: { pt: 'Brasil' } },
    instagram: { rotulo: { pt: 'instagram', en: 'instagram' }, valor: { pt: '@floway', en: '@floway' } },
    direitos: { pt: '© 2026 Floway. Todos os direitos reservados.' },
  },
} as const satisfies Textos;

// O índice (tests/unit/indice.test.ts) pede o export com o nome do arquivo.
export { contato };
