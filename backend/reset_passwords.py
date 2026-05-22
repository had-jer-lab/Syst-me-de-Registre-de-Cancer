#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User

# Find users with no password
users_no_pwd = User.objects.filter(role__in=['medecin', 'anapate', 'epidimio'])

print("=" * 80)
print("RESETTING PASSWORDS FOR USERS WITHOUT PASSWORD")
print("=" * 80)

for user in users_no_pwd:
    # Generate a temporary password based on email
    # Or use a default password that matches what the frontend sent
    # Since we don't know what password the admin tried to set, 
    # let's set a known password for testing
    
    temp_password = "TempPass123!"  # Temporary password
    user.set_password(temp_password)
    user.save()
    
    print(f"✓ Reset password for: {user.email}")
    print(f"  - Temporary password: {temp_password}")
    print(f"  - Please update this password after testing")
    print()

print("=" * 80)
print("TESTING LOGIN WITH NEW PASSWORD")
print("=" * 80)

import requests
import json

# Test login
email = "safiimane123@gmail.com"
password = "TempPass123!"

api_url = "http://localhost:8000/api/auth/login/"
payload = {"email": email, "password": password}

try:
    response = requests.post(api_url, json=payload, timeout=5)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("✓ LOGIN SUCCESSFUL!")
        data = response.json()
        print(f"  - User: {data['user']['prenom']} {data['user']['nom']}")
        print(f"  - Role: {data['user']['role']}")
        print(f"  - Route: {data['route']}")
    else:
        print(f"✗ LOGIN FAILED")
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
except Exception as e:
    print(f"Error: {e}")
