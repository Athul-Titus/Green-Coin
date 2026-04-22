import os
import glob

print("Patching models to use SQLite strings instead of PostgreSQL UUIDs...")
for file in glob.glob('backend/models/*.py'):
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('from sqlalchemy.dialects.postgresql import UUID', 'from sqlalchemy import String')
    content = content.replace('UUID(as_uuid=True)', 'String(36)')
    content = content.replace('default=uuid.uuid4', 'default=lambda: str(uuid.uuid4())')
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

with open('backend/config.py', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('postgresql://postgres:postgres@localhost:5432/greencoin', 'sqlite:///./greencoin.db')
with open('backend/config.py', 'w', encoding='utf-8') as f:
    f.write(content)

with open('backend/database.py', 'r', encoding='utf-8') as f:
    content = f.read()
if 'connect_args' not in content:
    content = content.replace('max_overflow=20,', 'max_overflow=20,\n    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},')
if 'client.ping()' in content and 'return False' not in content:
    content = content.replace('client.ping()', 'return False # Mocked for local sqlite\n        client.ping()')
with open('backend/database.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch complete.")
