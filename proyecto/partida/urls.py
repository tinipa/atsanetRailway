from django.urls import path
from . import views
# Rutas de la aplicación partida

urlpatterns = [
    path('', views.index, name='index'),
    path('iniciosesion/', views.iniciosesion, name='iniciosesion'),
    path('cerrarsesion/', views.cerrar_sesion, name='cerrarsesion'), 
    path('usuario/', views.usuario, name='usuarios'),
    path('formAlumno/', views.formAlumno, name='formAlumno'),
    path('validar-documento/', views.validar_documento_alumno, name='validar_documento'),
    path('formEntrenador/', views.formEntrenador, name='fomrularioe'),
    path('verificar-id-persona/', views.verificar_id_persona, name='verificar_id_persona'),
    path('solicitar-recuperacion/', views.solicitar_recuperacion, name='solicitar_recuperacion'),
    path('recuperar-contrasena/<str:token>/', views.recuperar_contrasena, name='recuperar_contrasena'),
]
