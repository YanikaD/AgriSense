from neo4j import GraphDatabase
from app.config import settings

_driver = None

def get_driver():
    global _driver
    if _driver is None:
        settings.require()
        _driver = GraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USERNAME, settings.NEO4J_PASSWORD),
        )
    return _driver