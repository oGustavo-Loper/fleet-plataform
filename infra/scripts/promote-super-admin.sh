#!/usr/bin/env bash
# Promotes an existing user to the SUPER_ADMIN role directly in Postgres.
#
# There is no in-app way to create or grant SUPER_ADMIN — that role can see
# every tenant's data, so it is intentionally kept out of any API endpoint.
# Run this manually, once, against an email that already has an account.
#
# Usage:
#   ./infra/scripts/promote-super-admin.sh admin@example.com

set -euo pipefail

EMAIL="${1:?Uso: promote-super-admin.sh <email>}"
CONTAINER="${POSTGRES_CONTAINER:-fleet-postgres}"
DB_USER="${POSTGRES_USER:-fleet}"
DB_NAME="${POSTGRES_DB:-fleet_platform}"

UPDATED=$(docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -tA -c \
  "UPDATE users SET role = 'SUPER_ADMIN' WHERE email = '${EMAIL}' RETURNING email;")

if [ -z "$UPDATED" ]; then
  echo "Nenhum usuário encontrado com o e-mail ${EMAIL}." >&2
  exit 1
fi

echo "Promovido a SUPER_ADMIN: ${UPDATED}"
echo "Faça login novamente (ou renove a sessão) para o novo papel valer no token."
