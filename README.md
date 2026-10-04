# VivaTech

Plataforma web de assistência técnica sob demanda, desenvolvida para conectar clientes a técnicos de diferentes especialidades.

O projeto permite encontrar profissionais disponíveis, solicitar atendimentos, acompanhar chamados e avaliar os serviços realizados. A aplicação também possui diferentes níveis de acesso para clientes, técnicos e administradores.

## Sobre o Projeto

O VivaTech foi desenvolvido com foco em criar uma experiência semelhante a plataformas reais de assistência técnica, desde a busca por um profissional até a conclusão do atendimento.

A aplicação conta com autenticação, gerenciamento de usuários, busca por proximidade, fluxo completo de chamados, avaliações e painéis específicos para cada perfil.

## Funcionalidades

### Cliente

- Cadastro e autenticação
- Busca de técnicos por proximidade
- Filtro por especialidade
- Visualização do perfil dos técnicos
- Abertura e acompanhamento de chamados
- Cancelamento de chamados
- Avaliação do atendimento
- Abertura de disputas
- Gerenciamento de perfil
- Sistema de notificações

### Técnico

- Cadastro como técnico
- Perfil profissional
- Cadastro de especialidades
- Controle de disponibilidade
- Recebimento de solicitações
- Aceite de chamados
- Atualização do status do atendimento
- Visualização dos próprios chamados
- Acompanhamento da avaliação média

### Administrador

- Gerenciamento de usuários
- Busca e filtro por perfil
- Verificação de técnicos
- Gerenciamento de disputas
- Acompanhamento das atividades da plataforma

## Fluxo de Atendimento

O fluxo principal do sistema segue as etapas:

**Cadastro → Busca de técnico → Abertura do chamado → Aceite → A caminho → Início do serviço → Conclusão → Avaliação**

Esse fluxo permite acompanhar todo o atendimento desde a solicitação inicial até a finalização do serviço.

## Segurança

O sistema possui controle de acesso baseado em papéis:

- `client`
- `technician`
- `admin`

As permissões dos chamados são centralizadas para garantir que apenas o cliente responsável, o técnico vinculado ou um administrador possam acessar determinadas informações.

As páginas protegidas também realizam a validação de permissão antes das consultas aos dados.

## Banco de Dados

O projeto utiliza PostgreSQL para armazenar as principais informações da aplicação, incluindo:

- Usuários
- Clientes
- Técnicos
- Especialidades
- Chamados
- Avaliações
- Notificações
- Disputas
- Histórico
- Protocolos
- Pagamentos
- Chats
- Mídias dos serviços

A estrutura também possui suporte para busca de técnicos por localização.

## Stack

- **Next.js 15**
- **React 19**
- **Tailwind CSS v4**
- **Better Auth**
- **PostgreSQL**
- **pg**
- **Zod**

## Estrutura do Projeto

A aplicação utiliza o App Router do Next.js e organiza suas páginas de acordo com os diferentes perfis e funcionalidades do sistema.

Principais áreas:

```text
/app
├── painel
├── painel-tecnico
├── tecnicos
├── chamados
├── solicitacoes
├── meus-chamados
├── usuarios
├── tecnicos-pendentes
├── disputas
├── notificacoes
└── perfil
```

A lógica relacionada às regras de negócio e permissões dos chamados é centralizada em `lib/services.js`.

## Status do Projeto

**Em desenvolvimento.**

O fluxo principal da aplicação já está estruturado e funcional, porém algumas funcionalidades ainda estão planejadas para versões futuras.

### Próximos passos

- Chat em tempo real
- Upload de fotos e vídeos
- Integração com pagamentos
- Rastreamento de localização em tempo real
- Chatbot para triagem de problemas
- Melhorias na experiência mobile
- Verificação de e-mail
- Recuperação de senha
- Testes automatizados
- Implementação completa de termos de uso e LGPD

## Objetivo

O VivaTech foi desenvolvido como um projeto completo de aplicação web, buscando aplicar na prática conceitos de desenvolvimento full stack, autenticação, banco de dados, controle de acesso, APIs, organização de componentes e desenvolvimento de interfaces responsivas.
