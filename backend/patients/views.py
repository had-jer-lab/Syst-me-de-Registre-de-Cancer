# ══════════════════════════════════════════
# patients/views.py
# ══════════════════════════════════════════
from rest_framework import generics, permissions, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from base64 import b64decode
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Wilaya, Commune, Hospital,
    Patient, CancerType, Cancer, Treatment,
    BiologicalExam, ImagingExam,
    Histology, Metastasis, FollowUp,
    Consultation, Death,
    CustomField,
)
from .serializers import (
    WilayaSerializer, CommuneSerializer, HospitalSerializer,
    CancerTypeSerializer, CustomFieldSerializer,
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
        if request.user.is_staff or getattr(request.user, 'role', '') == 'admin':
            return True
        if isinstance(obj, Patient):
            return obj.created_by == request.user
        if hasattr(obj, 'patient'):
            return obj.patient.created_by == request.user
        if hasattr(obj, 'cancer'):
            return obj.cancer.patient.created_by == request.user
        return False


class IsAdminOrStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.is_staff or getattr(request.user, 'role', '') == 'admin')
        )


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


class CustomFieldListCreateView(generics.ListCreateAPIView):
    serializer_class   = CustomFieldSerializer
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ['label', 'name', 'section']
    ordering_fields    = ['order', 'created_at']
    ordering           = ['section', 'order']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminOrStaff()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = CustomField.objects.order_by('section', 'order', 'created_at')
        section = self.request.query_params.get('section')
        if section:
            qs = qs.filter(section=section)
        if not (self.request.user.is_staff or getattr(self.request.user, 'role', '') == 'admin'):
            qs = qs.filter(is_active=True)
        return qs


class CustomFieldDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = CustomField.objects.all()
    serializer_class   = CustomFieldSerializer
    permission_classes = [IsAdminOrStaff]


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
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_serializer_class(self):
        return PatientDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role == 'admin':
            return Patient.objects.select_related(
                'commune__wilaya', 'hospital', 'created_by', 'death'
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
            'commune__wilaya', 'hospital', 'created_by', 'death'
        ).prefetch_related(
            'cancers__cancer_type',
            'cancers__treatments',
            'cancers__biological_exams',
            'cancers__imaging_exams',
            'cancers__histology',
            'cancers__metastases',
            'cancers__follow_ups',
            'cancers__status_history',
            'cancers__status_history',
            'consultations__user',
        ).filter(created_by=user)

    def perform_destroy(self, instance):
        from django.utils import timezone
        instance.deleted_at = timezone.now()
        instance.save()


class VoiceParseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        transcript = request.data.get('transcript', '')
        if not isinstance(transcript, str):
            return Response({'error': 'transcript is required'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({})


class WhisperParseView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        audio_file = request.FILES.get('audio')
        transcript = ''
        if not audio_file:
            return Response({'error': 'audio file is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Placeholder backend endpoint. If you want real transcription,
        # integrate Whisper/Groq here and return parsed `fields` + `transcript`.
        return Response({'fields': {}, 'transcript': transcript})


# ─── Stats rapides pour le dashboard ─────────────────────────────────────────

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.is_staff or user.role == 'admin':
            patients_qs = Patient.objects.filter(deleted_at__isnull=True)
        else:
            patients_qs = Patient.objects.filter(created_by=user, deleted_at__isnull=True)

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
            'total_patients':  total,
            'this_month':      this_month,
            'last_month':      last_month,
            'evolution_pct':   round(((this_month - last_month) / last_month * 100) if last_month else 0, 1),
            'sexe':            {'M': sexe_m, 'F': sexe_f},
            'stades':          list(stades),
            'top_organes':     list(top_organes),
        })


# ─── Public patient view (no auth, token based) ─────────────────────────────
class PublicPatientView(APIView):
    """Return patient data for a public link. No authentication required.

    Query param `token` must be base64(numero_dossier) or base64(id).
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        token = request.query_params.get('token')
        if not token:
            return Response({'detail': 'Lien invalide.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            patient = Patient.objects.select_related(
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
            ).get(pk=pk, deleted_at__isnull=True)
        except Patient.DoesNotExist:
            return Response({'detail': 'Dossier introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        # validate token
        try:
            decoded = b64decode(token).decode('utf-8')
        except Exception:
            return Response({'detail': 'Lien invalide.'}, status=status.HTTP_404_NOT_FOUND)

        if decoded != patient.numero_dossier and decoded != str(patient.id):
            return Response({'detail': 'Lien invalide ou expiré.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = PatientDetailSerializer(patient, context={'request': request})
        return Response(serializer.data)


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


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_patient_habit(request, patient_pk):
    """Lightweight endpoint used by frontend to record simple habits.
    Expects JSON: { habit_name: 'tabac', frequency: 'quotidien', duration_years: 5 }
    If habit does not exist it will be created.
    """
    from .models import Habit, PatientHabit
    user = request.user
    patient = get_object_or_404(Patient, id=patient_pk)
    # permission: staff or owner
    if not (user.is_staff or getattr(user, 'role', '') == 'admin' or patient.created_by == user):
        return Response({'detail': 'Accès refusé.'}, status=403)

    data = request.data or {}
    habit_name = data.get('habit_name') or data.get('habit')
    if not habit_name:
        return Response({'detail': 'habit_name requis.'}, status=400)

    habit_obj = Habit.objects.filter(name__iexact=habit_name).first()
    if not habit_obj:
        habit_obj = Habit.objects.create(name=habit_name)

    ph, created = PatientHabit.objects.get_or_create(patient=patient, habit=habit_obj)
    freq = data.get('frequency') or data.get('valeur')
    if freq:
        ph.frequency = str(freq)
    if data.get('duration_years'):
        try:
            ph.duration_years = int(data.get('duration_years'))
        except Exception:
            pass
    ph.save()
    return Response({'id': ph.id, 'habit': habit_obj.name, 'frequency': ph.frequency}, status=201 if created else 200)



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

# ─── QR Code Formulaire Patient & Notifications ───────────────────────────────

import uuid, json
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes as drf_permission_classes
from .models import PatientFormToken, PatientFormSubmission, Notification

DEFAULT_FORM_FIELDS = [
    {'key': 'telephone',    'label': 'Téléphone',                    'type': 'tel',      'required': False},
    {'key': 'adresse',      'label': 'Adresse complète',             'type': 'text',     'required': False},
    {'key': 'profession',   'label': 'Profession',                   'type': 'text',     'required': False},
    {'key': 'poids',        'label': 'Poids (kg)',                   'type': 'number',   'required': False},
    {'key': 'taille',       'label': 'Taille (cm)',                  'type': 'number',   'required': False},
    {'key': 'allergies',    'label': 'Allergies connues',            'type': 'textarea', 'required': False},
    {'key': 'tabac',        'label': 'Tabagisme',                    'type': 'select',   'required': False,
     'options': ['Non fumeur', 'Fumeur actif', 'Ancien fumeur']},
    {'key': 'alcool',       'label': 'Consommation alcool',          'type': 'select',   'required': False,
     'options': ['Aucune', 'Occasionnelle', 'Régulière']},
    {'key': 'antecedents',  'label': 'Antécédents familiaux cancer', 'type': 'textarea', 'required': False},
    {'key': 'observations', 'label': 'Autres informations',          'type': 'textarea', 'required': False},
]


@method_decorator(csrf_exempt, name='dispatch')
class PatientFormPublicView(View):
    """Vue publique — accessible via QR code sans authentification."""

    def get(self, request, token):
        try:
            form_token = get_object_or_404(PatientFormToken, token=token, is_active=True)
            patient    = form_token.patient
            fields     = form_token.fields_config or DEFAULT_FORM_FIELDS
            medecin    = ''
            if patient.created_by:
                medecin = f"Dr. {patient.created_by.prenom} {patient.created_by.nom}".strip()
            return JsonResponse({
                'patient_name': patient.first_name,
                'dossier':      patient.numero_dossier,
                'fields':       fields,
                'medecin':      medecin,
                'token':        str(token),
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=404)

    def post(self, request, token):
        try:
            form_token = get_object_or_404(PatientFormToken, token=token, is_active=True)
            patient    = form_token.patient
            data       = json.loads(request.body)

            # Sauvegarder soumission
            submission = PatientFormSubmission.objects.create(
                patient=patient, form_token=form_token,
                submitted_data=data,
                ip_address=request.META.get('REMOTE_ADDR'),
            )

            # Appliquer au dossier patient
            FIELD_MAP = {
                'telephone': 'phone', 'phone': 'phone',
                'adresse': 'adresse', 'profession': 'profession',
                'poids': 'poids', 'taille': 'taille',
                'allergies': 'allergies', 'observations': 'observations',
            }
            changed = False
            for k, field in FIELD_MAP.items():
                if data.get(k):
                    setattr(patient, field, data[k])
                    changed = True
            if changed:
                patient.save()

            # Notifier le médecin
            if patient.created_by:
                Notification.objects.create(
                    user=patient.created_by,
                    type='form_submission',
                    title=f'Formulaire soumis — {patient.first_name} {patient.last_name}',
                    message=f'Le patient {patient.first_name} {patient.last_name} (DOS: {patient.numero_dossier}) a soumis son formulaire.',
                    patient=patient,
                    data=data,
                )

            return JsonResponse({
                'success': True,
                'message': 'Vos informations ont été enregistrées avec succès.',
                'dossier': patient.numero_dossier,
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@api_view(['POST'])
@drf_permission_classes([permissions.IsAuthenticated])
def generate_patient_token(request, patient_id):
    """Génère ou retourne le token QR code d'un patient."""
    patient = get_object_or_404(Patient, id=patient_id)
    if not (request.user.is_staff or getattr(request.user, 'role', '') == 'admin'):
        if patient.created_by != request.user:
            return Response({'detail': 'Non autorisé.'}, status=403)

    fields_config = request.data.get('fields', DEFAULT_FORM_FIELDS)
    frontend_url  = request.data.get('frontend_url', 'http://localhost:3000')

    token_obj, created = PatientFormToken.objects.get_or_create(
        patient=patient,
        defaults={'token': uuid.uuid4(), 'fields_config': fields_config, 'is_active': True}
    )
    if not created and 'fields' in request.data:
        token_obj.fields_config = fields_config
        token_obj.save()

    form_url = f"{frontend_url}/patient-form/{token_obj.token}"
    return Response({'token': str(token_obj.token), 'form_url': form_url, 'qr_data': form_url})


@api_view(['GET'])
@drf_permission_classes([permissions.IsAuthenticated])
def get_patient_form_submissions(request, patient_id):
    """Retourne les soumissions de formulaire d'un patient."""
    patient = get_object_or_404(Patient, id=patient_id)
    subs    = PatientFormSubmission.objects.filter(patient=patient).order_by('-created_at')
    return Response([{
        'id':             s.id,
        'submitted_data': s.submitted_data,
        'created_at':     s.created_at.isoformat(),
        'ip_address':     s.ip_address,
    } for s in subs])


@api_view(['GET'])
@drf_permission_classes([permissions.IsAuthenticated])
def get_notifications(request):
    """Retourne les notifications du médecin connecté."""
    notifs = Notification.objects.filter(user=request.user).order_by('-created_at')[:50]
    return Response([{
        'id':          n.id,
        'type':        n.type,
        'title':       n.title,
        'message':     n.message,
        'patient_id':  n.patient_id,
        'patient_nom': f"{n.patient.first_name} {n.patient.last_name}" if n.patient else '',
        'dossier':     n.patient.numero_dossier if n.patient else '',
        'data':        n.data,
        'is_read':     n.is_read,
        'created_at':  n.created_at.isoformat(),
    } for n in notifs])


@api_view(['POST'])
@drf_permission_classes([permissions.IsAuthenticated])
def mark_notification_read(request, notif_id):
    """Marque une notification comme lue."""
    notif = get_object_or_404(Notification, id=notif_id, user=request.user)
    notif.is_read = True
    notif.save()
    return Response({'ok': True})
