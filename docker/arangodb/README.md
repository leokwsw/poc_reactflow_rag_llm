# ArangoDB

Local ArangoDB for Graph RAG.

```bash
cd docker/arangodb
cp .env.sample .env
docker compose up -d
```

Use these values in the app `.env`:

```bash
GRAPH_RAG_ARANGODB_ENABLED=true
ARANGODB_URL=http://localhost:8529
ARANGODB_USERNAME=root
ARANGODB_PASSWORD=password
ARANGODB_DATABASE=_system
ARANGODB_ENTITY_COLLECTION=kg_entities
ARANGODB_EDGE_COLLECTION=kg_edges
ARANGODB_CHUNK_COLLECTION=kg_chunks
```

The compose file exposes the HTTP API on `localhost:8529` and stores data in Docker named volumes.
