import os
# Views de la aplicación partida - Sistema de entrenadores
from django.shortcuts import render, redirect
from django.contrib.auth.forms import AuthenticationForm
from django.contrib import messages
from django.contrib.auth import login, authenticate
from django.contrib.auth import logout as django_logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.conf import settings
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.core.exceptions import ValidationError
from django.views.decorators.http import require_http_methods
from django.views.decorators.cache import never_cache
from django.views.decorators.vary import vary_on_headers
from datetime import date, timedelta
from .models import Persona, Acudiente, Alumno, Posicion, TokenRecuperacion
from .other import obtener_informacion
import datetime
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.contrib.auth.hashers import make_password
from django.db import transaction

# Create your views here.
def prevent_cache(view_func):
    """Decorator para prevenir cache en las vistas"""
    @vary_on_headers('Cookie')
    @never_cache
    def wrapped_view(request, *args, **kwargs):
        response = view_func(request, *args, **kwargs)
        
        # Headers adicionales para prevenir cache
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        
        return response
    return wrapped_view

#Funcion de la pagina index.html
def index(request):
    return render(request, 'index.html')

#Funcion de la pagina iniciosesion.html
def iniciosesion(request):
    if request.method == 'GET':
        if request.GET.get('next'):
            messages.warning(request, 'Debes iniciar sesión para acceder a esa página')
        return render(request, 'iniciosesion.html', {
            'form': AuthenticationForm
        })
    
    else:
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')

        try:
            # Verificar si el usuario existe
            persona = Persona.objects.get(id_persona=username)
            
            # Verificar si tiene PersonalT
            if not hasattr(persona, 'personalt'):
                messages.error(request, "Usuario o contraseña incorrectos")
                return render(request, 'iniciosesion.html', {'form': AuthenticationForm})
            
            personalt = persona.personalt
            
            # Verificar estado de postulante rechazado
            if personalt.estado_proceso == 'rechazado':
                messages.error(request, "Usuario o contraseña incorrectos")
                return render(request, 'iniciosesion.html', {'form': AuthenticationForm})

            # Verificar si está inactivo (pero no rechazado)
            if not personalt.estado:
                messages.error(request, "Tu cuenta está deshabilitada. Contacta al administrador")
                return render(request, 'iniciosesion.html', {'form': AuthenticationForm})

            # Verificar contraseña contra PersonalT (más confiable que Django User)
            # porque Django User puede no estar sincronizado después de cambiar rol
            if personalt.contrasena != password:
                messages.error(request, "Usuario o contraseña incorrectos")
                return render(request, 'iniciosesion.html', {'form': AuthenticationForm})
            
            # Si existe usuario Django, intentar autenticar con él
            # Si no existe, crearlo para la sesión
            user = persona.user
            if user is None:
                # Crear usuario Django si no existe
                from django.contrib.auth.models import User
                user = User.objects.create_user(
                    username=str(persona.id_persona),
                    password=password
                )
                persona.user = user
                persona.save()
            else:
                # Actualizar contraseña en Django User si cambió
                if not user.check_password(password):
                    user.set_password(password)
                    user.save()
                
                # Asegurar que está activo
                if not user.is_active:
                    user.is_active = True
                    user.save()
            
            # Login exitoso
            login(request, user)
            messages.success(request, f"👋 ¡Bienvenido/a {persona.nom1_persona}!")
            
            # Redirigir según el tipo de usuario
            next_url = request.GET.get('next', 'usuarios')
            return redirect(next_url)
                
        except Persona.DoesNotExist:
            messages.error(request, "Usuario o contraseña incorrectos")
            return render(request, 'iniciosesion.html', {'form': AuthenticationForm})
        except Exception as e:
            print(f"Error en login: {e}")
            messages.error(request, "Usuario o contraseña incorrectos")
            return render(request, 'iniciosesion.html', {'form': AuthenticationForm})


#Funcion para llevar toda la informacion de la sesion en usuario.html
@login_required
@prevent_cache
def usuario (request):
    info_u = obtener_informacion(request.user)
    return render(request, 'usuario.html', {
        'info_u': info_u,
    })
    
    
@login_required
@require_http_methods(["GET", "POST"])
def cerrar_sesion(request):
    try:
        # Información para el mensaje
        if hasattr(request.user, 'persona'):
            nombre_usuario = f"{request.user.persona.nom1_persona} {request.user.persona.ape1_persona}"
        else:
            nombre_usuario = request.user.username
        
        # Registrar el cierre de sesión (opcional, para logs)
        print(f"Sesión cerrada para {nombre_usuario} - {datetime.datetime.now()}")
        
        # Cerrar sesión
        django_logout(request)
        
        # Mensaje de despedida
        messages.success(request, f"{nombre_usuario}! Sesión cerrada correctamente")
        
    except Exception as e:
        # En caso de error, igual cerrar sesión pero sin mensaje personalizado
        django_logout(request)
        messages.info(request, "Sesión cerrada")
    
    return redirect('index')

#Funcion para guardar archivos
def guardar_archivo(file_obj, carpeta, id_persona):
    if file_obj:
        # Validar tamaño del archivo (máximo 5MB)
        if file_obj.size > 5 * 1024 * 1024:
            raise ValidationError(f"El archivo {file_obj.name} es demasiado grande. Máximo 5MB permitido.")
        
        extension = file_obj.name.split('.')[-1].lower()
        nuevo_nombre = f"{id_persona}.{extension}"
        ruta_completa = os.path.join(settings.MEDIA_ROOT, carpeta, nuevo_nombre)
        os.makedirs(os.path.dirname(ruta_completa), exist_ok=True)
        with open(ruta_completa, 'wb+') as destino:
            for chunk in file_obj.chunks():
                destino.write(chunk)
        return f"{carpeta}/{nuevo_nombre}"
    return None

def validar_documento_alumno(request):
    """Validar en tiempo real si un documento ya está matriculado"""
    if request.method == 'GET' and 'documento' in request.GET:
        documento = request.GET.get('documento')
        
        if not documento or not documento.isdigit():
            return JsonResponse({'valido': False, 'mensaje': 'Documento inválido'})
        
        try:
            # Verificar si existe persona con ese documento
            persona = Persona.objects.filter(id_persona=documento).first()
            
            if persona:
                # Verificar si ya está matriculado como alumno activo
                alumno_activo = Alumno.objects.filter(
                    fk_persona_alumno=persona, 
                    estado_alumno=True
                ).first()
                
                if alumno_activo:
                    return JsonResponse({
                        'valido': False, 
                        'mensaje': f'❌ El documento {documento} ya está matriculado activamente',
                        'existe': True
                    })
                else:
                    # Verificar si existe como alumno inactivo
                    alumno_inactivo = Alumno.objects.filter(
                        fk_persona_alumno=persona,
                        estado_alumno=False
                    ).first()
                    
                    if alumno_inactivo:
                        return JsonResponse({
                            'valido': True, 
                            'mensaje': f'⚠️ Este documento existe pero está inactivo. Puedes actualizar la información.',
                            'existe': True,
                            'postulante': alumno_inactivo.postulante
                        })
                    else:
                        return JsonResponse({
                            'valido': True, 
                            'mensaje': '✅ Documento disponible para registro',
                            'existe': False
                        })
            else:
                return JsonResponse({
                    'valido': True, 
                    'mensaje': '✅ Documento disponible para nuevo registro',
                    'existe': False
                })
                
        except Exception as e:
            return JsonResponse({'valido': False, 'mensaje': f'Error: {str(e)}'})
    
    return JsonResponse({'valido': False, 'mensaje': 'Solicitud inválida'})


from django.db import transaction  # IMPORTANTE: Agrega esto al inicio con los demás imports

def formAlumno(request):
    posiciones = Posicion.objects.all()
    # Filtrar TI (Tarjeta de Identidad) para evitar selección de menores
    tipos_identidad = Persona._meta.get_field('tipo_identidad').choices
    generos = Persona._meta.get_field('genero').choices
    eps = Persona._meta.get_field('eps').choices
    tipos_sangre = Persona._meta.get_field('rh').choices
    parentescos = Acudiente._meta.get_field('parentesco').choices
    talla_ropa = Alumno._meta.get_field('talla').choices
    pie_dom = Alumno._meta.get_field('pie_dominante').choices

    # Calcular fechas límite para edad (4-20 años)
    hoy = date.today()
    fecha_minima = hoy - timedelta(days=20*365)  # 20 años atrás
    fecha_maxima = hoy - timedelta(days=4*365)   # 4 años atrás

    if request.method == 'GET':
        return render(request, 'formAlumno.html', {
            'posiciones': posiciones,
            'tipos_identidad': tipos_identidad,
            'generos': generos,
            'eps': eps,
            'tipos_sangre': tipos_sangre,
            'parentescos': parentescos,
            'talla_ropa': talla_ropa,
            'pie_dom': pie_dom,
            'fecha_minima': fecha_minima,
            'fecha_maxima': fecha_maxima,
        })

    else:  # POST - Procesar formulario
        # USAMOS TRANSACCIÓN ATÓMICA PARA GARANTIZAR QUE TODO SE GUARDE O NADA
        with transaction.atomic():
            try:
                # VALIDACIONES INICIALES
                id_persona = request.POST.get('id_persona', '').strip()
                if not id_persona or not id_persona.isdigit():
                    messages.error(request, "El número de identificación debe contener solo números")
                    return redirect('formAlumno')
                
                # Limitar a máximo 10 dígitos para cédulas colombianas
                if len(id_persona) > 10:
                    messages.error(request, "El número de identificación no puede tener más de 10 dígitos")
                    return redirect('formAlumno')

                # Validar que el número no sea demasiado grande para IntegerField
                id_numero = int(id_persona)
                if id_numero > 2147483647:  #Límite máximo de IntegerField
                    messages.error(request, "El número de identificación es demasiado grande")
                    return redirect('formAlumno')
                
                # VALIDACIÓN CRÍTICA: Verificar si el alumno ya está matriculado activamente
                try:
                    persona_existente = Persona.objects.get(id_persona=id_persona)
                    alumno_activo = Alumno.objects.filter(
                        fk_persona_alumno=persona_existente, 
                        estado_alumno=True
                    ).first()
                    
                    if alumno_activo:
                        messages.error(request, f"❌ El documento {id_persona} ya está matriculado activamente")
                        return redirect('formAlumno')
                except Persona.DoesNotExist:
                    # Persona no existe, puede continuar
                    pass
                
                # Validar edad (4-20 años)
                fecha_nacimiento_str = request.POST.get('fecha_nacimiento')
                if fecha_nacimiento_str:
                    try:
                        fecha_nacimiento = date.fromisoformat(fecha_nacimiento_str)
                        hoy = date.today()
                        edad = hoy.year - fecha_nacimiento.year - ((hoy.month, hoy.day) < (fecha_nacimiento.month, fecha_nacimiento.day))
                        if edad < 4 or edad > 20:
                            messages.error(request, "La edad debe estar entre 4 y 20 años")
                            return redirect('formAlumno')
                    except ValueError:
                        messages.error(request, "Formato de fecha inválido")
                        return redirect('formAlumno')

                # VALIDAR CAMPOS REQUERIDOS CRÍTICOS ANTES DE PROCESAR
                campos_requeridos = [
                    'tipo_identidad', 'nom1_persona', 'ape1_persona', 'genero',
                    'rh', 'fecha_nacimiento', 'eps', 'direc_persona', 
                    'tel_persona', 'email_persona', 'fk_posicion',
                    'idacudiente', 'nom1_acudiente', 'ape1_acudiente',
                    'tel_acudiente', 'parentesco',
                    'altura_metros', 'peso_medidas', 'talla', 'calzado', 'pie_dominante'
                ]
                
                for campo in campos_requeridos:
                    valor = request.POST.get(campo, '').strip()
                    if not valor:
                        messages.error(request, f"El campo '{campo.replace('_', ' ').title()}' es requerido")
                        return redirect('formAlumno')
                
                # VALIDAR ARCHIVOS REQUERIDOS
                archivos_requeridos = ['foto', 'traDatos', 'autoMedica', 'certEps', 'documento_identidad']
                for archivo in archivos_requeridos:
                    if archivo not in request.FILES:
                        messages.error(request, f"El archivo '{archivo}' es requerido")
                        return redirect('formAlumno')

                # 1. PROCESAR PERSONA
                try:
                    # Busca a la persona con el id que estaba en el formulario
                    persona = Persona.objects.get(id_persona=id_persona)
                    
                    # Si la persona existe, actualizamos sus datos
                    persona.tipo_identidad = request.POST.get('tipo_identidad')
                    persona.nom1_persona = request.POST.get('nom1_persona')
                    persona.nom2_persona = request.POST.get('nom2_persona', '')
                    persona.ape1_persona = request.POST.get('ape1_persona')
                    persona.ape2_persona = request.POST.get('ape2_persona', '')
                    persona.fecha_nacimiento = request.POST.get('fecha_nacimiento')
                    persona.direc_persona = request.POST.get('direc_persona')
                    persona.tel_persona = request.POST.get('tel_persona')
                    persona.email_persona = request.POST.get('email_persona')
                    persona.genero = request.POST.get('genero')
                    persona.eps = request.POST.get('eps')
                    persona.rh = request.POST.get('rh')
                    persona.save()
                    messages.info(request, f"Usuario {id_persona} actualizado") 

                except Persona.DoesNotExist:
                    # Crea a la persona desde cero
                    persona = Persona.objects.create(
                        id_persona=id_persona,
                        tipo_identidad=request.POST.get('tipo_identidad'),
                        nom1_persona=request.POST.get('nom1_persona'),
                        nom2_persona=request.POST.get('nom2_persona', ''),
                        ape1_persona=request.POST.get('ape1_persona'),
                        ape2_persona=request.POST.get('ape2_persona', ''),
                        fecha_nacimiento=request.POST.get('fecha_nacimiento'),
                        direc_persona=request.POST.get('direc_persona'),
                        tel_persona=request.POST.get('tel_persona'),
                        email_persona=request.POST.get('email_persona'),
                        genero=request.POST.get('genero'),
                        eps=request.POST.get('eps'),
                        rh=request.POST.get('rh'),
                        fecha_registro=date.today()
                    )
                    messages.success(request, "Persona registrada correctamente")

                # 2. PROCESAR ACUDIENTE
                idacudiente = request.POST.get('idacudiente', '').strip()
                # Validar documento acudiente
                if not idacudiente or not idacudiente.isdigit():
                    messages.error(request, "El documento del acudiente debe contener solo números")
                    return redirect('formAlumno')
                
                if len(idacudiente) > 10:
                    messages.error(request, "El documento del acudiente no puede tener más de 10 dígitos")
                    return redirect('formAlumno')
                
                try:
                    acudiente = Acudiente.objects.get(idacudiente=idacudiente)
                    acudiente.nom1_acudiente = request.POST.get('nom1_acudiente')
                    acudiente.nom2_acudiente = request.POST.get('nom2_acudiente', '')
                    acudiente.ape1_acudiente = request.POST.get('ape1_acudiente')
                    acudiente.ape2_acudiente = request.POST.get('ape2_acudiente', '')
                    acudiente.tel_acudiente = request.POST.get('tel_acudiente')
                    acudiente.parentesco = request.POST.get('parentesco')
                    acudiente.save()
                    messages.info(request, "Acudiente actualizado")
    
                except Acudiente.DoesNotExist:
                    acudiente = Acudiente.objects.create(
                        idacudiente=idacudiente,
                        nom1_acudiente=request.POST.get('nom1_acudiente'),
                        nom2_acudiente=request.POST.get('nom2_acudiente', ''),
                        ape1_acudiente=request.POST.get('ape1_acudiente'),
                        ape2_acudiente=request.POST.get('ape2_acudiente', ''),
                        tel_acudiente=request.POST.get('tel_acudiente'),
                        parentesco=request.POST.get('parentesco'),
                    )
                    messages.success(request, "Acudiente registrado correctamente")

                # 3. PROCESAR ARCHIVOS
                fk_posicion_id = request.POST.get('fk_posicion')
                if not fk_posicion_id:
                    messages.error(request, "Debes seleccionar una posición en la cancha")
                    return redirect('formAlumno')

                # Guardar archivos con manejo de errores
                archivos_guardados = {}
                archivos_map = {
                    'foto': 'fotos',
                    'traDatos': 'traDatos', 
                    'autoMedica': 'autoMedica',
                    'certEps': 'certEps',
                    'documento_identidad': 'documento_identidad',
                    'otraescuela': 'otraEscuela',
                }
                
                for campo, carpeta in archivos_map.items():
                    archivo = request.FILES.get(campo)
                    if archivo:
                        try:
                            ruta = guardar_archivo(archivo, carpeta, id_persona)
                            archivos_guardados[campo] = ruta
                        except Exception as e:
                            messages.error(request, f"Error con {campo}: {str(e)}")
                            return redirect('formAlumno')
                    elif campo in ['foto', 'traDatos', 'autoMedica', 'certEps', 'documento_identidad']:
                        # Archivos requeridos que no se subieron
                        messages.error(request, f"El archivo {campo} es requerido")
                        return redirect('formAlumno')

                # 4. PROCESAR ALUMNO CON MEDIDAS FÍSICAS
                alumno_existente = Alumno.objects.filter(fk_persona_alumno=persona).first()

                # Procesar medidas físicas con validaciones
                altura_str = request.POST.get('altura_metros', '').strip()
                peso_str = request.POST.get('peso_medidas', '').strip()
                
                try:
                    altura = float(altura_str) if altura_str else None
                    peso = float(peso_str) if peso_str else None
                    
                    # Validar rangos de altura y peso
                    if altura and (altura < 0.5 or altura > 2.5):
                        messages.error(request, "La altura debe estar entre 0.5 y 2.5 metros")
                        return redirect('formAlumno')
                    
                    if peso and (peso < 10 or peso > 150):
                        messages.error(request, "El peso debe estar entre 10 y 150 kg")
                        return redirect('formAlumno')
                        
                except ValueError:
                    messages.error(request, "La altura y peso deben ser números válidos")
                    return redirect('formAlumno')

                # Calcular IMC automáticamente
                imc_calculado = None
                if altura and peso and altura > 0:
                    imc_calculado = peso / (altura * altura)
                    imc_calculado = round(imc_calculado, 2)

                # Validar y procesar calzado
                calzado_str = request.POST.get('calzado', '').strip()
                calzado_int = None
                if calzado_str:
                    try:
                        calzado_int = int(calzado_str)
                        if calzado_int < 15 or calzado_int > 50:
                            messages.error(request, "La talla de calzado debe estar entre 15 y 50")
                            return redirect('formAlumno')
                    except ValueError:
                        messages.error(request, "La talla de calzado debe ser un número entero")
                        return redirect('formAlumno')

                # Validar otros campos
                talla = request.POST.get('talla')
                if not talla:
                    messages.error(request, "Debe seleccionar una talla de ropa")
                    return redirect('formAlumno')
                    
                pie_dominante = request.POST.get('pie_dominante')
                if not pie_dominante:
                    messages.error(request, "Debe seleccionar el pie dominante")
                    return redirect('formAlumno')

                if alumno_existente:
                    # Actualizar alumno existente
                    alumno_existente.fk_acudiente = acudiente
                    alumno_existente.fk_posicion_id = fk_posicion_id
                    
                    # Actualizar archivos solo si se subieron nuevos
                    if 'foto' in archivos_guardados:
                        alumno_existente.foto = archivos_guardados.get('foto')
                    if 'traDatos' in archivos_guardados:
                        alumno_existente.tradatos = archivos_guardados.get('traDatos')
                    if 'autoMedica' in archivos_guardados:
                        alumno_existente.automedica = archivos_guardados.get('autoMedica')
                    if 'certEps' in archivos_guardados:
                        alumno_existente.certeps = archivos_guardados.get('certEps')
                    if 'documento_identidad' in archivos_guardados:
                        alumno_existente.documento_identidad = archivos_guardados.get('documento_identidad')
                    if 'otraescuela' in archivos_guardados:
                        alumno_existente.otraescuela = archivos_guardados.get('otraescuela')
                    
                    # Actualizar medidas físicas
                    alumno_existente.altura_metros = altura
                    alumno_existente.peso_medidas = peso
                    alumno_existente.imc_medidas = imc_calculado
                    alumno_existente.talla = talla
                    alumno_existente.calzado = calzado_int
                    alumno_existente.pie_dominante = pie_dominante
                    
                    alumno_existente.postulante = True
                    alumno_existente.estado_alumno = False
                    alumno_existente.save()

                    messages.warning(request, "Postulación actualizada - Ya estabas en nuestro sistema")
                else:
                    # Crear nuevo alumno con medidas físicas
                    alumno = Alumno.objects.create(
                        fk_persona_alumno=persona,
                        fk_acudiente=acudiente,
                        fk_posicion_id=fk_posicion_id,
                        foto=archivos_guardados.get('foto'),
                        tradatos=archivos_guardados.get('traDatos'),
                        automedica=archivos_guardados.get('autoMedica'),
                        certeps=archivos_guardados.get('certEps'),
                        otraescuela=archivos_guardados.get('otraescuela'),
                        documento_identidad=archivos_guardados.get('documento_identidad'),
                        
                        # Medidas físicas
                        altura_metros=altura,
                        peso_medidas=peso,
                        imc_medidas=imc_calculado,
                        talla=talla,
                        calzado=calzado_int,
                        pie_dominante=pie_dominante,
                        
                        postulante=True,
                        estado_alumno=False
                    )
                    messages.success(request, "✅ Postulación enviada correctamente. Te contactaremos pronto")
                
                # Si llegamos aquí, TODO se guardó correctamente
                return redirect('index')
                
            except ValidationError as e:
                # La transacción se revertirá automáticamente
                messages.error(request, f"Error de validación: {e}")
                return redirect('formAlumno')
            except Exception as e:
                # La transacción se revertirá automáticamente
                messages.error(request, f"❌ Error inesperado: {str(e)}")
                # Para debugging (quitar en producción)
                import traceback
                print(f"Error detallado en formAlumno: {traceback.format_exc()}")
                return redirect('formAlumno')

#miau

#Funcion de la pagina formEntrenador.html
def formEntrenador (request):
    # Obtener las listas de opciones desde los choices del modelo Persona
    tipos_identidad_all = Persona._meta.get_field('tipo_identidad').choices
    tipos_identidad = [par for par in tipos_identidad_all if par[0] != 'TI']
    generos = Persona._meta.get_field('genero').choices
    eps = Persona._meta.get_field('eps').choices
    tipos_sangre = Persona._meta.get_field('rh').choices
    
    # Obtener todas las habilidades de la base de datos
    from partida.models import Habilidad
    habilidades_obj = Habilidad.objects.all()
    habilidades = [(h.idhabilidad, h.descripcion) for h in habilidades_obj]

    context = {
        'tipos_identidad': tipos_identidad,
        'generos': generos,
        'eps': eps,
        'tipos_sangre': tipos_sangre,
        'habilidades': habilidades,
    }

    # Por ahora sólo manejamos GET (formulario de postulación). Si se requiere POST se añadirá lógica luego.
    if request.method == 'GET':
        # Limpiar mensajes pendientes para evitar que se muestren en login
        storage = messages.get_messages(request)
        storage.used = True
        return render(request, 'formEntrenador.html', context)

    # Detectar si es AJAX
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'

    # Detectar si es AJAX
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'

    # POST: crear/actualizar Persona y crear PersonalT como postulante
    tipo_identidad = request.POST.get('tipo_identidad')
    id_persona = request.POST.get('id') or request.POST.get('id_persona')
    nom1_persona = request.POST.get('nom1_persona')
    nom2_persona = request.POST.get('nom2_persona') or None
    ape1_persona = request.POST.get('ape1_persona')
    ape2_persona = request.POST.get('ape2_persona') or None
    fecha_nacimiento = request.POST.get('fecha_nacimiento')
    direc_persona = request.POST.get('direc_persona')
    tel_persona = request.POST.get('tel_persona')
    email_persona = request.POST.get('email_persona')
    genero = request.POST.get('genero')
    eps_v = request.POST.get('eps')
    rh = request.POST.get('rh')
    contrasena = request.POST.get('contrasena')
    contrasena_c = request.POST.get('contrasena_c')
    
    # Nuevos campos de experiencia profesional
    descripcion_especialidad = request.POST.get('descripcion_especialidad') or None
    categoria_experiencia = request.POST.get('categoria_experiencia') or None
    hoja_vida = request.FILES.get('hoja_vida')
    tarjeta_profesional = request.FILES.get('tarjeta_profesional')
    antecedentes = request.FILES.get('antecedentes')
    certificado_primeros_auxilios = request.FILES.get('certificado_primeros_auxilios')
    habilidades_seleccionadas = request.POST.getlist('habilidades')
    
    # Múltiples experiencias
    anios_experiencias = request.POST.getlist('anios_experiencia[]')
    certificados_experiencias = request.FILES.getlist('certificado_experiencia[]')
    
    # Validar límite de experiencias
    MAX_EXPERIENCIAS = 4
    MAX_ANIOS_POR_EXPERIENCIA = 10
    MAX_ANIOS_TOTALES = 30
    
    if len(anios_experiencias) > MAX_EXPERIENCIAS:
        error_msg = f'Solo puedes agregar máximo {MAX_EXPERIENCIAS} experiencias laborales.'
        if is_ajax:
            return JsonResponse({'success': False, 'message': error_msg})
        messages.error(request, error_msg)
        return render(request, 'formEntrenador.html', context)
    
    # Validar años de experiencia individuales y suma total
    total_anios = 0
    for i, anios in enumerate(anios_experiencias):
        try:
            anios_int = int(anios)
            if anios_int < 0:
                error_msg = f'Los años de experiencia no pueden ser negativos (Experiencia #{i+1}).'
                if is_ajax:
                    return JsonResponse({'success': False, 'message': error_msg})
                messages.error(request, error_msg)
                return render(request, 'formEntrenador.html', context)
            if anios_int > MAX_ANIOS_POR_EXPERIENCIA:
                error_msg = f'Máximo {MAX_ANIOS_POR_EXPERIENCIA} años por experiencia (Experiencia #{i+1} tiene {anios_int} años).'
                if is_ajax:
                    return JsonResponse({'success': False, 'message': error_msg})
                messages.error(request, error_msg)
                return render(request, 'formEntrenador.html', context)
            total_anios += anios_int
        except (ValueError, TypeError):
            error_msg = f'Los años de experiencia deben ser un número válido (Experiencia #{i+1}).'
            if is_ajax:
                return JsonResponse({'success': False, 'message': error_msg})
            messages.error(request, error_msg)
            return render(request, 'formEntrenador.html', context)
    
    # Validar suma total de años
    if total_anios > MAX_ANIOS_TOTALES:
        error_msg = f'La suma total de años de experiencia ({total_anios} años) excede el máximo permitido de {MAX_ANIOS_TOTALES} años. Por favor, verifica los datos.'
        if is_ajax:
            return JsonResponse({'success': False, 'message': error_msg})
        messages.error(request, error_msg)
        return render(request, 'formEntrenador.html', context)

    # Validaciones servidor
    if tipo_identidad == 'TI':
        error_msg = 'Tarjeta de Identidad no está permitida para entrenadores.'
        if is_ajax:
            return JsonResponse({'success': False, 'message': error_msg})
        messages.error(request, error_msg)
        return render(request, 'formEntrenador.html', context)
    if not id_persona or not id_persona.isdigit():
        error_msg = 'Número de identificación inválido.'
        if is_ajax:
            return JsonResponse({'success': False, 'message': error_msg})
        messages.error(request, error_msg)
        return render(request, 'formEntrenador.html', context)
    # Validar rango de INT de MySQL (máximo 10 dígitos: 2,147,483,647)
    if len(id_persona) > 10 or int(id_persona) > 2147483647:
        error_msg = 'El número de identificación no puede exceder 10 dígitos (máximo: 2,147,483,647).'
        if is_ajax:
            return JsonResponse({'success': False, 'message': error_msg})
        messages.error(request, error_msg)
        return render(request, 'formEntrenador.html', context)
    # Validar longitud de campos de texto
    if len(nom1_persona) > 20:
        error_msg = 'El primer nombre no puede exceder 20 caracteres.'
        if is_ajax:
            return JsonResponse({'success': False, 'message': error_msg})
        messages.error(request, error_msg)
        return render(request, 'formEntrenador.html', context)
    if nom2_persona and len(nom2_persona) > 20:
        error_msg = 'El segundo nombre no puede exceder 20 caracteres.'
        if is_ajax:
            return JsonResponse({'success': False, 'message': error_msg})
        messages.error(request, error_msg)
        return render(request, 'formEntrenador.html', context)
    if len(ape1_persona) > 20:
        error_msg = 'El primer apellido no puede exceder 20 caracteres.'
        if is_ajax:
            return JsonResponse({'success': False, 'message': error_msg})
        messages.error(request, error_msg)
        return render(request, 'formEntrenador.html', context)
    if ape2_persona and len(ape2_persona) > 20:
        error_msg = 'El segundo apellido no puede exceder 20 caracteres.'
        if is_ajax:
            return JsonResponse({'success': False, 'message': error_msg})
        messages.error(request, error_msg)
        return render(request, 'formEntrenador.html', context)
    if len(direc_persona) > 40:
        error_msg = 'La dirección no puede exceder 40 caracteres.'
        if is_ajax:
            return JsonResponse({'success': False, 'message': error_msg})
        messages.error(request, error_msg)
        return render(request, 'formEntrenador.html', context)
    if len(email_persona) > 40:
        error_msg = 'El correo electrónico no puede exceder 40 caracteres.'
        if is_ajax:
            return JsonResponse({'success': False, 'message': error_msg})
        messages.error(request, error_msg)
        return render(request, 'formEntrenador.html', context)
    # Fecha entre 1960-01-01 y 2004-12-31
    try:
        from datetime import date
        year, month, day = map(int, str(fecha_nacimiento).split('-'))
        fn = date(year, month, day)
        if fn < date(1960,1,1) or fn > date(2004,12,31):
            error_msg = 'La fecha de nacimiento debe estar entre 1960 y 2004.'
            if is_ajax:
                return JsonResponse({'success': False, 'message': error_msg})
            messages.error(request, error_msg)
            return render(request, 'formEntrenador.html', context)
    except Exception:
        error_msg = 'Fecha de nacimiento inválida.'
        if is_ajax:
            return JsonResponse({'success': False, 'message': error_msg})
        messages.error(request, error_msg)
        return render(request, 'formEntrenador.html', context)
    # Teléfono 10 dígitos y debe iniciar con 3
    if not tel_persona or (not tel_persona.isdigit()) or len(tel_persona) != 10 or not tel_persona.startswith('3'):
        error_msg = 'El número de celular debe iniciar con 3 y tener exactamente 10 dígitos.'
        if is_ajax:
            return JsonResponse({'success': False, 'message': error_msg})
        messages.error(request, error_msg)
        return render(request, 'formEntrenador.html', context)
    # Email válido
    try:
        validate_email(email_persona)
    except ValidationError:
        error_msg = 'Correo electrónico inválido.'
        if is_ajax:
            return JsonResponse({'success': False, 'message': error_msg})
        messages.error(request, error_msg)
        return render(request, 'formEntrenador.html', context)
    # Passwords
    if not contrasena or contrasena != contrasena_c:
        error_msg = 'Las contraseñas no coinciden.'
        if is_ajax:
            return JsonResponse({'success': False, 'message': error_msg})
        messages.error(request, error_msg)
        return render(request, 'formEntrenador.html', context)

    # Validar que el ID no exista ya en la base de datos
    if Persona.objects.filter(id_persona=int(id_persona)).exists():
        error_msg = f'El ID {id_persona} ya se encuentra registrado en el sistema. Por favor, usa otro número de identificación.'
        if is_ajax:
            return JsonResponse({'success': False, 'message': error_msg})
        messages.error(request, error_msg)
        return render(request, 'formEntrenador.html', context)

    # Crear/actualizar Persona
    persona, created = Persona.objects.get_or_create(
        id_persona=int(id_persona),
        defaults={
            'tipo_identidad': tipo_identidad,
            'nom1_persona': nom1_persona,
            'nom2_persona': nom2_persona,
            'ape1_persona': ape1_persona,
            'ape2_persona': ape2_persona,
            'fecha_nacimiento': fecha_nacimiento,
            'direc_persona': direc_persona,
            'tel_persona': int(tel_persona),
            'email_persona': email_persona,
            'genero': genero,
            'eps': eps_v,
            'rh': rh,
        }
    )
    if not created:
        persona.tipo_identidad = tipo_identidad or persona.tipo_identidad
        persona.nom1_persona = nom1_persona or persona.nom1_persona
        persona.nom2_persona = nom2_persona
        persona.ape1_persona = ape1_persona or persona.ape1_persona
        persona.ape2_persona = ape2_persona
        persona.fecha_nacimiento = fecha_nacimiento or persona.fecha_nacimiento
        persona.direc_persona = direc_persona or persona.direc_persona
        persona.tel_persona = int(tel_persona)
        persona.email_persona = email_persona or persona.email_persona
        persona.genero = genero or persona.genero
        persona.eps = eps_v or persona.eps
        persona.rh = rh or persona.rh
        persona.save()

    # Crear/actualizar PersonalT como postulante
    from partida.models import PersonalT, Habilidad, PersonalTHabilidad, Experiencia
    
    # Calcular total de años de experiencia
    total_anios = sum(int(anios) for anios in anios_experiencias if anios)
    
    personal, p_created = PersonalT.objects.get_or_create(
        fk_persona=persona,
        defaults={
            'contrasena': contrasena,
            'tipo_personal': 'Entrenador',
            'postulante': True,
            'estado': False,
            'estado_proceso': 'postulante',
            'experiencia': total_anios,
            'descripcion_especialidad': descripcion_especialidad,
            'categoria_experiencia': categoria_experiencia,
            'hoja_vida': hoja_vida,
            'tarjeta_profesional': tarjeta_profesional,
            'antecedentes': antecedentes,
            'certificado_primeros_auxilios': certificado_primeros_auxilios,
        }
    )
    if not p_created:
        personal.contrasena = contrasena or personal.contrasena
        personal.tipo_personal = 'Entrenador'
        personal.postulante = True
        personal.estado = False
        personal.estado_proceso = 'postulante'
        personal.experiencia = total_anios
        personal.descripcion_especialidad = descripcion_especialidad or personal.descripcion_especialidad
        personal.categoria_experiencia = categoria_experiencia or personal.categoria_experiencia
        if hoja_vida:
            personal.hoja_vida = hoja_vida
        if tarjeta_profesional:
            personal.tarjeta_profesional = tarjeta_profesional
        if antecedentes:
            personal.antecedentes = antecedentes
        if certificado_primeros_auxilios:
            personal.certificado_primeros_auxilios = certificado_primeros_auxilios
        personal.save()
    
    # Eliminar experiencias anteriores y crear las nuevas
    Experiencia.objects.filter(fk_persona_experiencia=personal).delete()
    
    # Crear las experiencias
    for i in range(len(anios_experiencias)):
        certificado = certificados_experiencias[i] if i < len(certificados_experiencias) else None
        Experiencia.objects.create(
            fk_persona_experiencia=personal,
            anios_experiencia=int(anios_experiencias[i]) if anios_experiencias[i] else 0,
            descripcion=descripcion_especialidad or '',  # Usar la descripción de especialidad para todas las experiencias
            certificado_experiencia=certificado
        )
    
    # Guardar habilidades seleccionadas
    print(f"DEBUG GUARDADO: habilidades_seleccionadas = {habilidades_seleccionadas}")
    print(f"DEBUG GUARDADO: PersonalT.pk = {personal.pk}")
    print(f"DEBUG GUARDADO: PersonalT.fk_persona_id = {personal.fk_persona_id}")
    
    if habilidades_seleccionadas:
        # Eliminar habilidades anteriores si existen
        PersonalTHabilidad.objects.filter(fk_personal=personal).delete()
        print(f"DEBUG GUARDADO: Habilidades anteriores eliminadas")
        
        # Agregar las nuevas habilidades
        for habilidad_id in habilidades_seleccionadas:
            try:
                habilidad = Habilidad.objects.get(idhabilidad=int(habilidad_id))
                nueva_relacion = PersonalTHabilidad.objects.create(
                    fk_personal=personal,
                    fk_habilidad=habilidad
                )
                print(f"DEBUG GUARDADO: Creada relación - fk_personal={nueva_relacion.fk_personal_id}, fk_habilidad={nueva_relacion.fk_habilidad_id} ({habilidad.descripcion})")
            except Habilidad.DoesNotExist:
                print(f"DEBUG GUARDADO ERROR: Habilidad {habilidad_id} no encontrada")
                pass
    else:
        print(f"DEBUG GUARDADO: No se seleccionaron habilidades")

    # Responder según si es AJAX o no
    if is_ajax:
        return JsonResponse({
            'success': True,
            'message': 'Postulación enviada. Queda pendiente de aprobación.'
        })
    
    messages.success(request, 'Postulación enviada. Queda pendiente de aprobación.')
    # Redirigimos al inicio; la gestión de postulantes requiere sesión
    return redirect('index')


def verificar_id_persona(request):
    """
    Vista AJAX para verificar si un ID de persona ya existe en la base de datos
    """
    if request.method == 'GET' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        id_persona = request.GET.get('id_persona', '').strip()
        
        if not id_persona:
            return JsonResponse({'existe': False})
        
        # Validar que sea numérico
        if not id_persona.isdigit():
            return JsonResponse({'existe': False})
        
        # Verificar si existe en la base de datos
        existe = Persona.objects.filter(id_persona=int(id_persona)).exists()
        
        return JsonResponse({'existe': existe})
    
    return JsonResponse({'error': 'Petición inválida'}, status=400)


def enmascarar_email(email):
    """
    Enmascara un email parcialmente para mayor privacidad
    Ejemplo: correoejemplo@gmail.com -> c****@g****
    """
    if not email or '@' not in email:
        return email
    
    partes = email.split('@')
    nombre_usuario = partes[0]
    dominio = partes[1]
    
    # Enmascarar nombre de usuario (mostrar primer carácter + ****)
    if len(nombre_usuario) <= 2:
        nombre_enmascarado = nombre_usuario[0] + '****'
    else:
        nombre_enmascarado = nombre_usuario[0] + '****'
    
    # Enmascarar dominio (mostrar primer carácter + ****)
    if '.' in dominio:
        dominio_partes = dominio.split('.')
        dominio_base = dominio_partes[0]
        extension = '.'.join(dominio_partes[1:])
        
        if len(dominio_base) <= 2:
            dominio_enmascarado = dominio_base[0] + '****'
        else:
            dominio_enmascarado = dominio_base[0] + '****'
        
        dominio_final = f"{dominio_enmascarado}.{extension}"
    else:
        dominio_final = dominio[0] + '****'
    
    return f"{nombre_enmascarado}@{dominio_final}"


def solicitar_recuperacion(request):
    if request.method == 'POST':
        numero_id = request.POST.get('numero_identificacion')
        
        try:
            # Buscar persona y usuario
            persona = Persona.objects.get(id_persona=numero_id)
            usuario = persona.user
            
            # Crear token de recuperación
            token = TokenRecuperacion.objects.create(usuario=usuario)
            
            # Construir URL de recuperación
            url_recuperacion = request.build_absolute_uri(
                f'/recuperar-contrasena/{token.token}/'
            )
            
            # Enviar correo
            context = {
                'nombre': f"{persona.nom1_persona} {persona.ape1_persona}",
                'url_recuperacion': url_recuperacion,
                'tiempo_expiracion': '1 hora'
            }
            
            html_message = render_to_string('emails/recuperacion_contrasena.html', context)
            plain_message = strip_tags(html_message)
            
            send_mail(
                subject='🔐 Recuperación de Contraseña - Club Deportivo',
                message=plain_message,
                html_message=html_message,
                from_email='noreply@clubdeportivo.com',
                recipient_list=[persona.email_persona],
                fail_silently=False,
            )
            
            # Enmascarar email para el mensaje de confirmación
            email_enmascarado = enmascarar_email(persona.email_persona)
            
            messages.success(request, 
                f'📧 Se ha enviado un correo a {email_enmascarado} con instrucciones para recuperar tu contraseña.')
            return redirect('solicitar_recuperacion')
            
        except Persona.DoesNotExist:
            messages.error(request, 
                '❌ No se encontró ninguna cuenta con ese número de identificación.')
        except Exception as e:
            messages.error(request, 
                '❌ Ocurrió un error al enviar el correo. Intenta nuevamente.')
            print(f"Error: {e}")
    
    return render(request, 'solicitar_recuperacion.html')


def recuperar_contrasena(request, token):
    try:
        token_obj = TokenRecuperacion.objects.get(token=token)
        
        if not token_obj.is_valid():
            messages.error(request, 
                '❌ Este enlace ha expirado o ya fue utilizado. Solicita uno nuevo.')
            return redirect('solicitar_recuperacion')
        
        if request.method == 'POST':
            nueva_contrasena = request.POST.get('nueva_contrasena')
            confirmar_contrasena = request.POST.get('confirmar_contrasena')
            
            if nueva_contrasena != confirmar_contrasena:
                messages.error(request, '❌ Las contraseñas no coinciden.')
                return render(request, 'recuperar_contrasena.html', {'token': token})
            
            # Validar complejidad de contraseña
            if len(nueva_contrasena) < 8:
                messages.error(request, '❌ La contraseña debe tener al menos 8 caracteres.')
                return render(request, 'recuperar_contrasena.html', {'token': token})
            
            if not any(c.isupper() for c in nueva_contrasena):
                messages.error(request, '❌ La contraseña debe contener al menos una mayúscula.')
                return render(request, 'recuperar_contrasena.html', {'token': token})
            
            if not any(c.islower() for c in nueva_contrasena):
                messages.error(request, '❌ La contraseña debe contener al menos una minúscula.')
                return render(request, 'recuperar_contrasena.html', {'token': token})
            
            if not any(c.isdigit() for c in nueva_contrasena):
                messages.error(request, '❌ La contraseña debe contener al menos un número.')
                return render(request, 'recuperar_contrasena.html', {'token': token})
            
            # Actualizar contraseña
            usuario = token_obj.usuario
            usuario.set_password(nueva_contrasena)
            usuario.save()
            
            # Actualizar también en PersonalT si existe (sin hash - comparación directa en login)
            try:
                persona = Persona.objects.get(user=usuario)
                if hasattr(persona, 'personalt'):
                    persona.personalt.contrasena = nueva_contrasena
                    persona.personalt.save()
            except:
                pass
            
            # Marcar token como usado
            token_obj.usado = True
            token_obj.save()
            
            messages.success(request, 
                '✅ Tu contraseña ha sido actualizada exitosamente. Ahora puedes iniciar sesión.')
            return redirect('iniciosesion')
        
        persona = Persona.objects.get(user=token_obj.usuario)
        context = {
            'token': token,
            'nombre': f"{persona.nom1_persona} {persona.ape1_persona}"
        }
        return render(request, 'recuperar_contrasena.html', context)
        
    except TokenRecuperacion.DoesNotExist:
        messages.error(request, '❌ Enlace inválido o expirado.')
        return redirect('solicitar_recuperacion')




