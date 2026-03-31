# ══════════════════════════════════════════
# patients/views.py
# ══════════════════════════════════════════
import json
import groq
from decouple import config

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
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or request.user.role == 'admin':
            return True
        if isinstance(obj, Patient):
            return obj.created_by == request.user
        if hasattr(obj, 'patient'):
            return obj.patient.created_by == request.user
        return False


# ─── Géographie ──────────────────────────────────────────────────────────────

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


# ─── Cancer Types ─────────────────────────────────────────────────────────────

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
    search_fields      = ['first_name', 'last_name', 'numero_dossier', 'national_id',
                          'commune__name', 'commune__wilaya__name', 'hospital__name']
    ordering_fields    = ['created_at', 'last_name', 'date_naissance']

    def get_serializer_class(self):
        return PatientListSerializer

    def get_queryset(self):
        user = self.request.user
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

        sexe     = self.request.query_params.get('sexe')
        wilaya   = self.request.query_params.get('wilaya_id')
        hospital = self.request.query_params.get('hospital_id')
        stade    = self.request.query_params.get('stade')

        if sexe:     qs = qs.filter(sexe=sexe)
        if wilaya:   qs = qs.filter(commune__wilaya_id=wilaya)
        if hospital: qs = qs.filter(hospital_id=hospital)
        if stade:    qs = qs.filter(cancers__stade_clinique=stade)

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
        qs = Patient.objects.select_related(
            'commune__wilaya', 'hospital', 'created_by'
        ).prefetch_related(
            'cancers__cancer_type', 'cancers__treatments',
            'cancers__biological_exams', 'cancers__imaging_exams',
            'cancers__histology', 'cancers__metastases',
            'cancers__follow_ups', 'consultations__user',
        )
        if user.is_staff or user.role == 'admin':
            return qs.all()
        return qs.filter(created_by=user)

    def perform_destroy(self, instance):
        from django.utils import timezone
        instance.deleted_at = timezone.now()
        instance.save()


# ─── Stats dashboard ─────────────────────────────────────────────────────────

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
        sexe_m = patients_qs.filter(sexe='M').count()
        sexe_f = patients_qs.filter(sexe='F').count()
        top_organes = (
            patients_qs
            .filter(cancers__cancer_type__isnull=False)
            .values('cancers__cancer_type__name')
            .annotate(count=Count('id'))
            .order_by('-count')[:5]
        )

        return Response({
            'total_patients': total,
            'this_month':     this_month,
            'last_month':     last_month,
            'evolution_pct':  round(((this_month - last_month) / last_month * 100) if last_month else 0, 1),
            'sexe':           {'M': sexe_m, 'F': sexe_f},
            'stades':         list(stades),
            'top_organes':    list(top_organes),
        })


# ─── Cancers ──────────────────────────────────────────────────────────────────

class CancerListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return CancerSerializer if self.request.method == 'GET' else CancerCreateSerializer

    def get_queryset(self):
        patient_id = self.kwargs.get('patient_pk')
        user = self.request.user
        qs = Cancer.objects.filter(patient_id=patient_id).select_related('cancer_type')
        if not (user.is_staff or user.role == 'admin'):
            qs = qs.filter(patient__created_by=user)
        return qs

    def perform_create(self, serializer):
        serializer.save(patient_id=self.kwargs.get('patient_pk'))


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


# ─── Voice Parse — Groq ──────────────────────────────────────────────────────

class VoiceParseView(APIView):
    """
    POST { "transcript": "المريض بن علي أحمد من وهران مزوج" }
    → retourne les champs patient détectés via Groq
    """
    permission_classes = [permissions.IsAuthenticated]

    SYSTEM = """Tu es un assistant médical. L'utilisateur dicte des informations sur un patient en français ou en arabe dialectal algérien (ou un mélange).
Retourne UNIQUEMENT un objet JSON valide, sans texte autour, sans markdown.
Champs possibles :
{"nom":"...","prenom":"...","dob":"YYYY-MM-DD","sexe":"♂ Masculin" ou "♀ Féminin","famille":"Célibataire" ou "Marié(e)" ou "Divorcé(e)" ou "Veuf / Veuve","tel":"...","wilaya":"...","commune":"...","profession":"...","poids":"...","taillep":"...","tabac":"🚭 Non-fumeur" ou "🚬 Fumeur actif" ou "⏹ Ex-fumeur","allergies":"...","observations":"..."}
N'inclus que les champs détectés. Si rien, retourne {}.
Exemples :
- "المريض بن علي أحمد من وهران مزوج" → {"nom":"Benali","prenom":"Ahmed","wilaya":"Oran","famille":"Marié(e)"}
- "patient Rahmani Sofiane né le 12 mars 1978 fumeur" → {"nom":"Rahmani","prenom":"Sofiane","dob":"1978-03-12","tabac":"🚬 Fumeur actif"}
- "وزنه 80 كيلو طوله 175 راجل" → {"poids":"80","taillep":"175","sexe":"♂ Masculin"}"""

    def post(self, request):
        transcript = request.data.get('transcript', '').strip()
        if not transcript:
            return Response({'error': 'transcript requis'}, status=400)

        api_key = config('GROQ_API_KEY', default='')
        if not api_key:
            return Response({'error': 'GROQ_API_KEY non configurée dans .env'}, status=500)

        try:
            client = groq.Groq(api_key=api_key)
            completion = client.chat.completions.create(
                model='llama-3.1-8b-instant',
                max_tokens=500,
                temperature=0,
                response_format={'type': 'json_object'},
                messages=[
                    {'role': 'system', 'content': self.SYSTEM},
                    {'role': 'user',   'content': transcript},
                ],
            )
            text   = completion.choices[0].message.content.strip()
            fields = json.loads(text)
            return Response(fields)
        except groq.AuthenticationError:
            return Response({'error': 'GROQ_API_KEY غير صالح'}, status=502)
        except groq.APIError as e:
            return Response({'error': f'Groq API error: {str(e)}'}, status=502)
        except (json.JSONDecodeError, KeyError) as e:
            return Response({'error': f'Réponse invalide: {e}'}, status=502)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


# ─── ID Card Scan — Groq Vision ───────────────────────────────────────────────

class IDCardScanView(APIView):
    """
    POST { "image": "data:image/jpeg;base64,..." }
    → retourne les champs patient extraits de la CIN algérienne via Groq Vision
    """
    permission_classes = [permissions.IsAuthenticated]

    SYSTEM = """Tu es un expert en lecture de cartes d'identité algériennes (بطاقة التعريف الوطنية).
Analyse l'image et extrait les informations du porteur.
Retourne UNIQUEMENT un objet JSON valide, sans texte autour, sans markdown.
Champs possibles :
{
  "nom": "NOM en majuscules",
  "prenom": "Prénom",
  "dob": "YYYY-MM-DD",
  "sexe": "♂ Masculin" ou "♀ Féminin",
  "wilaya": "Wilaya de naissance",
  "commune": "Commune de naissance",
  "national_id": "Numéro de la carte"
}
N'inclus que les champs lisibles. Si l'image est illisible, retourne {}.
"""

    def post(self, request):
        image_data = request.data.get('image', '')
        if not image_data:
            return Response({'error': 'image requise'}, status=400)

        api_key = config('GROQ_API_KEY', default='')
        if not api_key:
            return Response({'error': 'GROQ_API_KEY non configurée'}, status=500)

        # Nettoyer le préfixe base64
        if ',' in image_data:
            header, image_data = image_data.split(',', 1)
            media_type = header.split(':')[1].split(';')[0] if ':' in header else 'image/jpeg'
        else:
            media_type = 'image/jpeg'

        try:
            client = groq.Groq(api_key=api_key)
            completion = client.chat.completions.create(
                model='meta-llama/llama-4-scout-17b-16e-instruct',
                max_tokens=500,
                temperature=0,
                response_format={'type': 'json_object'},
                messages=[
                    {
                        'role': 'user',
                        'content': [
                            {
                                'type': 'image_url',
                                'image_url': {
                                    'url': f'data:{media_type};base64,{image_data}'
                                }
                            },
                            {
                                'type': 'text',
                                'text': self.SYSTEM,
                            }
                        ]
                    }
                ],
            )
            text   = completion.choices[0].message.content.strip()
            fields = json.loads(text)
            return Response(fields)
        except groq.AuthenticationError:
            return Response({'error': 'GROQ_API_KEY غير صالح'}, status=502)
        except groq.APIError as e:
            return Response({'error': f'Groq API error: {str(e)}'}, status=502)
        except (json.JSONDecodeError, KeyError) as e:
            return Response({'error': f'Réponse invalide: {e}'}, status=502)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


# ─── Whisper Parse — أضيفي هذا في نهاية patients/views.py ───────────────────

class WhisperParseView(APIView):
    """
    POST multipart/form-data { audio: <file>, lang: 'ar'|'fr'|'auto' }
    1. Groq Whisper → transcript
    2. Groq LLM     → champs JSON
    → retourne { transcript, fields }
    """
    permission_classes = [permissions.IsAuthenticated]

    SYSTEM = """Tu es un assistant médical. L'utilisateur dicte des informations sur un patient en français ou en arabe dialectal algérien (ou un mélange).
Retourne UNIQUEMENT un objet JSON valide, sans texte autour, sans markdown.
Champs possibles :
{"nom":"...","prenom":"...","dob":"YYYY-MM-DD","sexe":"♂ Masculin" ou "♀ Féminin","famille":"Célibataire" ou "Marié(e)" ou "Divorcé(e)" ou "Veuf / Veuve","tel":"...","wilaya":"...","commune":"...","profession":"...","poids":"...","taillep":"...","tabac":"🚭 Non-fumeur" ou "🚬 Fumeur actif" ou "⏹ Ex-fumeur","allergies":"...","observations":"..."}
N'inclus que les champs détectés. Si rien, retourne {}.
Exemples :
- "المريض بن علي أحمد من وهران مزوج" → {"nom":"Benali","prenom":"Ahmed","wilaya":"Oran","famille":"Marié(e)"}
- "patient Rahmani Sofiane né le 12 mars 1978 fumeur" → {"nom":"Rahmani","prenom":"Sofiane","dob":"1978-03-12","tabac":"🚬 Fumeur actif"}
- "وزنه 80 كيلو طوله 175 راجل" → {"poids":"80","taillep":"175","sexe":"♂ Masculin"}"""

    def post(self, request):
        audio_file = request.FILES.get('audio')
        lang       = request.data.get('lang', 'ar')

        if not audio_file:
            return Response({'error': 'audio requis'}, status=400)

        api_key = config('GROQ_API_KEY', default='')
        if not api_key:
            return Response({'error': 'GROQ_API_KEY non configurée'}, status=500)

        try:
            client = groq.Groq(api_key=api_key)

            # ── Étape 1 : Whisper → transcript ───────────────────────────────
            # لغة الإدخال لـ Whisper
            whisper_lang = None if lang == 'auto' else lang

            transcription = client.audio.transcriptions.create(
                model='whisper-large-v3',
                file=(audio_file.name, audio_file.read(), audio_file.content_type),
                language=whisper_lang,
                response_format='text',
            )
            transcript = transcription.strip() if isinstance(transcription, str) else transcription.text.strip()

            if not transcript:
                return Response({'transcript': '', 'fields': {}})

            # ── Étape 2 : LLM → champs JSON ──────────────────────────────────
            completion = client.chat.completions.create(
                model='llama-3.1-8b-instant',
                max_tokens=500,
                temperature=0,
                response_format={'type': 'json_object'},
                messages=[
                    {'role': 'system', 'content': self.SYSTEM},
                    {'role': 'user',   'content': transcript},
                ],
            )
            text   = completion.choices[0].message.content.strip()
            fields = json.loads(text)

            return Response({'transcript': transcript, 'fields': fields})

        except groq.AuthenticationError:
            return Response({'error': 'GROQ_API_KEY غير صالح'}, status=502)
        except groq.APIError as e:
            return Response({'error': f'Groq error: {str(e)}'}, status=502)
        except (json.JSONDecodeError, KeyError) as e:
            return Response({'error': f'Réponse invalide: {e}'}, status=502)
        except Exception as e:
            return Response({'error': str(e)}, status=500)