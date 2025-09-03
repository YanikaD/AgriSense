from pydantic import BaseModel,Field
from typing import Optional

class AskRequest(BaseModel):
    question: str

class AskResponse(BaseModel):
    answer: str

class OrgExtractDocRequest(BaseModel):
    document_name: str = Field(..., description="Exact Document.name to scan")

class OrgExtractTextRequest(BaseModel):
    document_name: str
    text: str
