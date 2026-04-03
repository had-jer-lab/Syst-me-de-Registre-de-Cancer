"""
patients/serializers.py — Sérialiseurs complets synchronisés avec les modèles et l'interface
"""
from rest_framework import serializers
from .models import (
    Wilaya, Commune, Hospital,
    Patient, CancerType, Cancer,
    Treatment, BiologicalExam, ImagingExam,
    Histology, Metastasis, FollowUp,
    CancerStatusHistory, Death,
    RiskFactor, PatientRiskFactor,
    Habit, PatientHabit, Consultation,
    DuplicateCase,
)


# ─── Géographie ──────────────────────────────────────────────────────────────

class WilayaSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Wilaya
        fields = ['id', 'name']


class CommuneSerializer(serializers.ModelSerializer):
    wilaya_name = serializers.CharField(source='wilaya.name', read_only=True)

    class Meta:
        model  = Commune
        fields = ['id', 'name', 'wilaya', 'wilaya_name', 'postal_code']


class HospitalSerializer(serializers.ModelSerializer):
    wilaya_name = serializers.CharField(source='wilaya.name', read_only=True)

    class Meta:
        model  = Hospital
        fields = ['id', 'name', 'wilaya', 'wilaya_name', 'type']


# ─── Cancer Type ─────────────────────────────────────────────────────────────

class CancerTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CancerType
        fields = ['id', 'name', 'cim10_code']


# ─── Traitement (complet) ─────────────────────────────────────────────────────

class TreatmentSerializer(serializers.ModelSerializer):
    type_traitement_display = serializers.CharField(
        source='get_type_traitement_display', read_only=True
    )
    intention_display = serializers.CharField(
        source='get_intention_display', read_only=True
    )
    statut_display = serializers.CharField(
        source='get_statut_display', read_only=True
    )
    reponse_display = serializers.CharField(
        source='get_reponse_tumorale_display', read_only=True
    )

    class Meta:
        model  = Treatment
        fields = [
            'id',
            'type_traitement', 'type_traitement_display',
            'intention', 'intention_display',
            'statut', 'statut_display',
            'ligne',
            'protocole', 'medicaments',
            'voie_administration', 'jours_administration',
            'cycles_prevus', 'cycles_realises',
            'date_debut', 'date_fin',
            'reponse_tumorale', 'reponse_display',
            'date_evaluation',
            'grade_toxicite', 'description_toxicite',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class TreatmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Treatment
        fields = [
            'id', 'cancer',
            'type_traitement', 'intention', 'statut', 'ligne',
            'protocole', 'medicaments',
            'voie_administration', 'jours_administration',
            'cycles_prevus', 'cycles_realises',
            'date_debut', 'date_fin',
            'reponse_tumorale', 'date_evaluation',
            'grade_toxicite', 'description_toxicite',
        ]


# ─── Examens ─────────────────────────────────────────────────────────────────

class BiologicalExamSerializer(serializers.ModelSerializer):
    class Meta:
        model  = BiologicalExam
        fields = ['id', 'type_analyse', 'resultat', 'valeur', 'unite', 'date_analyse']


class ImagingExamSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ImagingExam
        fields = ['id', 'type_examen', 'conclusion', 'date_examen']


class HistologySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Histology
        fields = [
            'id', 'type_histologique', 'grade_histologique',
            'marge_chirurgicale', 'envahissement_vasculaire',
            'envahissement_lymphatique', 'date_resultat', 'data_source',
        ]


class MetastasisSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Metastasis
        fields = ['id', 'organe', 'date_detection']


class FollowUpSerializer(serializers.ModelSerializer):
    class Meta:
        model  = FollowUp
        fields = ['id', 'date_visite', 'statut_clinique', 'observation']


class CancerStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = CancerStatusHistory
        fields = ['id', 'status', 'status_date']


# ─── Cancer (lecture complète avec nested) ────────────────────────────────────

class CancerSerializer(serializers.ModelSerializer):
    cancer_type_name = serializers.CharField(source='cancer_type.name', read_only=True)
    triple_negatif   = serializers.BooleanField(read_only=True)
    treatments       = TreatmentSerializer(many=True, read_only=True)
    biological_exams = BiologicalExamSerializer(many=True, read_only=True)
    imaging_exams    = ImagingExamSerializer(many=True, read_only=True)
    histology        = HistologySerializer(read_only=True)
    metastases       = MetastasisSerializer(many=True, read_only=True)
    follow_ups       = FollowUpSerializer(many=True, read_only=True)
    status_history   = CancerStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model  = Cancer
        fields = [
            # Identité tumorale
            'id', 'cancer_type', 'cancer_type_name',
            'type_tumeur', 'sous_type', 'lateralite', 'cim10_code',
            # Diagnostic
            'date_symptomes', 'date_diagnostic',
            'base_diagnostic',
            'etablissement_diag', 'service_diag', 'medecin_diag',
            # Histologie
            'type_histologique', 'grade_histologique', 'bloc_anapath',
            # TNM & Stade
            'stade_clinique', 'stade_pathologique', 'tnm', 'grade',
            # Données tumorales
            'taille_tumorale', 'ganglions_envahis',
            # Statut
            'localise', 'metastatique', 'recidive',
            'sites_metastatiques',
            # Récepteurs
            'recepteur_er', 'recepteur_pr', 'her2', 'triple_negatif',
            # Méta
            'data_source', 'created_at', 'updated_at',
            # Nested
            'treatments', 'biological_exams', 'imaging_exams',
            'histology', 'metastases', 'follow_ups', 'status_history',
        ]
        read_only_fields = ['created_at', 'updated_at']


# ─── Cancer (écriture — create/update) ───────────────────────────────────────

class CancerCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Cancer
        fields = [
            'id', 'patient',
            'cancer_type',
            'type_tumeur', 'sous_type', 'lateralite', 'cim10_code',
            'date_symptomes', 'date_diagnostic',
            'base_diagnostic',
            'etablissement_diag', 'service_diag', 'medecin_diag',
            'type_histologique', 'grade_histologique', 'bloc_anapath',
            'stade_clinique', 'stade_pathologique', 'tnm', 'grade',
            'taille_tumorale', 'ganglions_envahis',
            'localise', 'metastatique', 'recidive',
            'sites_metastatiques',
            'recepteur_er', 'recepteur_pr', 'her2',
            'data_source',
        ]

    def validate_patient(self, patient):
        request = self.context.get('request')
        if request and patient.created_by != request.user and not request.user.is_staff:
            raise serializers.ValidationError("Accès refusé à ce patient.")
        return patient


# ─── Consultation ─────────────────────────────────────────────────────────────

class ConsultationSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model  = Consultation
        fields = ['id', 'user', 'user_name', 'consultation_date', 'motif', 'compte_rendu', 'next_visit_date']

    def get_user_name(self, obj):
        if obj.user:
            return f"Dr. {obj.user.prenom} {obj.user.nom}"
        return '—'

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


# ─── Patient liste (léger) ────────────────────────────────────────────────────

class PatientListSerializer(serializers.ModelSerializer):
    age           = serializers.ReadOnlyField()
    full_name     = serializers.ReadOnlyField()
    commune_name  = serializers.CharField(source='commune.name', read_only=True)
    wilaya_name   = serializers.CharField(source='commune.wilaya.name', read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    medecin_nom   = serializers.SerializerMethodField()
    dernier_cancer = serializers.SerializerMethodField()

    class Meta:
        model  = Patient
        fields = [
            'id', 'numero_dossier', 'national_id',
            'first_name', 'last_name', 'full_name',
            'date_naissance', 'age', 'sexe',
            'phone', 'email',
            'situation_familiale', 'profession',
            'commune', 'commune_name', 'wilaya_name',
            'hospital', 'hospital_name',
            'couverture_sociale',
            'created_by', 'medecin_nom',
            'data_source', 'created_at', 'updated_at',
            'dernier_cancer',
        ]
        read_only_fields = ['numero_dossier', 'created_by', 'created_at', 'updated_at']

    def get_medecin_nom(self, obj):
        if obj.created_by:
            return f"Dr. {obj.created_by.prenom} {obj.created_by.nom}"
        return '—'

    def get_dernier_cancer(self, obj):
        cancer = obj.cancers.order_by('-created_at').first()
        if not cancer:
            return None
        return {
            'id':              cancer.id,
            'organe':          cancer.cancer_type.name if cancer.cancer_type else '—',
            'sous_type':       cancer.sous_type or '',
            'stade':           cancer.stade_clinique or cancer.stade_pathologique or '—',
            'tnm':             cancer.tnm or '',
            'date_diagnostic': str(cancer.date_diagnostic) if cancer.date_diagnostic else '—',
            'localise':        cancer.localise,
            'metastatique':    cancer.metastatique,
            'recidive':        cancer.recidive,
            'triple_negatif':  cancer.triple_negatif,
            'nb_traitements':  cancer.treatments.count(),
        }


# ─── Patient détail (complet) ─────────────────────────────────────────────────

class PatientDetailSerializer(serializers.ModelSerializer):
    age           = serializers.ReadOnlyField()
    full_name     = serializers.ReadOnlyField()
    commune_name  = serializers.CharField(source='commune.name',        read_only=True)
    wilaya_name   = serializers.CharField(source='commune.wilaya.name', read_only=True)
    hospital_name = serializers.CharField(source='hospital.name',       read_only=True)
    medecin_nom   = serializers.SerializerMethodField()
    cancers       = CancerSerializer(many=True, read_only=True)
    consultations = ConsultationSerializer(many=True, read_only=True)

    class Meta:
        model  = Patient
        fields = [
            'id', 'numero_dossier', 'national_id',
            'first_name', 'last_name', 'full_name',
            'date_naissance', 'age', 'sexe',
            'situation_familiale', 'profession',
            'phone', 'email', 'adresse',
            'commune', 'commune_name', 'wilaya_name',
            'hospital', 'hospital_name',
            'couverture_sociale',
            'created_by', 'medecin_nom',
            'is_merged', 'merged_into_patient',
            'data_source', 'created_at', 'updated_at',
            'cancers', 'consultations',
        ]
        read_only_fields = ['numero_dossier', 'created_by', 'created_at', 'updated_at']

    def get_medecin_nom(self, obj):
        if obj.created_by:
            return f"Dr. {obj.created_by.prenom} {obj.created_by.nom}"
        return '—'

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


# ─── Death ────────────────────────────────────────────────────────────────────

class DeathSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Death
        fields = ['id', 'patient', 'date_death', 'cause_principale']