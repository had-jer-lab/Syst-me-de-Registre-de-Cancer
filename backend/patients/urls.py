"""
patients/urls.py — URLs complètes avec endpoints traitements
"""
from django.urls import path
from .views import (
    WilayaListView, CommuneListView, HospitalListView,
    CancerTypeListView,
    PatientListCreateView, PatientDetailView,
    DashboardStatsView,
    CancerListCreateView, CancerDetailView,
    TreatmentListCreateView, TreatmentDetailView,
    ConsultationListCreateView,
)

urlpatterns = [
    # ── Référentiels ──────────────────────────────────────────────────────────
    path('wilayas/',       WilayaListView.as_view(),     name='wilayas'),
    path('communes/',      CommuneListView.as_view(),    name='communes'),
    path('hospitals/',     HospitalListView.as_view(),   name='hospitals'),
    path('cancer-types/',  CancerTypeListView.as_view(), name='cancer-types'),

    # ── Dashboard ─────────────────────────────────────────────────────────────
    path('stats/',         DashboardStatsView.as_view(), name='dashboard-stats'),

    # ── Patients ──────────────────────────────────────────────────────────────
    path('',               PatientListCreateView.as_view(), name='patients'),
    path('<int:pk>/',      PatientDetailView.as_view(),     name='patient-detail'),

    # ── Cancers (nested sous patient) ─────────────────────────────────────────
    path('<int:patient_pk>/cancers/',
         CancerListCreateView.as_view(),  name='patient-cancers'),
    path('<int:patient_pk>/cancers/<int:pk>/',
         CancerDetailView.as_view(),      name='patient-cancer-detail'),

    # ── Traitements (nested sous patient/cancer) ──────────────────────────────
    path('<int:patient_pk>/cancers/<int:cancer_pk>/treatments/',
         TreatmentListCreateView.as_view(), name='cancer-treatments'),
    path('<int:patient_pk>/cancers/<int:cancer_pk>/treatments/<int:pk>/',
         TreatmentDetailView.as_view(),     name='cancer-treatment-detail'),

    # ── Consultations (nested sous patient) ───────────────────────────────────
    path('<int:patient_pk>/consultations/',
         ConsultationListCreateView.as_view(), name='patient-consultations'),
]



# ─── À ajouter dans patients/urls.py ─────────────────────────────────────────

from .views import (
    DemandeExamenListCreateView,   # ajouter à l'import
    DemandeExamenDetailView,       # ajouter à l'import
    AllDemandesView,               # ajouter à l'import
)

# Ajouter dans urlpatterns :
urlpatterns += [
    # Demandes par patient
    path('<int:patient_pk>/demandes/',
         DemandeExamenListCreateView.as_view(), name='patient-demandes'),
    path('<int:patient_pk>/demandes/<int:pk>/',
         DemandeExamenDetailView.as_view(),     name='patient-demande-detail'),

    # Vue globale (biologiste / admin)
    path('demandes/',
         AllDemandesView.as_view(),             name='all-demandes'),
]