#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Créer le superutilisateur
admin_email = 'admin@registre-cancer.com'
if not User.objects.filter(email=admin_email).exists():
    User.objects.create_superuser(
        email=admin_email,
        password='admin123',
        nom='Administrateur',
        prenom='Système'
    )
    print("✅ Superutilisateur créé:")
    print("   Email: admin@registre-cancer.com")
    print("   Mot de passe: admin123")
else:
    print("❌ L'utilisateur avec l'email admin@registre-cancer.com existe déjà")
    # Réinitialiser le mot de passe
    user = User.objects.get(email=admin_email)
    user.set_password('admin123')
    user.save()
    print("✅ Mot de passe réinitialisé:")
    print("   Email: admin@registre-cancer.com")
    print("   Mot de passe: admin123")
