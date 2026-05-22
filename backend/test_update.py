#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from patients.models import Cancer
from patients.serializers import CancerCreateSerializer

# جلب آخر cancer
cancer = Cancer.objects.latest('id')
print(f"Before Update:")
print(f"  ID: {cancer.id}")
print(f"  date_diagnostic: {cancer.date_diagnostic}")
print(f"  stade_clinique: {cancer.stade_clinique}")

# محاكاة PATCH update
update_data = {
    'date_diagnostic': '2025-03-10',
    'stade_clinique': 'II',
}

serializer = CancerCreateSerializer(cancer, data=update_data, partial=True)
if serializer.is_valid():
    updated = serializer.save()
    print(f"\nAfter Update (من serializer):")
    print(f"  ID: {updated.id}")
    print(f"  date_diagnostic: {updated.date_diagnostic}")
    print(f"  stade_clinique: {updated.stade_clinique}")
    
    # تحقق من قاعدة البيانات
    cancer_check = Cancer.objects.get(id=cancer.id)
    print(f"\nAfter Update (من DB):")
    print(f"  ID: {cancer_check.id}")
    print(f"  date_diagnostic: {cancer_check.date_diagnostic}")
    print(f"  stade_clinique: {cancer_check.stade_clinique}")
else:
    print(f"\nخطأ في التحديث:")
    print(serializer.errors)
