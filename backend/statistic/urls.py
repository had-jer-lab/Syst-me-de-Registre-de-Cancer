from django.urls import path
from . import views

urlpatterns = [
    path('stats/', views.statistics_view, name='statistics'),
]