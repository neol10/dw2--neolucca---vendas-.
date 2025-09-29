from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Use a consistent DB filename already present in the repo
SQLALCHEMY_DATABASE_URL = "sqlite:///./loja.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency para FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
