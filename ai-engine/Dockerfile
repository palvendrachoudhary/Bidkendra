FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (for OCR)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download spacy model (optional, but good for NLP)
RUN python -m spacy download en_core_web_sm || true

# Copy application code
COPY ./app /app/app

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
