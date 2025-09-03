from docx import Document
import PyPDF2

def extract_docx_text(filepath: str) -> str:
    doc = Document(filepath)
    return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])

def extract_pdf_text(filepath: str) -> str:
    reader = PyPDF2.PdfReader(filepath)
    parts = []
    for page in reader.pages:
        text = page.extract_text() or ""
        parts.append(text)
    return "\n".join(parts)