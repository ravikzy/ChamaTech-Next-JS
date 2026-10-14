export const FAQ_GROUPS = [
  {
    id: "primeiros-passos",
    title: "Primeiros passos",
    questions: [
      { id: "como-funciona", question: "Como funciona o ChamaTech?", answer: "O ChamaTech aproxima clientes e profissionais de TI. Você descreve o problema, solicita um técnico e acompanha o andamento pelo chamado. O pagamento é combinado diretamente entre as partes." },
      { id: "criar-conta", question: "Como crio uma conta?", answer: "Informe seu nome, e-mail e senha, aceite os termos e confirme o e-mail pelo link enviado. Depois, escolha seu perfil de cliente ou solicite o cadastro como técnico." },
      { id: "buscar-tecnico", question: "Como encontro um técnico?", answer: "Na busca, filtre por especialidade e ordene os perfis por proximidade ou nota. As distâncias são aproximadas. Somente profissionais verificados e disponíveis aparecem." },
    ],
  },
  {
    id: "para-clientes",
    title: "Para clientes",
    questions: [
      { id: "abrir-chamado", question: "Como abro um chamado?", answer: "Entre na sua conta, escolha um técnico disponível, informe o problema e o endereço do atendimento e envie a solicitação. O endereço é compartilhado com o técnico relacionado ao chamado depois que ele aceita." },
      { id: "acompanhar-chamado", question: "O que acontece depois de enviar a solicitação?", answer: "O chamado fica aguardando aceite. Depois, você acompanha as etapas: aceito, a caminho, em atendimento e concluído. Você recebe notificações sobre as mudanças." },
      { id: "cancelar-chamado", question: "Posso cancelar um chamado?", answer: "Você pode cancelar enquanto o status estiver pendente, aceito ou a caminho. Depois que o atendimento começa, fale com a outra parte ou abra uma disputa pelo chamado." },
      { id: "avaliar-atendimento", question: "Como avalio o atendimento?", answer: "Quando o técnico marca o chamado como concluído, abra os detalhes e envie uma nota de 1 a 5. O comentário é opcional. Você pode avaliar cada chamado uma única vez." },
      { id: "disputas", question: "Como abro uma disputa?", answer: "Durante o status “Em atendimento”, abra os detalhes do chamado, descreva o problema e envie a disputa. Um administrador analisará o caso e poderá registrar uma resposta." },
    ],
  },
  {
    id: "para-tecnicos",
    title: "Para técnicos",
    questions: [
      { id: "virar-tecnico", question: "Como posso me tornar técnico?", answer: "Crie uma conta e solicite o perfil de técnico. Confirme seu e-mail e aguarde a análise administrativa. Após aprovação, complete a bio e escolha suas especialidades para ativar a disponibilidade." },
      { id: "verificacao-tecnico", question: "Como funciona a verificação dos técnicos?", answer: "Um administrador analisa os dados do perfil e aprova ou recusa o cadastro. A plataforma não declara que essa análise substitui checagens profissionais ou documentos que ainda não são solicitados." },
      { id: "disponibilidade", question: "Como apareço na busca?", answer: "Seu perfil precisa estar verificado, ter uma bio e pelo menos uma especialidade. Então, use o controle de disponibilidade no painel do técnico." },
      { id: "aceitar-chamado", question: "Como aceito e atualizo um chamado?", answer: "No painel de solicitações, aceite um chamado pendente. Depois do aceite, atualize para “A caminho”, “Em atendimento” e “Concluído” conforme o serviço avança." },
    ],
  },
  {
    id: "seguranca-privacidade",
    title: "Segurança e privacidade",
    questions: [
      { id: "dados-pessoais", question: "Como meus dados são usados?", answer: "Os dados de conta são usados para operar o marketplace e os chamados. O endereço não aparece na busca pública; ele é disponibilizado às partes do chamado conforme o atendimento avança." },
      { id: "telefone-endereco", question: "Meu telefone e endereço ficam públicos?", answer: "Não. Telefone e endereço não são exibidos na busca ou no perfil público. Os dados de contato são usados no contexto do chamado entre as partes." },
      { id: "recuperar-senha", question: "Como recupero minha senha?", answer: "Na tela de login, escolha “Esqueci minha senha” e informe o e-mail da conta. Use o link recebido para cadastrar uma nova senha. Verifique também a caixa de spam." },
      { id: "excluir-conta", question: "Como excluo minha conta?", answer: "A exclusão self-service ainda não está disponível. Solicite a remoção pelo e-mail de suporte; a equipe confirmará sua identidade e explicará quais registros precisam ser retidos." },
    ],
  },
  {
    id: "problemas-chamado",
    title: "Problemas com chamado",
    questions: [
      { id: "tecnico-nao-apareceu", question: "O técnico não apareceu no horário combinado. O que faço?", answer: "Entre em contato com o técnico pelos dados compartilhados após o aceite. Se o atendimento já estiver em andamento no sistema e não for resolvido, abra uma disputa no chamado." },
      { id: "chamado-pendente", question: "Meu chamado continua aguardando aceite. O que faço?", answer: "A disponibilidade pode mudar e nenhum profissional é obrigado a aceitar. Você pode aguardar ou cancelar o chamado e solicitar outro técnico disponível." },
      { id: "pagamento", question: "O ChamaTech cobra ou processa o pagamento?", answer: "Não. Nesta versão, a plataforma não processa pagamentos. Combine preço, forma e momento de pagamento diretamente com o técnico antes do serviço." },
      { id: "disputa-sem-resposta", question: "O que faço se ainda precisar de ajuda com uma disputa?", answer: "Acompanhe as atualizações em “Disputas”. Se precisar acrescentar informações ou a situação continuar sem resolução, escreva para o suporte usando o contato no fim desta página." },
    ],
  },
];
