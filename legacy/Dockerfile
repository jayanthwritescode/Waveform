FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    DATABASE_URL=sqlite:////app/data/workspace/waveform.db
WORKDIR /app
COPY backend/requirements-runtime-lock.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt && \
    useradd --uid 10001 --create-home waveform && \
    mkdir -p /app/data/workspace && chown -R waveform:waveform /app/data/workspace
COPY backend/app /app/backend/app
COPY frontend /app/frontend
COPY data/catalogue/tracks.json data/catalogue/fma.json /app/data/catalogue/
COPY docs/evaluation-report.json /app/docs/evaluation-report.json
USER waveform
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/ready', timeout=4)"
CMD ["python","-m","uvicorn","app.main:app","--app-dir","backend","--host","0.0.0.0","--port","8000"]
