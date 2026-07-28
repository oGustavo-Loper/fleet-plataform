# Run

## Subir tudo com Docker

Na raiz do projeto:

```bash
cd ~/fleet-platform
pnpm docker:dev
```

Esse comando sobe:

- `postgres` em `localhost:5432`
- `api` em `http://127.0.0.1:4000/graphql`
- `web` em `http://127.0.0.1:5173`

Observacao:

- a API exige `DATA_ENCRYPTION_KEY` para ler e gravar `CPF`, `CNH` e outros campos sensiveis criptografados
- no fluxo Docker local, essa chave ja esta configurada no `compose`

## Validar se subiu

Front:

```bash
curl -I http://127.0.0.1:5173/
```

API:

```bash
curl -sS -X POST http://127.0.0.1:4000/graphql \
  -H 'content-type: application/json' \
  --data '{"query":"query { __typename }"}'
```

Se estiver tudo certo, a API deve responder:

```json
{"data":{"__typename":"Query"}}
```

## Derrubar tudo

```bash
cd ~/fleet-platform
pnpm docker:dev:down
```

## Ver logs

```bash
docker compose -f infra/docker/compose.yml logs -f
```

Logs só da API:

```bash
docker compose -f infra/docker/compose.yml logs -f api
```

Logs só do front:

```bash
docker compose -f infra/docker/compose.yml logs -f web
```

## Troubleshooting

Se der erro de porta ocupada:

```bash
ss -ltnp | rg ':4000|:5173|:5432'
```

Se precisar rebuildar os containers:

```bash
cd ~/fleet-platform
docker compose -f infra/docker/compose.yml up --build
```

Se quiser limpar e subir de novo:

```bash
cd ~/fleet-platform
pnpm docker:dev:down
pnpm docker:dev
```
