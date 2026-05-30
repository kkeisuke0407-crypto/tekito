#!/usr/bin/env bash
# Clarity Data Export API fetcher
# Usage: CLARITY_TOKEN=xxx ./scripts/fetch-clarity.sh [numOfDays]
# numOfDays: 1, 2, or 3 (default: 3)

set -euo pipefail

if [ -z "${CLARITY_TOKEN:-}" ]; then
  echo "Error: CLARITY_TOKEN env var is required" >&2
  exit 1
fi

NUM_DAYS="${1:-3}"
ENDPOINT="https://www.clarity.ms/export-data/api/v1/project-live-insights"
OUT_DIR="data/clarity"
TODAY=$(date -u +%Y-%m-%d)
OUT_FILE="${OUT_DIR}/${TODAY}.json"

mkdir -p "$OUT_DIR"

fetch_dim() {
  local label="$1"
  local query="$2"
  echo "Fetching: $label ($query)" >&2
  curl -sS --fail-with-body \
    -H "Authorization: Bearer $CLARITY_TOKEN" \
    "${ENDPOINT}?numOfDays=${NUM_DAYS}${query}" \
    | jq --arg label "$label" '{label: $label, data: .}'
}

{
  echo '{'
  echo "  \"fetchedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
  echo "  \"numOfDays\": ${NUM_DAYS},"
  echo '  "queries": ['

  first=1
  for entry in \
    "overall|" \
    "byPage|&dimension1=URL" \
    "byDevice|&dimension1=Device" \
    "byBrowser|&dimension1=Browser" \
    "byOS|&dimension1=OS" \
    "byCountry|&dimension1=Country" \
    "bySource|&dimension1=Source"
  do
    label="${entry%%|*}"
    query="${entry#*|}"
    if [ $first -eq 0 ]; then echo ','; fi
    first=0
    fetch_dim "$label" "$query" || echo "{\"label\":\"$label\",\"error\":\"fetch failed\"}"
    sleep 1
  done

  echo
  echo '  ]'
  echo '}'
} > "$OUT_FILE"

echo "Saved: $OUT_FILE" >&2
