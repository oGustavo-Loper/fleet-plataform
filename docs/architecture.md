# Arquitetura

## Front-end

- `React + TypeScript + Vite`
- `TanStack Query` para dados remotos
- `Dexie` para persistencia local
- `Workbox` para cache e instalacao PWA
- `Apollo Client` para GraphQL

## Backend

- `NestJS`
- `GraphQL` code-first
- `Prisma + PostgreSQL`
- `JWT` com `RBAC` por tenant

## Offline sync

1. O usuario registra uma operacao.
2. Se estiver offline, o app grava o payload em `IndexedDB.outbox`.
3. Ao reconectar, o sincronizador envia mutacoes com `operationId`.
4. O backend responde com sucesso, conflito de validacao ou necessidade de retry.
5. O estado visual muda entre `offline`, `syncing`, `synced` e `conflict`.

## Dominios iniciais

- Auth e tenants
- Usuarios
- Veiculos
- Motoristas
- Quilometragem
- Abastecimentos
- Manutencoes
- Dashboard
- Relatorios
