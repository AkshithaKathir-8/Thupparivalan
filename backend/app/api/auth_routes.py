import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.all_models import User
from app.schemas.all_schemas import UserLogin, TokenResponse, UserResponse
from app.security.auth import verify_password, create_access_token, get_current_investigator, hash_password
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    email = credentials.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(credentials.password, user.password_hash):
        log_audit_event(
            db, actor_id=email, action="LOGIN_FAILURE",
            target_type="SESSION", target_id="auth-fail",
            details="Invalid login credentials provided", result="FAILURE"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if user.role != "INVESTIGATOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to authorized Investigators only."
        )

    user.last_login = datetime.utcnow()
    db.commit()

    access_token = create_access_token(data={"sub": user.email, "role": user.role})

    log_audit_event(
        db, actor_id=user.email, action="LOGIN_SUCCESS",
        target_type="SESSION", target_id=user.id,
        details=f"Investigator {user.full_name} logged in successfully", result="SUCCESS"
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "last_login": user.last_login
        }
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_investigator)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "last_login": current_user.last_login
    }
