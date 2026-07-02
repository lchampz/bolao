#!/usr/bin/env bash
# Helper para operações do dia a dia no Render via API (não cria o Blueprint —
# isso só é possível pelo dashboard, a API do Render não tem esse endpoint).
# Precisa de RENDER_API_KEY no ambiente (nunca hardcode a chave aqui):
#
#   export RENDER_API_KEY=rnd_xxx
#   ./scripts/render-deploy.sh list
#   ./scripts/render-deploy.sh deploy bolao-server
#   ./scripts/render-deploy.sh status bolao-server
#
# Docs: https://api-docs.render.com

set -euo pipefail

API="https://api.render.com/v1"

if [[ -z "${RENDER_API_KEY:-}" ]]; then
  echo "Erro: defina RENDER_API_KEY no ambiente antes de rodar este script." >&2
  echo "  export RENDER_API_KEY=rnd_xxx   (pegue em https://dashboard.render.com/u/settings#api-keys)" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "Erro: este script precisa do 'jq' instalado." >&2
  exit 1
fi

api() {
  curl -sS -H "Authorization: Bearer ${RENDER_API_KEY}" -H "Accept: application/json" "$@"
}

# Render envolve cada item da lista em {"cursor": ..., "service": {...}} —
# o `.service // .` abaixo funciona também se a API algum dia devolver o
# objeto direto, sem o wrapper.
service_id_by_name() {
  local name="$1"
  api "${API}/services?limit=100" | jq -r --arg name "$name" 'map(.service // .) | .[] | select(.name == $name) | .id' | head -n1
}

cmd_list() {
  api "${API}/services?limit=100" | jq -r 'map(.service // .) | .[] | [.id, .name, .type, .suspended] | @tsv' \
    | awk -F'\t' 'BEGIN { printf "%-22s %-18s %-16s %s\n", "ID", "NOME", "TIPO", "STATUS" }
                  { printf "%-22s %-18s %-16s %s\n", $1, $2, $3, $4 }'
}

cmd_deploy() {
  local name="${1:?uso: render-deploy.sh deploy <nome-do-serviço>}"
  local id
  id="$(service_id_by_name "$name")"
  if [[ -z "$id" ]]; then
    echo "Serviço '$name' não encontrado. Rode '$0 list' para ver os nomes disponíveis." >&2
    exit 1
  fi
  echo "Disparando deploy de '$name' ($id)..."
  api -X POST "${API}/services/${id}/deploys" -H "Content-Type: application/json" -d '{"clearCache":"do_not_clear"}' \
    | jq -r '"deploy " + .id + " -> status: " + .status'
}

cmd_status() {
  local name="${1:?uso: render-deploy.sh status <nome-do-serviço>}"
  local id
  id="$(service_id_by_name "$name")"
  if [[ -z "$id" ]]; then
    echo "Serviço '$name' não encontrado. Rode '$0 list' para ver os nomes disponíveis." >&2
    exit 1
  fi
  api "${API}/services/${id}/deploys?limit=1" \
    | jq -r 'map(.deploy // .) | .[0] | "id: " + .id + "\nstatus: " + .status + "\ncriado em: " + .createdAt'
}

case "${1:-}" in
  list) cmd_list ;;
  deploy) cmd_deploy "${2:-}" ;;
  status) cmd_status "${2:-}" ;;
  *)
    echo "Uso: $0 {list|deploy <nome>|status <nome>}" >&2
    exit 1
    ;;
esac
