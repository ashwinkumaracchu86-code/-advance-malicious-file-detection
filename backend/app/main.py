import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import engine, Base, SessionLocal
from .models.models import User
from .security.auth import get_password_hash
from .routes import auth, files, scans, dashboard, quarantine, logs, reports, antivirus
from .scanner.yara_scanner import get_yara_scanner

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

UPLOADS_DIR = os.getenv("UPLOADS_DIR", os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads"))
QUARANTINE_DIR = os.getenv("QUARANTINE_DIR", os.path.join(os.path.dirname(os.path.dirname(__file__)), "quarantine"))


def create_default_admin():
    """Create default admin user if none exists."""
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.is_admin == True).first()
        if not admin:
            admin = User(
                username="admin",
                email="admin@example.com",
                hashed_password=get_password_hash("admin123"),
                is_admin=True,
            )
            db.add(admin)
            db.commit()
            logger.info("Default admin user created (admin/admin123)")
        else:
            logger.info("Admin user already exists.")
    except Exception as e:
        logger.error(f"Failed to create admin user: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created.")

    os.makedirs(UPLOADS_DIR, exist_ok=True)
    os.makedirs(QUARANTINE_DIR, exist_ok=True)
    logger.info(f"Directories ensured: {UPLOADS_DIR}, {QUARANTINE_DIR}")

    create_default_admin()

    scanner = get_yara_scanner()
    logger.info(f"YARA scanner initialized with {scanner.get_loaded_rules_count()} rules.")

    yield

    logger.info("Application shutting down.")


app = FastAPI(
    title="Malicious File Detection System",
    description="Backend API for detecting malicious files using multiple analysis techniques",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(files.router)
app.include_router(scans.router)
app.include_router(dashboard.router)
app.include_router(quarantine.router)
app.include_router(logs.router)
app.include_router(reports.router)
app.include_router(antivirus.router)


@app.get("/")
def root():
    return {
        "name": "Malicious File Detection System",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
