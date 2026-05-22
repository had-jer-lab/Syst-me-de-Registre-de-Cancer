import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User

email = 'admin@registre-cancer.com'
password = 'admin123'

try:
    user = User.objects.get(email=email)
    user.set_password(password)
    user.is_active = True
    user.save()
    print(f"✅ Utilisateur existant mis à jour: {email}")
except User.DoesNotExist:
    user = User.objects.create_superuser(
        email=email,
        password=password,
        nom='Admin',
        prenom='System',
        role='admin',
        statut='actif'
    )
    print(f"✅ Utilisateur créé: {email}")

print(f"\n📍 Compte d'accès Django:")
print(f"Email: {email}")
print(f"Mot de passe: {password}")
print(f"\n📋 Tous les utilisateurs:")
for u in User.objects.all():
    print(f"  - {u.email} ({u.role}, statut={u.statut}, active={u.is_active})")
