# ══════════════════════════════════════════
# patients/urls.py
# ══════════════════════════════════════════
from django.urls import path
from .views import (
    WilayaListView, CommuneListView, HospitalListView,
    CancerTypeListView, CustomFieldListCreateView, CustomFieldDetailView,
    PatientListCreateView, PatientDetailView,
    PublicPatientView,
    DashboardStatsView,
    CancerListCreateView, CancerDetailView,
    TreatmentListCreateView, TreatmentDetailView,
    ConsultationListCreateView,
    DemandeExamenListCreateView,
    DemandeExamenDetailView,
    AllDemandesView,
)

urlpatterns = [
    # ── Référentiels ──────────────────────────────────────────────────────────
    path('wilayas/',       WilayaListView.as_view(),     name='wilayas'),
    path('communes/',      CommuneListView.as_view(),    name='communes'),
    path('hospitals/',     HospitalListView.as_view(),   name='hospitals'),
    path('cancer-types/',  CancerTypeListView.as_view(), name='cancer-types'),
    path('custom-fields/', CustomFieldListCreateView.as_view(), name='custom-fields'),
    path('custom-fields/<int:pk>/', CustomFieldDetailView.as_view(), name='custom-field-detail'),

    # ── Dashboard ─────────────────────────────────────────────────────────────
    path('stats/',         DashboardStatsView.as_view(), name='dashboard-stats'),

    # ── Patients ──────────────────────────────────────────────────────────────
    path('',               PatientListCreateView.as_view(), name='patients'),
    path('<int:pk>/',      PatientDetailView.as_view(),     name='patient-detail'),
    path('public/<int:pk>/', PublicPatientView.as_view(),    name='patient-public'),

    # ── Cancers (nested sous patient) ─────────────────────────────────────────
    path('<int:patient_pk>/cancers/',
         CancerListCreateView.as_view(),  name='patient-cancers'),
    path('<int:patient_pk>/cancers/<int:pk>/',
         CancerDetailView.as_view(),      name='patient-cancer-detail'),
    path('<int:patient_pk>/cancers/<int:cancer_pk>/treatments/',
         TreatmentListCreateView.as_view(), name='patient-cancer-treatments'),
    path('<int:patient_pk>/cancers/<int:cancer_pk>/treatments/<int:pk>/',
         TreatmentDetailView.as_view(), name='patient-cancer-treatment-detail'),

    # ── Consultations (nested sous patient) ───────────────────────────────────
    path('<int:patient_pk>/consultations/',
         ConsultationListCreateView.as_view(), name='patient-consultations'),

    # ── Demandes par patient ──────────────────────────────────────────────────
    path('<int:patient_pk>/demandes/',
         DemandeExamenListCreateView.as_view(), name='patient-demandes'),
    path('<int:patient_pk>/demandes/<int:pk>/',
         DemandeExamenDetailView.as_view(),     name='patient-demande-detail'),

    # ── Toutes les demandes ───────────────────────────────────────────────────
    path('demandes/all/', AllDemandesView.as_view(), name='all-demandes'),
]

# ─── QR Code Formulaire Patient & Notifications ───────────────────────────────

from django.urls import path as _path
from .views import (
    PatientFormPublicView,
    generate_patient_token,
    get_patient_form_submissions,
    get_notifications,
    mark_notification_read,
)

urlpatterns += [
    # Public — sans auth (QR code)
    _path('patient-form/<str:token>/',
          PatientFormPublicView.as_view(), name='patient-form-public'),

    # Auth — génération token + soumissions
    _path('<int:patient_id>/generate-form-token/',
          generate_patient_token,           name='generate-form-token'),
    _path('<int:patient_id>/form-submissions/',
          get_patient_form_submissions,     name='form-submissions'),

    # Notifications médecin
    _path('notifications/',
          get_notifications,                name='notifications'),
    _path('notifications/<int:notif_id>/read/',
          mark_notification_read,           name='notif-read'),
    
    
]