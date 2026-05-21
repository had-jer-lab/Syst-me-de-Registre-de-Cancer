#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

print("Available users:")
for u in User.objects.all():
    email = getattr(u, 'email', '?')
    print(f"  - ID: {u.id} | Email: {email}")

