# ══════════════════════════════════════════
# patients/serializers.py
# ══════════════════════════════════════════
from rest_framework import serializers
from .models import Patient


class PatientSerializer(serializers.ModelSerializer):
    age          = serializers.ReadOnlyField()
    medecin_nom  = serializers.SerializerMethodField()

    class Meta:
        model  = Patient
        fields = '__all__'
        read_only_fields = ['numero_dossier', 'created_by', 'created_at', 'updated_at']

    def get_medecin_nom(self, obj):
        if obj.medecin_referent:
            return f"Dr. {obj.medecin_referent.prenom} {obj.medecin_referent.nom}"
        return ''

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
