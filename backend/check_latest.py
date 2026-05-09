#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from patients.models import Cancer, Patient

# جلب أخر Cancer تم إنشاؤه
latest = Cancer.objects.latest('id')
print(f"Cancer ID: {latest.id}")
print(f"date_diagnostic: {latest.date_diagnostic}")
print(f"date_symptomes: {latest.date_symptomes}")
print(f"organe (cancer_type): {latest.cancer_type}")
