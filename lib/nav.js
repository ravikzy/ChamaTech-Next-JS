
export const NAV_BY_ROLE = {
  client: [
    { href: "/painel", label: "Painel" },
    { href: "/tecnicos", label: "Buscar técnico" },
    { href: "/chamados", label: "Meus chamados" },
    { href: "/perfil", label: "Meu perfil" },
    { href: "/notificacoes", label: "Notificações" },
  ],
  technician: [
    { href: "/painel-tecnico", label: "Painel" },
    { href: "/solicitacoes", label: "Solicitações" },
    { href: "/meus-chamados", label: "Meus chamados" },
    { href: "/perfil-tecnico", label: "Meu perfil" },
    { href: "/notificacoes", label: "Notificações" },
  ],
  admin: [
    { href: "/painel-admin", label: "Painel" },
    { href: "/usuarios", label: "Usuários" },
    { href: "/tecnicos-pendentes", label: "Técnicos pendentes" },
    { href: "/disputas", label: "Disputas" },
    { href: "/avaliacoes", label: "Avaliações denunciadas" },
    { href: "/atividade", label: "Atividade administrativa" },
    { href: "/notificacoes", label: "Notificações" },
  ],
};

export const TITLE_BY_ROLE = {
  client: "Painel do cliente",
  technician: "Painel do técnico",
  admin: "Painel administrativo",
};
