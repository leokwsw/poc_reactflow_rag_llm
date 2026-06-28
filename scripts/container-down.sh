#!/usr/bin/env sh
set -eu

if ! command -v container >/dev/null 2>&1; then
  echo "Apple container CLI is not installed or not on PATH." >&2
  exit 1
fi

for name in rag-postgres rag-elasticsearch rag-neo4j; do
  container stop "$name" >/dev/null 2>&1 || true
  container rm "$name" >/dev/null 2>&1 || true
done

echo "RAG infra containers stopped and removed."
