# Deploy Web no Vercel

Este projeto pode usar o `apps/web` no Vercel para gerar uma versao online do frontend.

## Escopo recomendado

- `web` no Vercel
- `api` em Railway, Render, Fly.io ou outro host Node com Postgres
- `VITE_API_URL` apontando para a API publica

O Nest atual nao e o melhor encaixe para Vercel sem uma adaptacao propria. O fluxo mais simples e separar:

- frontend estatico no Vercel
- backend persistente fora do Vercel

## Configuracao sugerida

No Vercel:

1. Crie um novo projeto apontando para este repositorio
2. Defina `Root Directory` como `apps/web`
3. Use:
   - Install Command: `pnpm install --frozen-lockfile`
   - Build Command: `pnpm build`
   - Output Directory: `dist`

## Variaveis de ambiente

No projeto web do Vercel, configure:

```bash
VITE_API_URL=https://sua-api-publica/graphql
WEB_BASE_URL=https://seu-front.vercel.app
```

## Observacoes

- O arquivo [apps/web/vercel.json](/home/gustavo/fleet-platform/apps/web/vercel.json:1) ja inclui fallback para SPA.
- Rotas como `/dashboard`, `/drivers` e `/admin/report` continuam funcionando em acesso direto.
- Se a API usar cookies, CORS e dominios confiaveis precisam ser revisados. Hoje o fluxo principal usa tokens no cliente.
