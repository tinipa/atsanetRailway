from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.models import User
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from partida.models import PersonalT, Persona, Categoria, JornadaEntrenamientos, PersonalJornadaCategoria
from partida.views import prevent_cache 


# Create your views here.
#Funcion para la pagina de entrenadores.html
@login_required
@prevent_cache
def entrenador(request):
    # Endpoints adicionales AJAX para puntajes y mejores postulantes
    if request.method == 'GET':
        is_ajax_generic = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        # Puntajes de postulantes
        if request.GET.get('puntajes_postulantes') and is_ajax_generic:
            from partida.models import PersonalTHabilidad
            postulantes_qs = PersonalT.objects.select_related('fk_persona').filter(postulante=True)
            data = []
            for p in postulantes_qs:
                exp = p.experiencia or 0
                num_hab = PersonalTHabilidad.objects.filter(fk_personal=p).count()
                puntos_exp = exp * 10
                puntos_hab = num_hab * 5
                data.append({
                    'persona_pk': p.fk_persona.id,
                    'id_persona': p.fk_persona.id_persona,
                    'nombres': f"{p.fk_persona.nom1_persona} {p.fk_persona.nom2_persona or ''}".strip(),
                    'apellidos': f"{p.fk_persona.ape1_persona} {p.fk_persona.ape2_persona or ''}".strip(),
                    'experiencia': exp,
                    'habilidades': num_hab,
                    'puntos_experiencia': puntos_exp,
                    'puntos_habilidades': puntos_hab,
                    'total': puntos_exp + puntos_hab,
                })
            return JsonResponse({'success': True, 'puntajes': data})
        # Mejores opciones (filtro)
        if request.GET.get('mejores_postulantes') and is_ajax_generic:
            from partida.models import PersonalTHabilidad
            candidatos = []
            postulantes_qs = PersonalT.objects.select_related('fk_persona').filter(postulante=True)
            for p in postulantes_qs:
                exp = p.experiencia or 0
                num_hab = PersonalTHabilidad.objects.filter(fk_personal=p).count()
                # Nuevo criterio: exp>=4 OR num_hab>=4
                if exp >= 4 or num_hab >= 4:
                    cumple_exp = exp >= 4
                    cumple_hab = num_hab >= 4
                    if cumple_exp and cumple_hab:
                        mensaje = 'Cumple años y habilidades'
                    elif cumple_exp and not cumple_hab:
                        mensaje = 'Cumple años pero NO habilidades'
                    elif cumple_hab and not cumple_exp:
                        mensaje = 'Cumple habilidades pero NO años'
                    else:
                        mensaje = 'Parcial'
                    candidatos.append({
                        'persona_pk': p.fk_persona.id,
                        'id_persona': p.fk_persona.id_persona,
                        'nombres': f"{p.fk_persona.nom1_persona} {p.fk_persona.nom2_persona or ''}".strip(),
                        'apellidos': f"{p.fk_persona.ape1_persona} {p.fk_persona.ape2_persona or ''}".strip(),
                        'experiencia': exp,
                        'habilidades': num_hab,
                        'cumple_experiencia': cumple_exp,
                        'cumple_habilidades': cumple_hab,
                        'mensaje': mensaje,
                    })
            return JsonResponse({'success': True, 'mejores': candidatos})
    # Endpoint AJAX para obtener habilidades de un postulante
    if request.method == 'GET' and request.GET.get('obtener_habilidades'):
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        if is_ajax:
            from partida.models import PersonalTHabilidad
            persona_pk = request.GET.get('obtener_habilidades')
            print(f"DEBUG: Buscando habilidades para persona_pk={persona_pk}")
            try:
                # La tabla personal_t_habilidad tiene fk_personal que apunta a personal_t(fk_persona)
                # y fk_persona es Persona.id (PK interno). Buscar por fk_personal_id.
                habilidades = PersonalTHabilidad.objects.filter(
                    fk_personal_id=persona_pk
                ).select_related('fk_habilidad')
                
                print(f"DEBUG: Query: PersonalTHabilidad.objects.filter(fk_personal_id={persona_pk})")
                print(f"DEBUG: Se encontraron {habilidades.count()} habilidades")
                
                habilidades_list = [h.fk_habilidad.descripcion for h in habilidades]
                print(f"DEBUG: Habilidades: {habilidades_list}")
                
                return JsonResponse({'success': True, 'habilidades': habilidades_list})
            except Exception as e:
                import traceback
                print(f"DEBUG ERROR: {str(e)}")
                print(traceback.format_exc())
                return JsonResponse({'success': False, 'message': f'Error: {str(e)}'})
    
    # Si el formulario de edición envía datos, procesarlos
    if request.method == 'POST':
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        # Manejo de edición de jornadas
        accion_jornada = request.POST.get('accion_jornada')
        
        if accion_jornada == 'editar':
            asignacion_id = request.POST.get('asignacion_id')
            categoria_id = request.POST.get('categoria')
            jornada_id = request.POST.get('jornada')
            
            if asignacion_id and categoria_id and jornada_id:
                try:
                    asignacion = PersonalJornadaCategoria.objects.get(id=asignacion_id)
                    categoria = Categoria.objects.get(idcategoria=categoria_id)
                    jornada = JornadaEntrenamientos.objects.get(idjornada=jornada_id)
                    
                    # Verificar si ya existe otra asignación con la misma combinación
                    existe = PersonalJornadaCategoria.objects.filter(
                        fk_categoria=categoria,
                        fk_jornada=jornada,
                        fk_personal=asignacion.fk_personal
                    ).exclude(id=asignacion_id).exists()
                    
                    if existe:
                        if is_ajax:
                            return JsonResponse({'success': False, 'message': 'Ya existe una asignación con esta combinación.'})
                        else:
                            messages.warning(request, 'Ya existe una asignación con esta combinación.')
                            return redirect('entrenador')
                    else:
                        # Actualizar la asignación
                        asignacion.fk_categoria = categoria
                        asignacion.fk_jornada = jornada
                        asignacion.save()
                        if is_ajax:
                            return JsonResponse({'success': True, 'message': 'Jornada actualizada correctamente.'})
                        else:
                            messages.success(request, 'Jornada actualizada correctamente.')
                            return redirect('entrenador')
                except Exception as e:
                    if is_ajax:
                        return JsonResponse({'success': False, 'message': f'Error al actualizar la asignación: {e}'})
                    else:
                        messages.error(request, f'Error al actualizar la asignación: {e}')
                        return redirect('entrenador')
            else:
                if is_ajax:
                    return JsonResponse({'success': False, 'message': 'Faltan datos para actualizar la jornada.'})
                else:
                    messages.error(request, 'Faltan datos para actualizar la jornada.')
                    return redirect('entrenador')
        
        # Manejo de eliminación de jornadas
        if accion_jornada == 'eliminar':
            asignacion_id = request.POST.get('asignacion_id')
            
            if asignacion_id:
                try:
                    asignacion = PersonalJornadaCategoria.objects.get(id=asignacion_id)
                    # Guardar información para el mensaje antes de eliminar
                    entrenador_nombre = f"{asignacion.fk_personal.fk_persona.nom1_persona} {asignacion.fk_personal.fk_persona.ape1_persona}"
                    categoria_nombre = asignacion.fk_categoria.nom_categoria
                    jornada_info = f"{asignacion.fk_jornada.dia_jornada}"
                    
                    # Eliminar la asignación
                    asignacion.delete()
                    
                    if is_ajax:
                        return JsonResponse({
                            'success': True, 
                            'message': f'Jornada eliminada correctamente para {entrenador_nombre}.'
                        })
                    else:
                        messages.success(request, f'Jornada eliminada correctamente para {entrenador_nombre}.')
                        return redirect('entrenador')
                except PersonalJornadaCategoria.DoesNotExist:
                    if is_ajax:
                        return JsonResponse({'success': False, 'message': 'No se encontró la asignación a eliminar.'})
                    else:
                        messages.error(request, 'No se encontró la asignación a eliminar.')
                        return redirect('entrenador')
                except Exception as e:
                    import traceback
                    traceback.print_exc()
                    if is_ajax:
                        return JsonResponse({'success': False, 'message': f'Error al eliminar: {str(e)}'})
                    else:
                        messages.error(request, f'Error al eliminar: {str(e)}')
                        return redirect('entrenador')
            else:
                if is_ajax:
                    return JsonResponse({'success': False, 'message': 'Falta el ID de la asignación a eliminar.'})
                else:
                    messages.error(request, 'Falta el ID de la asignación a eliminar.')
                    return redirect('entrenador')
        
        # Manejo de creación de jornadas
        if accion_jornada == 'crear':
            categoria_id = request.POST.get('categoria')
            jornada_id = request.POST.get('jornada')
            entrenador_id = request.POST.get('entrenador')
            
            if categoria_id and jornada_id and entrenador_id:
                try:
                    categoria = Categoria.objects.get(idcategoria=categoria_id)
                    jornada = JornadaEntrenamientos.objects.get(idjornada=jornada_id)
                    # Obtener el PersonalT usando el id_persona enviado del frontend
                    persona = Persona.objects.get(id_persona=entrenador_id)
                    personal = PersonalT.objects.get(fk_persona=persona)
                    
                    # Verificar si ya existe esta asignación
                    existe = PersonalJornadaCategoria.objects.filter(
                        fk_categoria=categoria,
                        fk_jornada=jornada,
                        fk_personal=personal
                    ).exists()
                    
                    if existe:
                        if is_ajax:
                            return JsonResponse({'success': False, 'message': 'Esta asignación ya existe.'})
                        else:
                            messages.warning(request, 'Esta asignación ya existe.')
                            return redirect('entrenador')
                    else:
                        # Crear la asignación
                        nueva_asignacion = PersonalJornadaCategoria.objects.create(
                            fk_categoria=categoria,
                            fk_jornada=jornada,
                            fk_personal=personal
                        )
                        
                        if is_ajax:
                            return JsonResponse({'success': True, 'message': 'Jornada asignada correctamente.'})
                        else:
                            messages.success(request, 'Jornada asignada correctamente.')
                            return redirect('entrenador')
                except Persona.DoesNotExist:
                    error_msg = f'No se encontró la persona con ID {entrenador_id}'
                    if is_ajax:
                        return JsonResponse({'success': False, 'message': error_msg})
                    else:
                        messages.error(request, error_msg)
                        return redirect('entrenador')
                except PersonalT.DoesNotExist:
                    error_msg = f'No se encontró el registro de personal para el entrenador seleccionado'
                    if is_ajax:
                        return JsonResponse({'success': False, 'message': error_msg})
                    else:
                        messages.error(request, error_msg)
                        return redirect('entrenador')
                except Categoria.DoesNotExist:
                    error_msg = 'No se encontró la categoría seleccionada'
                    if is_ajax:
                        return JsonResponse({'success': False, 'message': error_msg})
                    else:
                        messages.error(request, error_msg)
                        return redirect('entrenador')
                except JornadaEntrenamientos.DoesNotExist:
                    error_msg = 'No se encontró la jornada seleccionada'
                    if is_ajax:
                        return JsonResponse({'success': False, 'message': error_msg})
                    else:
                        messages.error(request, error_msg)
                        return redirect('entrenador')
                except Exception as e:
                    import traceback
                    traceback.print_exc()  # Imprimir el error completo en consola
                    error_msg = f'Error al crear la asignación: {str(e)}'
                    if is_ajax:
                        return JsonResponse({'success': False, 'message': error_msg})
                    else:
                        messages.error(request, error_msg)
                        return redirect('entrenador')
            else:
                if is_ajax:
                    return JsonResponse({'success': False, 'message': 'Debe seleccionar categoría, jornada y entrenador.'})
                else:
                    messages.error(request, 'Debe seleccionar categoría, jornada y entrenador.')
                    return redirect('entrenador')
        
        # Manejo rápido de acciones sobre postulantes: aceptar/rechazar
        accion_post = request.POST.get('accion_postulante')
        if accion_post and request.POST.get('id'):
            id_persona = request.POST.get('id')
            try:
                persona = Persona.objects.get(id_persona=id_persona)
            except Persona.DoesNotExist:
                if is_ajax:
                    return JsonResponse({'success': False, 'message': 'Persona no encontrada'})
                else:
                    messages.error(request, 'Persona no encontrada')
                    return redirect('entrenador')

            try:
                personalt = persona.personalt
            except PersonalT.DoesNotExist:
                if is_ajax:
                    return JsonResponse({'success': False, 'message': 'Registro de personal no encontrado'})
                else:
                    messages.error(request, 'Registro de personal no encontrado')
                    return redirect('entrenador')

            if accion_post == 'aceptar':
                personalt.postulante = False
                personalt.tipo_personal = 'Entrenador'
                personalt.estado = True
                personalt.save()
                
                # Enviar correo de aceptación
                try:
                    nombre_completo = f"{persona.nom1_persona} {persona.nom2_persona or ''} {persona.ape1_persona} {persona.ape2_persona or ''}".strip()
                    nombre_completo = ' '.join(nombre_completo.split())  # Eliminar espacios extras
                    
                    html_message = render_to_string('emails/postulante_aceptado.html', {
                        'nombre_completo': nombre_completo,
                    })
                    plain_message = strip_tags(html_message)
                    
                    send_mail(
                        subject='¡Bienvenido al Equipo! - Club Deportivo Atlético Santander',
                        message=plain_message,
                        from_email=None,  # Usará DEFAULT_FROM_EMAIL
                        recipient_list=[persona.email_persona],
                        html_message=html_message,
                        fail_silently=False,
                    )
                except Exception as e:
                    print(f"Error al enviar correo de aceptación: {e}")
                    # No fallar la operación si el correo falla
                
                if is_ajax:
                    return JsonResponse({'success': True, 'action': 'aceptar', 'id_persona': id_persona, 'message': 'Postulante aceptado correctamente'})
                else:
                    messages.success(request, 'Postulante aceptado correctamente')
                    return redirect('entrenador')
            elif accion_post == 'rechazar':
                # Borrado lógico: marcar como NO postulante y estado inactivo
                # No eliminamos el registro de la base de datos
                personalt.postulante = False  # Ya no es postulante (0)
                personalt.estado = False       # Estado inactivo (0)
                personalt.tipo_personal = ''   # Limpiar tipo para que no aparezca en entrenadores
                personalt.save()
                
                # Enviar correo de rechazo
                try:
                    nombre_completo = f"{persona.nom1_persona} {persona.nom2_persona or ''} {persona.ape1_persona} {persona.ape2_persona or ''}".strip()
                    nombre_completo = ' '.join(nombre_completo.split())  # Eliminar espacios extras
                    
                    html_message = render_to_string('emails/postulante_rechazado.html', {
                        'nombre_completo': nombre_completo,
                    })
                    plain_message = strip_tags(html_message)
                    
                    send_mail(
                        subject='Resultado de tu Postulación - Club Deportivo Atlético Santander',
                        message=plain_message,
                        from_email=None,  # Usará DEFAULT_FROM_EMAIL
                        recipient_list=[persona.email_persona],
                        html_message=html_message,
                        fail_silently=False,
                    )
                except Exception as e:
                    print(f"Error al enviar correo de rechazo: {e}")
                    # No fallar la operación si el correo falla
                
                if is_ajax:
                    return JsonResponse({
                        'success': True, 
                        'action': 'rechazar', 
                        'id_persona': id_persona, 
                        'message': 'Postulante rechazado correctamente'
                    })
                else:
                    messages.success(request, 'Postulante rechazado correctamente')
                    return redirect('entrenador')

        # identificador de persona (id_persona) enviado en el input name="id"
        id_persona = request.POST.get('id')
        if id_persona:
            try:
                persona = Persona.objects.get(id_persona=id_persona)
            except Persona.DoesNotExist:
                messages.error(request, 'Persona no encontrada')
                return redirect('entrenador')

            # Campos editables: nombres, apellidos, genero, datos de contacto y fisicos
            persona.nom1_persona = request.POST.get('nom1_persona', persona.nom1_persona)
            # Sólo actualizar segundo nombre si el campo viene en el POST
            if 'nom2_persona' in request.POST:
                persona.nom2_persona = request.POST.get('nom2_persona') or None
            persona.ape1_persona = request.POST.get('ape1_persona', persona.ape1_persona)
            # Sólo actualizar segundo apellido si el campo viene en el POST
            if 'ape2_persona' in request.POST:
                persona.ape2_persona = request.POST.get('ape2_persona') or None
            # No sobrescribimos tipo_identidad ni id_persona ni fecha_nacimiento (son no editables)
            genero = request.POST.get('genero')
            if genero:
                persona.genero = genero[0]
            # Datos fisicos y contacto
            eps = request.POST.get('eps')
            if eps:
                persona.eps = eps
            rhs = request.POST.get('rhs')
            if rhs:
                persona.rh = rhs
            direc = request.POST.get('direc_persona')
            if direc is not None:
                persona.direc_persona = direc
            tel = request.POST.get('tel_persona')
            if tel:
                try:
                    persona.tel_persona = int(tel)
                except ValueError:
                    # mantener el anterior si no es numérico
                    pass
            email = request.POST.get('email_persona')
            if email is not None:
                try:
                    validate_email(email)
                except ValidationError:
                    messages.error(request, 'Correo electrónico inválido.')
                    return redirect('entrenador')
                persona.email_persona = email

            persona.save()

            # Detectar si es petición AJAX
            is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'

            # Actualizar tipo_personal en PersonalT si se envió
            tipo_personal_req = request.POST.get('tipo_personal')
            if tipo_personal_req:
                try:
                    personalt = persona.personalt
                    personalt.tipo_personal = tipo_personal_req
                except PersonalT.DoesNotExist:
                    # crear registro si no existe
                    personalt = PersonalT(fk_persona=persona, tipo_personal=tipo_personal_req)
                personalt.save()
                # si existe usuario vinculado, actualizar is_staff según rol
                if persona.user:
                    try:
                        user = persona.user
                        user.is_staff = (tipo_personal_req == 'Administrador')
                        user.save()
                    except Exception:
                        pass
                
                # Si es AJAX y solo se envió tipo_personal, responder JSON
                if is_ajax and not request.POST.get('nom1_persona'):
                    return JsonResponse({'success': True, 'message': 'Rol actualizado correctamente'})

            # Actualizar estado en PersonalT si se envió (desde el switch toggle)
            estado_req = request.POST.get('estado')
            if estado_req is not None:
                try:
                    personalt = persona.personalt
                    personalt.estado = bool(int(estado_req))
                except PersonalT.DoesNotExist:
                    # crear registro si no existe
                    personalt = PersonalT(fk_persona=persona, estado=bool(int(estado_req)))
                personalt.save()
                
                # Si es AJAX y solo se envió estado, responder JSON
                if is_ajax and not request.POST.get('nom1_persona'):
                    return JsonResponse({'success': True, 'message': 'Estado actualizado correctamente'})

            messages.success(request, 'Datos guardados correctamente')
            
            # Si es AJAX (edición completa desde modal), responder JSON
            if is_ajax:
                return JsonResponse({'success': True, 'message': 'Datos guardados correctamente'})
            
            return redirect('entrenador')

    # GET: Listar tanto Administradores como Entrenadores 
    # Excluir postulantes activos (postulante=True) 
    # Y excluir postulantes rechazados (postulante=False AND tipo_personal no es Entrenador ni Administrador)
    # Mostrar entrenadores/admin activos e inactivos (toggle on/off)
    personales = PersonalT.objects.select_related('fk_persona').filter(
        postulante=False
    ).filter(
        tipo_personal__in=['Entrenador', 'Administrador']
    )
    
    rol = request.GET.get('rol')
    if rol == 'Entrenador':
        personales = personales.filter(tipo_personal='Entrenador')
    elif rol == 'Administrador':
        personales = personales.filter(tipo_personal='Administrador')

    q = request.GET.get('q','').strip()
    if q:
        personales = personales.filter(
            Q(fk_persona__nom1_persona__icontains=q) |
            Q(fk_persona__nom2_persona__icontains=q) |
            Q(fk_persona__ape1_persona__icontains=q) |
            Q(fk_persona__ape2_persona__icontains=q) |
            Q(fk_persona__email_persona__icontains=q)
        )
    # Listar postulantes por separado (búsqueda sólo por nombres/apellidos con parámetro independiente q_post)
    postulantes = PersonalT.objects.select_related('fk_persona').filter(postulante=True)
    q_post = request.GET.get('q_post','').strip()
    if q_post:
        postulantes = postulantes.filter(
            Q(fk_persona__nom1_persona__icontains=q_post) |
            Q(fk_persona__nom2_persona__icontains=q_post) |
            Q(fk_persona__ape1_persona__icontains=q_post) |
            Q(fk_persona__ape2_persona__icontains=q_post)
        )
    
    # Obtener datos para la sección de Jornadas
    categorias = Categoria.objects.all()
    jornadas = JornadaEntrenamientos.objects.all()
    entrenadores = PersonalT.objects.select_related('fk_persona').filter(
        tipo_personal='Entrenador',
        estado=True,
        postulante=False
    )
    # Solo mostrar asignaciones de entrenadores activos (no administradores)
    asignaciones = PersonalJornadaCategoria.objects.select_related(
        'fk_personal__fk_persona',
        'fk_jornada',
        'fk_categoria'
    ).filter(
        fk_personal__estado=True,
        fk_personal__tipo_personal='Entrenador'
    ).all()
    
    # Agrupar asignaciones por entrenador con contador de jornadas
    from collections import defaultdict
    entrenadores_asignaciones = defaultdict(lambda: {'entrenador': None, 'asignaciones': []})
    
    for asignacion in asignaciones:
        entrenador_id = asignacion.fk_personal.fk_persona.id_persona
        entrenadores_asignaciones[entrenador_id]['entrenador'] = asignacion.fk_personal
        entrenadores_asignaciones[entrenador_id]['asignaciones'].append(asignacion)
    
    # Convertir a lista para el template
    entrenadores_con_jornadas = []
    for entrenador_id, data in entrenadores_asignaciones.items():
        entrenadores_con_jornadas.append({
            'entrenador': data['entrenador'],
            'num_jornadas': len(data['asignaciones']),
            'asignaciones': data['asignaciones']
        })
    
    # Preparar datos JSON para JavaScript (evitar errores de linting)
    import json
    asignaciones_json = {}
    for item in entrenadores_con_jornadas:
        entrenador_id = item['entrenador'].fk_persona.id_persona
        asignaciones_json[str(entrenador_id)] = []
        for asig in item['asignaciones']:
            asignaciones_json[str(entrenador_id)].append({
                'id': asig.id,
                'categoria_id': asig.fk_categoria.idcategoria,
                'categoria_nombre': asig.fk_categoria.nom_categoria,
                'jornada_id': asig.fk_jornada.idjornada,
                'jornada_dia': asig.fk_jornada.dia_jornada,
                'jornada_hora': f"{asig.fk_jornada.hora_entrada.strftime('%I:%M%p').lower()}-{asig.fk_jornada.hora_salida.strftime('%I:%M%p').lower()}"
            })
    
    context = {
        'personales': personales,
        'postulantes': postulantes,
        'categorias': categorias,
        'jornadas': jornadas,
        'entrenadores': entrenadores,
        'entrenadores_con_jornadas': entrenadores_con_jornadas,
        'asignaciones_json': json.dumps(asignaciones_json),
    }
    return render(request, 'entrenadores.html', context)






























def crearUsuari(request):
    if request.method == 'GET':
        return render(request, 'crearUsuario.html')
    else:
        if request.POST['password1'] == request.POST['password2']:
            try:
                user = User.objects.create_user(
                username = request.POST['username'],
                password = request.POST['password1'])
                user.save()
                login(request, user)
                return redirect('entrenadores.html')
            except:
                return render(request, 'crearUsuario', {
                    'mensaje': 'usuario ya existe'
                } )
        else:
            return render(request, 'crearUsuario', {
                'mensaje': 'Las contraseñas no conciden'
            } )
