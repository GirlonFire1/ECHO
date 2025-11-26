import base64
import json
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import os

class E2EEncryption:
    """End-to-end encryption utilities for secure messaging"""
    
    @staticmethod
    def generate_key_pair():
        """Generate a new RSA key pair"""
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        public_key = private_key.public_key()
        
        # Serialize keys to PEM format
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        
        # Return base64 encoded keys
        return {
            "private_key": base64.b64encode(private_pem).decode('utf-8'),
            "public_key": base64.b64encode(public_pem).decode('utf-8')
        }
    
    @staticmethod
    def encrypt_message(message, recipient_public_key_b64):
        """Encrypt a message using recipient's public key"""
        # Generate a random symmetric key
        symmetric_key = os.urandom(32)  # 256-bit key
        iv = os.urandom(16)  # 128-bit IV for AES
        
        # Encrypt the message with the symmetric key
        cipher = Cipher(
            algorithms.AES(symmetric_key),
            modes.CBC(iv),
            backend=default_backend()
        )
        encryptor = cipher.encryptor()
        
        # Pad the message to be a multiple of 16 bytes (AES block size)
        padded_message = message
        padding_length = 16 - (len(message) % 16)
        padded_message += bytes([padding_length]) * padding_length
        
        # Encrypt the message
        ciphertext = encryptor.update(padded_message) + encryptor.finalize()
        
        # Load recipient's public key
        public_key_bytes = base64.b64decode(recipient_public_key_b64)
        public_key = serialization.load_pem_public_key(
            public_key_bytes,
            backend=default_backend()
        )
        
        # Encrypt the symmetric key with the recipient's public key
        encrypted_key = public_key.encrypt(
            symmetric_key,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        
        # Return the encrypted data
        encrypted_data = {
            "encrypted_key": base64.b64encode(encrypted_key).decode('utf-8'),
            "iv": base64.b64encode(iv).decode('utf-8'),
            "ciphertext": base64.b64encode(ciphertext).decode('utf-8')
        }
        
        return json.dumps(encrypted_data)
    
    @staticmethod
    def decrypt_message(encrypted_data_json, private_key_b64):
        """Decrypt a message using user's private key"""
        encrypted_data = json.loads(encrypted_data_json)
        
        # Load encrypted key, iv, and ciphertext
        encrypted_key = base64.b64decode(encrypted_data["encrypted_key"])
        iv = base64.b64decode(encrypted_data["iv"])
        ciphertext = base64.b64decode(encrypted_data["ciphertext"])
        
        # Load user's private key
        private_key_bytes = base64.b64decode(private_key_b64)
        private_key = serialization.load_pem_private_key(
            private_key_bytes,
            password=None,
            backend=default_backend()
        )
        
        # Decrypt the symmetric key
        symmetric_key = private_key.decrypt(
            encrypted_key,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        
        # Decrypt the message
        cipher = Cipher(
            algorithms.AES(symmetric_key),
            modes.CBC(iv),
            backend=default_backend()
        )
        decryptor = cipher.decryptor()
        padded_message = decryptor.update(ciphertext) + decryptor.finalize()
        
        # Remove padding
        padding_length = padded_message[-1]
        message = padded_message[:-padding_length]
        
        return message 