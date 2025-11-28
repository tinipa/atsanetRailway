from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.db.models import Q
from django.db import transaction
from datetime import date, datetime
# importar modelos
from partida.models import Matricula, Alumno, Persona, Categoria, Posicion, Acudiente
# importar funciones matricula
from matricula.views import calcular_edad, categoria_edad

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
    #Vista donde el alumno ve sus datos y puede renovar matrícula
    
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
    
    if request.method == 'POST':
        try:
            with transaction.atomic():
                #VALIDAR DOCUMENTOS OBLIGATORIOS
                documentos_obligatorios = ['tradatos', 'foto', 'automedica', 'certeps']
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
                
                #ACTUALIZAR DOCUMENTOS
                documentos = ['tradatos', 'foto', 'automedica', 'certeps', 'otraescuela']
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
                
                #USAR LA CATEGORÍA SELECCIONADA O LA SUGERIDA POR EDAD
                categoria_id = request.POST.get('categoria')
                if not categoria_id and categoria_sugerida:
                    categoria_id = categoria_sugerida.idcategoria
                
                # Si no se seleccionó categoría y no hay sugerida, usar la función categoria_edad
                if not categoria_id:
                    cat_id_auto = categoria_edad(edad)
                    if cat_id_auto:
                        categoria_id = cat_id_auto
                    else:
                        # Si no hay categoría por edad, usar la primera disponible
                        primera_categoria = Categoria.objects.first()
                        if primera_categoria:
                            categoria_id = primera_categoria.idcategoria
                
                #VALIDAR CAMPOS OBLIGATORIOS
                campos_obligatorios = {
                    'eps': 'EPS',
                    'direc_persona': 'Dirección',
                    'tel_persona': 'Teléfono',
                    'email_persona': 'Email',
                    'categoria': 'Categoría',
                    'posicion': 'Posición',
                    'tel_acudiente': 'Teléfono del acudiente'
                }
                
                for campo, nombre in campos_obligatorios.items():
                    if not request.POST.get(campo):
                        messages.error(request, f'El campo {nombre} es obligatorio')
                        return redirect('renovacion:datos')
                
                #VALIDAR FORMATOS
                # Validar teléfono (10 dígitos)
                telefono = request.POST.get('tel_persona')
                if telefono and (not telefono.isdigit() or len(telefono) != 10):
                    messages.error(request, 'El teléfono debe tener exactamente 10 dígitos')
                    return redirect('renovacion:datos')
                
                telefono_acudiente = request.POST.get('tel_acudiente')
                if telefono_acudiente and (not telefono_acudiente.isdigit() or len(telefono_acudiente) != 10):
                    messages.error(request, 'El teléfono del acudiente debe tener exactamente 10 dígitos')
                    return redirect('renovacion:datos')
                
                # Validar email
                email = request.POST.get('email_persona')
                if email and '@' not in email:
                    messages.error(request, 'El formato del email es inválido')
                    return redirect('renovacion:datos')
                
                #VALIDAR DATOS NUMERICOS
                altura = request.POST.get('altura')
                if altura:
                    try:
                        altura_num = float(altura.replace(',', '.'))
                        if altura_num < 0.5 or altura_num > 2.5:
                            messages.error(request, 'La altura debe estar entre 0.5 y 2.5 metros')
                            return redirect('renovacion:datos')
                    except ValueError:
                        messages.error(request, 'La altura debe ser un número válido')
                        return redirect('renovacion:datos')
                
                peso = request.POST.get('peso')
                if peso:
                    try:
                        peso_num = float(peso.replace(',', '.'))
                        if peso_num < 10 or peso_num > 150:
                            messages.error(request, 'El peso debe estar entre 10 y 150 kg')
                            return redirect('renovacion:datos')
                    except ValueError:
                        messages.error(request, 'El peso debe ser un número válido')
                        return redirect('renovacion:datos')
                
                calzado = request.POST.get('calzado')
                if calzado:
                    try:
                        calzado_num = int(calzado)
                        if calzado_num < 15 or calzado_num > 50:
                            messages.error(request, 'La talla de calzado debe estar entre 15 y 50')
                            return redirect('renovacion:datos')
                    except ValueError:
                        messages.error(request, 'La talla de calzado debe ser un número válido')
                        return redirect('renovacion:datos')
                
                
                #Crear matrícula para el año siguiente
                fecha_inicio_ano_siguiente = datetime(obtener_ano_siguiente(), 1, 1) 
                
                nueva_matricula = Matricula.objects.create(
                    fk_alumno=alumno,
                    fk_categoria_id=categoria_id,
                    fecha_inicio=fecha_inicio_ano_siguiente,
                    estado_matricula=1,  # 1 = activa
                    codigo_fin_periodo=None
                )
                
                #ACTUALIZAR DATOS EDITABLES DEL ALUMNO
                if request.POST.get('posicion'):
                    alumno.fk_posicion_id = request.POST.get('posicion')
                
                #Convertir comas a puntos antes de guardar
                if request.POST.get('altura'):
                    try:
                        altura_valor = request.POST.get('altura').replace(',', '.')
                        alumno.altura_metros = float(altura_valor) if altura_valor else None
                    except (ValueError, TypeError):
                        alumno.altura_metros = None
                
                if request.POST.get('peso'):
                    try:
                        peso_valor = request.POST.get('peso').replace(',', '.')
                        alumno.peso_medidas = float(peso_valor) if peso_valor else None
                    except (ValueError, TypeError):
                        alumno.peso_medidas = None
                
                if request.POST.get('talla'):
                    alumno.talla = request.POST.get('talla')
                
                if request.POST.get('calzado'):
                    try:
                        calzado_valor = request.POST.get('calzado')
                        alumno.calzado = int(calzado_valor) if calzado_valor else None
                    except (ValueError, TypeError):
                        alumno.calzado = None
                
                if request.POST.get('pie_dominante'):
                    alumno.pie_dominante = request.POST.get('pie_dominante')
                
                #Calcular IMC automáticamente
                try:
                    altura_valor = request.POST.get('altura', '').replace(',', '.')
                    peso_valor = request.POST.get('peso', '').replace(',', '.')
                    
                    if altura_valor and peso_valor:
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
                
                #ACTUALIZAR DATOS EDITABLES DE LA PERSONA
                if request.POST.get('nom1_persona'):
                    persona.nom1_persona = request.POST.get('nom1_persona')
                if request.POST.get('nom2_persona'):
                    persona.nom2_persona = request.POST.get('nom2_persona')
                if request.POST.get('ape1_persona'):
                    persona.ape1_persona = request.POST.get('ape1_persona')
                if request.POST.get('ape2_persona'):
                    persona.ape2_persona = request.POST.get('ape2_persona')
                if request.POST.get('direc_persona'):
                    persona.direc_persona = request.POST.get('direc_persona')
                if request.POST.get('tel_persona'):
                    persona.tel_persona = request.POST.get('tel_persona')
                if request.POST.get('email_persona'):
                    persona.email_persona = request.POST.get('email_persona')
                if request.POST.get('genero'):
                    persona.genero = request.POST.get('genero')
                if request.POST.get('eps'):
                    persona.eps = request.POST.get('eps')
                persona.save()
                
                #ACTUALIZAR ACUDIENTE SI EXISTE
                if alumno.fk_acudiente:
                    acudiente = alumno.fk_acudiente
                    if request.POST.get('nom1_acudiente'):
                        acudiente.nom1_acudiente = request.POST.get('nom1_acudiente')
                    if request.POST.get('nom2_acudiente'):
                        acudiente.nom2_acudiente = request.POST.get('nom2_acudiente')
                    if request.POST.get('ape1_acudiente'):
                        acudiente.ape1_acudiente = request.POST.get('ape1_acudiente')
                    if request.POST.get('ape2_acudiente'):
                        acudiente.ape2_acudiente = request.POST.get('ape2_acudiente')
                    if request.POST.get('tel_acudiente'):
                        acudiente.tel_acudiente = request.POST.get('tel_acudiente')
                    if request.POST.get('email_acudiente'):
                        acudiente.email_acudiente = request.POST.get('email_acudiente')
                    if request.POST.get('parentesco'):
                        acudiente.parentesco = request.POST.get('parentesco')
                    acudiente.save()
                
                #LIMPIAR SESIÓN
                if 'renovacion_alumno_id' in request.session:
                    del request.session['renovacion_alumno_id']
                if 'renovacion_codigo' in request.session:
                    del request.session['renovacion_codigo']
                
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