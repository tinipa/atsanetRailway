from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.db import transaction
from django.utils import timezone
from partida.models import (
    Categoria, Entrenamiento, Objetivos,
    Sesionentrenamiento, Asistencia, CalificacionObjetivos,
    MatriculaSesion, Matricula, Alumno, Persona
)
import json
from datetime import datetime
from django.contrib.auth.decorators import login_required
from partida.views import prevent_cache 

# Create your views here.

@login_required
@prevent_cache
def sesion(request):
    categorias = Categoria.objects.all()
    return render(request, 'sesion.html', {'categorias': categorias})


@login_required
def obtener_entrenamientos(request, categoria_id):
    try:
        entrenamientos = Entrenamiento.objects.filter(
            categoriaentrenamiento__fk_categoria_id=categoria_id,
            estado=1
        ).values('identrenamiento', 'nom_entrenamiento', 'descripcion')
        return JsonResponse(list(entrenamientos), safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def obtener_objetivos(request, entrenamiento_id):
    try:
        objetivos = Objetivos.objects.filter(
            entrenamientoobjetivo__fk_entrenamiento_id=entrenamiento_id,
            estado=1
        ).values('idobjetivos', 'nom_objetivo', 'descripcion')
        return JsonResponse(list(objetivos), safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def obtener_alumnos_categoria(request, categoria_id):
    """API endpoint para obtener alumnos activos de una categoría"""
    try:
        # Obtener matrículas activas de la categoría
        matriculas = Matricula.objects.filter(
            fk_categoria_id=categoria_id,
            estado_matricula=1  # Solo activas
        ).select_related(
            'fk_alumno__fk_persona_alumno'
        ).order_by(
            'fk_alumno__fk_persona_alumno__ape1_persona',
            'fk_alumno__fk_persona_alumno__ape2_persona',
            'fk_alumno__fk_persona_alumno__nom1_persona',
            'fk_alumno__fk_persona_alumno__nom2_persona'
        )
        
        alumnos_data = []
        for matricula in matriculas:
            persona = matricula.fk_alumno.fk_persona_alumno
            
            # Construir apellidos
            apellidos = persona.ape1_persona
            if persona.ape2_persona:
                apellidos += f" {persona.ape2_persona}"
            
            # Construir nombres
            nombres = persona.nom1_persona
            if persona.nom2_persona:
                nombres += f" {persona.nom2_persona}"
            
            # Formato: Apellidos, Nombres
            nombre_completo = f"{apellidos}, {nombres}"
            
            alumnos_data.append({
                'matricula_id': matricula.idmatricula,
                'alumno_id': persona.id,
                'nombre_completo': nombre_completo,
                'apellidos': apellidos,
                'nombres': nombres
            })
        
        return JsonResponse(alumnos_data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@require_http_methods(["POST"])
@transaction.atomic
def crear_sesion(request):
    """Guarda TODA la sesión en una sola transacción"""
    try:
        datos = json.loads(request.body)
        
        # CAPTURAR FECHA ACTUAL DEL SERVIDOR PARA LA SESIÓN (PASO 1)
        fecha_sesion = timezone.now()
        
        # 1. Crear sesión con fecha actual del servidor
        sesion = Sesionentrenamiento.objects.create(
            fk_entrenamiento_id=datos['paso1']['entrenamientoId'],
            fecha_entrenamiento=fecha_sesion  # Fecha actual del servidor
        )
        
        # 2. Guardar asistencias con fecha individual para cada alumno
        for asist in datos.get('paso2', {}).get('asistencia', []):
            # Crear o obtener la relación MatriculaSesion
            MatriculaSesion.objects.get_or_create(
                fk_matricula_id=asist['matricula_id'],
                fk_sesion=sesion
            )
            
            # CAPTURAR FECHA ACTUAL DEL SERVIDOR PARA CADA ASISTENCIA (PASO 2)
            # Solo para los presentes, los ausentes también llevan registro de fecha
            fecha_asistencia_registro = timezone.now()
            
            # Crear registro de asistencia
            Asistencia.objects.create(
                fk_sesion_ms=sesion,
                fk_matricula_ms_id=asist['matricula_id'],
                fecha_asistencia=fecha_asistencia_registro,  # Fecha actual del servidor
                asistencia=asist['presente'],  # 1 = presente, 0 = ausente
                observaciones=asist.get('observaciones', '')
            )
        
        # 3. Guardar calificaciones de objetivos
        for calif in datos.get('paso3', {}).get('calificaciones', []):
            # Obtener la asistencia correspondiente
            asistencia = Asistencia.objects.get(
                fk_sesion_ms=sesion,
                fk_matricula_ms_id=calif['matricula_id']
            )
            
            # Crear calificación de objetivo
            CalificacionObjetivos.objects.create(
                fk_asistencia=asistencia,
                id_objetivo=calif['objetivo_id'],
                evaluacion=calif['aprobado'],  # Boolean: True/False
                observaciones=calif.get('observaciones', ''),
                objetivo_evaluado=calif.get('objetivo_evaluado', True)
            )
        
        return JsonResponse({
            'success': True,
            'sesion_id': sesion.idsesion,
            'message': 'Sesión guardada exitosamente',
            'fecha_sesion': fecha_sesion.isoformat(),  # Enviar fecha de confirmación
            'total_asistencias': len(datos.get('paso2', {}).get('asistencia', [])),
            'total_calificaciones': len(datos.get('paso3', {}).get('calificaciones', []))
        })
        
    except Exception as e:
        import traceback
        return JsonResponse({
            'success': False, 
            'error': str(e),
            'traceback': traceback.format_exc()
        }, status=500)