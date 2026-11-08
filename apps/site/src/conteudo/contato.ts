import { pendente, type Textos } from './textos';

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
  // Página de contato (spec 4.6): rótulos da spec e frases do protótipo 12.
  formulario: {
    nome: { pt: 'Nome' },
    empresa: { pt: 'Empresa' },
    contato: { pt: 'Contato' },
    mensagem: { pt: 'Mensagem' },
    enviar: { pt: 'Enviar →' },
    // Inglês destes estados segue pendente de C2, com o fallback PT do índice.
    enviando: { pt: 'Enviando…' },
    retorno: { pt: 'Retorno do formulário. Não é possível confirmar a entrega nesta página.' },
    erro: { pt: 'Erro:' },
    problema: { pt: 'Há um problema' },
    preencher: {
      nome: { pt: 'Digite seu nome' },
      contato: { pt: 'Digite seu contato' },
      mensagem: { pt: 'Digite sua mensagem' },
    },
    limiteCampo: { pt: 'Use até 200 caracteres' },
    limiteMensagem: { pt: 'Use até 5000 caracteres' },
    tentar: { pt: 'Tentar de novo' },
    falha: { pt: 'Não conseguimos responder agora.' },
    enviado: { pt: 'Pedido enviado. A equipe da Floway responde pelo contato que você deixou. Obrigado pela conversa.' },
    aviso: {
      antes: { pt: 'Ao conversar, você concorda com a' },
      link: { pt: 'Política de Privacidade' },
      depois: { pt: '. Usamos as suas respostas só para responder ao seu contato.' },
    },
  },
  conversa: {
    convite: { pt: 'Conte o que você quer construir…' },
    atalhos: [{ pt: 'Quero uma landing page' }, { pt: 'Preciso de um site institucional' }, { pt: 'Quero automatizar um processo' }, { pt: 'Ainda não sei' }],
    voce: { pt: 'Você' },
    historico: { pt: 'Histórico da conversa' },
    respondendo: { pt: 'Floway está escrevendo' },
    alternativa: { pt: 'Usar formulário simples' },
    voltar: { pt: 'Voltar à conversa' },
    revisar: { pt: 'Revisar pedido' },
    resumo: { pt: 'Confira o resumo' },
    ajustar: { pt: 'Ajustar' },
    confirmar: { pt: 'Confirmar e enviar' },
    aceito: { pt: 'Envio aceito pelo serviço.' },
    pendente: { pt: 'Resultado pendente. Conserve esta cópia para conferência manual com a equipe.' },
    repetir: { pt: 'Repetir o mesmo envio' },
    expirado: { pt: 'Prazo de repetição encerrado. A expiração não comprova falha; conserve esta cópia para conferência manual com a equipe.' },
    aguardar: { pt: 'Aguarde antes de repetir.' },
    indisponivel: { pt: 'O envio está indisponível. Seu texto permanece nesta página.' },
    limite: { pt: 'Use até 2000 caracteres por mensagem, até 9 pares no histórico e até 10000 caracteres no total. Use o formulário para continuar sem cortar seu texto.' },
    cancelar: { pt: 'Cancelar espera' },
    demorado: { pt: 'Está demorando. Você pode cancelar a espera; isso não cancela uma chamada já iniciada.' },
    privacidade: { pt: 'Política de Privacidade' },
  },
  privacidade: pendente('texto do aviso de privacidade, C2'),
} as const satisfies Textos;

// O índice (tests/unit/indice.test.ts) pede o export com o nome do arquivo.
export { contato };
