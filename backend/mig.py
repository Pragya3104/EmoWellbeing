from app.database import engine, Base
from app import models  # triggers SQLAlchemy to see new columns
  # adds new columns if using SQLite