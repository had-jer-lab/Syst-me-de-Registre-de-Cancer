from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from collections import Counter
from datetime import date
from patients.models import Cancer, Patient


def get_age_group(age):
    if age <= 14: return "0–14"
    if age <= 34: return "15–34"
    if age <= 54: return "35–54"
    if age <= 74: return "55–74"
    return "75+"


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def statistics_view(request):
    sexe      = request.GET.get('sexe', 'all')
    age_group = request.GET.get('age', 'all')
    axis      = request.GET.get('axis', 'cancer')

    qs = Cancer.objects.select_related('patient', 'cancer_type').filter(
        patient__deleted_at__isnull=True
    )
    if sexe in ['M', 'F']:
        qs = qs.filter(patient__sexe=sexe)

    today = date.today()
    results = []
    for cancer in qs:
        p = cancer.patient
        age = today.year - p.date_naissance.year - (
            (today.month, today.day) < (p.date_naissance.month, p.date_naissance.day)
        )
        ag = get_age_group(age)
        if age_group != 'all' and ag != age_group:
            continue
        if axis == 'cancer':
            key = cancer.cancer_type.name if cancer.cancer_type else 'Inconnu'
        elif axis == 'age':
            key = ag
        elif axis == 'sex':
            key = 'Masculin' if p.sexe == 'M' else 'Féminin'
        else:
            key = 'Inconnu'
        results.append(key)

    counts = Counter(results)
    data = [{'label': k, 'value': v} for k, v in counts.most_common()]

    return Response({
        'data':           data,
        'total_patients': Patient.objects.filter(deleted_at__isnull=True).count(),
        'total_cancers':  Cancer.objects.count(),
        'axis':           axis,
    })