import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings')
import django
django.setup()
from patients.models import Patient
qs = Patient.objects.all()
print('COUNT:', qs.count())
print('SAMPLE 10 ids/names:')
for p in qs[:10]:
    print(p.id, getattr(p, 'last_name', None) or getattr(p, 'nom', None))
