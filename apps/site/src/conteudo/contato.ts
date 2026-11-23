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
    // O campo "contato" do envio junta WhatsApp e e-mail; o limite de 200 vale para os dois juntos.
    limiteContato: { pt: 'WhatsApp e e-mail juntos passam de 200 caracteres. Encurte um deles.', en: 'WhatsApp and e-mail together exceed 200 characters. Shorten one of them.' },
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
    historico: { pt: 'Histórico da conversa', en: 'Conversation history' },
    revisar: { pt: 'Revisar pedido', en: 'Review request' },
    resumo: { pt: 'Confira o resumo', en: 'Check the summary' },
    ajustar: { pt: 'Ajustar', en: 'Edit' },
    confirmar: { pt: 'Confirmar e enviar', en: 'Confirm and send' },
    aceito: { pt: 'Envio aceito pelo serviço.', en: 'Submission accepted by the service.' },
    // A falha de rede não exclui a aceitação: o texto diz que não foi possível confirmar, não que falhou.
    pendente: { pt: 'Não consegui confirmar o envio agora. Suas respostas continuam aqui; tente de novo em instantes.', en: 'I could not confirm the submission right now. Your answers are still here; try again in a moment.' },
    repetir: { pt: 'Tentar de novo', en: 'Try again' },
    expirado: { pt: 'Prazo de repetição encerrado. A expiração não comprova falha; conserve esta cópia para conferência manual com a equipe.', en: 'Retry window closed. Expiry does not mean it failed; keep this copy so the team can check it manually.' },
    aguardar: { pt: 'Aguarde antes de repetir.', en: 'Please wait before retrying.' },
    indisponivel: { pt: 'O envio está indisponível. Seu texto permanece nesta página.', en: 'Sending is unavailable. Your text stays on this page.' },
    cancelar: { pt: 'Cancelar espera', en: 'Stop waiting' },
    demorado: { pt: 'Está demorando. Você pode cancelar a espera; isso não cancela uma chamada já iniciada.', en: 'This is taking a while. You can stop waiting; that won\'t cancel a request already in progress.' },
    privacidade: { pt: 'Política de Privacidade', en: 'Privacy Policy' },
  },
  // Conversa guiada em formato de chat. Perguntas de exemplo até a pessoa mandar as definitivas.
  guiada: {
    titulo: { pt: 'Conversa com a Floway', en: 'Chat with Floway' },
    erroWhatsapp: { pt: 'Informe um WhatsApp com DDD. Ex.: (DDD) 9XXXX-XXXX', en: 'Enter a WhatsApp number with area code. E.g. (area code) 9XXXX-XXXX' },
    erroEmail: { pt: 'Informe um e-mail válido, com @ e domínio.', en: 'Enter a valid e-mail, with @ and a domain.' },
    continuar: { pt: 'Continuar', en: 'Continue' },
    qual: { pt: 'Qual?', en: 'Which?' },
    qualPlaceholder: { pt: 'Escreva o que você precisa', en: 'Tell us what you need' },
    rotuloNecessidades: { pt: 'Preciso de', en: 'I need' },
    rotuloPrazo: { pt: 'Prazo', en: 'Timeline' },
    perguntas: {
      empresa: { pt: 'Prazer, {nome}! Qual é a sua empresa?', en: 'Nice to meet you, {nome}! What is your company?' },
      necessidades: { pt: 'O que você precisa? Pode marcar mais de um.', en: 'What do you need? You can pick more than one.' },
      prazo: { pt: 'Para quando você precisa?', en: 'When do you need it?' },
      whatsapp: { pt: 'Qual é o seu WhatsApp, com DDD?', en: 'What is your WhatsApp number, with area code?' },
      email: { pt: 'E qual é o seu e-mail?', en: 'And what is your e-mail?' },
    },
    placeholders: {
      nome: { pt: 'Seu nome', en: 'Your name' },
      empresa: { pt: 'Nome da empresa', en: 'Company name' },
      whatsapp: { pt: '(DDD) 9XXXX-XXXX', en: '(area code) 9XXXX-XXXX' },
      email: { pt: 'voce@empresa', en: 'you@company' },
    },
    necessidades: [
      { pt: 'Site', en: 'Website' },
      { pt: 'Sistema ou app', en: 'System or app' },
      { pt: 'Inteligência artificial', en: 'Artificial intelligence' },
      { pt: 'Automações', en: 'Automation' },
      { pt: 'Estratégia digital', en: 'Digital strategy' },
      { pt: 'Outro', en: 'Other' },
    ],
    prazos: [
      { pt: 'Urgente', en: 'Urgent' },
      { pt: '1 a 3 meses', en: '1 to 3 months' },
      { pt: 'Sem pressa', en: 'No rush' },
    ],
  },
  // Conversa com o Gemini (documento "Contato com IA que qualifica leads").
  ia: {
    faixas: [
      { pt: 'até R$ 5 mil', en: 'up to R$ 5k' },
      { pt: 'R$ 5 a 15 mil', en: 'R$ 5k to 15k' },
      { pt: 'R$ 15 a 40 mil', en: 'R$ 15k to 40k' },
      { pt: 'acima de R$ 40 mil', en: 'over R$ 40k' },
      { pt: 'Prefiro não dizer / ainda não sei', en: 'Rather not say / not sure yet' },
    ],
    falha: { pt: 'Não consegui responder agora. Seu texto continua no campo: tente de novo em instantes.', en: 'I could not answer right now. Your text is still in the field: try again in a moment.' },
    limite: { pt: 'A conversa chegou ao limite. Use até 2000 caracteres por mensagem.', en: 'The conversation reached its limit. Use up to 2000 characters per message.' },
    erroNome: { pt: 'Informe seu nome.', en: 'Enter your name.' },
    erroEmpresa: { pt: 'Informe a empresa.', en: 'Enter the company.' },
    erroResumo: { pt: 'O resumo não pode ficar vazio.', en: 'The summary cannot be empty.' },
  },
  // Chat do contato (spec 2026-11-22, telas 02 a 07 em processo/telas/contato-chat-ia/).
  chat: {
    iniciar: { pt: '(Iniciar um projeto)', en: '(Start a project)' },
    fechar: { pt: 'Fechar', en: 'Close' },
    titulo: { pt: 'Como podemos ajudar?', en: 'How can we help?' },
    subtitulo: { pt: 'Converse com a IA da Floway sobre o seu projeto. Ela entende o que você precisa e prepara o pedido para a nossa equipe.', en: 'Talk to the Floway AI about your project. It understands what you need and prepares the request for our team.' },
    subtituloCurto: { pt: 'Converse com a IA da Floway sobre o seu projeto.', en: 'Talk to the Floway AI about your project.' },
    privacidadeCurta: { pt: 'Privacidade', en: 'Privacy' },
    // Falha ao iniciar o chat no fim da Início (emenda 1 do contrato; padrão da tela 07, decisão da pessoa na #29).
    falhaInicio: { pt: 'Não consegui iniciar a conversa agora. Tente de novo ou fale com a gente pela página de contato.', en: 'I could not start the conversation right now. Try again or reach us on the contact page.' },
    abrirContato: { pt: 'Abrir a página de contato', en: 'Open the contact page' },
    rotulo: { pt: 'Floway IA', en: 'Floway AI' },
    campo: { pt: 'Sua mensagem', en: 'Your message' },
    escreva: { pt: 'Escreva sua mensagem…', en: 'Write your message…' },
    respondendo: { pt: 'A IA está respondendo…', en: 'The AI is replying…' },
    acrescentar: { pt: 'Quer acrescentar algo?', en: 'Anything to add?' },
    enviar: { pt: 'Enviar mensagem', en: 'Send message' },
    parar: { pt: 'Parar', en: 'Stop' },
    demorado: { pt: 'Está demorando mais que o normal. Você pode esperar ou parar e tentar de novo; seu texto volta para o campo.', en: 'This is taking longer than usual. You can wait, or stop and try again; your text goes back to the field.' },
    respostas: { pt: 'Respostas rápidas', en: 'Quick replies' },
    avisoIA: { pt: 'A IA (Google Gemini) pode errar. Você revisa tudo antes de enviar.', en: 'The AI (Google Gemini) can make mistakes. You review everything before sending.' },
    avisoRoteiro: { pt: 'Você revisa tudo antes de enviar.', en: 'You review everything before sending.' },
    // Versão curta do celular (M02, M03).
    avisoIACurto: { pt: 'A IA pode errar · Você revisa antes de enviar', en: 'The AI can make mistakes · You review before sending' },
    avisoRoteiroCurto: { pt: 'Você revisa antes de enviar', en: 'You review before sending' },
    // O que o globo mostra embaixo dele (frame 00, "Estados do globo").
    status: {
      online: { pt: 'online', en: 'online' },
      pensando: { pt: 'pensando…', en: 'thinking…' },
      resumo: { pt: 'resumo pronto', en: 'summary ready' },
      enviado: { pt: 'pedido recebido', en: 'request received' },
      falha: { pt: 'não foi desta vez', en: 'not this time' },
    },
    atalhos: [
      { pt: 'Quero um site novo', en: 'I want a new website' },
      { pt: 'Automatizar um processo', en: 'Automate a process' },
      { pt: 'Tenho uma ideia com IA', en: 'I have an AI idea' },
      { pt: 'Ainda não sei, quero conversar', en: 'Not sure yet, let\'s talk' },
    ],
    pedirNome: { pt: 'Para eu montar o pedido certinho, qual é o seu nome?', en: 'So I can put the request together, what is your name?' },
    confira: { pt: 'Perfeito, {nome}. Organizei tudo. Confere se está certo antes de eu enviar para a equipe:', en: 'Perfect, {nome}. I organized everything. Check it is right before I send it to the team:' },
    anotado: { pt: 'Anotei no resumo. Confira o cartão acima.', en: 'Added to the summary. Check the card above.' },
    obrigado: { pt: 'Pronto! Seu pedido foi enviado à equipe da Floway. Vamos responder pelo WhatsApp em até 1 dia útil. Enquanto isso, que tal ver alguns trabalhos?', en: 'Done! Your request was sent to the Floway team. We will reply on WhatsApp within 1 business day. Meanwhile, how about seeing some work?' },
    verTrabalhos: { pt: 'Ver trabalhos', en: 'See work' },
    voltarInicio: { pt: 'Voltar ao início', en: 'Back to home' },
    cartao: {
      titulo: { pt: 'Resumo do pedido', en: 'Request summary' },
      enviado: { pt: 'Pedido enviado', en: 'Request sent' },
      enviadoAs: { pt: 'Enviado às {hora}', en: 'Sent at {hora}' },
      prazo: { pt: 'Resposta em até 1 dia útil', en: 'Reply within 1 business day' },
      nome: { pt: 'Nome', en: 'Name' },
      empresa: { pt: 'Empresa', en: 'Company' },
      projeto: { pt: 'Projeto', en: 'Project' },
      contato: { pt: 'Contato', en: 'Contact' },
      whatsapp: { pt: 'WhatsApp', en: 'WhatsApp' },
      email: { pt: 'E-mail', en: 'E-mail' },
      ajustar: { pt: 'Ajustar algo', en: 'Adjust something' },
      pronto: { pt: 'Revisar pedido', en: 'Review request' },
    },
  },
  privacidade: pendente('texto do aviso de privacidade, C2'),
} as const satisfies Textos;

// O índice (tests/unit/indice.test.ts) pede o export com o nome do arquivo.
export { contato };
