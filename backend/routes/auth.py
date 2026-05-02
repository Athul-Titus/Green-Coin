"""GreenCoin — Auth Routes (register, login, me)"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime, timedelta
from jose import JWTError, jwt
import hashlib
import os
import secrets
from typing import Optional
import logging

from database import get_db, get_redis
from models.user import User
from config import settings

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ── Rate Limiting ─────────────────────────────────────────────────────────────
MAX_LOGIN_ATTEMPTS = 5
LOGIN_WINDOW_SECONDS = 60


def _check_rate_limit(email: str):
    """Block login if too many failed attempts within the time window."""
    try:
        r = get_redis()
        key = f"login_attempts:{email}"
        attempts = r.get(key)
        if attempts and int(attempts) >= MAX_LOGIN_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many login attempts. Try again in {LOGIN_WINDOW_SECONDS}s.",
            )
    except HTTPException:
        raise
    except Exception:
        pass  # Redis unavailable — skip rate limiting


def _record_failed_attempt(email: str):
    """Increment failed login counter in Redis."""
    try:
        r = get_redis()
        key = f"login_attempts:{email}"
        pipe = r.pipeline()
        pipe.incr(key)
        pipe.expire(key, LOGIN_WINDOW_SECONDS)
        pipe.execute()
    except Exception:
        pass


def _clear_attempts(email: str):
    """Clear rate limit counter on successful login."""
    try:
        r = get_redis()
        r.delete(f"login_attempts:{email}")
    except Exception:
        pass


# ── Schemas ───────────────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    user_type: str = "individual"  # individual / corporate
    city: Optional[str] = None
    company_name: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: str
    user_id: str


class UserOut(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    user_type: str
    city: Optional[str]
    company_name: Optional[str]
    green_score: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Password Hashing (PBKDF2 with salt) ──────────────────────────────────────
PBKDF2_ITERATIONS = 100_000
SALT_LENGTH = 32


def hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with a random salt."""
    salt = os.urandom(SALT_LENGTH)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2${salt.hex()}${dk.hex()}"


def verify_password(plain: str, stored_hash: str) -> bool:
    """Verify password against stored hash (supports both PBKDF2 and legacy SHA256)."""
    if stored_hash.startswith("pbkdf2$"):
        # New PBKDF2 format: pbkdf2$<salt_hex>$<hash_hex>
        parts = stored_hash.split("$")
        if len(parts) != 3:
            return False
        salt = bytes.fromhex(parts[1])
        expected = parts[2]
        dk = hashlib.pbkdf2_hmac("sha256", plain.encode(), salt, PBKDF2_ITERATIONS)
        return secrets.compare_digest(dk.hex(), expected)
    else:
        # Legacy SHA256 (unsalted) — for migration
        return secrets.compare_digest(
            hashlib.sha256(plain.encode()).hexdigest(), stored_hash
        )


def _migrate_password_if_needed(user: User, plain: str, db: Session):
    """Re-hash legacy SHA256 passwords to PBKDF2 on successful login."""
    if not user.password_hash.startswith("pbkdf2$"):
        user.password_hash = hash_password(plain)
        db.commit()
        logger.info(f"Migrated password hash for user {user.email}")


# ── Token Helpers ─────────────────────────────────────────────────────────────
def create_token(user_id: str, user_type: str) -> str:
    payload = {
        "sub": user_id,
        "type": user_type,
        "exp": datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.post("/register", response_model=Token, status_code=201)
def register(data: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        user_type=data.user_type,
        city=data.city,
        company_name=data.company_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(str(user.id), user.user_type)
    return Token(
        access_token=token,
        token_type="bearer",
        user_type=user.user_type,
        user_id=str(user.id),
    )


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Rate limiting check
    _check_rate_limit(form_data.username)

    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        _record_failed_attempt(form_data.username)
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    # Seamless migration: re-hash legacy passwords
    _migrate_password_if_needed(user, form_data.password, db)

    # Clear rate limit on success
    _clear_attempts(form_data.username)

    token = create_token(str(user.id), user.user_type)
    return Token(
        access_token=token,
        token_type="bearer",
        user_type=user.user_type,
        user_id=str(user.id),
    )


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
