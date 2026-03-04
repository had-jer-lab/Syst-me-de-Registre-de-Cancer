from django.contrib import admin
from .models import *
admin.site.register(Patient)
admin.site.register(Cancer)
admin.site.register(CancerType)
admin.site.register(Wilaya)
admin.site.register(Commune)
admin.site.register(Hospital)
# Register your models here.
