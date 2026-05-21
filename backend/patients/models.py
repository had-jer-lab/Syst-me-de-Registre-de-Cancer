# ══════════════════════════════════════════
# patients/models.py — Version complète selon BDD
# ══════════════════════════════════════════
from django.db import models
from django.conf import settings


# ─── Géographie ───────────────────────────────────────────────────────────────

class Wilaya(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Wilayas'

    def __str__(self):
        return self.name


class Commune(models.Model):
    name        = models.CharField(max_length=100)
    wilaya      = models.ForeignKey(Wilaya, on_delete=models.CASCADE, related_name='communes')
    postal_code = models.CharField(max_length=10, blank=True)
    latitude    = models.FloatField(null=True, blank=True)
    longitude   = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.wilaya.name})"


class Hospital(models.Model):
    TYPE_CHOICES = [
        ('chu',    'CHU'),
        ('ehu',    'EHU'),
        ('epsp',   'EPSP'),
        ('clinic', 'Clinique privée'),
        ('other',  'Autre'),
    ]
    name      = models.CharField(max_length=200)
    wilaya    = models.ForeignKey(Wilaya, on_delete=models.SET_NULL, null=True, related_name='hospitals')
    type      = models.CharField(max_length=20, choices=TYPE_CHOICES, default='chu')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# ─── Patient ──────────────────────────────────────────────────────────────────

class Patient(models.Model):
    SEXE_CHOICES = [('M', 'Masculin'), ('F', 'Féminin')]
    SOURCE_CHOICES = [
        ('manual',  'Saisie manuelle'),
        ('import',  'Import CSV/Excel'),
        ('oedi',    'OEDI'),
    ]

    numero_dossier       = models.CharField(max_length=30, unique=True, blank=True)
    national_id          = models.CharField(max_length=20, unique=True, null=True, blank=True)
    first_name           = models.CharField(max_length=100)
    last_name            = models.CharField(max_length=100)
    date_naissance       = models.DateField()
    sexe                 = models.CharField(max_length=1, choices=SEXE_CHOICES)
    phone                = models.CharField(max_length=20, blank=True)
    commune              = models.ForeignKey(Commune,  on_delete=models.SET_NULL, null=True, blank=True, related_name='patients')
    hospital             = models.ForeignKey(Hospital, on_delete=models.SET_NULL, null=True, blank=True, related_name='patients')
    created_by           = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='patients_crees')
    is_merged            = models.BooleanField(default=False)
    merged_into_patient  = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='merged_patients')
    data_source          = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='manual')
    created_at           = models.DateTimeField(auto_now_add=True)
    updated_at           = models.DateTimeField(auto_now=True)
    deleted_at           = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.numero_dossier} — {self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def age(self):
        from datetime import date
        today = date.today()
        b = self.date_naissance
        return today.year - b.year - ((today.month, today.day) < (b.month, b.day))

    def save(self, *args, **kwargs):
        if not self.numero_dossier:
            from datetime import date
            year  = date.today().year
            count = Patient.objects.filter(created_at__year=year).count() + 1
            self.numero_dossier = f"DOS-{year}-{count:05d}"
        super().save(*args, **kwargs)


# ─── Cancer ───────────────────────────────────────────────────────────────────

class CancerType(models.Model):
    name      = models.CharField(max_length=100)
    cim10_code = models.CharField(max_length=10, unique=True, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.cim10_code or '—'})"


class Cancer(models.Model):
    SOURCE_CHOICES = [('manual', 'Manuel'), ('import', 'Import'), ('oedi', 'OEDI')]

    patient          = models.ForeignKey(Patient,    on_delete=models.CASCADE, related_name='cancers')
    cancer_type      = models.ForeignKey(CancerType, on_delete=models.SET_NULL, null=True, blank=True)
    stade_clinique   = models.CharField(max_length=10, blank=True)
    stade_pathologique = models.CharField(max_length=10, blank=True)
    tnm              = models.CharField(max_length=30, blank=True)   # ex: T2N1M0
    grade            = models.CharField(max_length=20, blank=True)
    date_diagnostic  = models.DateField(null=True, blank=True)
    data_source      = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='manual')
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cancer {self.cancer_type} — {self.patient}"


class Treatment(models.Model):
    cancer         = models.ForeignKey(Cancer, on_delete=models.CASCADE, related_name='treatments')
    type_traitement = models.CharField(max_length=100)   # chimio, radio, chirurgie…
    protocole      = models.TextField(blank=True)
    date_debut     = models.DateField(null=True, blank=True)
    date_fin       = models.DateField(null=True, blank=True)


class BiologicalExam(models.Model):
    cancer        = models.ForeignKey(Cancer, on_delete=models.CASCADE, related_name='biological_exams')
    type_analyse  = models.CharField(max_length=100)
    resultat      = models.TextField(blank=True)
    date_analyse  = models.DateField(null=True, blank=True)


class ImagingExam(models.Model):
    cancer       = models.ForeignKey(Cancer, on_delete=models.CASCADE, related_name='imaging_exams')
    type_examen  = models.CharField(max_length=100)
    conclusion   = models.TextField(blank=True)
    date_examen  = models.DateField(null=True, blank=True)


class Histology(models.Model):
    cancer                   = models.OneToOneField(Cancer, on_delete=models.CASCADE, related_name='histology')
    type_histologique        = models.CharField(max_length=100, blank=True)
    grade_histologique       = models.CharField(max_length=20, blank=True)
    marge_chirurgicale       = models.CharField(max_length=50, blank=True)
    envahissement_vasculaire = models.BooleanField(null=True, blank=True)
    envahissement_lymphatique = models.BooleanField(null=True, blank=True)
    date_resultat            = models.DateField(null=True, blank=True)
    data_source              = models.CharField(max_length=20, default='manual')


class Metastasis(models.Model):
    cancer         = models.ForeignKey(Cancer, on_delete=models.CASCADE, related_name='metastases')
    organe         = models.CharField(max_length=100)
    date_detection = models.DateField(null=True, blank=True)


class FollowUp(models.Model):
    cancer          = models.ForeignKey(Cancer, on_delete=models.CASCADE, related_name='follow_ups')
    date_visite     = models.DateField()
    statut_clinique = models.CharField(max_length=100, blank=True)
    observation     = models.TextField(blank=True)


class CancerStatusHistory(models.Model):
    cancer      = models.ForeignKey(Cancer, on_delete=models.CASCADE, related_name='status_history')
    status      = models.CharField(max_length=50)
    status_date = models.DateField()


# ─── Décès ────────────────────────────────────────────────────────────────────

class Death(models.Model):
    patient          = models.OneToOneField(Patient, on_delete=models.CASCADE, related_name='death')
    date_death       = models.DateField()
    cause_principale = models.CharField(max_length=200, blank=True)


# ─── Facteurs de risque & Habitudes ──────────────────────────────────────────

class RiskFactor(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class PatientRiskFactor(models.Model):
    patient     = models.ForeignKey(Patient,    on_delete=models.CASCADE, related_name='risk_factors')
    risk_factor = models.ForeignKey(RiskFactor, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('patient', 'risk_factor')


class Habit(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class PatientHabit(models.Model):
    patient        = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='habits')
    habit          = models.ForeignKey(Habit,   on_delete=models.CASCADE)
    frequency      = models.CharField(max_length=50, blank=True)
    duration_years = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        unique_together = ('patient', 'habit')


# ─── Consultations ────────────────────────────────────────────────────────────

class Consultation(models.Model):
    patient           = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='consultations')
    user              = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='consultations')
    consultation_date = models.DateField()
    motif             = models.CharField(max_length=200, blank=True)
    compte_rendu      = models.TextField(blank=True)
    next_visit_date   = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['-consultation_date']


# ─── Doublons ─────────────────────────────────────────────────────────────────

class DuplicateCase(models.Model):
    STATUS_CHOICES = [
        ('pending',  'En attente'),
        ('merged',   'Fusionné'),
        ('ignored',  'Ignoré'),
    ]
    patient_1  = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='duplicates_as_1')
    patient_2  = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='duplicates_as_2')
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)