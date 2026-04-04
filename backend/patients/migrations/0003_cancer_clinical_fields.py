# Generated migration — adds all fields required by oncologist interview

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0002_cancertype_commune_habit_hospital_riskfactor_wilaya_and_more'),
    ]

    operations = [

        # ── Cancer — nouveaux champs diagnostiques ──────────────────────────────
        migrations.AddField(
            model_name='cancer',
            name='date_symptomes',
            field=models.DateField(null=True, blank=True, verbose_name='Date des premiers symptômes'),
        ),
        migrations.AddField(
            model_name='cancer',
            name='base_diagnostic',
            field=models.JSONField(default=list, blank=True, verbose_name='Base de diagnostic'),
        ),
        migrations.AddField(
            model_name='cancer',
            name='cim10_code',
            field=models.CharField(max_length=15, blank=True, verbose_name='Code CIM-10'),
        ),
        migrations.AddField(
            model_name='cancer',
            name='bloc_anapath',
            field=models.CharField(max_length=50, blank=True, verbose_name='N° bloc anatomopathologique'),
        ),
        migrations.AddField(
            model_name='cancer',
            name='grade_histologique',
            field=models.CharField(max_length=50, blank=True, verbose_name='Grade histologique'),
        ),
        migrations.AddField(
            model_name='cancer',
            name='taille_tumorale',
            field=models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name='Taille tumorale (cm)'),
        ),
        migrations.AddField(
            model_name='cancer',
            name='ganglions_envahis',
            field=models.PositiveSmallIntegerField(null=True, blank=True, verbose_name='Nb ganglions envahis'),
        ),
        migrations.AddField(
            model_name='cancer',
            name='sites_metastatiques',
            field=models.JSONField(default=list, blank=True, verbose_name='Sites métastatiques'),
        ),
        migrations.AddField(
            model_name='cancer',
            name='localise',
            field=models.BooleanField(default=True, verbose_name='Localisé'),
        ),
        migrations.AddField(
            model_name='cancer',
            name='metastatique',
            field=models.BooleanField(default=False, verbose_name='Métastatique'),
        ),
        migrations.AddField(
            model_name='cancer',
            name='recidive',
            field=models.BooleanField(default=False, verbose_name='Récidive'),
        ),
        migrations.AddField(
            model_name='cancer',
            name='etablissement_diag',
            field=models.CharField(max_length=200, blank=True, verbose_name='Établissement diagnostiqueur'),
        ),
        migrations.AddField(
            model_name='cancer',
            name='medecin_diag',
            field=models.CharField(max_length=150, blank=True, verbose_name='Médecin diagnostiqueur'),
        ),
        migrations.AddField(
            model_name='cancer',
            name='service_diag',
            field=models.CharField(max_length=100, blank=True, verbose_name='Service'),
        ),
        migrations.AddField(
            model_name='cancer',
            name='sous_type',
            field=models.CharField(max_length=100, blank=True, verbose_name='Sous-type'),
        ),
        migrations.AddField(
            model_name='cancer',
            name='type_tumeur',
            field=models.CharField(
                max_length=30, blank=True,
                choices=[('solide', 'Solide'), ('liquide', 'Liquide'), ('hematologique', 'Hématologique')],
                verbose_name='Type de tumeur',
            ),
        ),

        # ── Récepteurs hormonaux (ER / PR / HER2) ──────────────────────────────
        migrations.AddField(
            model_name='cancer',
            name='recepteur_er',
            field=models.CharField(
                max_length=20, blank=True,
                choices=[('positif', 'Positif'), ('negatif', 'Négatif'), ('inconnu', 'Inconnu')],
                verbose_name='Récepteur ER',
            ),
        ),
        migrations.AddField(
            model_name='cancer',
            name='recepteur_pr',
            field=models.CharField(
                max_length=20, blank=True,
                choices=[('positif', 'Positif'), ('negatif', 'Négatif'), ('inconnu', 'Inconnu')],
                verbose_name='Récepteur PR',
            ),
        ),
        migrations.AddField(
            model_name='cancer',
            name='her2',
            field=models.CharField(
                max_length=20, blank=True,
                choices=[('positif', 'Positif'), ('equivoque', 'Équivoque'), ('negatif', 'Négatif'), ('inconnu', 'Inconnu')],
                verbose_name='HER2',
            ),
        ),

        # ── Treatment — champs détaillés ────────────────────────────────────────
        migrations.AddField(
            model_name='treatment',
            name='intention',
            field=models.CharField(
                max_length=30, blank=True,
                choices=[
                    ('curatif', 'Curatif'),
                    ('adjuvant', 'Adjuvant'),
                    ('neo_adjuvant', 'Néo-adjuvant'),
                    ('palliatif', 'Palliatif'),
                    ('prophylactique', 'Prophylactique'),
                ],
                verbose_name='Intention thérapeutique',
            ),
        ),
        migrations.AddField(
            model_name='treatment',
            name='statut',
            field=models.CharField(
                max_length=20, default='planifie',
                choices=[
                    ('planifie', 'Planifié'),
                    ('en_cours', 'En cours'),
                    ('termine', 'Terminé'),
                    ('pause', 'Pause'),
                    ('suspendu', 'Suspendu'),
                    ('abandonne', 'Abandonné'),
                ],
                verbose_name='Statut',
            ),
        ),
        migrations.AddField(
            model_name='treatment',
            name='ligne',
            field=models.CharField(max_length=30, blank=True, verbose_name='Ligne de traitement'),
        ),
        migrations.AddField(
            model_name='treatment',
            name='cycles_prevus',
            field=models.PositiveSmallIntegerField(null=True, blank=True, verbose_name='Cycles prévus'),
        ),
        migrations.AddField(
            model_name='treatment',
            name='cycles_realises',
            field=models.PositiveSmallIntegerField(null=True, blank=True, verbose_name='Cycles réalisés'),
        ),
        migrations.AddField(
            model_name='treatment',
            name='jours_administration',
            field=models.JSONField(default=list, blank=True, verbose_name='Jours d\'administration'),
        ),
        migrations.AddField(
            model_name='treatment',
            name='voie_administration',
            field=models.CharField(max_length=50, blank=True, verbose_name='Voie d\'administration'),
        ),
        migrations.AddField(
            model_name='treatment',
            name='medicaments',
            field=models.TextField(blank=True, verbose_name='Médicaments'),
        ),
        migrations.AddField(
            model_name='treatment',
            name='reponse_tumorale',
            field=models.CharField(
                max_length=10, blank=True,
                choices=[
                    ('RC', 'Rémission complète'),
                    ('RP', 'Rémission partielle'),
                    ('SD', 'Stabilisation'),
                    ('PD', 'Progression'),
                    ('NE', 'Non évaluable'),
                ],
                verbose_name='Réponse tumorale',
            ),
        ),
        migrations.AddField(
            model_name='treatment',
            name='date_evaluation',
            field=models.DateField(null=True, blank=True, verbose_name='Date d\'évaluation'),
        ),
        migrations.AddField(
            model_name='treatment',
            name='grade_toxicite',
            field=models.CharField(max_length=10, blank=True, verbose_name='Grade de toxicité'),
        ),
        migrations.AddField(
            model_name='treatment',
            name='description_toxicite',
            field=models.TextField(blank=True, verbose_name='Description toxicité'),
        ),
    ]