#!/usr/bin/env python
import os
import django
import json
from datetime import date
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from patients.models import Patient

User = get_user_model()

# جلب أول مستخدم أو استخدم superuser
user = User.objects.filter(is_superuser=True).first()
if not user:
    user = User.objects.first()

# جلب مريض موجود
patient = Patient.objects.first()
if not patient:
    print("لا توجد مرضى")
    exit(1)

print(f"Patient: {patient.numero_dossier}")
print(f"User: {user.email if user else 'Unknown'}")

# إنشاء client واختبار API
client = Client()

# بيانات السرطان
cancer_data = {
    'patient': patient.id,
    'organe': 'Test API',
    'date_diagnostic': '2025-02-20',
    'date_symptomes': '2025-01-15',
    'type_tumeur': 'solide',
    'localise': True,
    'data_source': 'manual',
}

print("\n\nإرسال بيانات السرطان:")
print(json.dumps(cancer_data, indent=2, default=str))

# POST إلى API
response = client.post(
    f'/api/patients/{patient.id}/cancers/',
    data=json.dumps(cancer_data),
    content_type='application/json',
    HTTP_AUTHORIZATION=f'Bearer {user.auth_token.key if hasattr(user, "auth_token") else ""}',
)

print(f"\nResponse status: {response.status_code}")
print(f"Response: {response.content.decode()}")

# إذا كانت العملية ناجحة، تحقق من البيانات المحفوظة
if response.status_code in [200, 201]:
    import json
    data = json.loads(response.content)
    print("\nBiانات المحفوظة من API:")
    print(json.dumps(data, indent=2, default=str))
