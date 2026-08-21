# Ollama Blog

A Django REST + React blog prototype. Posts contain only a title and description in the database. On the detail page, Django asks a local Ollama model for three tags through the OpenAI Python SDK.

## Setup

Prerequisites: Python 3.10+, Node.js 20+, pnpm, and Ollama.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python backend/manage.py migrate

cd frontend
pnpm install
```

Make sure the model configured in `.env` is installed locally:

```powershell
ollama pull gemma4:latest
```

If your Ollama installation uses a different available model name, change `OLLAMA_MODEL` in `.env`.

## Run

Start Ollama, Django, and Vite in separate terminals:

```powershell
ollama serve
.\.venv\Scripts\python.exe backend/manage.py runserver
cd frontend; pnpm run dev
```

Open http://localhost:5173. The API is available at http://localhost:8000/api/posts/.

## Tests

```powershell
.\.venv\Scripts\python.exe backend/manage.py test blog
cd frontend; pnpm run build
```
