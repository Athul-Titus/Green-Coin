# GreenCoin 🌱
**AI-powered Carbon Credit Marketplace**

A three-sided marketplace where individuals earn verified carbon credits through green lifestyle choices, and corporations buy them for ESG compliance.

---

## Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────────┐
│   Individuals   │    │  GreenCoin API   │    │    Corporations      │
│  (User App)     │───►│  (FastAPI +      │◄───│  (Corporate Portal)  │
│  :5173          │    │   ML + Redis)    │    │  :5174               │
└─────────────────┘    │  :8000           │    └──────────────────────┘
                       └──────────────────┘
                              │
                     ┌────────┴────────┐
                     │   PostgreSQL    │
                     │   Redis Cache   │
                     └─────────────────┘
```

## Quick Start
See [STARTUP.md](STARTUP.md) for full instructions.

```bash
# 1. Start databases
docker compose up -d

# 2. Backend
cd backend && pip install -r requirements.txt
python seed_data.py  # Load demo data
python main.py       # http://localhost:8000/docs

# 3. User Frontend
cd frontend-user && npm run dev   # http://localhost:5173

# 4. Corporate Dashboard  
cd frontend-corporate && npm run dev  # http://localhost:5174
```

## Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Individual | `arjun.sharma@demo.greencoin.io` | `greencoin123` |
| Corporate  | `sustainability@infosys.demo` | `corporate123` |

## Demo Simulation
```bash
curl -X POST http://localhost:8000/demo/run
```
Runs full journey: user logs cycling → ML trust score → mint credits → corporate purchase → ESG certificate.

## Tech Stack
- **Backend**: Python 3.11 + FastAPI + SQLAlchemy + Redis
- **ML**: IsolationForest (fraud) + KMeans (advisor) + PyTorch LSTM (forecast) + XGBoost (patterns)  
- **User Frontend**: React 18 + TypeScript + Vite + Tailwind + Framer Motion + Recharts
- **Corporate Frontend**: React 18 + TypeScript + Vite + Tailwind + Recharts
- **Database**: PostgreSQL 15 + Redis 7

## Credit Economy
- `1 credit = ₹50`
- `100 credits = 1 tonne CO₂`
- Cycling: 4 credits/km | Plant-based meal: 5 credits | Solar: 10 credits/kWh
