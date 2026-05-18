from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import LoginSerializer, UserSerializer, LoginLogSerializer
from .models import User, LoginLog


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data['user']

        # Générer tokens JWT
        refresh = RefreshToken.for_user(user)

        # Enregistrer log
        LoginLog.objects.create(
            user=user,
            action='login',
            ip_address=request.META.get('REMOTE_ADDR'),
            detail=request.META.get('HTTP_USER_AGENT', '')[:100],
        )

        # Route selon le rôle
        if user.role == 'admin':
            route = '/admin'
        else:
            route = '/dashboard'

        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
            'route': route,
        })


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        LoginLog.objects.create(
            user=request.user,
            action='logout',
            ip_address=request.META.get('REMOTE_ADDR'),
        )
        return Response({'message': 'Déconnecté avec succès'})


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UserListCreateView(generics.ListCreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        # Only show users created by this admin
        return User.objects.filter(
            role__in=['medecin', 'epidimio', 'anapate', 'pharmacie'],
            created_by=self.request.user
        ).order_by('-created_at')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = UserSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        # Admin can only modify users they created
        return User.objects.filter(created_by=self.request.user)


class LoginLogListView(generics.ListAPIView):
    queryset           = LoginLog.objects.all()[:200]
    serializer_class   = LoginLogSerializer
    permission_classes = [permissions.IsAdminUser]