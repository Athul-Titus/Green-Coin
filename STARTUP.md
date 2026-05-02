# GreenCoin — Startup Guide

Complete step-by-step instructions to get GreenCoin running locally.

---

## Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| Python | 3.11+ | `python --version` |
| Node.js | 18+ | `node --version` |
| Docker | Latest | `docker --version` |
| Docker Compose | v2+ | `docker compose version` |

---

## Step 1: Start Databases

```bash
docker compose up -d
```

Wait ~5 seconds for PostgreSQL and Redis to initialize. Verify:

```bash
docker compose ps
```

> **No Docker?** You can use SQLite instead (already the default fallback). Just skip this step and the app will use `greencoin.db` locally. Redis caching will be disabled but the app will still work.

---

## Step 2: Setup Python Environment

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:

| OS | Command |
|----|---------|
| **Windows (PowerShell)** | `venv\Scripts\activate` |
| **Windows (CMD)** | `venv\Scripts\activate.bat` |
| **macOS / Linux** | `source venv/bin/activate` |

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## Step 3: Configure Environment

```bash
# From the project root
cp .env.example backend/.env
```

Edit `backend/.env` if you have real API keys. For demo mode, no changes needed — the app works with `DEMO_MODE=True`.

### Key environment variables

| Variable | Required? | Description |
|----------|-----------|-------------|
| `DATABASE_URL` | Optional | PostgreSQL URL (defaults to SQLite) |
| `REDIS_URL` | Optional | Redis URL (gracefully degrades if unavailable) |
| `JWT_SECRET` | ⚠️ For production | JWT signing secret — change from default! |
| `GROQ_API_KEY` | For AI features | Groq API key for LLM-based verification |
| `DEMO_MODE` | — | `True` = mock APIs, `False` = real APIs |

---

## Step 4: Seed Demo Data

```bash
cd backend
python seed_data.py
```

This creates demo users, actions, credits, bundles, and certificates.

---

## Step 5: Start the Backend

```bash
cd backend
python main.py
```

The API will be available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health check**: http://localhost:8000/health

---

## Step 6: Start User Frontend

Open a **new terminal**:

```bash
cd frontend-user
npm install    # first time only
npm run dev
```

User app at: **http://localhost:5173**

---

## Step 7: Start Corporate Dashboard

Open another **new terminal**:

```bash
cd frontend-corporate
npm install    # first time only
npm run dev
```

Corporate dashboard at: **http://localhost:5174**

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Individual | `arjun.sharma@demo.greencoin.io` | `greencoin123` |
| Corporate | `sustainability@infosys.demo` | `corporate123` |

---

## Quick Demo Simulation

Run the full GreenCoin journey in one API call:

```bash
curl -X POST http://localhost:8000/demo/run
```

This simulates the complete flow:
1. User logs a cycling commute action
2. ML pipeline runs trust verification
3. Carbon credits are minted
4. Corporate user purchases a credit bundle
5. ESG compliance certificate is generated

---

## Quick Start (All Services at Once)

### PowerShell (Windows)

```powershell
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd backend; python main.py'
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd frontend-user; npm run dev'
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd frontend-corporate; npm run dev'
```

### Bash (macOS/Linux)

```bash
cd backend && python main.py &
cd frontend-user && npm run dev &
cd frontend-corporate && npm run dev &
```

---

## Troubleshooting

### "Module not found" errors
Make sure your virtual environment is activated and all dependencies are installed:
```bash
cd backend && pip install -r requirements.txt
```

### Redis connection errors
Redis is optional. If Redis is unavailable, the app logs a warning and disables caching. Everything else works normally.

### Port already in use
Kill the process on the port:
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :8000
kill -9 <PID>
```

### Database issues
Delete the SQLite database and re-seed:
```bash
cd backend
del greencoin.db        # Windows
# rm greencoin.db       # macOS/Linux
python seed_data.py
```
