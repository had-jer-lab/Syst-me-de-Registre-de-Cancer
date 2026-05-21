import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import json
from django.test import Client
from accounts.models import User

# Afficher les utilisateurs
print("=== Utilisateurs dans la base de données ===")
for u in User.objects.all():
    print(f"Email: {u.email}, Role: {u.role}, Active: {u.is_active}, Statut: {u.statut}")

# Tester le login
print("\n=== Test de connexion ===")
client = Client()

data = {'email': 'admin@registre-cancer.com', 'password': 'admin123'}
response = client.post(
    '/api/auth/login/',
    data=json.dumps(data),
    content_type='application/json'
)

print(f"Status: {response.status_code}")
print(f"Response: {response.content.decode()}")
