from django.shortcuts import render, get_object_or_404, redirect
from partida.models import Persona, Alumno, Matricula, Categoria, Posicion, Acudiente
from partida.other import obtener_informacion
from django.http import JsonResponse
from django.core.mail import send_mail
from datetime import datetime, date, timedelta
from django.contrib import messages
from django.db import transaction
from django.contrib.auth.decorators import login_required
import random, string
import json
import os
from django.conf import settings
from django.core.exceptions import ValidationError

# Carnet :c
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A6, A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO

from emails.views import send_aceptado_email, send_rechazado_email, send_fin_periodo_email, send_carnet_email
from partida.views import prevent_cache 


# ----------------- FUNCIONES AUXILIARES -----------------
def calcular_edad(fecha_nacimiento):
    today = date.today()
    edad = today.year - fecha_nacimiento.year
    if (today.month, today.day) < (fecha_nacimiento.month, fecha_nacimiento.day):
        edad -= 1
    return edad

def categoria_edad(edad):
    if 4 <= edad <= 7:
        return 1
    elif 8 <= edad <= 11:
        return 2
    elif 12 <= edad <= 15:
        return 3
    elif 16 <= edad <= 17:
        return 4
    elif 18 <= edad <= 25:
        return 5
    return None

def generar_codigo(length=8):
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=length))

def verificar_vencimiento_matriculas():
    """Verifica y marca códigos vencidos"""
    fecha_limite = date.today() - timedelta(days=15)
    
    matriculas_vencer = Matricula.objects.filter(
        fecha_codigo__lte=fecha_limite,
        codigo_fin_periodo__isnull=False,
        estado_matricula=False
    ).exclude(codigo_fin_periodo__startswith='VENCIDO-')
    
    for matricula in matriculas_vencer:
        matricula.codigo_fin_periodo = f"VENCIDO-{matricula.codigo_fin_periodo}"
        matricula.save()
        
# ----------------- FUNCIÓN PARA GENERAR CARNET (TEMPORAL) -----------------
@login_required
def generar_pdf_carnet(alumno):
    """Genera un PDF con el carnet del alumno - DISEÑO MEJORADO Y ORGANIZADO"""
    try:
        # Crear buffer para el PDF
        buffer = BytesIO()
        
        # Tamaño de carnet (A6 horizontal)
        width, height = A6
        width, height = height, width  # Cambiar a horizontal
        
        c = canvas.Canvas(buffer, pagesize=(width, height))
        
        # Configuración
        c.setTitle(f"Carnet - {alumno.fk_persona_alumno.nom1_persona} {alumno.fk_persona_alumno.ape1_persona}")
        
        # ========== FONDO ==========
        # Fondo principal
        c.setFillColorRGB(0.95, 0.97, 1.0)  # Azul muy claro
        c.rect(0, 0, width, height, fill=1, stroke=0)
        
        # Header con color corporativo
        c.setFillColorRGB(0.1, 0.3, 0.6)  # Azul oscuro
        c.rect(0, height-20*mm, width, 20*mm, fill=1, stroke=0)
        
        # ========== ENCABEZADO ==========
        c.setFillColorRGB(1, 1, 1)  # Blanco
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(width/2, height-12*mm, "CLUB DEPORTIVO ATLÉTICO")
        
        c.setFillColorRGB(0.8, 0.9, 1.0)  # Azul claro
        c.setFont("Helvetica", 8)
        c.drawCentredString(width/2, height-16*mm, "CARNET DE IDENTIFICACIÓN")
        
        # ========== FOTO DEL ALUMNO ==========
        photo_size = 25*mm
        photo_x = width - photo_size - 8*mm
        photo_y = height - 50*mm
        
        # Marco de la foto
        c.setStrokeColorRGB(0.1, 0.3, 0.6)
        c.setLineWidth(1)
        c.rect(photo_x-1*mm, photo_y-1*mm, photo_size+2*mm, photo_size+2*mm, fill=0, stroke=1)
        
        # Intentar cargar la foto si existe
        try:
            if alumno.foto and hasattr(alumno.foto, 'path') and os.path.exists(alumno.foto.path):
                img = ImageReader(alumno.foto.path)
                c.drawImage(img, photo_x, photo_y, width=photo_size, height=photo_size, mask='auto')
            else:
                # Placeholder elegante
                c.setFillColorRGB(0.9, 0.95, 1.0)
                c.rect(photo_x, photo_y, photo_size, photo_size, fill=1, stroke=0)
                c.setFillColorRGB(0.5, 0.5, 0.5)
                c.setFont("Helvetica", 12)
                c.drawCentredString(photo_x + photo_size/2, photo_y + photo_size/2 + 2*mm, "👤")
                c.setFont("Helvetica", 6)
                c.drawCentredString(photo_x + photo_size/2, photo_y + photo_size/2 - 3*mm, "SIN FOTO")
        except Exception as e:
            print(f"Error cargando foto: {e}")
            # Placeholder en caso de error
            c.setFillColorRGB(0.9, 0.95, 1.0)
            c.rect(photo_x, photo_y, photo_size, photo_size, fill=1, stroke=0)
        
        # ========== INFORMACIÓN PRINCIPAL ==========
        info_x = 8*mm
        info_y = height - 45*mm
        
        # Nombre completo (destacado)
        nombre_completo = f"{alumno.fk_persona_alumno.nom1_persona} {alumno.fk_persona_alumno.ape1_persona}"
        c.setFillColorRGB(0.1, 0.1, 0.1)  # Negro
        c.setFont("Helvetica-Bold", 12)
        c.drawString(info_x, info_y, nombre_completo)
        
        # Línea separadora
        c.setStrokeColorRGB(0.1, 0.3, 0.6)
        c.setLineWidth(0.5)
        c.line(info_x, info_y-2*mm, info_x + 45*mm, info_y-2*mm)
        
        # ========== SECCIÓN 1: INFORMACIÓN BÁSICA ==========
        seccion1_y = info_y - 8*mm
        
        # ID
        c.setFillColorRGB(0.2, 0.2, 0.2)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(info_x, seccion1_y, "IDENTIFICACIÓN:")
        c.setFont("Helvetica", 8)
        c.drawString(info_x + 25*mm, seccion1_y, str(alumno.fk_persona_alumno.id_persona))
        
        # Categoría
        try:
            matricula_actual = Matricula.objects.filter(fk_alumno=alumno, estado_matricula=True).first()
            if matricula_actual:
                c.setFont("Helvetica-Bold", 8)
                c.drawString(info_x, seccion1_y - 5*mm, "CATEGORÍA:")
                c.setFont("Helvetica", 8)
                c.drawString(info_x + 25*mm, seccion1_y - 5*mm, matricula_actual.fk_categoria.nom_categoria)
        except:
            pass
        
        # Posición
        if alumno.fk_posicion:
            c.setFont("Helvetica-Bold", 8)
            c.drawString(info_x, seccion1_y - 10*mm, "POSICIÓN:")
            c.setFont("Helvetica", 8)
            c.drawString(info_x + 25*mm, seccion1_y - 10*mm, alumno.fk_posicion.nom_posicion)
        
        # ========== SECCIÓN 2: DATOS PERSONALES ==========
        seccion2_y = seccion1_y - 15*mm
        
        # Fecha de Nacimiento
        if alumno.fk_persona_alumno.fecha_nacimiento:
            c.setFont("Helvetica-Bold", 8)
            c.drawString(info_x, seccion2_y, "FECHA NACIMIENTO:")
            c.setFont("Helvetica", 8)
            c.drawString(info_x + 30*mm, seccion2_y, alumno.fk_persona_alumno.fecha_nacimiento.strftime("%d/%m/%Y"))
        
        # RH
        if alumno.fk_persona_alumno.rh:
            c.setFont("Helvetica-Bold", 8)
            c.drawString(info_x, seccion2_y - 5*mm, "TIPO SANGRE:")
            c.setFont("Helvetica", 8)
            c.drawString(info_x + 30*mm, seccion2_y - 5*mm, alumno.fk_persona_alumno.rh)
        
        # ========== SECCIÓN 3: CONTACTO EMERGENCIA ==========
        contacto_y = 25*mm
        
        # Fondo para sección de contacto
        c.setFillColorRGB(0.1, 0.3, 0.6)
        c.rect(5*mm, 8*mm, width-10*mm, 15*mm, fill=1, stroke=0)
        
        c.setFillColorRGB(1, 1, 1)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(8*mm, contacto_y, "CONTACTO DE EMERGENCIA")
        
        if alumno.fk_acudiente:
            c.setFont("Helvetica", 7)
            acudiente_nombre = f"{alumno.fk_acudiente.nom1_acudiente} {alumno.fk_acudiente.ape1_acudiente}"
            # Nombre acudiente
            c.drawString(8*mm, contacto_y - 5*mm, acudiente_nombre[:28])
            
            # Teléfono y parentesco en misma línea si hay espacio
            if alumno.fk_acudiente.tel_acudiente and alumno.fk_acudiente.parentesco:
                c.drawString(8*mm, contacto_y - 10*mm, f"📞 {alumno.fk_acudiente.tel_acudiente} | 👪 {alumno.fk_acudiente.parentesco}")
            else:
                if alumno.fk_acudiente.tel_acudiente:
                    c.drawString(8*mm, contacto_y - 10*mm, f"📞 {alumno.fk_acudiente.tel_acudiente}")
                if alumno.fk_acudiente.parentesco:
                    c.drawString(8*mm, contacto_y - 10*mm, f"👪 {alumno.fk_acudiente.parentesco}")
        
        # ========== INFORMACIÓN ADICIONAL ==========
        # Fecha de expedición
        c.setFillColorRGB(0.4, 0.4, 0.4)
        c.setFont("Helvetica", 6)
        c.drawRightString(width-8*mm, 5*mm, f"Expedido: {datetime.now().strftime('%d/%m/%Y')}")
        
        # ID pequeño
        c.drawString(8*mm, 5*mm, f"ID: {alumno.fk_persona_alumno.id_persona}")
        
        # ========== BORDES DECORATIVOS ==========
        # Borde exterior
        c.setStrokeColorRGB(0.1, 0.3, 0.6)
        c.setLineWidth(2)
        c.rect(2*mm, 2*mm, width-4*mm, height-4*mm, fill=0, stroke=1)
        
        # Línea separadora entre header y contenido
        c.setStrokeColorRGB(0.8, 0.9, 1.0)
        c.setLineWidth(1)
        c.line(0, height-20*mm, width, height-20*mm)
        
        # ========== GUARDAR PDF ==========
        c.showPage()
        c.save()
        
        # Obtener los datos del buffer
        pdf_data = buffer.getvalue()
        buffer.close()
        
        print(f"Carnet generado exitosamente para {alumno.fk_persona_alumno.nom1_persona}")
        return pdf_data
        
    except Exception as e:
        print(f"Error generando PDF")
        return generar_pdf_simple_organizado(alumno)

@login_required
def generar_pdf_simple_organizado(alumno):
    """Genera un PDF simple pero bien organizado en caso de error"""
    buffer = BytesIO()
    width, height = A6
    width, height = height, width  # Horizontal
    
    c = canvas.Canvas(buffer, pagesize=(width, height))
    
    # Fondo
    c.setFillColorRGB(0.95, 0.97, 1.0)
    c.rect(0, 0, width, height, fill=1, stroke=0)
    
    # Header
    c.setFillColorRGB(0.1, 0.3, 0.6)
    c.rect(0, height-15*mm, width, 15*mm, fill=1, stroke=0)
    
    # Título
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(width/2, height-9*mm, "CLUB DEPORTIVO ATLÉTICO")
    
    # Información organizada
    c.setFillColorRGB(0.1, 0.1, 0.1)
    nombre_completo = f"{alumno.fk_persona_alumno.nom1_persona} {alumno.fk_persona_alumno.ape1_persona}"
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width/2, height-35*mm, nombre_completo)
    
    c.setFont("Helvetica", 10)
    c.drawCentredString(width/2, height-45*mm, f"ID: {alumno.fk_persona_alumno.id_persona}")
    
    # Fecha
    c.setFont("Helvetica", 8)
    c.drawCentredString(width/2, 8*mm, f"Expedido: {datetime.now().strftime('%d/%m/%Y')}")
    
    # Borde
    c.setStrokeColorRGB(0.1, 0.3, 0.6)
    c.setLineWidth(2)
    c.rect(3*mm, 3*mm, width-6*mm, height-6*mm, fill=0, stroke=1)
    
    c.showPage()
    c.save()
    
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data

# ----------------- FUNCIÓN PARA GUARDAR ARCHIVOS -----------------
@login_required
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

# ----------------- VISTA TERMINAR PERIODO -----------------
@login_required
def terminar_periodo(request):
    if request.method == 'POST':
        try:
            matriculas_ids = request.POST.getlist('matriculas[]')
            anio_actual = date.today().year
            resultados = []

            for m_id in matriculas_ids:
                # Asegurarnos que es matrícula del año actual y activa
                matricula = Matricula.objects.filter(
                    idmatricula=m_id, 
                    fecha_inicio__year=anio_actual,
                    estado_matricula=True
                ).first()
                
                if not matricula:
                    resultados.append({'id': m_id, 'status': 'no encontrada o ya inactiva'})
                    continue

                try:
                    with transaction.atomic():
                        # Desactivar matrícula
                        matricula.estado_matricula = False
                        matricula.fecha_terminacion = datetime.now()

                        # Generar código único
                        codigo = generar_codigo()
                        matricula.codigo_fin_periodo = codigo
                        matricula.fecha_codigo = date.today()
                        matricula.save()

                        # Enviar correo (manejar posibles errores)
                        try:
                            email_destino = matricula.fk_alumno.fk_persona_alumno.email_persona
                            if email_destino:
                                send_fin_periodo_email(matricula)
                            else:
                                print(f"No hay email para matrícula {m_id}")
                        except Exception as email_error:
                            print(f"Error enviando email para {m_id}: {email_error}")
                        resultados.append({'id': m_id, 'status': 'éxito', 'codigo': codigo})
                        
                except Exception as e:
                    error_msg = f'error: {str(e)}'
                    print(f"Error procesando matrícula {m_id}: {error_msg}")
                    resultados.append({'id': m_id, 'status': error_msg})

            return JsonResponse({'resultados': resultados})

        except Exception as e:
            return JsonResponse({'error': f'Error general: {str(e)}'}, status=500)
        
    return JsonResponse({'error': 'Método no permitido'}, status=405)

# ----------------- VISTA PARA OBTENER MATRÍCULAS EN JSON -----------------
@login_required
def get_matriculas_json(request):
    """Vista que devuelve las matrículas en formato JSON"""
    anio = datetime.now().year
    info_u = obtener_informacion(request.user)

    if info_u['tipo_personal'] == 'Administrador':
        matriculas = Matricula.objects.filter(fecha_inicio__year=anio).select_related(
            'fk_alumno__fk_persona_alumno', 'fk_categoria'
        )
    else:
        categoriasU = [c[0] for c in info_u.get('categorias', [])]
        matriculas = Matricula.objects.filter(fk_categoria__idcategoria__in=categoriasU, fecha_inicio__year=anio).select_related(
            'fk_alumno__fk_persona_alumno', 'fk_categoria'
        )

    # Preparar datos para JSON
    matriculas_data = []
    for m in matriculas:
        matriculas_data.append({
            'idmatricula': m.idmatricula,
            'fk_categoria': {'idcategoria': m.fk_categoria.idcategoria},
            'estado_matricula': m.estado_matricula,
            'fk_alumno': {
                'fk_persona_alumno': {
                    'nom1_persona': m.fk_alumno.fk_persona_alumno.nom1_persona,
                    'ape1_persona': m.fk_alumno.fk_persona_alumno.ape1_persona,
                    'email_persona': m.fk_alumno.fk_persona_alumno.email_persona
                }
            }
        })

    return JsonResponse(matriculas_data, safe=False)

# ----------------- VISTA PRINCIPAL DE MATRÍCULA -----------------
@login_required
@prevent_cache
def matricula(request):
    verificar_vencimiento_matriculas()
    
    # POST acciones
    if request.method == 'POST':
        action = request.POST.get('action')
        try:
            if action == 'accept':
                # aceptar postulante
                id_persona = request.POST.get('id_persona')
                fk_categoria = request.POST.get('fk_categoria')  # opcional
                alumno = get_object_or_404(Alumno, fk_persona_alumno__id=id_persona)
                
                with transaction.atomic():
                    alumno.estado_alumno = True
                    alumno.postulante = False
                    alumno.save()

                    # determinar categoría
                    if fk_categoria:
                        categoria = Categoria.objects.get(pk=fk_categoria)
                    else:
                        edad = calcular_edad(alumno.fk_persona_alumno.fecha_nacimiento)
                        cat_id = categoria_edad(edad)
                        categoria = Categoria.objects.get(idcategoria=cat_id) if cat_id else None

                    Matricula.objects.create(
                        fk_alumno=alumno,
                        fecha_inicio=datetime.now(),
                        fecha_terminacion=None,
                        estado_matricula=True,
                        codigo_fin_periodo=None,
                        fk_categoria=categoria
                    )
                    
                    # ENVIAR CORREO DE ACEPTACIÓN
                    try:
                        if alumno.fk_persona_alumno.email_persona:
                            send_aceptado_email(alumno, categoria)
                            messages.success(request, f"{alumno.fk_persona_alumno.nom1_persona} aceptado y correo enviado.")
                        else:
                            messages.success(request, f"{alumno.fk_persona_alumno.nom1_persona} aceptado (sin email para notificación).")
                    except Exception as e:
                        messages.success(request, f"{alumno.fk_persona_alumno.nom1_persona} aceptado (error enviando email: {str(e)})")
                
                return redirect('matricula')

            elif action == 'reject':
                id_persona = request.POST.get('id_persona')
                alumno = get_object_or_404(Alumno, fk_persona_alumno__id=id_persona)
                alumno.estado_alumno = False
                alumno.postulante = False
                alumno.save()
                
                # ENVIAR CORREO DE RECHAZO
                try:
                    if alumno.fk_persona_alumno.email_persona:
                        send_rechazado_email(alumno)
                        messages.error(request, f"{alumno.fk_persona_alumno.nom1_persona} rechazado y correo enviado.")
                    else:
                        messages.error(request, f"{alumno.fk_persona_alumno.nom1_persona} rechazado (sin email para notificación).")
                except Exception as e:
                    messages.error(request, f"{alumno.fk_persona_alumno.nom1_persona} rechazado (error enviando email: {str(e)})")
                
                return redirect('matricula')
            
            elif action == 'change_state':
                id_matricula = request.POST.get('id_matricula')
                nuevo_estado = request.POST.get('nuevo_estado')
                matricula = get_object_or_404(Matricula, idmatricula=id_matricula)
                matricula.estado_matricula = True if nuevo_estado == 'true' else False
                matricula.save()
                messages.info(request, f"Estado de matrícula de {matricula.fk_alumno.fk_persona_alumno.nom1_persona} actualizado.")
                return redirect('matricula')
            
            elif action == 'generate_carnet':
                # Generar y enviar carnet por email
                id_persona = request.POST.get('persona_id')
                alumno = get_object_or_404(Alumno, fk_persona_alumno__id_persona=id_persona)
                
                try:
                    # Generar el PDF del carnet
                    pdf_carnet = generar_pdf_carnet(alumno)
                    
                    if alumno.fk_persona_alumno.email_persona:
                        send_carnet_email(alumno, pdf_carnet)
                        messages.success(request, f"Carnet enviado por email a {alumno.fk_persona_alumno.nom1_persona}")
                    else:
                        messages.warning(request, f"No hay email para enviar el carnet a {alumno.fk_persona_alumno.nom1_persona}")
                        
                except Exception as e:
                    messages.error(request, f"Error generando carnet: {str(e)}")
                
                return redirect('matricula')

            elif action == 'edit':
                try:
                    with transaction.atomic():
                        persona_id = request.POST.get('persona_id')
                        idacudiente_actual = request.POST.get('idacudiente_actual')
                        idacudiente_nuevo = request.POST.get('idacudiente')
                        matricula_id = request.POST.get('idmatricula')

                        # ========== ACTUALIZAR PERSONA ==========
                        persona = get_object_or_404(Persona, id_persona=persona_id)
                        
                        # Campos EDITABLES de persona
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

                        #ACTUALIZAR ALUMNO
                        alumno = get_object_or_404(Alumno, fk_persona_alumno=persona)
                        
                        # Medidas físicas
                        if request.POST.get('altura_metros'):
                            altura_str = request.POST.get('altura_metros').replace(',', '.')
                            alumno.altura_metros = float(altura_str)
                        if request.POST.get('peso_medidas'):
                            peso_str = request.POST.get('peso_medidas').replace(',', '.')
                            alumno.peso_medidas = float(peso_str)
                        if request.POST.get('imc_medidas'):
                            imc_str = request.POST.get('imc_medidas').replace(',', '.')
                            alumno.imc_medidas = float(imc_str)
                        if request.POST.get('talla'):
                            alumno.talla = request.POST.get('talla')
                        if request.POST.get('calzado'):
                            alumno.calzado = int(request.POST.get('calzado'))
                        if request.POST.get('pie_dominante'):
                            alumno.pie_dominante = request.POST.get('pie_dominante')
                        if request.POST.get('fk_posicion'):
                            alumno.fk_posicion_id = request.POST.get('fk_posicion')
                        
                        alumno.save()

                        #ACTUALIZAR ACUDIENTE
                        acudiente = None
                        
                        # Verificar si se cambio el ID del acudiente
                        if idacudiente_nuevo and idacudiente_nuevo != idacudiente_actual:
                            # Se cambio crear nuevo acudiente o usar existente
                            try:
                                # Buscar si ya existe un acudiente con el nuevo ID
                                acudiente = Acudiente.objects.get(idacudiente=idacudiente_nuevo)
                            except Acudiente.DoesNotExist:
                                # Crear nuevo acudiente
                                acudiente = Acudiente.objects.create(
                                    idacudiente=idacudiente_nuevo,
                                    nom1_acudiente=request.POST.get('nom1_acudiente', ''),
                                    nom2_acudiente=request.POST.get('nom2_acudiente', ''),
                                    ape1_acudiente=request.POST.get('ape1_acudiente', ''),
                                    ape2_acudiente=request.POST.get('ape2_acudiente', ''),
                                    tel_acudiente=request.POST.get('tel_acudiente', ''),
                                    email_acudiente=request.POST.get('email_acudiente', ''),
                                    parentesco=request.POST.get('parentesco', '')
                                )
                        else:
                            # Usar el acudiente actual y actualizar sus datos
                            acudiente = get_object_or_404(Acudiente, idacudiente=idacudiente_actual)

                        # Actualizar datos del acudiente (tanto para nuevo como existente)
                        if acudiente:
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
                            
                            # Asignar el acudiente al alumno
                            alumno.fk_acudiente = acudiente
                            alumno.save()

                        #ACTUALIZAR MATRÍCULA
                        if matricula_id:
                            matricula = get_object_or_404(Matricula, idmatricula=matricula_id)
                            if request.POST.get('fk_categoria'):
                                matricula.fk_categoria_id = request.POST.get('fk_categoria')
                            matricula.save()

                        #PROCESAR ARCHIVOS (solo autorización médica y EPS)
                        archivos_guardados = {}
                        archivos_map = {
                            'automedica': 'autoMedica',
                            'certeps': 'certEps'
                        }
                        
                        for campo, carpeta in archivos_map.items():
                            archivo = request.FILES.get(campo)
                            if archivo:
                                try:
                                    ruta = guardar_archivo(archivo, carpeta, persona_id)
                                    archivos_guardados[campo] = ruta
                                    
                                    # Actualizar el campo correspondiente en el alumno
                                    if campo == 'automedica':
                                        alumno.automedica = ruta
                                    elif campo == 'certeps':
                                        alumno.certeps = ruta
                                        
                                except Exception as e:
                                    messages.error(request, f"Error con {campo}: {str(e)}")
                                    #permitir que continúe con otros campos
                        
                        if archivos_guardados:
                            alumno.save()

                        messages.success(request, f"Datos de {persona.nom1_persona} actualizados correctamente.")
                        
                except Exception as e:
                    messages.error(request, f"Error al actualizar: {str(e)}")
                
                return redirect('matricula')

            else:
                messages.warning(request, "Acción no reconocida.")
                return redirect('matricula')

        except Exception as e:
            messages.error(request, f"Ocurrió un error: {str(e)}")
            return redirect('matricula')

    # GET: preparar datos para render
    anio = datetime.now().year
    info_u = obtener_informacion(request.user)

    if info_u['tipo_personal'] == 'Administrador':
        allMatriculas = Matricula.objects.filter(fecha_inicio__year=anio).select_related(
            'fk_alumno__fk_persona_alumno', 'fk_categoria', 'fk_alumno__fk_posicion', 'fk_alumno__fk_acudiente'
        )
        allPostulantes = Alumno.objects.filter(postulante=True, estado_alumno=False).select_related(
            'fk_persona_alumno', 'fk_acudiente', 'fk_posicion'
        )
    else:
        categoriasU = [c[0] for c in info_u.get('categorias', [])]
        allMatriculas = Matricula.objects.filter(fk_categoria__idcategoria__in=categoriasU, fecha_inicio__year=anio).select_related(
            'fk_alumno__fk_persona_alumno', 'fk_categoria', 'fk_alumno__fk_posicion', 'fk_alumno__fk_acudiente'
        )
        allPostulantes = Alumno.objects.none()

    categorias = Categoria.objects.all()
    posiciones = Posicion.objects.all()
    tipos_identidad_all = Persona._meta.get_field('tipo_identidad').choices
    tipos_identidad = [par for par in tipos_identidad_all if par[0] != 'TI']
    generos = Persona._meta.get_field('genero').choices
    eps = Persona._meta.get_field('eps').choices
    tipos_sangre = Persona._meta.get_field('rh').choices
    parentescos = Acudiente._meta.get_field('parentesco').choices
    talla_ropa = Alumno._meta.get_field('talla').choices
    pie_dom = Alumno._meta.get_field('pie_dominante').choices
    
    categorias_usuario = categorias  # default para admin
    if info_u['tipo_personal'] != 'Administrador':
        categorias_usuario = Categoria.objects.filter(idcategoria__in=[c[0] for c in info_u.get('categorias', [])])

    return render(request, 'matricula.html', {
        'allMatriculas': allMatriculas,
        'allPostulantes': allPostulantes,
        'categorias': categorias,
        'posiciones': posiciones,
        'tipos_identidad': tipos_identidad,
        'generos': generos,
        'eps': eps,
        'tipos_sangre': tipos_sangre,
        'parentescos': parentescos,
        'talla_ropa': talla_ropa,
        'pie_dom': pie_dom,
        'categorias_usuario': categorias_usuario,
    })
    