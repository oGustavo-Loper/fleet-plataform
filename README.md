# Fleet Platform

Monorepo base para um sistema de gestao de veiculos multi-tenant com `React + TypeScript` no front, `NestJS + GraphQL` no backend, `PostgreSQL` no banco e suporte offline via `PWA + IndexedDB`.

## Estrutura

```text
apps/
  api/   Backend NestJS + GraphQL + PostgreSQL
  web/   Front-end React PWA
packages/
  shared-types/
  shared-validation/
  ui/
infra/
  docker/
docs/
```

## Fluxo principal

- `apps/web` funciona online e offline.
- Formularios offline entram em uma outbox no `IndexedDB`.
- Quando a conexao retorna, a outbox reenvia operacoes idempotentes para a API GraphQL.
- O backend valida `tenant`, permissoes, consistencia de KM e registra eventos auditaveis.

## Comandos

```bash
pnpm install
pnpm dev
pnpm docker:dev
pnpm build
```

## Docker dev

Para subir `postgres + api + web` com um comando:

```bash
pnpm docker:dev
```

Servicos expostos:

- Front: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:4000/graphql`
- Postgres: `localhost:5432`

Para derrubar:

```bash
pnpm docker:dev:down
```

## Variaveis esperadas

- API:
  - `DATABASE_URL`
  - `DATA_ENCRYPTION_KEY`
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`
  - `HOST`
  - `PORT`
- `BILLING_PROVIDER`
- `WEB_BASE_URL`
- `MERCADO_PAGO_CHECKOUT_URL`
- `BILLING_WEBHOOK_TOKEN`
- `MEDIA_STORAGE_DIR`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
  - `SMTP_PASSWORD`
  - `MAIL_FROM`
- Web:
  - `VITE_HOST`
  - `VITE_PORT`
  - `VITE_API_URL`

## Dados sensiveis

- `DATA_ENCRYPTION_KEY` protege os dados sensiveis criptografados em repouso, como `CPF`, `CNH` e `document_number`.
- A API agora exige essa variavel para subir em qualquer ambiente normal.
- Apenas `NODE_ENV=test` usa uma chave interna de teste para a suite automatizada.
- Em producao, essa chave deve existir apenas no ambiente da API e nao deve ser commitada no repositório.

## Onboarding e billing

- `Criar conta empresa` gera `tenant + usuario admin`.
- `Criar conta pessoal` gera `tenant individual + usuario pessoal`.
- No cadastro pessoal existe a opcao `Quero me cadastrar tambem como motorista`, evitando preencher os mesmos dados duas vezes depois.
- O onboarding inicial redireciona para `/onboarding` e orienta cadastro de primeiro veiculo, primeiro motorista e primeiros lancamentos.
- O plano pessoal usa limite por `vehicleLimit`.
- O checkout de assinatura foi preparado com Mercado Pago:
  - configure `MERCADO_PAGO_CHECKOUT_URL` com a URL real do checkout hospedado
  - a ativacao de pagamento chega via webhook em `/billing/webhooks/mercado-pago`
  - a tela `/plans` abre esse checkout
  - para desenvolvimento local continua existindo um botao de ativacao demo
- O upload real de imagem usa `POST /media/upload` com `multipart/form-data` e serve os arquivos em `/media/...`.
- Os arquivos sao armazenados no diretório indicado por `MEDIA_STORAGE_DIR` e as entidades passam a salvar a URL publica retornada pelo backend.

## Recuperacao de senha

- O login agora oferece `Esqueci minha senha`.
- O fluxo envia um codigo de 6 digitos para o e-mail cadastrado.
- Em desenvolvimento, se `SMTP_HOST`/`SMTP_USER`/`SMTP_PASSWORD` nao estiverem configurados, o codigo e logado no backend e tambem aparece no retorno de debug da mutacao.
- Para producao, configure um provedor SMTP real e preencha:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASSWORD`
  - `MAIL_FROM`
- Precos publicados:
  - `Free`: R$ 0,00
  - `Pro`: R$ 19,90 promocional, com preco cheio de R$ 29,90
  - `Empresa`: R$ 59,90 promocional, com preco cheio de R$ 79,90

## Proxima etapa Mercado Pago

Fluxo recomendado para colocar pagamento real em producao:

1. Criar a aplicacao no painel do Mercado Pago.
2. Obter as credenciais e configurar as variaveis:
   - `MERCADO_PAGO_CHECKOUT_URL`
   - `BILLING_WEBHOOK_TOKEN`
   - `BILLING_PROVIDER=mercado_pago`
3. Apontar o webhook publico para `/billing/webhooks/mercado-pago`.
4. Confirmar a assinatura no webhook e ativar o tenant com `planStatus=ACTIVE`.
5. Remover o modo demo de ativacao quando o pagamento real estiver validado.

No codigo atual, a base do checkout e do webhook ja esta pronta. Falta plugar a URL real do checkout hospedado e a confirmacao assincrona do Mercado Pago no ambiente de producao.

## PostgreSQL real

- A API agora conecta direto no PostgreSQL via `pg` e auto-cria as tabelas no startup.
- O `DATABASE_URL` padrao aponta para o container local definido em `infra/docker/compose.yml`.
- O ambiente padrao de desenvolvimento usa `127.0.0.1` para API e front.
- O schema Prisma foi mantido como referencia de modelo, mas nao e mais o caminho de execucao do backend.
- Se precisar subir o banco localmente:

```bash
cp .env.example .env
docker compose -f infra/docker/compose.yml up -d postgres
pnpm --filter @fleet/api dev
```

## Acesso pelo celular na rede local

Para validar pelo celular na mesma rede do notebook:

1. Descubra o IP local do notebook, por exemplo `192.168.0.25`.
2. Sobrescreva o padrao local no `.env`:
   - `HOST=0.0.0.0`
   - `PORT=4000`
   - `VITE_HOST=0.0.0.0`
   - `VITE_PORT=5173`
   - `VITE_API_URL=http://192.168.0.25:4000/graphql`
   - `WEB_BASE_URL=http://192.168.0.25:5173`
3. Reinicie API e front.
4. No celular, abra `http://192.168.0.25:5173`.

Observacao:
- se o firewall do notebook bloquear conexoes locais, o celular nao vai acessar mesmo com o host correto
- o valor de `VITE_API_URL` nao pode ficar como `localhost`, porque no celular `localhost` aponta para o proprio aparelho

## Robo de UI

A automacao de UI foi separada em um repositorio irmão para facilitar o envio no GitHub como dois projetos distintos. O repositorio fica em `../fleet-platform-robot`.

## Status atual

Este scaffold inclui:

- schema relacional dos principais modulos em PostgreSQL
- backend base com auth, tenants, users, vehicles, dashboard e sync
- PWA React com dashboard, veiculos, sincronizacao offline e shell mobile-first
- pacotes compartilhados de tipos e validacao
