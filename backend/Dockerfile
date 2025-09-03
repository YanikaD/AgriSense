FROM python:3.11-slim AS base

# Install system dependencies (optional, add more if needed for libs like numpy, opencv, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (better caching)
COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy app source
COPY . .

# Expose port
EXPOSE 8000

# Start FastAPI with hot-reload OFF in production
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
