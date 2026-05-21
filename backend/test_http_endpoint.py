#!/usr/bin/env python
import urllib.request
import json

# أولاً، سجّل دخول للحصول على token
print("🔐 Logging in...")
login_data = json.dumps({
    'username': 'hadjer@example.com',
    'password': 'hadjer123',
}).encode('utf-8')

req = urllib.request.Request(
    'http://localhost:8000/api/auth/login/',
    data=login_data,
    headers={'Content-Type': 'application/json'}
)

try:
    response = urllib.request.urlopen(req)
    login_response = json.loads(response.read())
    token = login_response.get('access')
    print(f"✅ Token: {token[:20]}...")
except Exception as e:
    print(f"❌ Login failed: {e}")
    exit(1)

# الآن اختبر mes_patients endpoint
print("\n📋 Fetching patients...")
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}
req = urllib.request.Request(
    'http://localhost:8000/api/rcp/mes-patients/',
    headers=headers
)

try:
    response = urllib.request.urlopen(req)
    data = json.loads(response.read())
    print(f"Status: {response.status}")
    print(f"Patients count: {len(data)}")
    if len(data) > 0:
        print(f"First patient: {data[0]}")
except Exception as e:
    print(f"❌ Error: {e}")
