# Segurança local e primeiro administrador

## E-mail

Defina `RESEND_API_KEY` e `EMAIL_FROM` com uma chave de envio e um remetente verificado no Resend. Em desenvolvimento, se essas variáveis estiverem vazias, os links de confirmação e recuperação são impressos no terminal local; em produção, o envio falha de forma fechada.

## Limitação de chamadas

O Better Auth limita login, cadastro, recuperação e reenvio de confirmação. Os limites de abertura de chamado e avaliação são cinco por usuário por hora. Esses limites usam memória do processo e reiniciam junto com a aplicação; antes de executar várias instâncias, mova-os para um armazenamento compartilhado, como Redis.

## Primeiro administrador

1. Cadastre uma conta de cliente e confirme o endereço de e-mail.
2. Defina `INITIAL_ADMIN_EMAIL` com o e-mail dessa conta.
3. Gere as tabelas do Better Auth e aplique `db/schema.sql` com `npm run db:apply-schema`.
4. Execute `npm run db:promote-admin` uma única vez.

O comando só promove uma conta verificada e bloqueia novas execuções se já houver um administrador. A promoção fica no registro de auditoria.
