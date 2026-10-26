from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager

from app.core.database import connect_to_mongo, close_mongo_connection
from app.routes import stations, trips, ai, admin, bookings, queue, charging_sessions, wallet, maintenance

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(
    title="GridWise AI Mobility API",
    description="Backend API for GridWise EV Charging and Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stations.router, prefix="/api/v1/stations", tags=["Stations"])
app.include_router(trips.router, prefix="/api/v1/trips", tags=["Trips"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(bookings.router, prefix="/api/v1/bookings", tags=["Bookings"])
app.include_router(queue.router, prefix="/api/v1/queue", tags=["Queue"])
app.include_router(charging_sessions.router, prefix="/api/v1/charging-sessions", tags=["Charging Sessions"])
app.include_router(wallet.router, prefix="/api/v1/wallet", tags=["Wallet"])
app.include_router(maintenance.router, prefix="/api/v1/admin/maintenance", tags=["Maintenance"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the GridWise API"}

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "GridWise Backend"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
