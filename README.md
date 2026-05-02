# 🌱 GreenCoin

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**AI-powered Carbon Credit Marketplace** — A three-sided marketplace where individuals earn verified carbon credits through green lifestyle choices, and corporations purchase them for ESG compliance.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🚴 **Green Action Logging** | Log eco-friendly actions (cycling, plant-based meals, solar energy) with GPS/image proof |
| 🤖 **AI Verification Pipeline** | ML-powered trust scoring, fraud detection, and automated credit minting |
| 💰 **Carbon Credit Wallet** | Real-time balance tracking, transaction history, and withdrawal support |
| 🏢 **Corporate ESG Portal** | Browse credit bundles, purchase offsets, and generate ESG certificates |
| 📊 **Smart Advisor** | Personalized green action recommendations based on user patterns |
| 🔮 **Credit Forecasting** | LSTM-based prediction of future credit earnings |

---

## 🏗️ Architecture

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

### Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Python 3.11 · FastAPI · SQLAlchemy · Pydantic · Redis |
| **ML Pipeline** | Groq Llama 3.1 (LLM) · IsolationForest · KMeans · LSTM · XGBoost |
| **User Frontend** | React 19 · TypeScript · Vite · Three.js · Framer Motion · GSAP · Recharts |
| **Corporate Frontend** | React 19 · TypeScript · Vite · Recharts |
| **Database** | PostgreSQL 15 · Redis 7 |
| **Auth** | JWT · PBKDF2-HMAC-SHA256 · Rate limiting |

---

## 🚀 Quick Start

> See [STARTUP.md](STARTUP.md) for the full detailed guide with troubleshooting.

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (for PostgreSQL + Redis)

### 1. Clone & setup environment

```bash
git clone https://github.com/Athul-Titus/Green-Coin.git
cd Green-Coin
cp .env.example backend/.env
```

### 2. Start databases

```bash
docker compose up -d
```

### 3. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
python seed_data.py          # Load demo data
python main.py               # API at http://localhost:8000/docs
```

### 4. User Frontend

```bash
cd frontend-user
npm install
npm run dev                  # http://localhost:5173
```

### 5. Corporate Dashboard

```bash
cd frontend-corporate
npm install
npm run dev                  # http://localhost:5174
```

---

## 🎮 Demo

### Credentials

| Role | Email | Password |
|------|-------|----------|
| Individual | `arjun.sharma@demo.greencoin.io` | `greencoin123` |
| Corporate | `sustainability@infosys.demo` | `corporate123` |

### Full Simulation

Run the complete journey in one command:

```bash
curl -X POST http://localhost:8000/demo/run
```

This simulates: **User logs cycling** → **ML trust verification** → **Credits minted** → **Corporate purchase** → **ESG certificate generated**

---

## 🔌 API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | — | Create new user account |
| `POST` | `/auth/login` | — | Login and get JWT token |
| `GET` | `/auth/me` | ✅ | Get current user profile |
| `POST` | `/actions/log` | ✅ | Submit a green action with proof |
| `GET` | `/actions/history` | ✅ | View past actions |
| `GET` | `/credits/balance` | ✅ | Get credit balance (cached) |
| `GET` | `/credits/history` | ✅ | Credit transaction history |
| `POST` | `/credits/withdraw` | ✅ | Request credit withdrawal |
| `GET` | `/marketplace/bundles` | ✅ | Browse credit bundles |
| `POST` | `/marketplace/purchase` | ✅ | Purchase a credit bundle |
| `GET` | `/advisor/plan` | ✅ | Get personalized green plan |
| `GET` | `/health` | — | Health check |
| `POST` | `/demo/run` | — | Run full demo simulation |

> Full interactive API docs available at [`/docs`](http://localhost:8000/docs) (Swagger UI) and [`/redoc`](http://localhost:8000/redoc).

---

## 💹 Credit Economy

| Parameter | Value |
|-----------|-------|
| 1 Credit | ₹50 |
| 100 Credits | 1 tonne CO₂ |
| Cycling | 4 credits/km |
| Plant-based Meal | 5 credits/meal |
| Solar Energy | 10 credits/kWh |
| EV Charging | 8 credits/kWh |
| Composting | 3 credits/kg |
| LED Switch | 20 credits (one-time) |
| No-flight pledge | 50 credits/flight |

---

## 🛡️ Security

- **Password hashing**: PBKDF2-HMAC-SHA256 with random 32-byte salt (100,000 iterations)
- **Authentication**: JWT tokens with configurable expiry
- **Rate limiting**: Redis-backed login attempt throttling (5 attempts/60s)
- **Secrets management**: All API keys stored in `.env` (git-ignored)
- **CORS**: Restricted to configured frontend origins only
- **Input validation**: Pydantic schemas on all endpoints

---

## 📁 Project Structure

```
Green-Coin/
├── backend/
│   ├── config.py              # Pydantic settings from .env
│   ├── database.py            # SQLAlchemy + Redis setup
│   ├── main.py                # FastAPI app entry point
│   ├── seed_data.py           # Demo data seeder
│   ├── models/                # SQLAlchemy models
│   │   ├── user.py            # User model (individual + corporate)
│   │   ├── action.py          # GreenAction model
│   │   ├── credit.py          # CarbonCredit, Bundle, Certificate
│   │   └── verification.py    # Device & audit verification
│   ├── routes/                # API endpoints
│   │   ├── auth.py            # Register, login, JWT
│   │   ├── actions.py         # Action logging & history
│   │   ├── credits.py         # Balance, history, withdraw
│   │   ├── marketplace.py     # Bundle browsing & purchase
│   │   ├── advisor.py         # AI green advisor
│   │   ├── verification.py    # Device registration & audits
│   │   └── demo.py            # Demo simulation endpoint
│   ├── ml/                    # Machine learning services
│   │   ├── llm_client.py      # Shared Groq LLM client
│   │   ├── trust_verify.py    # Action trust scoring
│   │   ├── fraud_detector.py  # Fraud pattern detection
│   │   ├── green_advisor.py   # Personalized recommendations
│   │   └── credit_forecaster.py # Credit earning prediction
│   └── services/              # Business logic
│       ├── credit_minter.py   # Credit minting pipeline
│       ├── gps_verifier.py    # GPS proof verification
│       ├── ocr_verifier.py    # Image/receipt verification
│       └── certificate_generator.py # ESG PDF certificates
├── frontend-user/             # Individual user React app
├── frontend-corporate/        # Corporate portal React app
├── .env.example               # Environment template
├── docker-compose.yml         # PostgreSQL + Redis
└── STARTUP.md                 # Detailed setup guide
```

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Setting up the development environment
- Branch naming conventions
- Code style and commit messages
- Pull request process

---

## 📄 License

This project is licensed under the MIT License.
