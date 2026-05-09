#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from patients.serializers import CancerCreateSerializer
from patients.models import Cancer

print("CancerCreateSerializer fields:")
for field_name in CancerCreateSerializer.Meta.fields:
    print(f"  - {field_name}")

print("\ndate_diagnostic in fields:", "date_diagnostic" in CancerCreateSerializer.Meta.fields)

# اختبر إنشاء سيريالايزر مع بيانات
test_data = {
    'patient': 1,
    'cancer_type': None,
    'organe': 'Test',
    'date_diagnostic': '2025-03-01',
}

serializer = CancerCreateSerializer(data=test_data)
print("\nSerializer validation result:", serializer.is_valid())
if not serializer.is_valid():
    print("Errors:", serializer.errors)
else:
    print("Validated data keys:", list(serializer.validated_data.keys()))
