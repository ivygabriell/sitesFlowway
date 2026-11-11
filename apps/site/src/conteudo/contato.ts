import { pendente, type Textos } from './textos';

// Contato e rodapé da Início (spec 4.3, linhas Contato e Rodapé).
const contato = {
  // 22 palavras.
  frase: {
    pt: 'Na Floway, estratégia e desenvolvimento caminham juntos. Unimos visão criativa, engenharia de software e inteligência artificial para transformar desafios em soluções inteligentes.', en: 'At Floway, strategy and development go hand in hand. We bring together creative vision, software engineering and artificial intelligence to turn challenges into smart solutions.',
  },
  cta: { pt: 'Iniciar um projeto →', en: 'Start a project →' },
  // Cada linha com o rótulo em itálico, como o protótipo 07. Sem e-mail nem telefone: o convite leva ao formulário.
  rodape: {
    especialidades: {
      rotulo: { pt: 'especialidades', en: 'expertise' },
      valor: { pt: 'Estratégia digital, desenvolvimento web, inteligência artificial, automações e experiências digitais', en: 'Digital strategy, web development, artificial intelligence, automation and digital experiences' },
    },
    localizacao: { rotulo: { pt: 'localização', en: 'location' }, valor: { pt: 'Brasil', en: 'Brazil' } },
    instagram: { rotulo: { pt: 'instagram', en: 'instagram' }, valor: { pt: '@floway', en: '@floway' } },
    direitos: { pt: '© 2026 Floway. Todos os direitos reservados.', en: '© 2026 Floway. All rights reserved.' },
  },
  // Página de contato (spec 4.6): rótulos da spec e frases do protótipo 12.
  formulario: {
    nome: { pt: 'Nome', en: 'Name' },
    empresa: { pt: 'Empresa', en: 'Company' },
    contato: { pt: 'Contato', en: 'Contact' },
    mensagem: { pt: 'Mensagem', en: 'Message' },
    enviar: { pt: 'Enviar →', en: 'Send →' },
    enviando: { pt: 'Enviando…', en: 'Sending…' },
    retorno: { pt: 'Retorno do formulário. Não é possível confirmar a entrega nesta página.', en: 'Form status. Delivery cannot be confirmed on this page.' },
    erro: { pt: 'Erro:', en: 'Error:' },
    problema: { pt: 'Há um problema', en: 'There is a problem' },
    preencher: {
      nome: { pt: 'Digite seu nome', en: 'Enter your name' },
      contato: { pt: 'Digite seu contato', en: 'Enter your contact' },
      mensagem: { pt: 'Digite sua mensagem', en: 'Enter your message' },
    },
    limiteCampo: { pt: 'Use até 200 caracteres', en: 'Use up to 200 characters' },
    limiteMensagem: { pt: 'Use até 5000 caracteres', en: 'Use up to 5000 characters' },
    tentar: { pt: 'Tentar de novo', en: 'Try again' },
    falha: { pt: 'Não conseguimos responder agora.', en: 'We can\'t respond right now.' },
    enviado: { pt: 'Pedido enviado. A equipe da Floway responde pelo contato que você deixou. Obrigado pela conversa.', en: 'Request sent. The Floway team will reply through the contact you left. Thanks for reaching out.' },
    aviso: {
      antes: { pt: 'Ao conversar, você concorda com a', en: 'By chatting, you agree to the' },
      link: { pt: 'Política de Privacidade', en: 'Privacy Policy' },
      depois: { pt: '. Usamos as suas respostas só para responder ao seu contato.', en: '. We use your answers only to reply to you.' },
    },
  },
  conversa: {
    convite: { pt: 'Conte o que você quer construir…', en: 'Tell us what you want to build…' },
    atalhos: [{ pt: 'Quero uma landing page', en: 'I want a landing page' }, { pt: 'Preciso de um site institucional', en: 'I need a company website' }, { pt: 'Quero automatizar um processo', en: 'I want to automate a process' }, { pt: 'Ainda não sei', en: 'I\'m not sure yet' }],
    voce: { pt: 'Você', en: 'You' },
    historico: { pt: 'Histórico da conversa', en: 'Conversation history' },
    respondendo: { pt: 'Floway está escrevendo', en: 'Floway is typing' },
    alternativa: { pt: 'Usar formulário simples', en: 'Use simple form' },
    voltar: { pt: 'Voltar à conversa', en: 'Back to chat' },
    revisar: { pt: 'Revisar pedido', en: 'Review request' },
    resumo: { pt: 'Confira o resumo', en: 'Check the summary' },
    ajustar: { pt: 'Ajustar', en: 'Edit' },
    confirmar: { pt: 'Confirmar e enviar', en: 'Confirm and send' },
    aceito: { pt: 'Envio aceito pelo serviço.', en: 'Submission accepted by the service.' },
    pendente: { pt: 'Resultado pendente. Conserve esta cópia para conferência manual com a equipe.', en: 'Result pending. Keep this copy so the team can check it manually.' },
    repetir: { pt: 'Repetir o mesmo envio', en: 'Retry the same submission' },
    expirado: { pt: 'Prazo de repetição encerrado. A expiração não comprova falha; conserve esta cópia para conferência manual com a equipe.', en: 'Retry window closed. Expiry does not mean it failed; keep this copy so the team can check it manually.' },
    aguardar: { pt: 'Aguarde antes de repetir.', en: 'Please wait before retrying.' },
    indisponivel: { pt: 'O envio está indisponível. Seu texto permanece nesta página.', en: 'Sending is unavailable. Your text stays on this page.' },
    limite: { pt: 'Use até 2000 caracteres por mensagem, até 9 pares no histórico e até 10000 caracteres no total. Use o formulário para continuar sem cortar seu texto.', en: 'Use up to 2000 characters per message, up to 9 exchanges in the history and up to 10000 characters in total. Use the form to continue without cutting your text.' },
    cancelar: { pt: 'Cancelar espera', en: 'Stop waiting' },
    demorado: { pt: 'Está demorando. Você pode cancelar a espera; isso não cancela uma chamada já iniciada.', en: 'This is taking a while. You can stop waiting; that won\'t cancel a request already in progress.' },
    privacidade: { pt: 'Política de Privacidade', en: 'Privacy Policy' },
  },
  privacidade: pendente('texto do aviso de privacidade, C2'),
} as const satisfies Textos;

// O índice (tests/unit/indice.test.ts) pede o export com o nome do arquivo.
export { contato };
