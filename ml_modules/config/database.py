import os
import logging
from pymongo import MongoClient
from pymongo.uri_parser import parse_uri
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables from backend
dotenv_path = os.path.join(os.path.dirname(__file__), '../../backend/.env')
load_dotenv(dotenv_path)

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    logger.error("MONGO_URI not found in environment variables")
    raise ValueError("MONGO_URI not set")

client = None
db = None

async def connect_db():
    global client, db
    try:
        client = MongoClient(MONGO_URI)
        
        # Extract DB name from URI
        uri_info = parse_uri(MONGO_URI)
        db_name = uri_info.get('database') or "MyDataBase"
        
        db = client[db_name]
        logger.info(f"Using Database: {db_name}")
        
        client.admin.command('ping')
        logger.info("✅ Connected to MongoDB successfully")
    except Exception as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        raise e

def close_db():
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed")

def get_database():
    return db
