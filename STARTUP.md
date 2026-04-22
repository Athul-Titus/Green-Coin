# GreenCoin — Complete Startup Guide
# Run these commands in sequence

# ─────────────────────────────────────────
# STEP 1: Start PostgreSQL + Redis (Docker)
# ─────────────────────────────────────────
# docker compose up -d
# Wait 5 seconds for DB to be ready

# ─────────────────────────────────────────
# STEP 2: Setup Python environment
# ─────────────────────────────────────────
# cd backend
# python -m venv venv
# venv\Scripts\activate          (Windows)
# pip install -r requirements.txt

# ─────────────────────────────────────────
# STEP 3: Copy and configure .env
# ─────────────────────────────────────────
# copy .env.example .env
# (Edit .env if you have real API keys — not required for demo)

# ─────────────────────────────────────────
# STEP 4: Seed database with demo data
# ─────────────────────────────────────────
# cd backend
# python seed_data.py

# ─────────────────────────────────────────
# STEP 5: Start FastAPI backend
# ─────────────────────────────────────────
# cd backend
# python main.py
# API docs available at: http://localhost:8000/docs

# ─────────────────────────────────────────
# STEP 6: Start User Frontend (new terminal)
# ─────────────────────────────────────────  
# cd frontend-user
# npm run dev
# User app at: http://localhost:5173

# ─────────────────────────────────────────
# STEP 7: Start Corporate Dashboard (new terminal)
# ─────────────────────────────────────────
# cd frontend-corporate
# npm run dev
# Corporate dashboard at: http://localhost:5174

# ─────────────────────────────────────────
# DEMO CREDENTIALS
# ─────────────────────────────────────────
# Individual: arjun.sharma@demo.greencoin.io / greencoin123
# Corporate:  sustainability@infosys.demo / corporate123

# ─────────────────────────────────────────
# HACKATHON DEMO ENDPOINT
# ─────────────────────────────────────────
# POST http://localhost:8000/demo/run
# Runs full simulation: user logs action → ML verification → credits minted → corporate purchase → certificate

# ─────────────────────────────────────────
# QUICK START (PowerShell - all services)
# ─────────────────────────────────────────
# Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd backend; python main.py'
# Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd frontend-user; npm run dev'
# Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd frontend-corporate; npm run dev'
