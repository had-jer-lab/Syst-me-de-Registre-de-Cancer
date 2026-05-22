#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from patients.models import Patient
from django.contrib.auth import get_user_model
User = get_user_model()

# عد المرضى في قاعدة البيانات
total = Patient.objects.count()
print(f"إجمالي المرضى: {total}")

# عد المرضى حسب deleted_at
active = Patient.objects.filter(deleted_at__isnull=True).count()
print(f"المرضى النشطين: {active}")

# اطبع أول 5 مرضى
for p in Patient.objects.filter(deleted_at__isnull=True)[:5]:
    print(f"  - {p.full_name} (ID: {p.id}) - أنشأ: {p.created_by}")

# عد المستخدمين
users = User.objects.count()
print(f"\nإجمالي المستخدمين: {users}")
