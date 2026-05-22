from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_user_created_by'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('admin', 'Administrateur'),
                    ('medecin', 'Médecin'),
                    ('epidimio', 'Épidimio'),
                    ('anapate', 'Anapath'),
                    ('pharmacie', 'Pharmacie'),
                ],
                default='medecin',
                max_length=20,
            ),
        ),
    ]
