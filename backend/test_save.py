#!/usr/bin/env python
import os
import django
from datetime import date
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from patients.models import Patient, Cancer, CancerType
from patients.serializers import CancerCreateSerializer

# جلب أول مريض موجود
try:
    patient = Patient.objects.first()
    if not patient:
        print("لا توجد مرضى في قاعدة البيانات")
        exit(1)
    
    print(f"استخدام المريض: {patient.numero_dossier}")
    
    # إنشاء سرطان مع date_diagnostic
    cancer_data = {
        'patient': patient.id,
        'organe': 'Test Cancer',
        'date_diagnostic': '2025-01-15',
        'date_symptomes': '2024-12-01',
        'localise': True,
        'data_source': 'manual',
    }
    
    serializer = CancerCreateSerializer(data=cancer_data)
    if serializer.is_valid():
        cancer = serializer.save()
        print(f"\nتم إنشاء السرطان: {cancer.id}")
        print(f"date_diagnostic في قاعدة البيانات: {cancer.date_diagnostic}")
        print(f"date_symptomes في قاعدة البيانات: {cancer.date_symptomes}")
        
        # تحقق من الإرجاع
        cancer_check = Cancer.objects.get(id=cancer.id)
        print(f"\nالتحقق من قاعدة البيانات:")
        print(f"date_diagnostic: {cancer_check.date_diagnostic}")
        print(f"date_symptomes: {cancer_check.date_symptomes}")
    else:
        print("خطأ في التحقق:")
        print(serializer.errors)

except Exception as e:
    print(f"خطأ: {e}")
    import traceback
    traceback.print_exc()
