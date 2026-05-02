import hashlib, secrets

# Simulate what's in the DB (SHA256 from seed_data)
stored = hashlib.sha256('greencoin123'.encode()).hexdigest()
print(f'Stored hash: {stored}')
print(f'Starts with pbkdf2: {stored.startswith("pbkdf2")}')

# Test legacy verify
plain = 'greencoin123'
result = secrets.compare_digest(hashlib.sha256(plain.encode()).hexdigest(), stored)
print(f'Legacy verify result: {result}')

# Also verify the new auth.py verify_password function
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from routes.auth import verify_password, hash_password
print(f'\nverify_password("greencoin123", stored_sha256): {verify_password("greencoin123", stored)}')

# Test new PBKDF2
new_hash = hash_password("greencoin123")
print(f'New PBKDF2 hash: {new_hash[:50]}...')
print(f'verify_password("greencoin123", new_pbkdf2): {verify_password("greencoin123", new_hash)}')
print(f'verify_password("wrong", new_pbkdf2): {verify_password("wrong", new_hash)}')
