FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server_cloud.py ./server.py

# Cloud Run sets PORT env var (default 8080)
ENV PORT=8080

EXPOSE 8080

CMD exec gunicorn --bind :$PORT --workers 2 --threads 4 --timeout 120 server:app
