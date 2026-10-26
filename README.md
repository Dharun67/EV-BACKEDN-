# GridWise — EV Mobility Backend Architecture & Services

The complete backend ecosystem powering the GridWise Intelligent EV Charging & Route Optimization Platform. This repository contains the distributed backend services, real-time telemetry pipelines, asynchronous workers, and machine learning inference engines.

## 🏛️ System Architecture

```
                       ┌─────────────────────────┐
                       │   Frontend Application   │
                       └────────────┬────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  │                                   │
                  ▼ (REST / Socket.IO)                ▼ (REST / WebSockets)
        ┌──────────────────┐               ┌──────────────────────┐
        │  Node.js/Express │               │    Python FastAPI    │
        │   Backend API    │               │   Backend Service    │
        │   (Port 5000)    │               │  (Port 8000 / 8001)  │
        └─────────┬────────┘               └──────────┬───────────┘
                  │                                   │
      ┌───────────┼───────────┐                       │
      │           │           │                       │
      ▼           ▼           ▼                       ▼
┌───────────┐ ┌───────┐ ┌───────────┐       ┌──────────────────┐
│  MongoDB  │ │ Redis │ │ RabbitMQ  │       │    ML Service    │
│ Persist.  │ │ Locks │ │ & BullMQ  │       │   (Port 8000)    │
└───────────┘ └───────┘ └───────────┘       └─────────┬────────┘
                                                      │
                                                      ▼
                                            ┌──────────────────┐
                                            │ Pretrained ML    │
                                            │ Models (Joblib)  │
                                            └──────────────────┘
```

---

## 📦 Services Included

### 1. `backend/` — Node.js & TypeScript API Gateway (Port 5000)
- **Framework**: Express 5 + TypeScript + tsx
- **Database**: MongoDB (Mongoose ODM) with geospatial indexing (`$geoNear`)
- **Cache & Realtime**: Upstash / Local Redis for distributed locks, rate limiting, and FIFO station queues
- **Message Broker & Queues**: RabbitMQ & BullMQ workers for incident detection, AI decision execution, and notification dispatching
- **WebSockets**: Socket.IO for live charging session telemetry
- **Auth**: Firebase Admin SDK integration

### 2. `gridwise-backend/` — Python FastAPI Service (Port 8000/8001)
- **Framework**: FastAPI + Uvicorn + Motor (Async MongoDB)
- **Features**: Stations API, live queue management, booking scheduler, emergency rescue routing, wallet transactions, and CPO administrative analytics
- **WebSockets**: Native FastAPI WebSockets for live battery telemetry

### 3. `ml-service/` — AI & Machine Learning Inference Engine
- **Framework**: FastAPI + Scikit-learn + XGBoost
- **Endpoints**: Route recommendation, dynamic charging strategy, queue wait time forecasting, and predictive charger maintenance
- **Models**: Pre-trained model weights located in `models/`

### 4. Supporting Folders & Scripts
- `models/`: Serialized ML models (e.g., `traffic_forecasting_model.pkl`)
- `docs/`: 24+ architecture specifications, security audits, and integration documents
- `scripts/`: Data ingestion, MongoDB seeding (`seed_mongo.py`), METR-LA traffic processing (`process_metr_la.py`), and ML training pipelines (`train_models.py`)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ and npm
- **Python**: 3.10+
- **MongoDB**: MongoDB Atlas or local MongoDB instance
- **Redis**: Upstash Redis or local Redis server

### 2. Running the Node.js Express API (`backend/`)
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB, Redis, and Firebase credentials
npm run dev
```

### 3. Running the Python FastAPI Backend (`gridwise-backend/`)
```bash
cd gridwise-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### 4. Running the Machine Learning Service (`ml-service/`)
```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m src.main
```

---

## 🔒 Security & Environment
Sensitive credentials (`.env` files) are strictly excluded from git tracking. Sample configuration templates are provided via `.env.example` in each service directory.

## 📄 License
ISC License
