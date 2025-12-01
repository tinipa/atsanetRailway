from django.urls import path
from . import views

urlpatterns = [
    path('', views.matricula, name='matricula'),
    path('matricula/terminar-periodo/', views.terminar_periodo, name='terminar_periodo'),
    path('matricula/json/', views.get_matriculas_json, name='get_matriculas_json'),  # ✅ NUEVA
]