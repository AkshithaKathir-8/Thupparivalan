import os
import sys

# Ensure backend app path is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(BASE_DIR, "backend"))

from app.database.connection import engine, Base
from app.main import auto_seed_if_empty

if __name__ == "__main__":
    print("Initializing Thupparivalan database schema...")
    Base.metadata.create_all(bind=engine)
    print("Executing seed ingestion...")
    auto_seed_if_empty()
    print("Database seeding completed successfully.")
