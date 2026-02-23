# ══════════════════════════════════════════
# accounts/urls.py
# ══════════════════════════════════════════
from django.urls import path
from .views import (
    LoginView, LogoutView, MeView,
    UserListCreateView, UserDetailView,
    LoginLogListView,
)

urlpatterns = [
    path('login/',          LoginView.as_view(),          name='login'),
    path('logout/',         LogoutView.as_view(),          name='logout'),
    path('me/',             MeView.as_view(),              name='me'),
    path('users/',          UserListCreateView.as_view(),  name='users'),
    path('users/<int:pk>/', UserDetailView.as_view(),      name='user-detail'),
    path('logs/',           LoginLogListView.as_view(),    name='logs'),
]

