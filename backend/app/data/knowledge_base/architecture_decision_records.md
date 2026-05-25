---
title: "AI Platform Architecture Decision Records"
category: "architecture"
department: "Engineering"
access_level: "internal"
roles: "developer,team_lead,executive,cto"
---

# Architecture Decision Records (ADRs) — AI Platform

## ADR-031: Adopt RAG Over Fine-Tuning for Enterprise Knowledge

**Status:** Accepted | **Date:** 2024-09-15 | **Author:** Platform Architecture Team

### Context
We needed to decide between fine-tuning a base LLM on company data vs. implementing Retrieval-Augmented Generation (RAG) for our enterprise AI copilot.

### Decision
We chose RAG over fine-tuning.

### Rationale

| Factor | Fine-Tuning | RAG |
|--------|------------|-----|
| Knowledge freshness | Requires re-training | Real-time |
| Cost | $40K-200K per run | Minimal |
| Data privacy | Model memorizes data | Data stays in DB |
| Accuracy | Hallucination risk | Grounded in sources |
| Auditability | Opaque | Full trace |

**Winner: RAG** — enterprise knowledge changes daily. Fine-tuning creates a snapshot; RAG enables living knowledge.

### Consequences
- Invest in Qdrant vector database infrastructure
- Build document ingestion pipeline
- Implement chunking and embedding strategy
- Accept higher latency per query (retrieval step adds ~200ms)

---

## ADR-032: Use Qdrant Over Pinecone/Weaviate for Vector Storage

**Status:** Accepted | **Date:** 2024-10-01

### Context
Evaluated Pinecone, Weaviate, Chroma, Milvus, and Qdrant for vector storage.

### Decision
Qdrant selected as primary vector database.

### Rationale
- **Self-hosted**: Full data sovereignty, no external API calls
- **Performance**: Fastest ANN search in benchmarks (< 5ms at 1M vectors)
- **Filtering**: Best-in-class payload filtering for metadata-based access control
- **Rust-based**: Minimal resource footprint in Kubernetes
- **Open-source**: No vendor lock-in

### Consequences
- Ops team trains on Qdrant administration
- Deploy Qdrant Kubernetes operator
- Implement backup strategy for vector data

---

## ADR-033: Local LLM via Ollama Over Cloud API

**Status:** Accepted | **Date:** 2024-10-15

### Context
Evaluated OpenAI GPT-4, Anthropic Claude, Cohere, and local Ollama for LLM inference.

### Decision
Ollama with local open-source models (Llama 3.2, Mistral) as primary inference engine.

### Rationale
1. **Data sovereignty**: Enterprise data NEVER leaves our infrastructure
2. **Cost**: $0 per query vs $0.002-0.06 per query with cloud APIs
3. **Latency**: Local inference at 15-20 tokens/sec, no network roundtrip
4. **GDPR**: No data processing agreements with third parties needed
5. **Availability**: No dependency on external API rate limits or outages

### Consequences
- Requires GPU infrastructure (NVIDIA A100 in production)
- Model management overhead (updates, version control)
- Slightly lower quality vs GPT-4 (acceptable for enterprise retrieval)
- Accept: no access to latest frontier models

---

## ADR-034: Permission-Aware Retrieval at Vector Search Layer

**Status:** Accepted | **Date:** 2024-11-01

### Context
How should we enforce document access control in the RAG pipeline?

### Options Considered
1. Post-generation filtering (LLM generates, then we redact)
2. Pre-retrieval filtering (filter before LLM sees anything)
3. Separate collections per role
4. Metadata filtering at vector search time

### Decision
**Option 4: Metadata filtering at vector search time**

### Rationale
- **Security**: LLM NEVER receives restricted content
- **Performance**: Single collection, filter by metadata payload
- **Flexibility**: Role-based and attribute-based access in one query
- **Auditability**: Qdrant logs exactly which filters applied

### Implementation
```python
# Qdrant filter at search time
filter = Filter(must=[
    FieldCondition(key="access_level", match=MatchAny(any=allowed_levels)),
    FieldCondition(key="department", match=MatchAny(any=user_departments)),
])
```

**The LLM cannot hallucinate data it was never given.**

---

## ADR-035: BAAI/bge-small-en-v1.5 as Primary Embedding Model

**Status:** Accepted | **Date:** 2024-11-10

### Decision
Use BAAI/bge-small-en-v1.5 (384-dim) as primary embedding model.

### Rationale
- **MTEB Leaderboard**: Top-10 retrieval performance at its size class
- **Speed**: 3x faster than all-mpnet-base-v2
- **Size**: 33M parameters (fits in CPU RAM easily)
- **Retrieval-optimized**: Specifically trained for retrieval tasks (not semantic similarity)
- **Deterministic**: Same embedding every time (no temperature)

### Embedding dimensions: 384

At 10M documents with 384-dim float32:
`10M × 384 × 4 bytes = 15.4 GB` — well within Qdrant's capacity.
