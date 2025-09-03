from typing import List, Dict
from app.neo4j_client import get_driver
from app.repositories.chunks import search_neo4j_chunks


def retrieve_context(user_query: str) -> List[Dict]:
    driver = get_driver()
    with driver.session() as session:
        return session.execute_read(search_neo4j_chunks, user_query)