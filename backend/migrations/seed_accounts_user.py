"""Seed/upsert the dedicated accounts user.

  • email:    accounts@locofast.com
  • password: Accounts@123 (must be changed by user first login)
  • role:     accounts (restricted feature surface)
"""
import asyncio, os, uuid
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    db = AsyncIOMotorClient(os.environ['MONGO_URL'])[os.environ['DB_NAME']]
    email = "accounts@locofast.com"
    plain = "Accounts@123"
    existing = await db.admins.find_one({"email": email})
    pwhash = bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()
    if existing:
        await db.admins.update_one(
            {"id": existing["id"]},
            {"$set": {
                "role": "accounts",
                "name": existing.get("name") or "Accounts (Locofast)",
                "password": pwhash,
            }},
        )
        print(f"Updated existing user: id={existing['id']}")
    else:
        doc = {
            "id": str(uuid.uuid4()),
            "email": email,
            "password": pwhash,
            "name": "Accounts (Locofast)",
            "role": "accounts",
            "is_account_manager": False,
        }
        await db.admins.insert_one(doc)
        print(f"Created accounts user: id={doc['id']}")
    print(f"Credentials → {email} / {plain}")

asyncio.run(main())
