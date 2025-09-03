from openai import OpenAI
from app.config import settings

_client = None

def get_openai():
    global _client
    if _client is None:
        settings.require()
        _client = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


def ask_with_context_stream(question: str, chunks: list) -> str:
    context_text = "\n\n".join([c.get("fulltext", "") for c in chunks])
    prompt = f"""
You are an agricultural policy assistant.
Instruction:
1. Answer in English or Thai based on the question language. if context is in Thai, but question is in English, answer in English.
2. Only use the provided context to answer.
3. Do not mention or list any sources.

Input: {question}
Context: {chunks}
"""
    client = get_openai()
    stream = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        stream=True
        # temperature=0.2,
    )
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta