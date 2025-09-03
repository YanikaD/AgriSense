from typing import Dict, List
from neo4j import Transaction
from openai import OpenAI
from pythainlp.tokenize import word_tokenize
from app.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

# --- Extract filters with LLM ---
def extract_filters_with_llm(user_query: str) -> Dict:
    prompt = f"""
    You are an expert assistant. 
    Given the following query, extract lists for these categories:
    - section_type (e.g. รายงาน, สถานการณ์)
    - crop_type (e.g. ข้าว, ยางพารา)
    - key_topics (e.g. ผลกระทบ, ราคา, นโยบาย)
    - organization (e.g. กระทรวงเกษตร, FAQ)

    Query: "{user_query}"

    Respond in strict JSON only.
    """

    response = client.chat.completions.create(
        model="gpt-5-nano",  # or your preferred model
        messages=[{"role": "user", "content": prompt}],
        # temperature=0
    )

    import json
    try:
        return json.loads(response.choices[0].message.content)
    except:
        return {"section_type": [], "crop_type": [], "key_topics": [], "organization": []}


# --- Fulltext Search ---
def fulltext_search(tx: Transaction, query: str, limit: int = 5) -> List[Dict]:
    result = tx.run("""
    CALL db.index.fulltext.queryNodes('chunk_content', $query)
    YIELD node, score
    RETURN node.id AS id, node.content AS content, score
    ORDER BY score DESC
    LIMIT $limit
    """, {"query": query, "limit": limit})
    return [r.data() for r in result]


# --- Vector Search ---
def vector_search(tx: Transaction, embedding: List[float], limit: int = 5) -> List[Dict]:
    result = tx.run("""
    CALL db.index.vector.queryNodes('chunk_embedding', $limit, $embedding)
    YIELD node, score
    RETURN node.id AS id, node.content AS content, score
    """, embedding=embedding, limit=limit)
    return [r.data() for r in result]


# --- Hybrid Search with Metadata Filters ---
def search_neo4j_chunks(tx: Transaction, user_query: str, filters: Dict = None, limit: int = 5) -> List[Dict]:
    user_query = " ".join(word_tokenize(user_query, engine="newmm"))

    if filters is None:
        filters = extract_filters_with_llm(user_query)
    # print(f"Extracted filters: {filters}")

    results = []

    # 1. If filters provided → filter first
    if any(filters.values()):
        cypher = """
        MATCH (c:Chunk)
        WHERE (
            (SIZE($section_type) > 0 AND ANY(term IN $section_type WHERE term IN c.section_type)) OR
            (SIZE($crop_type) > 0 AND ANY(term IN $crop_type WHERE term IN c.crop_type)) OR
            (SIZE($key_topics) > 0 AND ANY(term IN $key_topics WHERE term IN c.key_topics)) OR
            (SIZE($organization) > 0 AND ANY(term IN $organization WHERE term IN c.organization))
        )
        RETURN c.id AS id, c.content AS content, 1.0 AS score
        LIMIT $limit
        """
        result = tx.run(cypher, **filters, limit=limit)
        results.extend([r.data() for r in result])
    # 2. Always run fulltext search
    results.extend(fulltext_search(tx, user_query, limit))
    # print(f"results 2.: {results}")
    # 3. Vector search using OpenAI embeddings
    embedding = client.embeddings.create(
        model="text-embedding-3-small",
        input=user_query
    ).data[0].embedding
    results.extend(vector_search(tx, embedding, limit))
    # print(f"results 3.: {results}")
    # 4. Deduplicate by id, keep highest score
    merged, seen = [], {}
    for r in results:
        rid = r.get("id")
        if rid not in seen or r["score"] > seen[rid]["score"]:
            seen[rid] = r
    merged = list(seen.values())
    print(f"merged: {merged}")
    # Sort by score (vector/ft search provide scores, filters fixed at 1.0)
    merged = sorted(merged, key=lambda x: x["score"], reverse=True)[:limit]

    return merged


# --- Optional: List chunks by document ---
def list_chunks_by_document(tx: Transaction, document_name: str) -> List[Dict]:
    res = tx.run(
        """
        MATCH (d:Document {name: $document_name})-[:CONTAINS]->(c:Chunk)
        RETURN c.id AS id, c.content AS content
        ORDER BY c.sequence
        """,
        document_name=document_name,
    )
    return [r.data() for r in res]
