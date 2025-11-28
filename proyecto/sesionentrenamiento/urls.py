from django.urls import path
from . import views

app_name = 'sesionentrenamiento'

urlpatterns = [
    path('', views.sesion, name='sesion'),
    path('api/entrenamientos/<int:categoria_id>/', views.obtener_entrenamientos, name='api_entrenamientos'),
    path('api/objetivos/<int:entrenamiento_id>/', views.obtener_objetivos, name='api_objetivos'),
    path('api/alumnos/<int:categoria_id>/', views.obtener_alumnos_categoria, name='api_alumnos'),
    path('api/crear-sesion/', views.crear_sesion, name='crear_sesion'),
]