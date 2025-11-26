from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

class MongoDB:
    client: AsyncIOMotorClient = None
    database = None

    async def connect(self):
        self.client = AsyncIOMotorClient(settings.MONGO_CONNECTION_STRING)
        self.database = self.client[settings.MONGO_DATABASE_NAME]
        print(f"Connected to MongoDB: {settings.MONGO_DATABASE_NAME}")

    async def close(self):
        if self.client:
            self.client.close()
            print("MongoDB connection closed.")

mongodb = MongoDB()

async def get_database():
    return mongodb.database

