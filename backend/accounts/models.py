from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError('Email requis')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault('role', 'admin')
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('admin',      'Administrateur'),
        ('medecin',    'Médecin'),
        ('biologiste', 'Biologiste'),
    ]
    STATUS_CHOICES = [
        ('actif',    'Actif'),
        ('inactif',  'Inactif'),
        ('suspendu', 'Suspendu'),
    ]

    email         = models.EmailField(unique=True)
    nom           = models.CharField(max_length=100)
    prenom        = models.CharField(max_length=100)
    telephone     = models.CharField(max_length=20, blank=True)
    role          = models.CharField(max_length=20, choices=ROLE_CHOICES, default='medecin')
    specialite    = models.CharField(max_length=100, blank=True)
    etablissement = models.CharField(max_length=200, blank=True)
    wilaya        = models.CharField(max_length=100, blank=True)
    statut        = models.CharField(max_length=20, choices=STATUS_CHOICES, default='actif')

    # Permissions
    perm_read   = models.BooleanField(default=True)
    perm_write  = models.BooleanField(default=False)
    perm_rcp    = models.BooleanField(default=False)
    perm_lab    = models.BooleanField(default=False)
    perm_stats  = models.BooleanField(default=False)
    perm_import = models.BooleanField(default=False)

    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)

    created_by = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='created_users')
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['nom', 'prenom']

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.role})"

    @property
    def permissions_list(self):
        perms = []
        if self.perm_read:   perms.append('read')
        if self.perm_write:  perms.append('write')
        if self.perm_rcp:    perms.append('rcp')
        if self.perm_lab:    perms.append('lab')
        if self.perm_stats:  perms.append('stats')
        if self.perm_import: perms.append('import')
        return perms


class LoginLog(models.Model):
    ACTION_CHOICES = [
        ('login',   'Connexion'),
        ('logout',  'Déconnexion'),
        ('action',  'Action'),
    ]
    user       = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action     = models.CharField(max_length=20, choices=ACTION_CHOICES)
    detail     = models.CharField(max_length=255, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user} — {self.action} — {self.timestamp}"