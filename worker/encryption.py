from cryptography.fernet import Fernet

from config import settings


def get_fernet() -> Fernet:
    if not settings.CAMERA_ENCRYPTION_KEY:
        raise ValueError("CAMERA_ENCRYPTION_KEY is not set")
    return Fernet(settings.CAMERA_ENCRYPTION_KEY.encode())


def encrypt_password(password: str) -> str:
    fernet = get_fernet()
    return fernet.encrypt(password.encode()).decode()


def decrypt_password(encrypted: str) -> str:
    fernet = get_fernet()
    return fernet.decrypt(encrypted.encode()).decode()
