# ══════════════════════════════════════════
# patients/urls.py
# ══════════════════════════════════════════

from django.urls import path
from .views import (
    VoiceParseView,
    IDCardScanView,   # ✅ مهم
    WilayaListView, CommuneListView, HospitalListView,
    CancerTypeListView,
    PatientListCreateView, PatientDetailView,
    DashboardStatsView,
    CancerListCreateView, CancerDetailView,
    ConsultationListCreateView,
)

from .views import WhisperParseView

urlpatterns = [
    # ── Référentiels ──────────────────────────────────────
    path('wilayas/',      WilayaListView.as_view(),    name='wilayas'),
    path('communes/',     CommuneListView.as_view(),   name='communes'),
    path('hospitals/',    HospitalListView.as_view(),  name='hospitals'),
    path('cancer-types/', CancerTypeListView.as_view(), name='cancer-types'),

    # ── Dashboard stats ───────────────────────────────────
    path('stats/',        DashboardStatsView.as_view(), name='dashboard-stats'),

    # ── Patients ──────────────────────────────────────────
    path('',              PatientListCreateView.as_view(), name='patients'),
    path('<int:pk>/',     PatientDetailView.as_view(),     name='patient-detail'),

    # ── Nested : Cancers ──────────────────────────────────
    path('<int:patient_pk>/cancers/',        CancerListCreateView.as_view(), name='patient-cancers'),
    path('<int:patient_pk>/cancers/<int:pk>/', CancerDetailView.as_view(),  name='patient-cancer-detail'),

    # ── Nested : Consultations ────────────────────────────
    path('<int:patient_pk>/consultations/',  ConsultationListCreateView.as_view(), name='patient-consultations'),

    # ── Voice Parse ───────────────────────────────────────
    path('voice-parse/', VoiceParseView.as_view(), name='voice-parse'),

    # ── ✅ ID Card Scanner (الإصلاح هنا)
    path('scan-id/', IDCardScanView.as_view(), name='scan-id'),
    path('whisper-parse/', WhisperParseView.as_view()),

]