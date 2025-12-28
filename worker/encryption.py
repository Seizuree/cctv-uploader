import hashlib

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from config import settings


def get_key() -> bytes:
    """Derive 32-byte key using scrypt (same as API).

    Node.js scryptSync defaults: N=16384 (2^14), r=8, p=1
    """
    key = settings.CAMERA_ENCRYPTION_KEY
    if not key:
        raise ValueError("CAMERA_ENCRYPTION_KEY is not set")
    # Match Node.js scryptSync(key, 'salt', 32) with defaults
    return hashlib.scrypt(
        key.encode(),
        salt=b"salt",
        n=16384,  # Node.js default (2^14)
        r=8,      # Node.js default
        p=1,      # Node.js default
        dklen=32,
    )


def decrypt_password(encrypted_data: str) -> str:
    """Decrypt password using AES-256-GCM (format: iv:authTag:encrypted in hex)."""
    key = get_key()

    parts = encrypted_data.split(":")
    if len(parts) != 3:
        raise ValueError("Invalid encrypted data format")

    iv_hex, auth_tag_hex, encrypted_hex = parts

    iv = bytes.fromhex(iv_hex)
    auth_tag = bytes.fromhex(auth_tag_hex)
    encrypted = bytes.fromhex(encrypted_hex)

    # AESGCM expects ciphertext + tag concatenated
    ciphertext_with_tag = encrypted + auth_tag

    aesgcm = AESGCM(key)
    decrypted = aesgcm.decrypt(iv, ciphertext_with_tag, None)

    return decrypted.decode("utf-8")
