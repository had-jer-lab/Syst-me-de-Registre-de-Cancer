# backend/patients/migrations/0003_customfield_cancercustomvalue.py

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
            name='CustomField',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='Nom technique')),
                ('label', models.CharField(max_length=200, verbose_name='Libellé affiché')),
                ('field_type', models.CharField(
                    max_length=20,
                    choices=[
                        ('text',     'Texte libre'),
                        ('number',   'Nombre'),
                        ('date',     'Date'),
                        ('select',   'Liste déroulante'),
                        ('boolean',  'Oui / Non'),
                        ('textarea', 'Texte long'),
                    ],
                    default='text',
                )),
                ('options', models.JSONField(default=list, blank=True)),
                ('is_required', models.BooleanField(default=False)),
                ('is_active', models.BooleanField(default=True)),
                ('order', models.PositiveIntegerField(default=0)),
                ('section', models.CharField(
                    max_length=50,
                    choices=[
                        ('diagnostic', 'Diagnostic & Cancer'),
                        ('biologie',   'Données biologiques'),
                        ('traitement', 'Traitement'),
                        ('autres',     'Autres'),
                    ],
                    default='diagnostic',
                )),
                ('created_by', models.ForeignKey(
                    settings.AUTH_USER_MODEL,
                    on_delete=django.db.models.deletion.SET_NULL,
                    null=True, blank=True,
                    related_name='custom_fields',
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['order', 'created_at'],
                'verbose_name': 'Champ personnalisé',
                'verbose_name_plural': 'Champs personnalisés',
            },
        ),
        migrations.CreateModel(
            name='CancerCustomValue',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('value', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('cancer', models.ForeignKey(
                    'patients.Cancer',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='custom_values',
                )),
                ('field', models.ForeignKey(
                    'patients.CustomField',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='values',
                )),
            ],
            options={
                'unique_together': {('cancer', 'field')},
            },
        ),
    ]