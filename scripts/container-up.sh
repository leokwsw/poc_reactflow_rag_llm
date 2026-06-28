#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
DATA_DIR="$ROOT_DIR/.container-data"

mkdir -p \
  "$DATA_DIR/postgres" \
  "$DATA_DIR/elasticsearch" \
  "$DATA_DIR/neo4j"

if ! command -v container >/dev/null 2>&1; then
  echo "Apple container CLI is not installed or not on PATH." >&2
  echo "Install it from https://github.com/apple/container and retry." >&2
  exit 1
fi

container system start >/dev/null 2>&1 || true

replace_container() {
  name="$1"
  container stop "$name" >/dev/null 2>&1 || true
  container rm "$name" >/dev/null 2>&1 || true
}

replace_container rag-postgres
container run --detach \
  --name rag-postgres \
  --env POSTGRES_USER=rag \
  --env POSTGRES_PASSWORD=rag \
  --env POSTGRES_DB=rag_workflow \
  --publish 5432:5432 \
  --volume "$DATA_DIR/postgres:/var/lib/postgresql/data" \
  docker.io/library/postgres:16-alpine

replace_container rag-elasticsearch
container run --detach \
  --name rag-elasticsearch \
  --env discovery.type=single-node \
  --env xpack.security.enabled=false \
  --env ES_JAVA_OPTS="-Xms512m -Xmx512m" \
  --publish 9200:9200 \
  --volume "$DATA_DIR/elasticsearch:/usr/share/elasticsearch/data" \
  docker.elastic.co/elasticsearch/elasticsearch:8.14.3

replace_container rag-neo4j
container run --detach \
  --name rag-neo4j \
  --env NEO4J_AUTH=neo4j/ragpassword \
  --publish 7474:7474 \
  --publish 7687:7687 \
  --volume "$DATA_DIR/neo4j:/data" \
  docker.io/library/neo4j:5-community

echo "RAG infra is starting:"
echo "- PostgreSQL: localhost:5432"
echo "- Elasticsearch: http://localhost:9200"
echo "- Neo4j Browser: http://localhost:7474"
