from django.urls import path
from . import views

app_name = 'reportes'

urlpatterns = [
    path('', views.listar_entrenamientos, name='index'),  # MODIFICADO
    path('generar-individual/', views.generar_reporte_individual, name='generar_individual'),
    path('generar-grupal/', views.generar_reporte_grupal, name='generar_grupal'),
    path('api/alumnos-por-categoria/', views.obtener_alumnos_por_categoria, name='alumnos_por_categoria'),
    path('generar-certificado/<int:matricula_id>/', views.generar_certificado_pdf, name='generar_certificado'),
    path('exportar-excel/<int:matricula_id>/', views.exportar_reporte_individual_excel, name='exportar_excel'),
    path('enviar-correo/<int:matricula_id>/', views.enviar_reportes_por_correo, name='enviar_correo'),
    path('api/detalle-entrenamiento/<int:sesion_id>/', views.obtener_detalle_entrenamiento, name='detalle_entrenamiento'),  # NUEVO
]