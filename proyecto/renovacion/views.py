#miauuuu
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.db.models import Q
from django.db import transaction
from datetime import date, datetime, time
# importar modelos
from partida.models import Matricula, Alumno, Persona, Categoria, Posicion, Acudiente
# importar funciones matricula
from matricula.views import calcular_edad, categoria_edad
import time  
import re

def obtener_estado_renovaciones():
    #Obtiene el estado y mensaje sobre las renovaciones
    hoy = date.today()
    
    fecha_inicio = date(hoy.year, 12, 1) 
    fecha_fin = date(hoy.year, 12, 10)
    
    if hoy < fecha_inicio:
        return {
            'habilitada': False,
            'mensaje': f'Las renovaciones estarán disponibles desde el {fecha_inicio.strftime("%d de %B")} hasta el {fecha_fin.strftime("%d de %B")}'
        }
    elif hoy > fecha_fin:
        return {
            'habilitada': False, 
            'mensaje': f'El período de renovaciones finalizó el {fecha_fin.strftime("%d de %B")}. Vuelve el próximo año.'
        }
    else:
        return {
            'habilitada': True,
            'mensaje': f'Renovaciones habilitadas - Disponible hasta el {fecha_fin.strftime("%d de %B")}'
        }

def obtener_ano_siguiente():
    #Obtiene el año siguiente para la nueva matrícula
    return date.today().year + 1


def renovacion_login(request):
    #Vista para que los alumnos ingresen con su código de renovación
    # Verificar si las renovaciones están habilitadas
    estado = obtener_estado_renovaciones()
    if not estado['habilitada']:
        messages.error(request, estado['mensaje'])
        # Pasamos el estado al template para mostrar información
        context = {
            'estado_renovaciones': estado,
            'ano_siguiente': obtener_ano_siguiente()
        }
        return render(request, 'renovacion/login.html', context)
    
    if request.method == 'POST':
        codigo = request.POST.get('codigo')
        identificacion = request.POST.get('identificacion')
        
        try:
            # CONSULTA CORREGIDA: Buscar con estado_matricula=0
            matricula = Matricula.objects.filter(
                codigo_fin_periodo=codigo,
                estado_matricula=0  # 0 = inactiva
            ).first()
            
            if matricula:
                # Verificar que la identificación coincida
                persona_matricula = matricula.fk_alumno.fk_persona_alumno
                
                if str(persona_matricula.id_persona) == str(identificacion):
                    # Verificar que el código no esté vencido
                    if not matricula.codigo_fin_periodo.startswith('VENCIDO-'):
                        # Guardar en sesión
                        request.session['renovacion_alumno_id'] = matricula.fk_alumno.fk_persona_alumno_id
                        request.session['renovacion_codigo'] = codigo
                        return redirect('renovacion:datos')
                    else:
                        messages.error(request, 'El código de renovación ha expirado')
                else:
                    messages.error(request, 'La identificación no coincide con el código')
            else:
                messages.error(request, 'Código incorrecto o ya utilizado')
                
        except Exception as e:
            messages.error(request, 'Error en el sistema. Intente más tarde.')
    
    # Si es GET, pasar el estado actual
    context = {
        'estado_renovaciones': obtener_estado_renovaciones(),
        'ano_siguiente': obtener_ano_siguiente()
    }
    return render(request, 'renovacion/login.html', context)


def renovacion_datos(request):
    # Vista donde el alumno ve sus datos y puede renovar matrícula
    
    # Verificar si las renovaciones están habilitadas
    estado = obtener_estado_renovaciones()
    if not estado['habilitada']:
        messages.error(request, estado['mensaje'])
        return redirect('renovacion:login')
    
    alumno_id = request.session.get('renovacion_alumno_id')
    if not alumno_id:
        return redirect('renovacion:login')
    
    # Buscar alumno por fk_persona_alumno_id
    alumno = get_object_or_404(Alumno, fk_persona_alumno_id=alumno_id)
    persona = alumno.fk_persona_alumno
    
    # Obtener todas las matrículas anteriores
    matriculas_anteriores = Matricula.objects.filter(
        fk_alumno=alumno
    ).order_by('-fecha_inicio')
    
    # Calcular edad usando la función importada
    edad = calcular_edad(persona.fecha_nacimiento)
    
    # Obtener categoría sugerida usando la función importada categoria_edad
    cat_id_sugerido = categoria_edad(edad)
    categoria_sugerida = None
    if cat_id_sugerido:
        categoria_sugerida = Categoria.objects.filter(idcategoria=cat_id_sugerido).first()
    
    # Obtener todas las categorías disponibles
    categorias_disponibles = Categoria.objects.all()
    
    # Obtener las opciones para los campos de medidas físicas
    TALLA_ROPA = Alumno._meta.get_field('talla').choices
    PIE_DOM = Alumno._meta.get_field('pie_dominante').choices
    
    # Obtener el año siguiente para mostrar en el template
    ano_siguiente = obtener_ano_siguiente()
    
    # ========== GUARDAR TIEMPO DE INICIO DE SESIÓN ==========
    if 'renovacion_tiempo_inicio' not in request.session:
        request.session['renovacion_tiempo_inicio'] = time.time()
    
    # ========== VERIFICAR EXPIRACIÓN DE SESIÓN (1 HORA) ==========
    tiempo_inicio_sesion = request.session.get('renovacion_tiempo_inicio')
    if tiempo_inicio_sesion:
        tiempo_transcurrido = time.time() - tiempo_inicio_sesion
        if tiempo_transcurrido > 3600:  # 1 hora en segundos
            # Limpiar sesión
            for key in ['renovacion_alumno_id', 'renovacion_codigo', 'renovacion_tiempo_inicio']:
                if key in request.session:
                    del request.session[key]
            messages.error(request, 'Tu sesión ha expirado (1 hora). Por favor, inicia sesión nuevamente.')
            return redirect('renovacion:login')
    
    if request.method == 'POST':
        try:
            with transaction.atomic():
                # ========== VERIFICAR TIEMPO DE SESIÓN ANTES DE PROCESAR ==========
                tiempo_inicio_sesion = request.session.get('renovacion_tiempo_inicio')
                if tiempo_inicio_sesion:
                    tiempo_transcurrido = time.time() - tiempo_inicio_sesion
                    if tiempo_transcurrido > 3600:
                        for key in ['renovacion_alumno_id', 'renovacion_codigo', 'renovacion_tiempo_inicio']:
                            if key in request.session:
                                del request.session[key]
                        messages.error(request, 'Tu sesión ha expirado (1 hora). Por favor, inicia sesión nuevamente.')
                        return redirect('renovacion:login')
                
                # ========== USAR CATEGORÍA AUTOMÁTICA (NO EDITABLE) ==========
                categoria_id = None
                
                # Usar primero la categoría sugerida por edad
                if categoria_sugerida:
                    categoria_id = categoria_sugerida.idcategoria
                
                # Si no hay categoría sugerida, usar la función categoria_edad
                if not categoria_id:
                    cat_id_auto = categoria_edad(edad)
                    if cat_id_auto:
                        categoria_id = cat_id_auto
                    else:
                        # Si no hay categoría por edad, usar la primera disponible
                        primera_categoria = Categoria.objects.first()
                        if primera_categoria:
                            categoria_id = primera_categoria.idcategoria
                
                if not categoria_id:
                    messages.error(request, 'No se pudo asignar una categoría automáticamente')
                    return redirect('renovacion:datos')
                
                # ========== VALIDAR DOCUMENTOS OBLIGATORIOS ==========
                documentos_obligatorios = ['tradatos', 'foto', 'automedica', 'certeps', 'documento_identidad']
                documentos_faltantes = []
                
                for doc in documentos_obligatorios:
                    archivo = request.FILES.get(doc)
                    if not archivo:
                        # Verificar si ya existe el documento (para renovaciones)
                        archivo_actual = getattr(alumno, doc)
                        if not archivo_actual or not hasattr(archivo_actual, 'url'):
                            documentos_faltantes.append(doc)
                
                if documentos_faltantes:
                    messages.error(request, f'Documentos obligatorios faltantes: {", ".join(documentos_faltantes)}')
                    return redirect('renovacion:datos')
                
                # ========== ACTUALIZAR DOCUMENTOS ==========
                documentos = ['tradatos', 'foto', 'automedica', 'certeps', 'documento_identidad', 'otraescuela']
                for doc in documentos:
                    archivo = request.FILES.get(doc)
                    if archivo:
                        # Validar tamaño del archivo (5MB máximo)
                        if archivo.size > 5 * 1024 * 1024:
                            messages.error(request, f'El archivo {doc} es demasiado grande (máximo 5MB)')
                            return redirect('renovacion:datos')
                        
                        # Validar extensiones
                        extensiones_permitidas = {
                            'tradatos': ['.pdf', '.doc', '.docx'],
                            'automedica': ['.pdf', '.doc', '.docx'],
                            'certeps': ['.pdf', '.doc', '.docx'],
                            'otraescuela': ['.pdf', '.doc', '.docx'],
                            'documento_identidad': ['.pdf', '.doc', '.docx'],
                            'foto': ['.jpg', '.jpeg', '.png']
                        }
                        
                        extension = archivo.name.lower()[archivo.name.rfind('.'):]
                        if doc in extensiones_permitidas and extension not in extensiones_permitidas[doc]:
                            messages.error(request, f'Formato no permitido para {doc}. Formatos: {", ".join(extensiones_permitidas[doc])}')
                            return redirect('renovacion:datos')
                        
                        # Eliminar archivo anterior si existe
                        archivo_actual = getattr(alumno, doc)
                        if archivo_actual:
                            archivo_actual.delete(save=False)
                        
                        # Guardar nuevo archivo
                        setattr(alumno, doc, archivo)
                
                # ========== VALIDAR CAMPOS OBLIGATORIOS ==========
                campos_obligatorios = {
                    'eps': 'EPS',
                    'direc_persona': 'Dirección',
                    'tel_persona': 'Teléfono',
                    'email_persona': 'Email',
                    'tel_acudiente': 'Teléfono del acudiente'
                }
                
                for campo, nombre in campos_obligatorios.items():
                    valor = request.POST.get(campo, '').strip()
                    if not valor:
                        messages.error(request, f'El campo {nombre} es obligatorio')
                        return redirect('renovacion:datos')
                
                # ========== VALIDAR FORMATOS Y LONGITUDES ==========
                # Validar teléfono (10 dígitos)
                telefono = request.POST.get('tel_persona', '').strip()
                if telefono and (not telefono.isdigit() or len(telefono) != 10):
                    messages.error(request, 'El teléfono debe tener exactamente 10 dígitos')
                    return redirect('renovacion:datos')
                
                telefono_acudiente = request.POST.get('tel_acudiente', '').strip()
                if telefono_acudiente and (not telefono_acudiente.isdigit() or len(telefono_acudiente) != 10):
                    messages.error(request, 'El teléfono del acudiente debe tener exactamente 10 dígitos')
                    return redirect('renovacion:datos')
                
                # Validar email
                email = request.POST.get('email_persona', '').strip()
                if email:
                    if len(email) > 40:
                        messages.error(request, 'El email no puede exceder 40 caracteres')
                        return redirect('renovacion:datos')
                    if '@' not in email or '.' not in email.split('@')[-1]:
                        messages.error(request, 'El formato del email es inválido')
                        return redirect('renovacion:datos')
                
                # Validar dirección
                direccion = request.POST.get('direc_persona', '').strip()
                if direccion and len(direccion) > 40:
                    messages.error(request, 'La dirección no puede exceder 40 caracteres')
                    return redirect('renovacion:datos')
                
                # ========== VALIDAR EPS (DEBE SER UNA OPCIÓN VÁLIDA) ==========
                eps_valor = request.POST.get('eps', '').strip()
                if eps_valor:
                    eps_validas = [choice[0] for choice in Persona._meta.get_field('eps').choices]
                    if eps_valor not in eps_validas:
                        messages.error(request, 'La EPS seleccionada no es válida')
                        return redirect('renovacion:datos')
                
                # ========== VALIDAR GÉNERO (DEBE SER UNA OPCIÓN VÁLIDA) ==========
                genero_valor = request.POST.get('genero', '').strip()
                if genero_valor:
                    generos_validos = [choice[0] for choice in Persona._meta.get_field('genero').choices]
                    if genero_valor not in generos_validos:
                        messages.error(request, 'El género seleccionado no es válido')
                        return redirect('renovacion:datos')
                
                # ========== VALIDAR DATOS DEL ACUDIENTE ==========
                # Obtener datos del acudiente
                id_acudiente = request.POST.get('idacudiente', '').strip()
                nom1_acudiente = request.POST.get('nom1_acudiente', '').strip()
                nom2_acudiente = request.POST.get('nom2_acudiente', '').strip()
                ape1_acudiente = request.POST.get('ape1_acudiente', '').strip()
                ape2_acudiente = request.POST.get('ape2_acudiente', '').strip()
                email_acudiente = request.POST.get('email_acudiente', '').strip()
                parentesco_valor = request.POST.get('parentesco', '').strip()
                
                # Validar que si se proporciona ID, también haya datos básicos
                if id_acudiente and (not nom1_acudiente or not telefono_acudiente):
                    messages.error(request, 'Si proporciona ID del acudiente, también debe incluir nombre y teléfono')
                    return redirect('renovacion:datos')
                
                # Validar ID del acudiente (si se proporciona)
                if id_acudiente:
                    # Validar que el ID tenga un formato válido (ejemplo: solo números)
                    if not id_acudiente.isdigit():
                        messages.error(request, 'El ID del acudiente debe contener solo números')
                        return redirect('renovacion:datos')
                    
                    if len(id_acudiente) < 6 or len(id_acudiente) > 10:
                        messages.error(request, 'El ID del acudiente debe tener entre 6 y 10 dígitos')
                        return redirect('renovacion:datos')
                
                # Validar nombres del acudiente (solo si se proporcionan)
                if nom1_acudiente:
                    if len(nom1_acudiente) > 20:
                        messages.error(request, 'El primer nombre del acudiente no puede exceder 20 caracteres')
                        return redirect('renovacion:datos')
                    if not re.match(r'^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$', nom1_acudiente):
                        messages.error(request, 'El primer nombre del acudiente solo puede contener letras')
                        return redirect('renovacion:datos')
                
                if nom2_acudiente:
                    if len(nom2_acudiente) > 20:
                        messages.error(request, 'El segundo nombre del acudiente no puede exceder 20 caracteres')
                        return redirect('renovacion:datos')
                    if not re.match(r'^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$', nom2_acudiente):
                        messages.error(request, 'El segundo nombre del acudiente solo puede contener letras')
                        return redirect('renovacion:datos')
                
                # Validar apellidos del acudiente (solo si se proporcionan)
                if ape1_acudiente:
                    if len(ape1_acudiente) > 20:
                        messages.error(request, 'El primer apellido del acudiente no puede exceder 20 caracteres')
                        return redirect('renovacion:datos')
                    if not re.match(r'^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$', ape1_acudiente):
                        messages.error(request, 'El primer apellido del acudiente solo puede contener letras')
                        return redirect('renovacion:datos')
                
                if ape2_acudiente:
                    if len(ape2_acudiente) > 20:
                        messages.error(request, 'El segundo apellido del acudiente no puede exceder 20 caracteres')
                        return redirect('renovacion:datos')
                    if not re.match(r'^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$', ape2_acudiente):
                        messages.error(request, 'El segundo apellido del acudiente solo puede contener letras')
                        return redirect('renovacion:datos')
                
                # Validar email del acudiente (si se proporciona)
                if email_acudiente:
                    if len(email_acudiente) > 40:
                        messages.error(request, 'El email del acudiente no puede exceder 40 caracteres')
                        return redirect('renovacion:datos')
                    if '@' not in email_acudiente or '.' not in email_acudiente.split('@')[-1]:
                        messages.error(request, 'El formato del email del acudiente es inválido')
                        return redirect('renovacion:datos')
                
                # ========== VALIDAR PARENTESCO (SI SE PROPORCIONA) ==========
                if parentesco_valor:
                    parentescos_validos = [choice[0] for choice in Acudiente._meta.get_field('parentesco').choices]
                    if parentesco_valor not in parentescos_validos:
                        messages.error(request, 'El parentesco seleccionado no es válido')
                        return redirect('renovacion:datos')
                
                # ========== VALIDAR DATOS NUMÉRICOS ==========
                altura = request.POST.get('altura', '').strip()
                if altura:
                    try:
                        altura_num = float(altura.replace(',', '.'))
                        if altura_num < 0.5 or altura_num > 2.5:
                            messages.error(request, 'La altura debe estar entre 0.5 y 2.5 metros')
                            return redirect('renovacion:datos')
                    except ValueError:
                        messages.error(request, 'La altura debe ser un número válido')
                        return redirect('renovacion:datos')
                
                peso = request.POST.get('peso', '').strip()
                if peso:
                    try:
                        peso_num = float(peso.replace(',', '.'))
                        if peso_num < 10 or peso_num > 150:
                            messages.error(request, 'El peso debe estar entre 10 y 150 kg')
                            return redirect('renovacion:datos')
                    except ValueError:
                        messages.error(request, 'El peso debe ser un número válido')
                        return redirect('renovacion:datos')
                
                calzado = request.POST.get('calzado', '').strip()
                if calzado:
                    try:
                        calzado_num = int(calzado)
                        if calzado_num < 15 or calzado_num > 50:
                            messages.error(request, 'La talla de calzado debe estar entre 15 y 50')
                            return redirect('renovacion:datos')
                    except ValueError:
                        messages.error(request, 'La talla de calzado debe ser un número válido')
                        return redirect('renovacion:datos')
                
                # Validar talla de ropa (si se proporciona)
                talla = request.POST.get('talla', '').strip()
                if talla:
                    tallas_validas = [choice[0] for choice in TALLA_ROPA]
                    if talla not in tallas_validas:
                        messages.error(request, 'La talla de ropa seleccionada no es válida')
                        return redirect('renovacion:datos')
                
                # Validar pie dominante (si se proporciona)
                pie_dominante = request.POST.get('pie_dominante', '').strip()
                if pie_dominante:
                    pies_validos = [choice[0] for choice in PIE_DOM]
                    if pie_dominante not in pies_validos:
                        messages.error(request, 'El pie dominante seleccionado no es válido')
                        return redirect('renovacion:datos')
                
                # ========== CREAR MATRÍCULA PARA EL AÑO SIGUIENTE ==========
                fecha_inicio_ano_siguiente = datetime(obtener_ano_siguiente(), 1, 1)
                
                nueva_matricula = Matricula.objects.create(
                    fk_alumno=alumno,
                    fk_categoria_id=categoria_id,
                    fecha_inicio=fecha_inicio_ano_siguiente,
                    estado_matricula=1,
                    codigo_fin_periodo=None
                )
                
                # ========== ACTUALIZAR DATOS EDITABLES DEL ALUMNO ==========
                # Actualizar medidas físicas
                if altura:
                    try:
                        altura_valor = altura.replace(',', '.')
                        alumno.altura_metros = float(altura_valor)
                    except (ValueError, TypeError):
                        alumno.altura_metros = None
                
                if peso:
                    try:
                        peso_valor = peso.replace(',', '.')
                        alumno.peso_medidas = float(peso_valor)
                    except (ValueError, TypeError):
                        alumno.peso_medidas = None
                
                if talla:
                    alumno.talla = talla
                
                if calzado:
                    try:
                        alumno.calzado = int(calzado)
                    except (ValueError, TypeError):
                        alumno.calzado = None
                
                if pie_dominante:
                    alumno.pie_dominante = pie_dominante
                
                # Calcular IMC automáticamente
                try:
                    if altura and peso:
                        altura_valor = altura.replace(',', '.')
                        peso_valor = peso.replace(',', '.')
                        altura_num = float(altura_valor)
                        peso_num = float(peso_valor)
                        
                        if altura_num > 0 and peso_num > 0:
                            alumno.imc_medidas = peso_num / (altura_num * altura_num)
                        else:
                            alumno.imc_medidas = None
                    else:
                        alumno.imc_medidas = None
                except (ValueError, TypeError, ZeroDivisionError):
                    alumno.imc_medidas = None
                
                # Guardar alumno (incluye documentos)
                alumno.save()
                
                # ========== ACTUALIZAR DATOS EDITABLES DE LA PERSONA ==========
                if direccion:
                    persona.direc_persona = direccion
                
                if telefono:
                    persona.tel_persona = telefono
                
                if email:
                    persona.email_persona = email
                
                if genero_valor:
                    persona.genero = genero_valor
                
                if eps_valor:
                    persona.eps = eps_valor
                
                persona.save()
                
                # ========== ACTUALIZAR ACUDIENTE ==========
                if id_acudiente:
                    # Verificar si ya existe un acudiente relacionado con el alumno
                    if alumno.fk_acudiente:
                        # CASO 1: Ya existe acudiente - actualizar datos
                        acudiente = alumno.fk_acudiente
                        
                        # Verificar si el nuevo ID ya existe en otro acudiente
                        try:
                            otro_acudiente = Acudiente.objects.get(idacudiente=id_acudiente)
                            
                            # IMPORTANTE: Si el ID existe PERO ES EL MISMO ACUDIENTE, solo actualizar
                            if otro_acudiente == acudiente:
                                # Es el mismo acudiente, solo actualizar datos
                                if nom1_acudiente:
                                    acudiente.nom1_acudiente = nom1_acudiente
                                if nom2_acudiente:
                                    acudiente.nom2_acudiente = nom2_acudiente
                                if ape1_acudiente:
                                    acudiente.ape1_acudiente = ape1_acudiente
                                if ape2_acudiente:
                                    acudiente.ape2_acudiente = ape2_acudiente
                                if telefono_acudiente:
                                    acudiente.tel_acudiente = telefono_acudiente
                                if email_acudiente:
                                    acudiente.email_acudiente = email_acudiente
                                if parentesco_valor:
                                    acudiente.parentesco = parentesco_valor
                                
                                acudiente.save()
                            else:
                                # El ID pertenece a OTRO acudiente, actualizar sin cambiar ID
                                messages.warning(request, f'El ID {id_acudiente} ya está registrado para otro acudiente. Se mantuvo el ID original.')
                                # Solo actualizar los otros datos del acudiente actual
                                if nom1_acudiente:
                                    acudiente.nom1_acudiente = nom1_acudiente
                                if nom2_acudiente:
                                    acudiente.nom2_acudiente = nom2_acudiente
                                if ape1_acudiente:
                                    acudiente.ape1_acudiente = ape1_acudiente
                                if ape2_acudiente:
                                    acudiente.ape2_acudiente = ape2_acudiente
                                if telefono_acudiente:
                                    acudiente.tel_acudiente = telefono_acudiente
                                if email_acudiente:
                                    acudiente.email_acudiente = email_acudiente
                                if parentesco_valor:
                                    acudiente.parentesco = parentesco_valor
                                
                                acudiente.save()
                                
                        except Acudiente.DoesNotExist:
                            # El nuevo ID no existe, actualizar ID y datos
                            acudiente.idacudiente = id_acudiente
                            if nom1_acudiente:
                                acudiente.nom1_acudiente = nom1_acudiente
                            if nom2_acudiente:
                                acudiente.nom2_acudiente = nom2_acudiente
                            if ape1_acudiente:
                                acudiente.ape1_acudiente = ape1_acudiente
                            if ape2_acudiente:
                                acudiente.ape2_acudiente = ape2_acudiente
                            if telefono_acudiente:
                                acudiente.tel_acudiente = telefono_acudiente
                            if email_acudiente:
                                acudiente.email_acudiente = email_acudiente
                            if parentesco_valor:
                                acudiente.parentesco = parentesco_valor
                            
                            acudiente.save()
                        
                    else:
                        # CASO 2: No existe acudiente - buscar o crear uno nuevo
                        try:
                            # Buscar si ya existe un acudiente con ese ID
                            acudiente_existente = Acudiente.objects.get(idacudiente=id_acudiente)
                            
                            # Si existe, asignarlo al alumno
                            alumno.fk_acudiente = acudiente_existente
                            alumno.save()
                            
                            # Actualizar datos del acudiente existente si se proporcionan
                            if nom1_acudiente:
                                acudiente_existente.nom1_acudiente = nom1_acudiente
                            if nom2_acudiente:
                                acudiente_existente.nom2_acudiente = nom2_acudiente
                            if ape1_acudiente:
                                acudiente_existente.ape1_acudiente = ape1_acudiente
                            if ape2_acudiente:
                                acudiente_existente.ape2_acudiente = ape2_acudiente
                            if telefono_acudiente:
                                acudiente_existente.tel_acudiente = telefono_acudiente
                            if email_acudiente:
                                acudiente_existente.email_acudiente = email_acudiente
                            if parentesco_valor:
                                acudiente_existente.parentesco = parentesco_valor
                            
                            acudiente_existente.save()
                            
                        except Acudiente.DoesNotExist:
                            # Si no existe, crear un nuevo acudiente
                            nuevo_acudiente = Acudiente.objects.create(
                                idacudiente=id_acudiente,
                                nom1_acudiente=nom1_acudiente or '',
                                nom2_acudiente=nom2_acudiente or '',
                                ape1_acudiente=ape1_acudiente or '',
                                ape2_acudiente=ape2_acudiente or '',
                                tel_acudiente=telefono_acudiente or '',
                                email_acudiente=email_acudiente or '',
                                parentesco=parentesco_valor or ''
                            )
                            
                            # Asignar el nuevo acudiente al alumno
                            alumno.fk_acudiente = nuevo_acudiente
                            alumno.save()
                else:
                    # Si no se proporciona ID de acudiente pero hay datos, crear uno sin ID
                    if nom1_acudiente or telefono_acudiente:
                        messages.error(request, 'Para registrar datos del acudiente, debe proporcionar el ID')
                        return redirect('renovacion:datos')
                
                # ========== LIMPIAR SESIÓN ==========
                for key in ['renovacion_alumno_id', 'renovacion_codigo', 'renovacion_tiempo_inicio']:
                    if key in request.session:
                        del request.session[key]
                
                messages.success(request, f'¡Matrícula renovada exitosamente para el año {obtener_ano_siguiente()}!')
                return redirect('renovacion:login')
                
        except Exception as e:
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            messages.error(request, f'Error al renovar matrícula: {str(e)}')
    
    context = {
        'alumno': alumno,
        'persona': persona,
        'matriculas_anteriores': matriculas_anteriores,
        'categorias': categorias_disponibles,
        'categoria_sugerida': categoria_sugerida,
        'posiciones': Posicion.objects.all(),
        'generos': Persona._meta.get_field('genero').choices,
        'eps': Persona._meta.get_field('eps').choices,
        'tipos_sangre': Persona._meta.get_field('rh').choices,
        'parentescos': Acudiente._meta.get_field('parentesco').choices,
        'tipos_identidad': Persona._meta.get_field('tipo_identidad').choices,
        'edad': edad,
        'talla_ropa': TALLA_ROPA,
        'pie_dom': PIE_DOM,
        'ano_siguiente': ano_siguiente,
    }
    return render(request, 'renovacion/datos.html', context)


def renovacion_logout(request):
    #Cerrar sesión de renovación
    if 'renovacion_alumno_id' in request.session:
        del request.session['renovacion_alumno_id']
    if 'renovacion_codigo' in request.session:
        del request.session['renovacion_codigo']
    messages.info(request, 'Sesión cerrada correctamente')
    return redirect('renovacion:login')