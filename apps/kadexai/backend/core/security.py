from core.config import settings


def encrypt_token(token: str) -> str:
    if not settings.encryption_key:
        raise RuntimeError("ENCRYPTION_KEY is required for token storage")
    try:
        from cryptography.fernet import Fernet
        return Fernet(settings.encryption_key.encode()).encrypt(token.encode()).decode()
    except Exception as exc:
        raise RuntimeError("Token encryption failed") from exc


def decrypt_token(token: str) -> str:
    if not settings.encryption_key:
        raise RuntimeError("ENCRYPTION_KEY is required for token storage")
    try:
        from cryptography.fernet import Fernet
        return Fernet(settings.encryption_key.encode()).decrypt(token.encode()).decode()
    except Exception as exc:
        raise RuntimeError("Token decryption failed") from exc
