from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, LoginLog


class UserSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()
    password    = serializers.CharField(write_only=True, required=False)

    class Meta:
        model  = User
        fields = [
            'id', 'email', 'nom', 'prenom', 'telephone',
            'role', 'specialite', 'etablissement', 'wilaya',
            'statut', 'permissions', 'created_at',
            'perm_read', 'perm_write', 'perm_rcp',
            'perm_lab', 'perm_stats', 'perm_import',
            'password',
        ]
        extra_kwargs = {
            'perm_read':   {'write_only': False},
            'perm_write':  {'write_only': False},
            'perm_rcp':    {'write_only': False},
            'perm_lab':    {'write_only': False},
            'perm_stats':  {'write_only': False},
            'perm_import': {'write_only': False},
        }

    def get_permissions(self, obj):
        return obj.permissions_list

    def create(self, validated_data):
        request = self.context.get('request')
        password = validated_data.pop('password', None)
        created_by = None
        if request and request.user.is_authenticated:
            created_by = request.user
        user = User(**validated_data)
        if created_by:
            user.created_by = created_by
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Email ou mot de passe incorrect")
        if not user.is_active:
            raise serializers.ValidationError("Compte désactivé")
        if user.statut != 'actif':
            raise serializers.ValidationError("Compte suspendu ou inactif")
        data['user'] = user
        return data


class LoginLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model  = LoginLog
        fields = ['id', 'user_name', 'action', 'detail', 'ip_address', 'timestamp']

    def get_user_name(self, obj):
        return str(obj.user) if obj.user else 'Utilisateur supprimé'