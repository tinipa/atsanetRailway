from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
import json
from partida.models import (
    Entrenamiento, 
    Categoria, 
    Objetivos,
    CategoriaEntrenamiento,
    EntrenamientoObjetivo,
    Sesionentrenamiento
)
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from partida.views import prevent_cache 

# Create your views here.

@login_required
@prevent_cache
def entrenamientos(request):
    # Ordenar por ID descendente (más reciente primero)
    entrenamientos = Entrenamiento.objects.all().order_by('-identrenamiento')
    categorias = Categoria.objects.all()
    objetivos = Objetivos.objects.all()
    
    # Preparar datos de entrenamientos con sus relaciones
    entrenamientos_con_datos = []
    for entrenamiento in entrenamientos:
        # SOLUCIÓN: Convertir bytes a booleano para entrenamientos
        if isinstance(entrenamiento.estado, bytes):
            entrenamiento.estado = entrenamiento.estado != b'\x00'
        elif entrenamiento.estado is None:
            entrenamiento.estado = False
        else:
            entrenamiento.estado = bool(entrenamiento.estado)
        
        # Obtener categorías relacionadas a través de la tabla intermedia
        categorias_relacionadas = Categoria.objects.filter(
            categoriaentrenamiento__fk_entrenamiento=entrenamiento
        )
        
        # Obtener objetivos relacionados (usar la relación ManyToMany definida)
        objetivos_relacionados = Objetivos.objects.filter(
            entrenamientoobjetivo__fk_entrenamiento=entrenamiento,
            estado=1
        )
        
        entrenamientos_con_datos.append({
            'entrenamiento': entrenamiento,
            'categorias': categorias_relacionadas,
            'objetivos': objetivos_relacionados
        })
    
    # Convertir bytes a booleano para todos los objetivos
    for objetivo in objetivos:
        if isinstance(objetivo.estado, bytes):
            objetivo.estado = objetivo.estado != b'\x00'
        elif objetivo.estado is None:
            objetivo.estado = False
        else:
            objetivo.estado = bool(objetivo.estado)
    
    context = {
        'entrenamientos_con_datos': entrenamientos_con_datos,
        'categorias': categorias,
        'objetivos': objetivos,
    }
    
    return render(request, 'entrenamientos.html', context)

@login_required
@require_http_methods(["GET"])
def obtener_entrenamiento(request, id):
    try:
        entrenamiento = get_object_or_404(Entrenamiento, identrenamiento=id)
        
        # Convertir bytes a booleano
        if isinstance(entrenamiento.estado, bytes):
            estado_bool = entrenamiento.estado != b'\x00'
        elif entrenamiento.estado is None:
            estado_bool = False
        else:
            estado_bool = bool(entrenamiento.estado)
        
        # Obtener la primera categoría asociada (para mantener compatibilidad con el frontend)
        categoria_entrenamiento = CategoriaEntrenamiento.objects.filter(
            fk_entrenamiento=entrenamiento
        ).first()
        
        categoria_id = None
        if categoria_entrenamiento and categoria_entrenamiento.fk_categoria:
            categoria_id = categoria_entrenamiento.fk_categoria.idcategoria
        
        # Obtener objetivos relacionados
        objetivos_relacionados = Objetivos.objects.filter(
            entrenamientoobjetivo__fk_entrenamiento=entrenamiento,
            estado=1
        )
        
        objetivos_data = []
        for objetivo in objetivos_relacionados:
            objetivos_data.append({
                'id': objetivo.idobjetivos,  # Corrección: usar 'idobjetivos' en lugar de 'idobjetivo'
                'nom_objetivo': objetivo.nom_objetivo,
                'descripcion': objetivo.descripcion or ''
            })
        
        # Verificar si tiene sesiones asociadas
        tiene_sesiones = Sesionentrenamiento.objects.filter(fk_entrenamiento=entrenamiento).exists()
        sesiones_count = Sesionentrenamiento.objects.filter(fk_entrenamiento=entrenamiento).count()
        
        return JsonResponse({
            'id': entrenamiento.identrenamiento,
            'nom_entrenamiento': entrenamiento.nom_entrenamiento,
            'descripcion': entrenamiento.descripcion or '',
            'estado': estado_bool,
            'categoria_id': categoria_id,
            'objetivos': objetivos_data,
            'tiene_sesiones': tiene_sesiones,
            'sesiones_count': sesiones_count
        })
        
    except Entrenamiento.DoesNotExist:
        return JsonResponse({
            'error': 'Entrenamiento no encontrado'
        }, status=404)
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'error': str(e)
        }, status=500)

@login_required
@require_http_methods(["GET"])
def obtener_objetivos(request):
    """Devuelve todos los objetivos disponibles"""
    try:
        objetivos = Objetivos.objects.filter(estado=1)
        
        objetivos_data = []
        for objetivo in objetivos:
            # Convertir bytes a booleano si es necesario
            if isinstance(objetivo.estado, bytes):
                estado_bool = objetivo.estado != b'\x00'
            else:
                estado_bool = bool(objetivo.estado)
            
            objetivos_data.append({
                'idobjetivos': objetivo.idobjetivos,  # Usar 'idobjetivos'
                'nom_objetivo': objetivo.nom_objetivo,
                'descripcion': objetivo.descripcion or '',
                'estado': estado_bool
            })
        
        return JsonResponse({
            'success': True,
            'objetivos': objetivos_data
        })
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_http_methods(["GET"])
def buscar_objetivos(request):
    """Vista para buscar objetivos mediante AJAX"""
    try:
        query = request.GET.get('q', '').strip()
        
        if not query or len(query) < 2:
            return JsonResponse({
                'objetivos': []
            })
        
        objetivos = Objetivos.objects.filter(
            nom_objetivo__icontains=query,
            estado=1
        )[:10]
        
        objetivos_data = []
        for objetivo in objetivos:
            objetivos_data.append({
                'idobjetivos': objetivo.idobjetivos,  # Usar 'idobjetivos'
                'nom_objetivo': objetivo.nom_objetivo,
                'descripcion': objetivo.descripcion or ''
            })
        
        return JsonResponse({
            'objetivos': objetivos_data
        })
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'error': str(e)
        }, status=500)

@login_required
@require_http_methods(["POST"])
def editar_entrenamiento(request):
    """Edita un entrenamiento existente"""
    try:
        entrenamiento_id = request.POST.get('id_entrenamiento')
        nombre = request.POST.get('nombre', '').strip()
        descripcion = request.POST.get('descripcion', '').strip()
        categoria_id = request.POST.get('categoria')
        
        # Validaciones
        if not entrenamiento_id:
            return JsonResponse({
                'success': False,
                'error': 'ID de entrenamiento no proporcionado'
            }, status=400)
        
        if not nombre:
            return JsonResponse({
                'success': False,
                'error': 'El nombre del entrenamiento es obligatorio'
            }, status=400)
        
        if len(nombre) > 30:
            return JsonResponse({
                'success': False,
                'error': 'El nombre no puede exceder 30 caracteres'
            }, status=400)
        
        if len(descripcion) > 300:
            return JsonResponse({
                'success': False,
                'error': 'La descripción no puede exceder 300 caracteres'
            }, status=400)
        
        if not categoria_id:
            return JsonResponse({
                'success': False,
                'error': 'La categoría es obligatoria'
            }, status=400)
        
        # Obtener el entrenamiento
        entrenamiento = Entrenamiento.objects.get(pk=entrenamiento_id)
        
        # Verificar si tiene sesiones asociadas
        tiene_sesiones = Sesionentrenamiento.objects.filter(
            fk_entrenamiento=entrenamiento
        ).exists()
        
        # Actualizar nombre y descripción (siempre permitido)
        entrenamiento.nom_entrenamiento = nombre
        entrenamiento.descripcion = descripcion
        
        # Solo actualizar categoría y objetivos si NO tiene sesiones
        if not tiene_sesiones:
            # Actualizar categoría
            categoria = Categoria.objects.get(pk=categoria_id)
            
            # Usar update_fields para especificar qué campos actualizar
            entrenamiento.nom_entrenamiento = nombre
            entrenamiento.descripcion = descripcion
            entrenamiento.save(update_fields=['nom_entrenamiento', 'descripcion'])
            
            # Actualizar la relación de categoría
            CategoriaEntrenamiento.objects.filter(
                fk_entrenamiento=entrenamiento
            ).delete()
            
            CategoriaEntrenamiento.objects.create(
                fk_entrenamiento=entrenamiento,
                fk_categoria=categoria
            )
            
            # Actualizar objetivos
            objetivos_ids = []
            for key in request.POST:
                if key.startswith('objetivos['):
                    objetivos_ids.append(request.POST[key])
            
            # Eliminar objetivos actuales
            EntrenamientoObjetivo.objects.filter(
                fk_entrenamiento=entrenamiento
            ).delete()
            
            # Agregar nuevos objetivos
            for objetivo_id in objetivos_ids:
                objetivo = Objetivos.objects.get(pk=objetivo_id)
                EntrenamientoObjetivo.objects.create(
                    fk_entrenamiento=entrenamiento,
                    fk_objetivo=objetivo
                )
        else:
            # Si tiene sesiones, solo actualizar nombre y descripción
            entrenamiento.save(update_fields=['nom_entrenamiento', 'descripcion'])
        
        # Refrescar desde la base de datos
        entrenamiento.refresh_from_db()
        
        return JsonResponse({
            'success': True,
            'message': f'Entrenamiento "{nombre}" actualizado exitosamente'
        })
        
    except Entrenamiento.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Entrenamiento no encontrado'
        }, status=404)
    except Categoria.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Categoría no encontrada'
        }, status=404)
    except Objetivos.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Uno o más objetivos no encontrados'
        }, status=404)
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': f'Error al actualizar el entrenamiento: {str(e)}'
        }, status=500)

@login_required
@require_http_methods(["POST"])
def crear_entrenamiento(request):
    try:
        # Obtener datos del formulario
        nombre = request.POST.get('nombre', '').strip()
        descripcion = request.POST.get('descripcion', '').strip()
        
        # Validaciones básicas
        if not nombre:
            return JsonResponse({
                'success': False,
                'error': 'El nombre del entrenamiento es obligatorio'
            }, status=400)
        
        if len(nombre) > 30:
            return JsonResponse({
                'success': False,
                'error': f'El nombre no puede superar los 30 caracteres. Actual: {len(nombre)}'
            }, status=400)
        
        if len(descripcion) > 300:
            return JsonResponse({
                'success': False,
                'error': f'La descripción no puede superar los 300 caracteres. Actual: {len(descripcion)}'
            }, status=400)
        
        # Obtener categorías seleccionadas
        categorias_ids = []
        for key in request.POST.keys():
            if key.startswith('categorias['):
                categorias_ids.append(request.POST.get(key))
        
        if not categorias_ids:
            return JsonResponse({
                'success': False,
                'error': 'Debe seleccionar al menos una categoría'
            }, status=400)
        
        # Verificar que todas las categorías existen
        categorias = Categoria.objects.filter(pk__in=categorias_ids)
        if categorias.count() != len(categorias_ids):
            return JsonResponse({
                'success': False,
                'error': 'Una o más categorías seleccionadas no son válidas'
            }, status=400)
        
        # Obtener objetivos
        objetivos_ids = []
        for key in request.POST.keys():
            if key.startswith('objetivos['):
                objetivos_ids.append(request.POST.get(key))
        
        if not objetivos_ids:
            return JsonResponse({
                'success': False,
                'error': 'Debe agregar al menos un objetivo'
            }, status=400)
        
        # Verificar que todos los objetivos existen
        objetivos = Objetivos.objects.filter(idobjetivos__in=objetivos_ids)
        if objetivos.count() != len(objetivos_ids):
            return JsonResponse({
                'success': False,
                'error': 'Uno o más objetivos seleccionados no son válidos'
            }, status=400)
        
        # Usar transacción para asegurar integridad de datos
        with transaction.atomic():
            # Crear el entrenamiento
            entrenamiento = Entrenamiento.objects.create(
                nom_entrenamiento=nombre,
                descripcion=descripcion
            )
            
            # Crear relaciones con las categorías seleccionadas
            for categoria_id in categorias_ids:
                categoria = Categoria.objects.get(pk=categoria_id)
                CategoriaEntrenamiento.objects.create(
                    fk_entrenamiento=entrenamiento,
                    fk_categoria=categoria
                )
            
            # Crear las relaciones con los objetivos
            for objetivo_id in objetivos_ids:
                objetivo = Objetivos.objects.get(pk=objetivo_id)
                EntrenamientoObjetivo.objects.create(
                    fk_entrenamiento=entrenamiento,
                    fk_objetivo=objetivo
                )
        
        return JsonResponse({
            'success': True,
            'message': 'Entrenamiento creado exitosamente',
            'entrenamiento_id': entrenamiento.pk,
            'nombre': entrenamiento.nom_entrenamiento,
            'categorias_asignadas': len(categorias_ids)
        })
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': f'Error al crear el entrenamiento: {str(e)}'
        }, status=500)

@login_required
@require_http_methods(["POST"])
def eliminar_entrenamiento(request):
    """Elimina un entrenamiento existente"""
    try:
        # Obtener ID del entrenamiento
        id_entrenamiento = request.POST.get('id_entrenamiento')
        
        if not id_entrenamiento:
            return JsonResponse({
                'success': False,
                'error': 'ID de entrenamiento no proporcionado'
            }, status=400)
        
        # Verificar que el entrenamiento existe
        try:
            entrenamiento = Entrenamiento.objects.get(pk=id_entrenamiento)
        except Entrenamiento.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Entrenamiento no encontrado'
            }, status=404)
        
        # Verificar si el entrenamiento tiene sesiones asociadas
        sesiones_count = Sesionentrenamiento.objects.filter(fk_entrenamiento=entrenamiento).count()
        
        if sesiones_count > 0:
            return JsonResponse({
                'success': False,
                'error': f'No se puede eliminar el entrenamiento porque tiene {sesiones_count} sesión(es) asociada(s)'
            }, status=400)
        
        # Guardar nombre antes de eliminar para el mensaje de éxito
        nombre_entrenamiento = entrenamiento.nom_entrenamiento
        
        # Usar transacción para asegurar integridad de datos
        with transaction.atomic():
            # Eliminar relaciones en tablas intermedias
            CategoriaEntrenamiento.objects.filter(fk_entrenamiento=entrenamiento).delete()
            EntrenamientoObjetivo.objects.filter(fk_entrenamiento=entrenamiento).delete()
            
            # Eliminar el entrenamiento
            entrenamiento.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Entrenamiento "{nombre_entrenamiento}" eliminado correctamente'
        })
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': f'Error al eliminar el entrenamiento: {str(e)}'
        }, status=500)

@login_required
@require_http_methods(["POST"])
def cambiar_estado_entrenamiento(request):
    """Cambia el estado activo/inactivo de un entrenamiento"""
    try:
        entrenamiento_id = request.POST.get('id_entrenamiento')
        nuevo_estado = request.POST.get('estado')
        
        if not entrenamiento_id:
            return JsonResponse({
                'success': False, 
                'error': 'ID de entrenamiento no proporcionado'
            }, status=400)
        
        if nuevo_estado is None:
            return JsonResponse({
                'success': False, 
                'error': 'Estado no proporcionado'
            }, status=400)
        
        # Convertir el estado a booleano
        nuevo_estado = nuevo_estado.lower() in ['true', '1', 'on']
        
        # Obtener el entrenamiento
        entrenamiento = Entrenamiento.objects.get(pk=entrenamiento_id)
        
        # Actualizar el estado
        entrenamiento.estado = nuevo_estado
        entrenamiento.save()
        
        # Refrescar desde DB y convertir bytes si es necesario
        entrenamiento.refresh_from_db()
        
        # Convertir bytes a booleano para la respuesta
        estado_actual = entrenamiento.estado
        if isinstance(estado_actual, bytes):
            estado_actual = estado_actual != b'\x00'
        
        return JsonResponse({
            'success': True,
            'message': f'Estado del entrenamiento actualizado a {"Activo" if estado_actual else "Inactivo"}',
            'nuevo_estado': bool(estado_actual),
            'estado_texto': 'Activo' if estado_actual else 'Inactivo'
        })
        
    except Entrenamiento.DoesNotExist:
        return JsonResponse({
            'success': False, 
            'error': 'Entrenamiento no encontrado'
        }, status=404)
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'success': False, 
            'error': f'Error al cambiar el estado: {str(e)}'
        }, status=500)

@login_required
@require_http_methods(["POST"])
def cambiar_estado_objetivo(request):
    """Cambia el estado activo/inactivo de un objetivo"""
    try:
        objetivo_id = request.POST.get('id_objetivo')
        nuevo_estado = request.POST.get('estado')
        
        if not objetivo_id:
            return JsonResponse({
                'success': False, 
                'error': 'ID de objetivo no proporcionado'
            }, status=400)
        
        if nuevo_estado is None:
            return JsonResponse({
                'success': False, 
                'error': 'Estado no proporcionado'
            }, status=400)
        
        # Convertir el estado a booleano
        nuevo_estado = nuevo_estado.lower() in ['true', '1', 'on']
        
        # Obtener el objetivo
        objetivo = Objetivos.objects.get(pk=objetivo_id)
        
        # Actualizar el estado
        objetivo.estado = nuevo_estado
        objetivo.save()
        
        # Refrescar desde DB y convertir bytes si es necesario
        objetivo.refresh_from_db()
        
        # Convertir bytes a booleano para la respuesta
        estado_actual = objetivo.estado
        if isinstance(estado_actual, bytes):
            estado_actual = estado_actual != b'\x00'
        
        return JsonResponse({
            'success': True,
            'message': f'Estado del objetivo actualizado a {"Activo" if estado_actual else "Inactivo"}',
            'nuevo_estado': bool(estado_actual),
            'estado_texto': 'Activo' if estado_actual else 'Inactivo'
        })
        
    except Objetivos.DoesNotExist:
        return JsonResponse({
            'success': False, 
            'error': 'Objetivo no encontrado'
        }, status=404)
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'success': False, 
            'error': f'Error al cambiar el estado: {str(e)}'
        }, status=500)

@login_required
@require_http_methods(["POST"])
def crear_objetivo(request):
    """Crea un nuevo objetivo"""
    try:
        nombre = request.POST.get('nombre_objetivo', '').strip()
        descripcion = request.POST.get('descripcion_objetivo', '').strip()
        
        # Validaciones básicas
        if not nombre:
            return JsonResponse({
                'success': False,
                'error': 'El nombre del objetivo es obligatorio'
            }, status=400)
        
        if len(nombre) > 30:
            return JsonResponse({
                'success': False,
                'error': f'El nombre no puede superar los 30 caracteres. Actual: {len(nombre)}'
            }, status=400)
        
        if not descripcion:
            return JsonResponse({
                'success': False,
                'error': 'La descripción del objetivo es obligatoria'
            }, status=400)
        
        if len(descripcion) > 300:
            return JsonResponse({
                'success': False,
                'error': f'La descripción no puede superar los 300 caracteres. Actual: {len(descripcion)}'
            }, status=400)
        
        # VALIDACIÓN: Verificar si ya existe un objetivo con ese nombre (case-insensitive)
        objetivo_existente = Objetivos.objects.filter(nom_objetivo__iexact=nombre).first()
        
        if objetivo_existente:
            return JsonResponse({
                'success': False,
                'error': f'Ya existe un objetivo con el nombre "{objetivo_existente.nom_objetivo}". Por favor, usa un nombre diferente.',
                'nombre_existente': objetivo_existente.nom_objetivo
            }, status=400)
        
        # Crear el objetivo
        objetivo = Objetivos.objects.create(
            nom_objetivo=nombre,
            descripcion=descripcion,
            estado=1  # Activo por defecto
        )
        
        # Convertir bytes a booleano para el estado
        if isinstance(objetivo.estado, bytes):
            objetivo.estado = objetivo.estado != b'\x00'
        elif objetivo.estado is None:
            objetivo.estado = False
        else:
            objetivo.estado = bool(objetivo.estado)
        
        return JsonResponse({
            'success': True,
            'message': 'Objetivo creado exitosamente',
            'objetivo': {
                'idobjetivos': objetivo.idobjetivos,
                'nom_objetivo': objetivo.nom_objetivo,
                'descripcion': objetivo.descripcion,
                'estado': objetivo.estado
            }
        })
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': f'Error al crear el objetivo: {str(e)}'
        }, status=500)

@login_required
@require_http_methods(["GET"])
def obtener_objetivo(request, id):
    """Obtiene los datos de un objetivo específico"""
    try:
        objetivo = Objetivos.objects.get(pk=id)
        
        # Convertir bytes a booleano si es necesario
        estado_actual = objetivo.estado
        if isinstance(estado_actual, bytes):
            estado_actual = estado_actual != b'\x00'
        
        # Verificar si tiene calificaciones asociadas
        try:
            from partida.models import CalificacionObjetivos
            total_calificaciones = CalificacionObjetivos.objects.filter(
                id_objetivo=objetivo
            ).count()
        except Exception as e:
            # Si hay error al obtener calificaciones, continuar sin ese dato
            print(f"Error al obtener calificaciones: {e}")
            total_calificaciones = 0
        
        data = {
            'success': True,
            'objetivo': {
                'idobjetivos': objetivo.pk,
                'nom_objetivo': objetivo.nom_objetivo,
                'descripcion': objetivo.descripcion,
                'estado': bool(estado_actual),
                'tiene_calificaciones': total_calificaciones > 0,
                'total_calificaciones': total_calificaciones
            }
        }
        
        return JsonResponse(data)
        
    except Objetivos.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Objetivo no encontrado'
        }, status=404)
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': f'Error al obtener el objetivo: {str(e)}'
        }, status=500)

@login_required
@require_http_methods(["POST"])
def editar_objetivo(request):
    try:
        id_objetivo = request.POST.get('id_objetivo')
        nombre = request.POST.get('nombre_objetivo', '').strip()
        descripcion = request.POST.get('descripcion_objetivo', '').strip()
        
        # Validaciones básicas
        if not id_objetivo:
            return JsonResponse({
                'success': False,
                'error': 'ID del objetivo no especificado'
            }, status=400)
        
        if not nombre:
            return JsonResponse({
                'success': False,
                'error': 'El nombre del objetivo es obligatorio'
            }, status=400)
        
        if len(nombre) > 30:
            return JsonResponse({
                'success': False,
                'error': f'El nombre no puede superar los 30 caracteres. Actual: {len(nombre)}'
            }, status=400)
        
        if not descripcion:
            return JsonResponse({
                'success': False,
                'error': 'La descripción del objetivo es obligatoria'
            }, status=400)
        
        if len(descripcion) > 300:
            return JsonResponse({
                'success': False,
                'error': f'La descripción no puede superar los 300 caracteres. Actual: {len(descripcion)}'
            }, status=400)
        
        # Obtener el objetivo
        objetivo = get_object_or_404(Objetivos, idobjetivos=id_objetivo)
        
        # Verificar si el nuevo nombre ya existe en otro objetivo (case-insensitive)
        objetivo_duplicado = Objetivos.objects.filter(
            nom_objetivo__iexact=nombre
        ).exclude(idobjetivos=id_objetivo).first()
        
        if objetivo_duplicado:
            return JsonResponse({
                'success': False,
                'error': f'Ya existe otro objetivo con el nombre "{objetivo_duplicado.nom_objetivo}"',
                'nombre_existente': objetivo_duplicado.nom_objetivo
            }, status=400)
        
        # Actualizar el objetivo
        objetivo.nom_objetivo = nombre
        objetivo.descripcion = descripcion
        objetivo.save()
        
        # Convertir bytes a booleano para el estado
        if isinstance(objetivo.estado, bytes):
            estado_bool = objetivo.estado != b'\x00'
        elif objetivo.estado is None:
            estado_bool = False
        else:
            estado_bool = bool(objetivo.estado)
        
        return JsonResponse({
            'success': True,
            'message': 'Objetivo actualizado correctamente',
            'objetivo': {
                'idobjetivos': objetivo.idobjetivos,
                'nom_objetivo': objetivo.nom_objetivo,
                'descripcion': objetivo.descripcion,
                'estado': estado_bool
            }
        })
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': f'Error al actualizar el objetivo: {str(e)}'
        }, status=500)

@login_required
@require_http_methods(["GET"])
def verificar_eliminar_objetivo(request, id):
    """Verifica si un objetivo puede ser eliminado"""
    try:
        objetivo = Objetivos.objects.get(pk=id)
        
        # Verificar si tiene calificaciones asociadas
        try:
            from partida.models import CalificacionObjetivos
            total_calificaciones = CalificacionObjetivos.objects.filter(
                id_objetivo=objetivo.idobjetivos
            ).count()
        except Exception as e:
            print(f"Error al verificar calificaciones: {e}")
            total_calificaciones = 0
        
        puede_eliminar = total_calificaciones == 0
        
        return JsonResponse({
            'success': True,
            'puede_eliminar': puede_eliminar,
            'total_calificaciones': total_calificaciones,
            'objetivo': {
                'idobjetivos': objetivo.pk,
                'nom_objetivo': objetivo.nom_objetivo
            }
        })
        
    except Objetivos.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Objetivo no encontrado'
        }, status=404)
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': f'Error al verificar el objetivo: {str(e)}'
        }, status=500)

@login_required
@require_http_methods(["POST"])
def eliminar_objetivo(request):
    """Elimina un objetivo si no tiene calificaciones asociadas"""
    try:
        objetivo_id = request.POST.get('id_objetivo')
        
        if not objetivo_id:
            return JsonResponse({
                'success': False,
                'error': 'ID de objetivo no proporcionado'
            }, status=400)
        
        # Obtener el objetivo
        objetivo = Objetivos.objects.get(pk=objetivo_id)
        
        # Verificar nuevamente si tiene calificaciones
        try:
            from partida.models import CalificacionObjetivos
            total_calificaciones = CalificacionObjetivos.objects.filter(
                id_objetivo=objetivo.idobjetivos
            ).count()
        except Exception as e:
            print(f"Error al verificar calificaciones: {e}")
            total_calificaciones = 0
        
        if total_calificaciones > 0:
            return JsonResponse({
                'success': False,
                'error': f'No se puede eliminar el objetivo porque tiene {total_calificaciones} calificación(es) asociada(s)'
            }, status=400)
        
        # Guardar nombre antes de eliminar
        nombre_objetivo = objetivo.nom_objetivo
        
        # Usar transacción para asegurar integridad
        with transaction.atomic():
            # Eliminar relaciones con entrenamientos
            EntrenamientoObjetivo.objects.filter(fk_objetivo=objetivo).delete()
            
            # Eliminar el objetivo
            objetivo.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Objetivo "{nombre_objetivo}" eliminado correctamente'
        })
        
    except Objetivos.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Objetivo no encontrado'
        }, status=404)
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': f'Error al eliminar el objetivo: {str(e)}'
        }, status=500)
