
# ══════════════════════════════════════════
# config/urls.py
# ══════════════════════════════════════════
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin-panel/', admin.site.urls),
    path('api/auth/',    include('accounts.urls')),
    path('api/patients/',include('patients.urls')),
    path('api/statistic/', include('statistic.urls')),
]