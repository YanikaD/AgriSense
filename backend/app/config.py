import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    NEO4J_URI: str = os.getenv("NEO4J_URI", "")
    NEO4J_USERNAME: str = os.getenv("NEO4J_USERNAME", "")
    NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "https://agrisense-backend-production-a012.up.railway.app")

    def require(self):
        missing = [
            ("NEO4J_URI", self.NEO4J_URI),
            ("NEO4J_USERNAME", self.NEO4J_USERNAME),
            ("NEO4J_PASSWORD", self.NEO4J_PASSWORD),
            ("OPENAI_API_KEY", self.OPENAI_API_KEY),
        ]
        errs = [k for k, v in missing if not v]
        if errs:
            raise RuntimeError(f"Missing environment variables: {', '.join(errs)}")

settings = Settings()