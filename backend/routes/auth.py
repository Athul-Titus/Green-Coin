from datetime import datetime, timedelta
from typing import Optional, List
from jose import jwt, JWTError
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import os
import hashlib
import secrets

from database import get_db
from models import User
from config import settings

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

SECRET_KEY = settings.JWT_SECRET
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.JWT_EXPIRE_MINUTES

class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    user_type: Optional[str] = "individual"
    location: Optional[str] = None
    neighborhood_type: Optional[str] = None
    commute_type: Optional[str] = None
    diet_type: Optional[str] = None
    has_solar: Optional[bool] = False
    has_led: Optional[bool] = False
    has_smart_meter: Optional[bool] = False
    has_ev_charger: Optional[bool] = False

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    full_name: str
    email: str
    user_type: str

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    user_type: str
    location: Optional[str] = None
    neighborhood_type: Optional[str] = None
    commute_type: Optional[str] = None
    diet_type: Optional[str] = None
    has_solar: bool
    has_led: bool
    has_smart_meter: bool
    has_ev_charger: bool
    trust_score: float
    total_credits: int
    available_credits: int

    class Config:
        from_attributes = True


# ── Password hashing (native hashlib PBKDF2) ──
PBKDF2_ITERATIONS = 100_000
SALT_LENGTH = 32

def hash_password(password: str) -> str:
    salt = os.urandom(SALT_LENGTH)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2${salt.hex()}${dk.hex()}"

def verify_password(plain: str, stored_hash: str) -> bool:
    try:
        parts = stored_hash.split("$")
        if len(parts) != 3:
            return False
        salt = bytes.fromhex(parts[1])
        expected = parts[2]
        dk = hashlib.pbkdf2_hmac("sha256", plain.encode(), salt, PBKDF2_ITERATIONS)
        return secrets.compare_digest(dk.hex(), expected)
    except Exception:
        return False

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY,
                      algorithm=ALGORITHM)

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY,
                             algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

# ── ROUTES ────────────────────────────────────

@router.post("/register", response_model=TokenResponse)
async def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):
    # Check if email already exists
    existing = db.query(User).filter(
        User.email == request.email
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    new_user = User(
        full_name         = request.full_name,
        email             = request.email,
        password_hash     = hash_password(request.password),
        user_type         = request.user_type or "individual",
        location          = request.location,
        neighborhood_type = request.neighborhood_type,
        commute_type      = request.commute_type,
        diet_type         = request.diet_type,
        has_solar         = request.has_solar or False,
        has_led           = request.has_led or False,
        has_smart_meter   = request.has_smart_meter or False,
        has_ev_charger    = request.has_ev_charger or False,
        trust_score       = 50.0,
        total_credits     = 0,
        available_credits = 0,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate JWT token
    access_token = create_access_token(
        data={"sub": new_user.id}
    )

    return TokenResponse(
        access_token  = access_token,
        token_type    = "bearer",
        user_id       = new_user.id,
        full_name     = new_user.full_name,
        email         = new_user.email,
        user_type     = new_user.user_type,
    )

@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    # Find user
    user = db.query(User).filter(
        User.email == request.email
    ).first()

    if not user or not verify_password(
        request.password, user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={"sub": user.id}
    )

    return TokenResponse(
        access_token = access_token,
        token_type   = "bearer",
        user_id      = user.id,
        full_name    = user.full_name,
        email        = user.email,
        user_type    = user.user_type,
    )

@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user

@router.post("/logout")
async def logout():
    # JWT is stateless — client just deletes token
    return {"message": "Logged out successfully"}

