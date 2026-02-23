# ══════════════════════════════════════════
# patients/models.py
# ══════════════════════════════════════════
from django.db import models
from accounts.models import User


class Patient(models.Model):
    STADE_CHOICES = [
        ('I','Stade I'), ('II','Stade II'),
        ('III','Stade III'), ('IV','Stade IV'),
    ]
    STATUS_CHOICES = [
        ('actif','Actif'), ('suivi','Suivi'),
        ('critique','Critique'), ('decede','Décédé'),
    ]

    numero_dossier   = models.CharField(max_length=30, unique=True, blank=True)
    nom              = models.CharField(max_length=100)
    prenom           = models.CharField(max_length=100)
    date_naissance   = models.DateField()
    sexe             = models.CharField(max_length=1, choices=[('M','Masculin'),('F','Féminin')])
    wilaya           = models.CharField(max_length=100)
    commune          = models.CharField(max_length=100, blank=True)
    telephone        = models.CharField(max_length=20, blank=True)
    organe           = models.CharField(max_length=100)
    stade            = models.CharField(max_length=5, choices=STADE_CHOICES)
    date_diagnostic  = models.DateField()
    histologie       = models.TextField(blank=True)
    statut           = models.CharField(max_length=20, choices=STATUS_CHOICES, default='actif')
    medecin_referent = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='patients', limit_choices_to={'role': 'medecin'}
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name='dossiers_crees'
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.numero_dossier} — {self.prenom} {self.nom}"

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
