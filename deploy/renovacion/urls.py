from django.urls import path
from . import views
app_name = 'renovacion'

urlpatterns = [
    path('', views.renovacion_login, name='login'),
    path('datos/', views.renovacion_datos, name='datos'),
    path('logout/', views.renovacion_logout, name='logout'),
]