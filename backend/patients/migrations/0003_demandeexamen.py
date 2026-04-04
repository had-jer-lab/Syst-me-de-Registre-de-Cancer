from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0002_cancertype_commune_habit_hospital_riskfactor_wilaya_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='DemandeExamen',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type_demande', models.CharField(
                    max_length=20,
                    choices=[('biologie', 'Bilan biologique'), ('imagerie', 'Imagerie radiologique')],
                )),
                ('statut', models.CharField(
                    max_length=20,
                    choices=[
                        ('en_attente', 'En attente'),
                        ('en_cours',   'En cours'),
                        ('resultat_disponible', 'Résultat disponible'),
                        ('annule',     'Annulé'),
                    ],
                    default='en_attente',
                )),
                ('urgence', models.CharField(
                    max_length=10,
                    choices=[('normal', 'Normal'), ('urgent', 'Urgent'), ('tres_urgent', 'Très urgent')],
                    default='normal',
                )),
                # Examens demandés (liste JSON)
                ('examens_demandes', models.JSONField(default=list)),
                # Champs communs
                ('motif_clinique',    models.TextField(blank=True)),
                ('observations',      models.TextField(blank=True)),
                ('date_demande',      models.DateTimeField(auto_now_add=True)),
                ('date_souhaitee',    models.DateField(null=True, blank=True)),
                # Résultat
                ('resultat_texte',    models.TextField(blank=True)),
                ('date_resultat',     models.DateField(null=True, blank=True)),
                # Relations
                ('patient', models.ForeignKey(
                    'patients.Patient',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='demandes_examens',
                )),
                ('cancer', models.ForeignKey(
                    'patients.Cancer',
                    on_delete=django.db.models.deletion.SET_NULL,
                    null=True, blank=True,
                    related_name='demandes_examens',
                )),
                ('medecin', models.ForeignKey(
                    settings.AUTH_USER_MODEL,
                    on_delete=django.db.models.deletion.SET_NULL,
                    null=True,
                    related_name='demandes_envoyees',
                )),
            ],
            options={
                'ordering': ['-date_demande'],
            },
        ),
    ]