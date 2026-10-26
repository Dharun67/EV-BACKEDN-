from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../../backend/.env'))

MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    # fallback to local if not found
    MONGODB_URI = "mongodb+srv://dharun143:dharun143@cluster0.mxw8xkj.mongodb.net/gridwise?retryWrites=true&w=majority"

client = AsyncIOMotorClient(MONGODB_URI)
db = client.get_database("gridwise")

def get_db():
    return db
