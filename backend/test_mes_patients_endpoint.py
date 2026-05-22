#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from rest_framework.request import Request
from django.contrib.auth import get_user_model
from rcp.views import mes_patients

User = get_user_model()

# احصل على أول user
user = User.objects.first()
print(f"Testing with user: {user}")

# أنشئ request
factory = APIRequestFactory()
django_request = factory.get('/api/rcp/mes-patients/')
django_request.user = user

# استدعِ الدالة مباشرة
try:
    response = mes_patients(django_request)
    print(f"Status: {response.status_code}")
    print(f"Response data: {response.data}")
    print(f"Data type: {type(response.data)}")
    print(f"Data count: {len(response.data) if hasattr(response.data, '__len__') else 'N/A'}")
    if isinstance(response.data, list) and len(response.data) > 0:
        print(f"First patient: {response.data[0]}")
    else:
        print("No data returned!")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
