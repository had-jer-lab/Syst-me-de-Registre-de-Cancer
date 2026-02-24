# ══════════════════════════════════════════
# patients/views.py
# ══════════════════════════════════════════
from rest_framework import generics, permissions, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Wilaya, Commune, Hospital,
    Patient, CancerType, Cancer,
    Treatment, BiologicalExam, ImagingExam,
    Histology, Metastasis, FollowUp,
    Consultation, Death,
)
from .serializers import (
    WilayaSerializer, CommuneSerializer, HospitalSerializer,
    CancerTypeSerializer,
    PatientListSerializer, PatientDetailSerializer,
    CancerSerializer, CancerCreateSerializer,
    TreatmentSerializer, BiologicalExamSerializer,
    ImagingExamSerializer, HistologySerializer,
    MetastasisSerializer, FollowUpSerializer,
    ConsultationSerializer, DeathSerializer,
)


# ─── Permission helper ────────────────────────────────────────────────────────

class IsOwnerOrAdmin(permissions.BasePermission):
    """Le patient appartient au médecin connecté ou l'utilisateur est admin."""
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or request.user.role == 'admin':
            return True
        if isinstance(obj, Patient):
            return obj.created_by == request.user
        # Pour les sous-objets (Cancer, Consultation…)
        if hasattr(obj, 'patient'):
            return obj.patient.created_by == request.user
        return False


# ─── Géographie ──────────────────────────────────────────────────────────────

class WilayaListView(generics.ListAPIView):
    queryset         = Wilaya.objects.all()
    serializer_class = WilayaSerializer
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


# ─── Cancer Types ─────────────────────────────────────────────────────────────

class CancerTypeListView(generics.ListAPIView):
    queryset           = CancerType.objects.all()
    serializer_class   = CancerTypeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['name', 'cim10_code']


# ─── Patients ────────────────────────────────────────────────────────────────

class PatientListCreateView(generics.ListCreateAPIView):
    """
    GET  → liste des patients DU MÉDECIN CONNECTÉ uniquement
    POST → créer un nouveau patient (created_by = user connecté)
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ['first_name', 'last_name', 'numero_dossier', 'national_id',
                          'commune__name', 'commune__wilaya__name', 'hospital__name']
    ordering_fields    = ['created_at', 'last_name', 'date_naissance']

    def get_serializer_class(self):
        return PatientListSerializer

    def get_queryset(self):
        user = self.request.user
        # Admin voit tout ; médecin/biologiste voit ses patients
        if user.is_staff or user.role == 'admin':
            qs = Patient.objects.select_related(
                'commune__wilaya', 'hospital', 'created_by'
            ).prefetch_related('cancers__cancer_type').filter(deleted_at__isnull=True)
        else:
            qs = Patient.objects.select_related(
                'commune__wilaya', 'hospital', 'created_by'
            ).prefetch_related('cancers__cancer_type').filter(
                created_by=user,
                deleted_at__isnull=True,
            )

        # Filtres optionnels par query params
        sexe     = self.request.query_params.get('sexe')
        wilaya   = self.request.query_params.get('wilaya_id')
        hospital = self.request.query_params.get('hospital_id')
        stade    = self.request.query_params.get('stade')

        if sexe:
            qs = qs.filter(sexe=sexe)
        if wilaya:
            qs = qs.filter(commune__wilaya_id=wilaya)
        if hospital:
            qs = qs.filter(hospital_id=hospital)
        if stade:
            qs = qs.filter(cancers__stade_clinique=stade)

        return qs.order_by('-created_at')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Détail complet d'un patient — accessible uniquement par son médecin ou admin."""
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_serializer_class(self):
        return PatientDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role == 'admin':
            return Patient.objects.select_related(
                'commune__wilaya', 'hospital', 'created_by'
            ).prefetch_related(
                'cancers__cancer_type',
                'cancers__treatments',
                'cancers__biological_exams',
                'cancers__imaging_exams',
                'cancers__histology',
                'cancers__metastases',
                'cancers__follow_ups',
                'consultations__user',
            ).all()
        return Patient.objects.select_related(
            'commune__wilaya', 'hospital', 'created_by'
        ).prefetch_related(
            'cancers__cancer_type',
            'cancers__treatments',
            'cancers__biological_exams',
            'cancers__imaging_exams',
            'cancers__histology',
            'cancers__metastases',
            'cancers__follow_ups',
            'consultations__user',
        ).filter(created_by=user)

    def perform_destroy(self, instance):
        # Soft delete
        from django.utils import timezone
        instance.deleted_at = timezone.now()
        instance.save()


# ─── Stats rapides pour le dashboard ─────────────────────────────────────────

class DashboardStatsView(APIView):
    """Statistiques pour le dashboard du médecin connecté."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.is_staff or user.role == 'admin':
            patients_qs = Patient.objects.filter(deleted_at__isnull=True)
        else:
            patients_qs = Patient.objects.filter(created_by=user, deleted_at__isnull=True)

        from django.db.models import Count
        from datetime import date, timedelta

        total      = patients_qs.count()
        this_month = patients_qs.filter(
            created_at__month=date.today().month,
            created_at__year=date.today().year,
        ).count()
        last_month = patients_qs.filter(
            created_at__month=(date.today().replace(day=1) - timedelta(days=1)).month,
        ).count()

        # Répartition par stade
        stades = (
            patients_qs
            .filter(cancers__stade_clinique__isnull=False)
            .exclude(cancers__stade_clinique='')
            .values('cancers__stade_clinique')
            .annotate(count=Count('id'))
            .order_by('cancers__stade_clinique')
        )

        # Répartition par sexe
        sexe_m = patients_qs.filter(sexe='M').count()
        sexe_f = patients_qs.filter(sexe='F').count()

        # Top organes
        top_organes = (
            patients_qs
            .filter(cancers__cancer_type__isnull=False)
            .values('cancers__cancer_type__name')
            .annotate(count=Count('id'))
            .order_by('-count')[:5]
        )

        return Response({
            'total_patients':  total,
            'this_month':      this_month,
            'last_month':      last_month,
            'evolution_pct':   round(((this_month - last_month) / last_month * 100) if last_month else 0, 1),
            'sexe':            {'M': sexe_m, 'F': sexe_f},
            'stades':          list(stades),
            'top_organes':     list(top_organes),
        })


# ─── Cancers ──────────────────────────────────────────────────────────────────

class CancerListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return CancerSerializer
        return CancerCreateSerializer

    def get_queryset(self):
        patient_id = self.kwargs.get('patient_pk')
        user = self.request.user
        qs = Cancer.objects.filter(patient_id=patient_id).select_related('cancer_type')
        if not (user.is_staff or user.role == 'admin'):
            qs = qs.filter(patient__created_by=user)
        return qs

    def perform_create(self, serializer):
        patient_id = self.kwargs.get('patient_pk')
        serializer.save(patient_id=patient_id)


class CancerDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    serializer_class   = CancerSerializer

    def get_queryset(self):
        return Cancer.objects.filter(patient_id=self.kwargs.get('patient_pk'))


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