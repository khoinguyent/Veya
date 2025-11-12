from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from uuid import uuid4
from datetime import datetime, timedelta
from app.db.database import get_session
from app.models.user import User, UserProfile, SocialAccount, AuthProvider
from app.schemas.user import (
    UserResponse,
    FirebaseAuthRequest,
    FirebaseAuthResponse,
    LoginRequest,
    LoginResponse,
    TokenResponse,
    GuestAuthResponse,
    SocialAccountCreate,
    SocialAccountResponse,
)
from app.core.security import create_access_token, verify_password
from app.core.firebase import verify_firebase_token, initialize_firebase, get_firebase_user
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


# Firebase initialization is handled in main.py lifespan


@router.post("/firebase/register", response_model=FirebaseAuthResponse)
def register_with_firebase(
    request: FirebaseAuthRequest,
    session: Session = Depends(get_session)
):
    """
    Register a new user with Firebase ID token.
    Creates a user profile in the database if the user doesn't exist.
    
    **Security**: This endpoint verifies the Firebase ID token server-side
    before creating any user records. The token must be valid and not expired.
    
    Args:
        request: Firebase authentication request with ID token
        
    Returns:
        FirebaseAuthResponse with user info, JWT token, and is_new_user flag
        
    Raises:
        HTTPException: If token is invalid, expired, or user creation fails
    """
    # Verify Firebase token
    decoded_token = verify_firebase_token(request.id_token)
    if not decoded_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    firebase_uid = decoded_token.get("uid")
    email = decoded_token.get("email")
    email_verified = decoded_token.get("email_verified", False)
    display_name = decoded_token.get("name")
    photo_url = decoded_token.get("picture")
    
    if not firebase_uid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Firebase token: missing UID"
        )
    
    # Check if user already exists by Firebase UID
    statement = select(User).where(User.firebase_uid == firebase_uid)
    existing_user = session.exec(statement).first()
    
    if existing_user:
        # User already exists, return existing user info
        access_token_expires = timedelta(minutes=60 * 24 * 7)  # 7 days
        access_token = create_access_token(
            data={"sub": str(existing_user.id)}, expires_delta=access_token_expires
        )
        
        return FirebaseAuthResponse(
            user=UserResponse.model_validate(existing_user),
            token=access_token,
            is_new_user=False
        )
    
    # Check if user exists by email (for account linking)
    if email:
        statement = select(User).where(User.email == email)
        email_user = session.exec(statement).first()
        if email_user:
            # Link Firebase account to existing email user
            email_user.firebase_uid = firebase_uid
            email_user.email_verified = email_verified
            email_user.auth_provider = request.provider or AuthProvider.FIREBASE
            if display_name and not email_user.display_name:
                email_user.display_name = display_name
            if photo_url and not email_user.avatar_url:
                email_user.avatar_url = photo_url
            email_user.last_login_at = datetime.utcnow()
            session.add(email_user)
            session.commit()
            session.refresh(email_user)
            
            access_token_expires = timedelta(minutes=60 * 24 * 7)
            access_token = create_access_token(
                data={"sub": str(email_user.id)}, expires_delta=access_token_expires
            )
            
            return FirebaseAuthResponse(
                user=UserResponse.model_validate(email_user),
                token=access_token,
                is_new_user=False
            )
    
    # Create new user
    new_user = User(
        firebase_uid=firebase_uid,
        email=email,
        email_verified=email_verified,
        display_name=display_name,
        avatar_url=photo_url,
        auth_provider=request.provider or AuthProvider.FIREBASE,
        is_guest=False,
        is_active=True,
        created_at=datetime.utcnow(),
        last_login_at=datetime.utcnow(),
    )
    
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    # Create user profile
    user_profile = UserProfile(
        user_id=new_user.id,
        name=display_name or email,
        created_at=datetime.utcnow(),
    )
    session.add(user_profile)
    session.commit()
    
    # Create JWT token
    access_token_expires = timedelta(minutes=60 * 24 * 7)  # 7 days
    access_token = create_access_token(
        data={"sub": str(new_user.id)}, expires_delta=access_token_expires
    )
    
    return FirebaseAuthResponse(
        user=UserResponse.model_validate(new_user),
        token=access_token,
        is_new_user=True
    )


@router.post("/firebase/login", response_model=FirebaseAuthResponse)
def login_with_firebase(
    request: FirebaseAuthRequest,
    session: Session = Depends(get_session)
):
    """
    Login with Firebase ID token.
    Returns user profile if user exists, otherwise returns 404.
    
    **Security**: This endpoint verifies the Firebase ID token server-side.
    Use /firebase/register if you want to automatically create users.
    
    Args:
        request: Firebase authentication request with ID token
        
    Returns:
        FirebaseAuthResponse with user info and JWT token
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    # Verify Firebase token
    decoded_token = verify_firebase_token(request.id_token)
    if not decoded_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    firebase_uid = decoded_token.get("uid")
    
    if not firebase_uid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Firebase token: missing UID"
        )
    
    # Find user by Firebase UID
    statement = select(User).where(User.firebase_uid == firebase_uid)
    user = session.exec(statement).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please register first."
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Update last login time
    user.last_login_at = datetime.utcnow()
    
    # Update user info from Firebase token if available
    email = decoded_token.get("email")
    email_verified = decoded_token.get("email_verified", False)
    display_name = decoded_token.get("name")
    photo_url = decoded_token.get("picture")
    
    if email and not user.email:
        user.email = email
    if email_verified:
        user.email_verified = email_verified
    if display_name and not user.display_name:
        user.display_name = display_name
    if photo_url and not user.avatar_url:
        user.avatar_url = photo_url
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # Create JWT token
    access_token_expires = timedelta(minutes=60 * 24 * 7)  # 7 days
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return FirebaseAuthResponse(
        user=UserResponse.model_validate(user),
        token=access_token,
        is_new_user=False
    )


@router.post("/login", response_model=LoginResponse)
def login(
    login_data: LoginRequest,
    session: Session = Depends(get_session)
):
    """
    Authenticate user with email and password.
    
    **Security Note**: This endpoint should only be used over HTTPS in production
    to ensure the password is encrypted in transit. The password is sent as plaintext
    in the request body and is encrypted by the TLS/SSL connection.
    
    Args:
        login_data: Email and password credentials
        
    Returns:
        LoginResponse with user info and JWT token
        
    Raises:
        HTTPException: If credentials are invalid or user is inactive
    """
    # Find user by email
    statement = select(User).where(User.email == login_data.email)
    user = session.exec(statement).first()
    
    # Check if user exists
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Check if user has a password (email/password auth)
    if not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password authentication not available for this account. Please use a different authentication method.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login time
    user.last_login_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # Create JWT token
    access_token_expires = timedelta(minutes=60 * 24 * 7)  # 7 days
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return LoginResponse(
        user=UserResponse.model_validate(user),
        token=access_token,
        token_type="bearer"
    )


@router.post("/firebase", response_model=FirebaseAuthResponse)
def authenticate_with_firebase(
    request: FirebaseAuthRequest,
    session: Session = Depends(get_session)
):
    """
    Authenticate user with Firebase ID token.
    Creates user if doesn't exist, or returns existing user.
    """
    # Verify Firebase token
    decoded_token = verify_firebase_token(request.id_token)
    if not decoded_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase token"
        )
    
    firebase_uid = decoded_token.get("uid")
    email = decoded_token.get("email")
    email_verified = decoded_token.get("email_verified", False)
    display_name = decoded_token.get("name")
    photo_url = decoded_token.get("picture")
    
    if not firebase_uid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Firebase token: missing UID"
        )
    
    # Check if user exists by Firebase UID
    statement = select(User).where(User.firebase_uid == firebase_uid)
    user = session.exec(statement).first()
    is_new_user = False
    
    if not user:
        # Check if user exists by email (for account linking)
        if email:
            statement = select(User).where(User.email == email)
            existing_user = session.exec(statement).first()
            if existing_user:
                # Link Firebase account to existing user
                existing_user.firebase_uid = firebase_uid
                existing_user.email_verified = email_verified
                existing_user.auth_provider = request.provider
                if display_name:
                    existing_user.display_name = display_name
                if photo_url:
                    existing_user.avatar_url = photo_url
                existing_user.last_login_at = datetime.utcnow()
                session.add(existing_user)
                session.commit()
                session.refresh(existing_user)
                user = existing_user
            else:
                # Create new user
                is_new_user = True
                user = User(
                    firebase_uid=firebase_uid,
                    email=email,
                    email_verified=email_verified,
                    display_name=display_name,
                    avatar_url=photo_url,
                    auth_provider=request.provider,
                    is_guest=False,
                    is_active=True,
                    last_login_at=datetime.utcnow(),
                )
                session.add(user)
                session.commit()
                session.refresh(user)
        else:
            # Create user with only Firebase UID
            is_new_user = True
            user = User(
                firebase_uid=firebase_uid,
                auth_provider=request.provider,
                is_guest=False,
                is_active=True,
                last_login_at=datetime.utcnow(),
            )
            session.add(user)
            session.commit()
            session.refresh(user)
    else:
        # Update last login and user info
        user.last_login_at = datetime.utcnow()
        if email and not user.email:
            user.email = email
        if email_verified:
            user.email_verified = email_verified
        if display_name and not user.display_name:
            user.display_name = display_name
        if photo_url and not user.avatar_url:
            user.avatar_url = photo_url
        session.add(user)
        session.commit()
        session.refresh(user)
    
    # Create JWT token
    access_token_expires = timedelta(minutes=60 * 24 * 7)  # 7 days
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return FirebaseAuthResponse(
        user=UserResponse.model_validate(user),
        token=access_token,
        is_new_user=is_new_user
    )


@router.post("/guest", response_model=GuestAuthResponse)
def create_guest_user(session: Session = Depends(get_session)):
    """Create a guest user and return user_id and token."""
    # Create a new guest user
    guest_user = User(
        id=uuid4(),
        is_guest=True,
        auth_provider=AuthProvider.GUEST,
        is_active=True,
    )
    
    session.add(guest_user)
    session.commit()
    session.refresh(guest_user)
    
    # Create access token
    access_token_expires = timedelta(minutes=60 * 24 * 7)  # 7 days
    access_token = create_access_token(
        data={"sub": str(guest_user.id)}, expires_delta=access_token_expires
    )
    
    return GuestAuthResponse(
        user_id=guest_user.id,
        token=access_token,
        user=UserResponse.model_validate(guest_user)
    )


@router.post("/social/link", response_model=SocialAccountResponse)
def link_social_account(
    social_account: SocialAccountCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Link a social account (Google, Apple) to the current user.
    """
    # Check if account already linked
    statement = select(SocialAccount).where(
        SocialAccount.user_id == current_user.id,
        SocialAccount.provider == social_account.provider,
        SocialAccount.provider_account_id == social_account.provider_account_id
    )
    existing = session.exec(statement).first()
    
    if existing:
        # Update existing
        existing.provider_email = social_account.provider_email
        existing.access_token = social_account.access_token
        existing.refresh_token = social_account.refresh_token
        existing.expires_at = social_account.expires_at
        existing.updated_at = datetime.utcnow()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return SocialAccountResponse.model_validate(existing)
    
    # Create new social account link
    new_account = SocialAccount(
        user_id=current_user.id,
        provider=social_account.provider,
        provider_account_id=social_account.provider_account_id,
        provider_email=social_account.provider_email,
        access_token=social_account.access_token,
        refresh_token=social_account.refresh_token,
        expires_at=social_account.expires_at,
    )
    
    session.add(new_account)
    session.commit()
    session.refresh(new_account)
    
    return SocialAccountResponse.model_validate(new_account)


@router.get("/social/accounts", response_model=list[SocialAccountResponse])
def get_linked_social_accounts(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get all social accounts linked to the current user."""
    statement = select(SocialAccount).where(SocialAccount.user_id == current_user.id)
    accounts = session.exec(statement).all()
    return [SocialAccountResponse.model_validate(acc) for acc in accounts]


@router.delete("/social/accounts/{account_id}")
def unlink_social_account(
    account_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Unlink a social account from the current user."""
    from uuid import UUID
    try:
        account_uuid = UUID(account_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid account ID format"
        )
    
    statement = select(SocialAccount).where(
        SocialAccount.id == account_uuid,
        SocialAccount.user_id == current_user.id
    )
    account = session.exec(statement).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Social account not found"
        )
    
    session.delete(account)
    session.commit()
    
    return {"message": "Social account unlinked successfully"}


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user information."""
    return UserResponse.model_validate(current_user)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(current_user: User = Depends(get_current_user)):
    """Refresh JWT token for current user."""
    access_token_expires = timedelta(minutes=60 * 24 * 7)  # 7 days
    access_token = create_access_token(
        data={"sub": str(current_user.id)}, expires_delta=access_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(current_user)
    )
