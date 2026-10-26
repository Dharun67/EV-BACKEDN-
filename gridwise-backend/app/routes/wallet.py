from fastapi import APIRouter, HTTPException
from typing import List
from app.core.database import get_db

router = APIRouter()

@router.get("/balance")
async def get_wallet_balance():
    db = get_db()
    # In a real app, we'd fetch by user_id from auth token. 
    # For now, return a mock user wallet document.
    return {
        "success": True,
        "data": {
            "balance": 2450.50,
            "reward_credits": 125,
            "currency": "INR"
        }
    }

@router.get("/transactions")
async def get_transactions():
    return {
        "success": True,
        "data": [
            {
                "id": "TXN-8849",
                "type": "charge",
                "amount": -180.00,
                "date": "2026-10-06T10:30:00Z",
                "status": "completed",
                "description": "ChargeHub Peelamedu"
            },
            {
                "id": "TXN-8850",
                "type": "topup",
                "amount": 1000.00,
                "date": "2026-10-05T14:20:00Z",
                "status": "completed",
                "description": "Credit Card ending in 4421"
            }
        ]
    }
