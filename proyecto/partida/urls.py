from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('iniciosesion/', views.iniciosesion, name='iniciosesion'),
    path('cerrarsesion/', views.cerrar_sesion, name='cerrarsesion'), 
    path('usuario/', views.usuario, name='usuarios'),
    path('formAlumno/', views.formAlumno, name='formAlumno'),
    path('formEntrenador/', views.formEntrenador, name='fomrularioe'),
]
