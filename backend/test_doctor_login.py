#!/usr/bin/env python
import os
import django
import json
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User

# Check database
print("=" * 80)
print("USERS IN DATABASE:")
print("=" * 80)
users = User.objects.filter(role__in=['medecin', 'anapate', 'epidimio'])
for user in users:
    print(f"Email: {user.email}")
    print(f"  - Name: {user.prenom} {user.nom}")
    print(f"  - Role: {user.role}")
    print(f"  - Status (statut): {user.statut}")
    print(f"  - Is Active: {user.is_active}")
    print(f"  - Has password: {bool(user.password)}")
    print()

# Try login
print("=" * 80)
print("TESTING LOGIN:")
print("=" * 80)

email = "safiimane123@gmail.com"
password = "safi123"

try:
    user = User.objects.get(email=email)
    print(f"User found: {user.email}")
    print(f"  - Checking password...")
    if user.check_password(password):
        print("  ✓ Password is correct!")
    else:
        print("  ✗ Password is WRONG")
        print("  - Trying to find the correct password by checking database...")
except User.DoesNotExist:
    print(f"✗ User NOT found with email: {email}")
    print(f"\nAvailable emails:")
    for user in User.objects.filter(role__in=['medecin', 'anapate']):
        print(f"  - {user.email}")

# Now test API call
print("\n" + "=" * 80)
print("TESTING API CALL:")
print("=" * 80)

api_url = "http://localhost:8000/api/auth/login/"
payload = {"email": email, "password": password}

try:
    response = requests.post(api_url, json=payload, timeout=5)
    print(f"Status Code: {response.status_code}")
    print(f"Response:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
except Exception as e:
    print(f"Error: {e}")
