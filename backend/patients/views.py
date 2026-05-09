"""
patients/views.py — Vues complètes avec tous les endpoints
"""
from rest_framework import generics, permissions, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Wilaya, Commune, Hospital,
    Patient, CancerType, Cancer, Treatment,
    BiologicalExam, ImagingExam,
    Histology, Metastasis, FollowUp,
    Consultation, Death,
)
from .serializers import (
    WilayaSerializer, CommuneSerializer, HospitalSerializer,
    CancerTypeSerializer,
    PatientListSerializer, PatientDetailSerializer,
    CancerSerializer, CancerCreateSerializer,
    TreatmentSerializer, TreatmentCreateSerializer,
    BiologicalExamSerializer, ImagingExamSerializer,
    HistologySerializer, MetastasisSerializer, FollowUpSerializer,
    ConsultationSerializer, DeathSerializer,
)


# ─── Permission ───────────────────────────────────────────────────────────────

class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or request.user.role == 'admin':
            return True
        if isinstance(obj, Patient):
            return obj.created_by == request.user
        if hasattr(obj, 'patient'):
            return obj.patient.created_by == request.user
        if hasattr(obj, 'cancer'):
            return obj.cancer.patient.created_by == request.user
        return False


def _patient_qs(user):
    """Retourne le queryset de base des patients selon le rôle."""
    if user.is_staff or user.role == 'admin':
        return Patient.objects.filter(deleted_at__isnull=True)
    return Patient.objects.filter(created_by=user, deleted_at__isnull=True)


# ─── Référentiels ─────────────────────────────────────────────────────────────

class WilayaListView(generics.ListAPIView):
    queryset           = Wilaya.objects.all()
    serializer_class   = WilayaSerializer
    permission_classes = [permissions.IsAuthenticated]


class CommuneListView(generics.ListAPIView):
    serializer_class   = CommuneSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Commune.objects.select_related('wilaya').all()
        wilaya_id = self.request.query_params.get('wilaya_id')
        if wilaya_id:
            qs = qs.filter(wilaya_id=wilaya_id)
        return qs


class HospitalListView(generics.ListAPIView):
    serializer_class   = HospitalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Hospital.objects.select_related('wilaya').all()
        wilaya_id = self.request.query_params.get('wilaya_id')
        if wilaya_id:
            qs = qs.filter(wilaya_id=wilaya_id)
        return qs


class CancerTypeListView(generics.ListAPIView):
    queryset           = CancerType.objects.all()
    serializer_class   = CancerTypeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['name', 'cim10_code']


# ─── Patients ────────────────────────────────────────────────────────────────

class PatientListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = [
        'first_name', 'last_name', 'numero_dossier', 'national_id',
        'commune__name', 'commune__wilaya__name', 'hospital__name',
    ]
    ordering_fields    = ['created_at', 'last_name', 'date_naissance']

    def get_serializer_class(self):
        # Utiliser un serializer plus complet pour la création,
        # afin que tous les champs du patient soient acceptés.
        if self.request.method == 'POST':
            return PatientDetailSerializer
        return PatientListSerializer

    def get_queryset(self):
        qs = _patient_qs(self.request.user).select_related(
            'commune__wilaya', 'hospital', 'created_by'
        ).prefetch_related('cancers__cancer_type', 'cancers__treatments')

        # Filtres
        sexe     = self.request.query_params.get('sexe')
        wilaya   = self.request.query_params.get('wilaya_id')
        hospital = self.request.query_params.get('hospital_id')
        stade    = self.request.query_params.get('stade')
        source   = self.request.query_params.get('data_source')

        if sexe:     qs = qs.filter(sexe=sexe)
        if wilaya:   qs = qs.filter(commune__wilaya_id=wilaya)
        if hospital: qs = qs.filter(hospital_id=hospital)
        if stade:    qs = qs.filter(cancers__stade_clinique=stade)
        if source:   qs = qs.filter(data_source=source)

        return qs.order_by('-created_at')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_serializer_class(self):
        return PatientDetailSerializer

    def get_queryset(self):
        user = self.request.user
        base = _patient_qs(user)
        return base.select_related(
            'commune__wilaya', 'hospital', 'created_by'
        ).prefetch_related(
            'cancers__cancer_type',
            'cancers__treatments',
            'cancers__biological_exams',
            'cancers__imaging_exams',
            'cancers__histology',
            'cancers__metastases',
            'cancers__follow_ups',
            'cancers__status_history',
            'consultations__user',
        )

    def perform_destroy(self, instance):
        from django.utils import timezone
        instance.deleted_at = timezone.now()
        instance.save()


# ─── Dashboard stats ──────────────────────────────────────────────────────────

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.db.models import Count
        from datetime import date, timedelta

        patients_qs = _patient_qs(request.user)
        total      = patients_qs.count()
        this_month = patients_qs.filter(
            created_at__month=date.today().month,
            created_at__year=date.today().year,
        ).count()
        last_month = patients_qs.filter(
            created_at__month=(date.today().replace(day=1) - timedelta(days=1)).month,
        ).count()

        stades = (
            patients_qs
            .filter(cancers__stade_clinique__isnull=False)
            .exclude(cancers__stade_clinique='')
            .values('cancers__stade_clinique')
            .annotate(count=Count('id'))
            .order_by('cancers__stade_clinique')
        )
        top_organes = (
            patients_qs
            .filter(cancers__cancer_type__isnull=False)
            .values('cancers__cancer_type__name')
            .annotate(count=Count('id'))
            .order_by('-count')[:5]
        )

        # Statistiques traitements
        traitements_stats = (
            Treatment.objects
            .filter(cancer__patient__in=patients_qs)
            .values('type_traitement')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        # Triple négatif
        triple_neg = patients_qs.filter(
            cancers__recepteur_er='negatif',
            cancers__recepteur_pr='negatif',
            cancers__her2='negatif',
        ).distinct().count()

        return Response({
            'total_patients':    total,
            'this_month':        this_month,
            'last_month':        last_month,
            'evolution_pct':     round(((this_month - last_month) / last_month * 100) if last_month else 0, 1),
            'sexe':              {'M': patients_qs.filter(sexe='M').count(), 'F': patients_qs.filter(sexe='F').count()},
            'stades':            list(stades),
            'top_organes':       list(top_organes),
            'traitements_stats': list(traitements_stats),
            'triple_negatif':    triple_neg,
        })


# ─── Cancers ─────────────────────────────────────────────────────────────────

class CancerListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return CancerSerializer if self.request.method == 'GET' else CancerCreateSerializer

    def get_queryset(self):
        patient_id = self.kwargs.get('patient_pk')
        user = self.request.user
        qs = Cancer.objects.filter(patient_id=patient_id).select_related(
            'cancer_type'
        ).prefetch_related(
            'treatments', 'biological_exams', 'imaging_exams',
            'histology', 'metastases', 'follow_ups',
        )
        if not (user.is_staff or user.role == 'admin'):
            qs = qs.filter(patient__created_by=user)
        return qs

    def perform_create(self, serializer):
        serializer.save(patient_id=self.kwargs.get('patient_pk'))


class CancerDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_serializer_class(self):
        return CancerSerializer if self.request.method == 'GET' else CancerCreateSerializer

    def get_queryset(self):
        return Cancer.objects.filter(patient_id=self.kwargs.get('patient_pk'))


# ─── Traitements ─────────────────────────────────────────────────────────────

class TreatmentListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return TreatmentSerializer if self.request.method == 'GET' else TreatmentCreateSerializer

    def get_queryset(self):
        cancer_id = self.kwargs.get('cancer_pk')
        patient_id = self.kwargs.get('patient_pk')
        user = self.request.user
        qs = Treatment.objects.filter(
            cancer_id=cancer_id,
            cancer__patient_id=patient_id,
        )
        if not (user.is_staff or user.role == 'admin'):
            qs = qs.filter(cancer__patient__created_by=user)
        return qs.order_by('date_debut')

    def perform_create(self, serializer):
        serializer.save(cancer_id=self.kwargs.get('cancer_pk'))


class TreatmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_serializer_class(self):
        return TreatmentSerializer if self.request.method == 'GET' else TreatmentCreateSerializer

    def get_queryset(self):
        return Treatment.objects.filter(
            cancer_id=self.kwargs.get('cancer_pk'),
            cancer__patient_id=self.kwargs.get('patient_pk'),
        )


# ─── Consultations ────────────────────────────────────────────────────────────

class ConsultationListCreateView(generics.ListCreateAPIView):
    serializer_class   = ConsultationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        patient_id = self.kwargs.get('patient_pk')
        user = self.request.user
        qs = Consultation.objects.filter(patient_id=patient_id).select_related('user')
        if not (user.is_staff or user.role == 'admin'):
            qs = qs.filter(patient__created_by=user)
        return qs

    def perform_create(self, serializer):
        serializer.save(
            patient_id=self.kwargs.get('patient_pk'),
            user=self.request.user,
        )



# ─── À ajouter dans patients/views.py ────────────────────────────────────────

from .models      import DemandeExamen          # ajouter à l'import
from .serializers import DemandeExamenSerializer # ajouter à l'import


class DemandeExamenListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/patients/<patient_pk>/demandes/
    POST /api/patients/<patient_pk>/demandes/
    """
    serializer_class   = DemandeExamenSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        patient_id = self.kwargs['patient_pk']
        user = self.request.user
        qs = DemandeExamen.objects.filter(patient_id=patient_id).select_related(
            'medecin', 'patient', 'cancer__cancer_type'
        )
        if not (user.is_staff or getattr(user, 'role', '') == 'admin'):
            qs = qs.filter(patient__created_by=user)
        return qs

    def perform_create(self, serializer):
        serializer.save(
            patient_id=self.kwargs['patient_pk'],
            medecin=self.request.user,
        )


class DemandeExamenDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET / PATCH / DELETE  /api/patients/<patient_pk>/demandes/<pk>/
    Permet aussi au biologiste/radiologue de renseigner le résultat (PATCH statut + resultat_texte)
    """
    serializer_class   = DemandeExamenSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DemandeExamen.objects.filter(patient_id=self.kwargs['patient_pk'])


class AllDemandesView(generics.ListAPIView):
    """
    GET /api/patients/demandes/   → toutes les demandes du médecin connecté
    Utile pour un tableau de bord dédié aux biologistes / radiologues
    """
    serializer_class   = DemandeExamenSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends    = [filters.OrderingFilter]
    ordering_fields    = ['date_demande', 'statut', 'urgence']

    def get_queryset(self):
        user = self.request.user
        qs = DemandeExamen.objects.select_related(
            'medecin', 'patient', 'cancer__cancer_type'
        )
        if user.is_staff or getattr(user, 'role', '') == 'admin':
            return qs
        # Médecin : ses propres demandes
        # Biologiste : demandes de type biologie
        if getattr(user, 'role', '') == 'biologiste':
            return qs.filter(type_demande='biologie')
        return qs.filter(medecin=user)