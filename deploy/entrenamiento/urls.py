from django.urls import path
from . import views

urlpatterns = [
    path('', views.entrenamientos, name='entrenamientos'),
    path('api/entrenamiento/crear/', views.crear_entrenamiento, name='crear_entrenamiento'),
    path('api/entrenamiento/editar/', views.editar_entrenamiento, name='editar_entrenamiento'),
    path('api/entrenamiento/eliminar/', views.eliminar_entrenamiento, name='eliminar_entrenamiento'),
    path('api/entrenamiento/<int:id>/', views.obtener_entrenamiento, name='obtener_entrenamiento'),
    path('buscar-objetivos/', views.buscar_objetivos, name='buscar_objetivos'),
    path('api/entrenamiento/cambiar-estado/', views.cambiar_estado_entrenamiento, name='cambiar_estado_entrenamiento'),
    path('api/objetivo/crear/', views.crear_objetivo, name='crear_objetivo'),
    path('api/objetivo/<int:id>/', views.obtener_objetivo, name='obtener_objetivo'),
    path('api/objetivo/editar/', views.editar_objetivo, name='editar_objetivo'),
    path('api/objetivo/cambiar-estado/', views.cambiar_estado_objetivo, name='cambiar_estado_objetivo'),
    path('api/objetivo/<int:id>/verificar-eliminar/', views.verificar_eliminar_objetivo, name='verificar_eliminar_objetivo'),
    path('api/objetivo/eliminar/', views.eliminar_objetivo, name='eliminar_objetivo'),
]