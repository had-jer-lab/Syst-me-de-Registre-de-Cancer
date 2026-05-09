#!/usr/bin/env python
import os
import django
from datetime import date
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from patients.models import Cancer
from patients.serializers import CancerCreateSerializer

# جلب آخر cancer
cancer = Cancer.objects.latest('id')
print(f"Current state:")
print(f"  date_diagnostic: '{cancer.date_diagnostic}' (type: {type(cancer.date_diagnostic).__name__})")
print(f"  date_symptomes: '{cancer.date_symptomes}' (type: {type(cancer.date_symptomes).__name__})")

# اختبر PATCH مع إرسال null
print("\n\nTest 1: PATCH with null date_diagnostic")
update_data = {
    'date_diagnostic': None,
    'stade_clinique': 'III',
}
serializer = CancerCreateSerializer(cancer, data=update_data, partial=True)
if serializer.is_valid():
    updated = serializer.save()
    cancer_check = Cancer.objects.get(id=cancer.id)
    print(f"  Result: date_diagnostic = '{cancer_check.date_diagnostic}'")
else:
    print(f"  Validation errors: {serializer.errors}")

# اختبر PATCH مع إرسال empty string
print("\nTest 2: PATCH with empty string date_diagnostic")
cancer.date_diagnostic = '2025-03-10'
cancer.save()
update_data = {
    'date_diagnostic': '',
    'stade_clinique': 'I',
}
serializer = CancerCreateSerializer(cancer, data=update_data, partial=True)
if serializer.is_valid():
    updated = serializer.save()
    cancer_check = Cancer.objects.get(id=cancer.id)
    print(f"  Result: date_diagnostic = '{cancer_check.date_diagnostic}'")
else:
    print(f"  Validation errors: {serializer.errors}")

# اختبر PATCH مع إرسال تاريخ صحيح
print("\nTest 3: PATCH with valid date")
update_data = {
    'date_diagnostic': '2025-04-15',
    'stade_clinique': 'II',
}
serializer = CancerCreateSerializer(cancer, data=update_data, partial=True)
if serializer.is_valid():
    updated = serializer.save()
    cancer_check = Cancer.objects.get(id=cancer.id)
    print(f"  Result: date_diagnostic = '{cancer_check.date_diagnostic}'")
else:
    print(f"  Validation errors: {serializer.errors}")
