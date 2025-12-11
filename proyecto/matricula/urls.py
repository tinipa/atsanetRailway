# hola :D
from django.urls import path
from . import views

urlpatterns = [
    path('', views.matricula, name='matricula'),
    path('matricula/terminar-periodo/', views.terminar_periodo, name='terminar_periodo'),
    path('matricula/json/', views.get_matriculas_json, name='get_matriculas_json'),
    path('preview-carnet/', views.preview_carnet, name='preview_carnet'),
    
    # NUEVAS URLs para Kanban
    path('matricula/categorias/limites/', views.obtener_datos_categorias, name='obtener_datos_categorias'),
    path('matricula/categorias/limites/actualizar/', views.actualizar_limite_categoria, name='actualizar_limite_categoria'),
    path('matricula/categorias/limites/actualizar-masivo/', views.actualizar_limites_masivo, name='actualizar_limites_masivo'),
    path('matricula/categorias/resumen/', views.obtener_resumen_categorias, name='obtener_resumen_categorias'),  # NUEVA
]