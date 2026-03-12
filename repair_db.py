import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

async def repair_data():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
    db = client.attendance_db
    
    print("--- DATA REPAIR STARTED ---")
    
    # 1. Update Employees missing organization_id or basic fields
    result = await db.employees.update_many(
        {"$or": [
            {"organization_id": {"$exists": False}},
            {"department": {"$exists": False}},
            {"designation": {"$exists": False}},
            {"employee_type": {"$exists": False}}
        ]},
        {"$set": {
            "organization_id": "ORG001", # Default fallback
            "department": "General",
            "designation": "Staff",
            "employee_type": "office"
        }}
    )
    print(f"Repaired {result.modified_count} employee records.")

    # 2. Update Admins missing organization_id
    result = await db.admins.update_many(
        {"organization_id": {"$exists": False}},
        {"$set": {"organization_id": "ORG001"}}
    )
    print(f"Repaired {result.modified_count} admin records.")

    # 3. Ensure all check-ins have organization_id for filtering
    result = await db.attendance.update_many(
        {"organization_id": {"$exists": False}},
        {"$set": {"organization_id": "ORG001"}}
    )
    print(f"Repaired {result.modified_count} attendance records.")

    print("--- DATA REPAIR COMPLETE ---")

if __name__ == "__main__":
    asyncio.run(repair_data())
