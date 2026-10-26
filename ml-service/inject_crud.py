import os
from src.main import app
# We will write a script that modifies main.py to add generic CRUD and CORS.

with open('src/main.py', 'r') as f:
    content = f.read()

if "CORSMiddleware" not in content:
    content = content.replace("from fastapi import FastAPI, HTTPException", "from fastapi import FastAPI, HTTPException, Request\nfrom fastapi.middleware.cors import CORSMiddleware")
    content = content.replace('app = FastAPI(title="GridWise ML Service")', '''app = FastAPI(title="GridWise ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from src.database import get_db
from bson import ObjectId

# Generic CRUD endpoints
@app.get("/api/{collection_name}")
async def get_all(collection_name: str, limit: int = 100):
    db = get_db()
    items = await db[collection_name].find().to_list(limit)
    for item in items:
        item["id"] = str(item["_id"])
        del item["_id"]
    return {"success": True, "data": items}

@app.get("/api/{collection_name}/{item_id}")
async def get_one(collection_name: str, item_id: str):
    db = get_db()
    try:
        item = await db[collection_name].find_one({"_id": ObjectId(item_id)})
        if item:
            item["id"] = str(item["_id"])
            del item["_id"]
            return {"success": True, "data": item}
        return {"success": False, "message": "Not found"}
    except:
        return {"success": False, "message": "Invalid ID"}

@app.post("/api/{collection_name}")
async def create_one(collection_name: str, request: Request):
    db = get_db()
    data = await request.json()
    result = await db[collection_name].insert_one(data)
    data["id"] = str(result.inserted_id)
    if "_id" in data:
        del data["_id"]
    return {"success": True, "data": data}

@app.put("/api/{collection_name}/{item_id}")
async def update_one(collection_name: str, item_id: str, request: Request):
    db = get_db()
    data = await request.json()
    try:
        await db[collection_name].update_one({"_id": ObjectId(item_id)}, {"$set": data})
        return {"success": True, "message": "Updated successfully"}
    except:
        return {"success": False, "message": "Invalid ID"}

@app.delete("/api/{collection_name}/{item_id}")
async def delete_one(collection_name: str, item_id: str):
    db = get_db()
    try:
        await db[collection_name].delete_one({"_id": ObjectId(item_id)})
        return {"success": True, "message": "Deleted successfully"}
    except:
        return {"success": False, "message": "Invalid ID"}
''')

    with open('src/main.py', 'w') as f:
        f.write(content)
