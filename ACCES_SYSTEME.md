# Registre National de Cancer - Accès au Système

## ✅ Système en cours d'exécution

### Serveurs actifs
- **Backend Django**: http://localhost:8000
- **Frontend React**: http://localhost:3000

---

## 📌 Compte d'accès administrateur

**Email:** `admin@registre-cancer.com`  
**Mot de passe:** `admin123`

### URL de connexion:
```
http://localhost:3000/auth
```

---

## 🔗 Endpoints API disponibles

### Authentification
- **POST** `/api/auth/login/` - Connexion
- **POST** `/api/auth/logout/` - Déconnexion  
- **GET** `/api/auth/me/` - Infos utilisateur actuel

### Gestion des utilisateurs
- **GET** `/api/auth/users/` - Liste des utilisateurs
- **POST** `/api/auth/users/` - Créer un nouvel utilisateur
- **GET/PATCH/DELETE** `/api/auth/users/{id}/` - Détails/Modification/Suppression

### Logs d'activité
- **GET** `/api/auth/logs/` - Journal des connexions/déconnexions

### Patients & Cancer  
- **GET/POST** `/api/patients/` - Gestion des patients
- **GET/POST** `/api/patients/{id}/cancers/` - Données de cancer

---

## 🧪 Test de connexion (via curl)

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@registre-cancer.com",
    "password": "admin123"
  }'
```

**Réponse attendue:** Tokens JWT (access + refresh)

---

## 🗄️ Base de données

- **Type:** SQLite3
- **Fichier:** `backend/db.sqlite3`
- **Utilisateurs existants:**
  - admin@registre-cancer.com (Administrateur)
  - safiimane@gmail.com (Anapath)
  - safiimane123@gmail.com (Médecin)

---

## 📝 Architecture

```
Frontend (React 19 + Tailwind)
    ↓ (http://localhost:3000)
    ├─ Authentification (/auth)
    ├─ Admin Dashboard (/admin)
    ├─ Dashboard utilisateur (/dashboard)
    └─ Gestion des patients

Backend (Django 6.0 + DRF)
    ↓ (http://localhost:8000)
    ├─ Accounts (Authentication)
    ├─ Patients (Gestion des patients)
    ├─ RCP (Discussions RCP)
    └─ Statistics (Statistiques)
```

---

## 🆘 Aide & Résolution des problèmes

### Problème: Erreur 400 Bad Request au login
**Solution:** Vérifiez que:
- L'email et le mot de passe sont corrects
- Le compte est actif dans la base de données
- Le serveur backend est en cours d'exécution

### Problème: CORS errors
**Solution:** CORS est configuré pour `http://localhost:3000`
- Si vous accédez depuis une autre origine, configurez `CORS_ALLOWED_ORIGINS` dans `settings.py`

### Problème: Base de données vide
**Solution:** Les migrations sont déjà appliquées. Pour réinitialiser:
```bash
cd backend
python manage.py migrate
python setup_admin.py
```

---

✅ **Projet prêt à l'emploi!**
Accédez à http://localhost:3000 pour commencer.
