# ══════════════════════════════════════════
# patients/views.py
# ══════════════════════════════════════════
from rest_framework import generics, permissions, filters
from .models import Patient
from .serializers import PatientSerializer


class PatientListCreateView(generics.ListCreateAPIView):
    queryset       = Patient.objects.all()
    serializer_class = PatientSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ['nom', 'prenom', 'numero_dossier', 'organe', 'wilaya']
    ordering_fields  = ['created_at', 'nom', 'stade', 'statut']


class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset         = Patient.objects.all()
    serializer_class = PatientSerializer

