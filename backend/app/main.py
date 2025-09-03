from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import shutil
import tempfile
from app.config import settings
from app.utils.text_extract import extract_docx_text, extract_pdf_text
from app.services.retrieval import retrieve_context
from app.services.openai_client import ask_with_context_stream
from app.models.schemas import AskRequest, AskResponse
from app.models.schemas import OrgExtractDocRequest, OrgExtractTextRequest

app = FastAPI(title="RAG Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://agri-sense-frontend-weld.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/chat")
async def chat(req: AskRequest):
    chunks = retrieve_context(req.question)
    if not chunks:
        async def gen():
            yield "ไม่พบเอกสารที่เกี่ยวข้องในระบบ"
        return StreamingResponse(gen(), media_type="text/plain")

    async def gen():
        for token in ask_with_context_stream(req.question, chunks):
            yield token

    return StreamingResponse(gen(), media_type="text/plain")