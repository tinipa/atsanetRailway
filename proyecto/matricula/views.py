# hola :D
from django.shortcuts import render, get_object_or_404, redirect
from partida.models import Persona, Alumno, Matricula, Categoria, Posicion, Acudiente, CalificacionObjetivos, Asistencia
from partida.other import obtener_informacion
from django.http import JsonResponse, HttpResponse
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

# hola :D
# Carnet :c
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A6, A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO

from emails.views import send_aceptado_email, send_rechazado_email_con_mensaje, send_fin_periodo_email, send_carnet_email, send_rechazados_email_masivo
from partida.views import prevent_cache 

# hola :D
def calcular_estadisticas_matricula(matricula):
    """
    Calcula estadísticas para una matrícula
    Retorna: dict con % asistencia, % objetivos, calificación
    """
    try:
        # Obtener todas las asistencias del alumno (sin límite de fecha)
        asistencias = Asistencia.objects.filter(
            fk_matricula_ms=matricula
        )
        
        total_entrenamientos = asistencias.count()
        
        if total_entrenamientos == 0:
            return {
                'porcentaje_asistencia': 0,
                'porcentaje_objetivos': 0,
                'calificacion_general': 0,
                'total_entrenamientos': 0,
                'total_asistencias': 0,
                'total_objetivos_evaluados': 0,
                'total_objetivos_cumplidos': 0,
                'rendimiento': 'Sin datos'
            }
        
        # Calcular asistencia
        total_asistencias = asistencias.filter(asistencia=1).count()
        porcentaje_asistencia = (total_asistencias / total_entrenamientos * 100)
        
        # Calcular objetivos
        calificaciones = CalificacionObjetivos.objects.filter(
            fk_asistencia__in=asistencias,
            objetivo_evaluado=True
        )
        
        total_objetivos_evaluados = calificaciones.count()
        
        if total_objetivos_evaluados == 0:
            porcentaje_objetivos = 0
            total_objetivos_cumplidos = 0
        else:
            total_objetivos_cumplidos = calificaciones.filter(evaluacion=True).count()
            porcentaje_objetivos = (total_objetivos_cumplidos / total_objetivos_evaluados * 100)
        
        # Calificar rendimiento general (40% asistencia, 60% objetivos)
        calificacion_general = (porcentaje_asistencia * 0.4) + (porcentaje_objetivos * 0.6)
        
        # Determinar nivel de rendimiento
        if calificacion_general >= 80:
            rendimiento = 'Excelente'
        elif calificacion_general >= 60:
            rendimiento = 'Regular'
        else:
            rendimiento = 'Bajo'
        
        return {
            'porcentaje_asistencia': round(porcentaje_asistencia, 1),
            'porcentaje_objetivos': round(porcentaje_objetivos, 1),
            'calificacion_general': round(calificacion_general, 1),
            'total_entrenamientos': total_entrenamientos,
            'total_asistencias': total_asistencias,
            'total_objetivos_evaluados': total_objetivos_evaluados,
            'total_objetivos_cumplidos': total_objetivos_cumplidos,
            'rendimiento': rendimiento
        }
        
    except Exception as e:
        print(f"Error calculando estadísticas para matrícula {matricula.idmatricula}: {e}")
        return {
            'porcentaje_asistencia': 0,
            'porcentaje_objetivos': 0,
            'calificacion_general': 0,
            'rendimiento': 'Error'
        }


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

# Añade esta función a tu views.py para generar HTML del carnet
def generar_html_carnet(alumno):
    """Genera HTML del carnet para vista previa con el diseño exacto de la imagen"""
    try:
        # Obtener la matrícula actual del alumno
        matricula_actual = Matricula.objects.filter(
            fk_alumno=alumno, 
            estado_matricula=True
        ).first()
        
        # Obtener la categoría
        categoria_nombre = matricula_actual.fk_categoria.nom_categoria if matricula_actual else 'No asignada'
        
        # Obtener datos básicos
        nombre_completo = f"{alumno.fk_persona_alumno.nom1_persona} {alumno.fk_persona_alumno.ape1_persona}"
        posicion = alumno.fk_posicion.nom_posicion if alumno.fk_posicion else 'No asignada'
        
        # Formatear fecha de nacimiento
        fecha_nacimiento = ''
        if alumno.fk_persona_alumno.fecha_nacimiento:
            fecha_nacimiento = alumno.fk_persona_alumno.fecha_nacimiento.strftime('%d/%m/%Y')
        
        # Obtener datos del acudiente
        contacto_emergencia = ''
        if alumno.fk_acudiente:
            nombre_acudiente = f"{alumno.fk_acudiente.nom1_acudiente} {alumno.fk_acudiente.ape1_acudiente}"
            telefono_acudiente = alumno.fk_acudiente.tel_acudiente or 'No disponible'
            parentesco = alumno.fk_acudiente.parentesco or 'No especificado'
            contacto_emergencia = f"{nombre_acudiente} | {telefono_acudiente} | {parentesco}"
        
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Carnet - {nombre_completo}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: Arial, Helvetica, sans-serif;
            background: white;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }}
        
        /* CONTENEDOR PRINCIPAL - Exacto como la imagen */
        .carnet-container {{
            width: 350px;
            background: white;
            border: 3px solid #1a237e;
            border-radius: 5px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.15);
            position: relative;
            overflow: hidden;
        }}
        
        /* ENCABEZADO AZUL - Igual que la imagen */
        .carnet-header {{
            background: #1a237e;
            color: white;
            padding: 15px;
            text-align: center;
            border-bottom: 2px solid white;
        }}
        
        .club-nombre {{
            font-size: 18px;
            font-weight: bold;
            letter-spacing: 1px;
            margin-bottom: 3px;
        }}
        
        .carnet-titulo {{
            font-size: 14px;
            opacity: 0.95;
        }}
        
        /* CONTENIDO PRINCIPAL */
        .carnet-content {{
            padding: 20px;
        }}
        
        /* NOMBRE DEL ALUMNO - Centrado y grande */
        .nombre-alumno {{
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #1a237e;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        
        /* INFORMACIÓN EN GRID - Igual que la imagen */
        .info-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }}
        
        .info-item {{
            display: flex;
            flex-direction: column;
        }}
        
        .info-label {{
            font-size: 11px;
            color: #666;
            font-weight: bold;
            margin-bottom: 3px;
            text-transform: uppercase;
        }}
        
        .info-value {{
            font-size: 13px;
            color: #333;
            font-weight: normal;
            padding: 4px 0;
        }}
        
        /* LÍNEA DIVISORIA - Exacta como la imagen */
        .divider {{
            height: 1px;
            background: linear-gradient(to right, transparent, #1a237e, transparent);
            margin: 20px 0;
        }}
        
        /* SECCIÓN DEL ACUDIENTE - Estilo exacto */
        .acudiente-section {{
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
        }}
        
        .acudiente-title {{
            font-size: 12px;
            color: #1a237e;
            font-weight: bold;
            margin-bottom: 8px;
        }}
        
        .acudiente-info {{
            font-size: 11px;
            color: #333;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }}
        
        .acudiente-nombre {{
            font-weight: bold;
        }}
        
        /* PIE DEL CARNET - Exacto como la imagen */
        .carnet-footer {{
            background: #f0f0f0;
            padding: 12px 20px;
            text-align: center;
            border-top: 2px solid #1a237e;
            font-size: 11px;
            color: #555;
        }}
        
        .id-number {{
            font-size: 12px;
            font-weight: bold;
            color: #1a237e;
            margin-bottom: 5px;
        }}
        
        .expedido {{
            font-size: 10px;
            color: #777;
        }}
        
        /* BADGE DE ID - En la esquina superior derecha */
        .badge-id {{
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(255, 255, 255, 0.9);
            color: #1a237e;
            padding: 3px 8px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: bold;
            border: 1px solid #1a237e;
        }}
        
        /* BOTONES DE ACCIÓN */
        .action-buttons {{
            margin-top: 25px;
            display: flex;
            gap: 10px;
            justify-content: center;
        }}
        
        .action-btn {{
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: bold;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 5px;
        }}
        
        .btn-print {{
            background: #2196F3;
            color: white;
        }}
        
        .btn-close {{
            background: #f44336;
            color: white;
        }}
        
        .action-btn:hover {{
            opacity: 0.9;
            transform: translateY(-2px);
        }}
        
        /* ESTILOS PARA IMPRESIÓN */
        @media print {{
            body {{
                padding: 0;
                background: white;
            }}
            
            .carnet-container {{
                border: 2px solid #1a237e;
                box-shadow: none;
                margin: 0;
                width: 100%;
            }}
            
            .action-buttons {{
                display: none !important;
            }}
            
            .badge-id {{
                background: white;
            }}
        }}
        
        /* COLORES PARA DIFERENTES TIPOS DE INFORMACIÓN */
        .blood-type {{
            color: #d32f2f;
            font-weight: bold;
        }}
        
        .category {{
            color: #388e3c;
            font-weight: bold;
        }}
        
        .position {{
            color: #1976d2;
            font-weight: bold;
        }}
        
        /* ESTILO PARA VALORES VACÍOS */
        .empty-value {{
            color: #999;
            font-style: italic;
        }}
    </style>
</head>
<body>
    <div class="carnet-container">
        <!-- Badge con ID -->
        <div class="badge-id">ID: {alumno.fk_persona_alumno.id_persona}</div>
        
        <!-- ENCABEZADO AZUL -->
        <div class="carnet-header">
            <div class="club-nombre">CLUB DEPORTIVO ATLÉTICO</div>
            <div class="carnet-titulo">CARNET DE IDENTIFICACIÓN</div>
        </div>
        
        <!-- CONTENIDO PRINCIPAL -->
        <div class="carnet-content">
            <!-- NOMBRE DEL ALUMNO -->
            <div class="nombre-alumno">{nombre_completo}</div>
            
            <!-- INFORMACIÓN EN GRID DE 2 COLUMNAS -->
            <div class="info-grid">
                <!-- COLUMNA IZQUIERDA -->
                <div class="info-item">
                    <div class="info-label">IDENTIFICACIÓN</div>
                    <div class="info-value">{alumno.fk_persona_alumno.id_persona}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">CATEGORÍA</div>
                    <div class="info-value category">{categoria_nombre}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">POSICIÓN</div>
                    <div class="info-value position">{posicion}</div>
                </div>
                
                <!-- COLUMNA DERECHA -->
                <div class="info-item">
                    <div class="info-label">FECHA NACIMIENTO</div>
                    <div class="info-value">{fecha_nacimiento or 'No registrada'}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">TIPO SANGRE</div>
                    <div class="info-value blood-type">{alumno.fk_persona_alumno.rh or 'No registrado'}</div>
                </div>
            </div>
            
            <!-- LÍNEA DIVISORIA -->
            <div class="divider"></div>
            
            <!-- INFORMACIÓN DEL ACUDIENTE -->
            <div class="acudiente-section">
                <div class="acudiente-title">ACUDIENTE / CONTACTO</div>
                <div class="acudiente-info">
                    {contacto_emergencia if contacto_emergencia else 
                     '<span class="empty-value">No hay información de contacto</span>'}
                </div>
            </div>
        </div>
        <!-- PIE DEL CARNET -->
        <div class="carnet-footer">
            <div class="id-number">ID: {alumno.fk_persona_alumno.id_persona}</div>
            <div class="expedido">Expedido: {datetime.now().strftime('%d/%m/%Y')}</div>
        </div>
    </div>

    <!-- BOTONES DE ACCIÓN -->
    <div class="action-buttons">
        <button class="action-btn btn-close" onclick="window.close()">
            <span>❌</span> Cerrar
        </button>
    </div>

    <script>
        // Auto-ajustar si la ventana es muy pequeña
        window.addEventListener('resize', function() {{
            if (window.innerWidth < 400) {{
                document.querySelector('.carnet-container').style.width = '95%';
            }} else {{
                document.querySelector('.carnet-container').style.width = '350px';
            }}
        }});
        
        // Inicializar ancho correcto
        if (window.innerWidth < 400) {{
            document.querySelector('.carnet-container').style.width = '95%';
        }}
    </script>
</body>
</html>
"""
        return html
        
    except Exception as e:
        print(f"Error generando HTML del carnet: {e}")
        # HTML de error simple
        return f"""
<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body style="padding: 50px; text-align: center; font-family: Arial;">
    <div style="background: #ffebee; border: 2px solid #f44336; padding: 30px; border-radius: 10px;">
        <h2 style="color: #d32f2f;">⚠️ Error al generar el carnet</h2>
        <p style="color: #666; margin: 15px 0;">{str(e)}</p>
        <p style="color: #777; margin: 15px 0;">Por favor, verifique que el alumno tenga todos los datos requeridos.</p>
        <button onclick="window.close()" style="
            background: #1a237e;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
        ">Cerrar</button>
    </div>
</body>
</html>
"""

# Añade esta vista para la vista previa
@login_required
def preview_carnet(request):
    """Muestra una vista previa del carnet en HTML"""
    try:
        alumno_id = request.GET.get('alumno_id')
        if not alumno_id:
            return HttpResponse("ID de alumno no proporcionado", status=400)
        
        # Buscar al alumno
        alumno = get_object_or_404(Alumno, fk_persona_alumno__id_persona=alumno_id)
        
        # Generar el HTML del carnet
        html_carnet = generar_html_carnet(alumno)
        
        # Devolver como HTML
        return HttpResponse(html_carnet, content_type='text/html')
        
    except Exception as e:
        error_html = f"""
        <!DOCTYPE html>
        <html>
        <head><title>Error</title></head>
        <body style="padding: 50px; text-align: center;">
            <h2>❌ Error al generar vista previa</h2>
            <p>{str(e)}</p>
            <button onclick="window.close()">Cerrar</button>
        </body>
        </html>
        """
        return HttpResponse(error_html, status=500)
    
# ----------------- FUNCIÓN PARA GUARDAR ARCHIVOS -----------------
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

# ================= NUEVAS FUNCIONES PARA KANBAN Y LÍMITES =================
@login_required
def obtener_datos_categorias(request):
    """Obtiene datos de categorías para el modal de límites"""
    try:
        categorias = Categoria.objects.all()
        categorias_data = []
        
        for cat in categorias:
            categorias_data.append({
                'idcategoria': cat.idcategoria,
                'nom_categoria': cat.nom_categoria,
                'alumnos_actuales': cat.alumnos_actuales(),
                'limite_alumnos': cat.limite_alumnos,
                'cupos_disponibles': cat.cupos_disponibles()
            })
        
        return JsonResponse({
            'success': True,
            'categorias': categorias_data
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
def actualizar_limite_categoria(request):
    """Actualiza el límite de una categoría individual"""
    if request.method == 'POST':
        try:
            categoria_id = request.POST.get('categoria_id')
            nuevo_limite = int(request.POST.get('nuevo_limite'))
            
            categoria = get_object_or_404(Categoria, idcategoria=categoria_id)
            
            # Verificar que el nuevo límite no sea menor que los alumnos actuales
            alumnos_actuales = categoria.alumnos_actuales()
            
            if nuevo_limite < alumnos_actuales:
                return JsonResponse({
                    'success': False,
                    'error': f'No se puede establecer un límite ({nuevo_limite}) menor que los alumnos actuales ({alumnos_actuales})'
                })
            
            # Actualizar límite
            categoria.limite_alumnos = nuevo_limite
            categoria.save()
            
            return JsonResponse({
                'success': True,
                'message': f'Límite actualizado para {categoria.nom_categoria}: {nuevo_limite} alumnos'
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)

@login_required
def actualizar_limites_masivo(request):
    """Actualiza múltiples límites de categorías a la vez"""
    if request.method == 'POST':
        try:
            cambios = json.loads(request.POST.get('cambios', '[]'))
            resultados = []
            
            with transaction.atomic():
                for cambio in cambios:
                    categoria = get_object_or_404(Categoria, idcategoria=cambio['id'])
                    alumnos_actuales = categoria.alumnos_actuales()
                    
                    if cambio['limite'] < alumnos_actuales:
                        resultados.append({
                            'id': cambio['id'],
                            'status': 'error',
                            'message': f'Límite ({cambio["limite"]}) < Alumnos actuales ({alumnos_actuales})'
                        })
                    else:
                        categoria.limite_alumnos = cambio['limite']
                        categoria.save()
                        resultados.append({
                            'id': cambio['id'],
                            'status': 'success',
                            'message': f'Actualizado a {cambio["limite"]}'
                        })
            
            exitosos = [r for r in resultados if r['status'] == 'success']
            
            return JsonResponse({
                'success': True,
                'message': f'Actualizados {len(exitosos)} de {len(resultados)} límites',
                'resultados': resultados
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)

@login_required
def obtener_resumen_categorias(request):
    """Obtiene resumen de categorías para mostrar en tarjetas"""
    try:
        categorias = Categoria.objects.all()
        resumen_data = []
        
        for cat in categorias:
            alumnos_actuales = cat.alumnos_actuales()
            limite = cat.limite_alumnos
            cupos_disponibles = cat.cupos_disponibles()
            
            # Calcular porcentaje
            porcentaje = (alumnos_actuales / limite * 100) if limite > 0 else 0
            
            # Determinar clase CSS según el porcentaje
            if porcentaje >= 95:
                clase_color = 'bg-danger'
            elif porcentaje >= 80:
                clase_color = 'bg-warning'
            else:
                clase_color = 'bg-success'
            
            resumen_data.append({
                'id': cat.idcategoria,
                'nombre': cat.nom_categoria,
                'actuales': alumnos_actuales,
                'limite': limite,
                'cupos': cupos_disponibles,
                'porcentaje': round(porcentaje, 1),
                'clase_color': clase_color,
                'texto': f"{alumnos_actuales}/{limite}"
            })
        
        return JsonResponse({
            'success': True,
            'resumen': resumen_data
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


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
                id_persona = request.POST.get('id_persona')
                alumno = get_object_or_404(Alumno, fk_persona_alumno__id=id_persona)
                
                with transaction.atomic():
                    # Calcular categoría automáticamente por edad
                    edad = calcular_edad(alumno.fk_persona_alumno.fecha_nacimiento)
                    cat_id = categoria_edad(edad)
                    
                    if cat_id:
                        categoria = Categoria.objects.get(idcategoria=cat_id)
                        
                        # VERIFICAR LÍMITE DE CUPOS
                        if categoria.cupos_disponibles() <= 0:
                            messages.warning(request, f"No hay cupos disponibles en {categoria.nom_categoria}. Límite alcanzado: {categoria.limite_alumnos}")
                            return redirect('matricula')
                        
                        alumno.estado_alumno = True
                        alumno.postulante = False
                        alumno.save()

                        Matricula.objects.create(
                            fk_alumno=alumno,
                            fecha_inicio=datetime.now(),
                            fecha_terminacion=None,
                            estado_matricula=True,
                            codigo_fin_periodo=None,
                            fk_categoria=categoria
                        )
                        
                        # Generar el PDF del carnet
                        pdf_carnet = generar_pdf_carnet(alumno)
                        mensaje_carnet = "y carnet enviado" if pdf_carnet else "(carnet no enviado - sin email)"
                        # ENVIAR CORREO DE ACEPTACIÓN
                        try:
                            if alumno.fk_persona_alumno.email_persona:
                                send_aceptado_email(alumno, categoria, pdf_carnet)
                                messages.success(request, f"{alumno.fk_persona_alumno.nom1_persona} aceptado en {categoria.nom_categoria} {mensaje_carnet}. Cupos restantes: {categoria.cupos_disponibles()}")
                            else:
                                messages.success(request, f"{alumno.fk_persona_alumno.nom1_persona} aceptado en {categoria.nom_categoria} (sin email). Cupos restantes: {categoria.cupos_disponibles()}")
                        except Exception as e:
                            messages.success(request, f"{alumno.fk_persona_alumno.nom1_persona} aceptado en {categoria.nom_categoria} (error email). Cupos restantes: {categoria.cupos_disponibles()}")
                    else:
                        messages.error(request, f"{alumno.fk_persona_alumno.nom1_persona} no tiene edad para ninguna categoría disponible")
                        return redirect('matricula')
                
                return redirect('matricula')


            elif action == 'reject':
                id_persona = request.POST.get('id_persona')
                mensaje_rechazo = request.POST.get('mensaje_rechazo', '')  # <- AGREGAR ESTA LÍNEA
                alumno = get_object_or_404(Alumno, fk_persona_alumno__id=id_persona)
                alumno.estado_alumno = False
                alumno.postulante = False
                alumno.save()
                
                # ENVIAR CORREO DE RECHAZO CON MENSAJE
                try:
                    if alumno.fk_persona_alumno.email_persona:
                        # Necesitas modificar send_rechazado_email para aceptar 2 parámetros
                        # O crear una función nueva
                        send_rechazados_email_masivo([alumno], mensaje_rechazo)
                        if mensaje_rechazo:
                            messages.error(request, f"{alumno.fk_persona_alumno.nom1_persona} rechazado. Correo enviado con mensaje personalizado.")
                        else:
                            messages.error(request, f"{alumno.fk_persona_alumno.nom1_persona} rechazado. Correo enviado.")
                    else:
                        if mensaje_rechazo:
                            messages.error(request, f"{alumno.fk_persona_alumno.nom1_persona} rechazado. Motivo: {mensaje_rechazo} (sin email para notificación).")
                        else:
                            messages.error(request, f"{alumno.fk_persona_alumno.nom1_persona} rechazado (sin email para notificación).")
                except Exception as e:
                    messages.error(request, f"{alumno.fk_persona_alumno.nom1_persona} rechazado (error enviando email: {str(e)})")
                
                return redirect('matricula')
            
            # ===== NUEVOS CASOS PARA KANBAN =====
            # views.py - Modifica las acciones dentro del if request.method == 'POST':
            elif action == 'accept_multiple':
                # Aceptar múltiples postulantes - CON ENVÍO DE CORREOS
                ids = request.POST.getlist('ids[]')
                enviar_carnet_auto = request.POST.get('enviar_carnet_auto', 'false') == 'true'
                aceptados = []
                rechazados_limite = 0
                carnets_enviados = 0
                correos_enviados = 0
                
                for id_persona in ids:
                    try:
                        alumno = get_object_or_404(Alumno, fk_persona_alumno__id=id_persona)
                        
                        # Calcular categoría automáticamente por edad
                        edad = calcular_edad(alumno.fk_persona_alumno.fecha_nacimiento)
                        cat_id = categoria_edad(edad)
                        
                        if cat_id:
                            categoria = Categoria.objects.get(idcategoria=cat_id)
                            
                            # VERIFICAR LÍMITE DE CUPOS
                            if categoria.cupos_disponibles() <= 0:
                                rechazados_limite += 1
                                continue  # Saltar este postulante
                            
                            with transaction.atomic():
                                alumno.estado_alumno = True
                                alumno.postulante = False
                                alumno.save()

                                Matricula.objects.create(
                                    fk_alumno=alumno,
                                    fecha_inicio=datetime.now(),
                                    fecha_terminacion=None,
                                    estado_matricula=True,
                                    codigo_fin_periodo=None,
                                    fk_categoria=categoria
                                )
                                
                                aceptados.append(alumno)
                                pdf_carnet = generar_pdf_carnet(alumno)
                                
                                # Enviar correo de aceptación INDIVIDUAL (como ya lo haces)
                                try:
                                    if alumno.fk_persona_alumno.email_persona:
                                        send_aceptado_email(alumno, categoria, pdf_carnet)
                                        correos_enviados += 1
                                except Exception as email_error:
                                    print(f"Error enviando email a {alumno.fk_persona_alumno.nom1_persona}: {email_error}")  
                                
                    except Exception as e:
                        print(f"Error aceptando postulante {id_persona}: {e}")
                                
                if rechazados_limite > 0:
                    messages.warning(request, f"{rechazados_limite} postulantes no pudieron ser aceptados por falta de cupos")
                
                if len(aceptados) > 0:
                    mensaje = f"{len(aceptados)} postulantes aceptados exitosamente"
                    if correos_enviados > 0:
                        mensaje += f" ({correos_enviados} correos enviados)"
                    if carnets_enviados > 0:
                        mensaje += f" (se enviaron {carnets_enviados} carnets)"
                    messages.success(request, mensaje)
                else:
                    messages.warning(request, "No se pudo aceptar ningún postulante (verifique cupos disponibles)")
                
                return redirect('matricula')

            # En el action == 'reject_multiple' (ya existe, modifícalo):
            elif action == 'reject_multiple':
                # Rechazar múltiples postulantes - CON ENVÍO DE CORREOS
                ids = request.POST.getlist('ids[]')
                mensaje_rechazo = request.POST.get('mensaje_rechazo', '')
                rechazados = []
                correos_enviados = 0
                
                for id_persona in ids:
                    try:
                        alumno = get_object_or_404(Alumno, fk_persona_alumno__id=id_persona)
                        alumno.estado_alumno = False
                        alumno.postulante = False
                        alumno.save()
                        rechazados.append(alumno)
                        
                        # Enviar correo de rechazo INDIVIDUAL (como ya lo haces)
                        try:
                            if alumno.fk_persona_alumno.email_persona:
                                send_rechazados_email_masivo(rechazados, mensaje_rechazo)
                                correos_enviados += 1
                        except Exception as email_error:
                            print(f"Error enviando email de rechazo a {alumno.fk_persona_alumno.nom1_persona}: {email_error}")
                            
                    except Exception as e:
                        print(f"Error rechazando postulante {id_persona}: {e}")
                
                mensaje_error = f"{len(rechazados)} postulantes rechazados exitosamente"
                messages.success(request, mensaje_error)
                return redirect('matricula')
            
            elif action == 'change_state':
                id_matricula = request.POST.get('id_matricula')
                nuevo_estado = request.POST.get('nuevo_estado')
                matricula = get_object_or_404(Matricula, idmatricula=id_matricula)
                
                # Verificar que no tenga código (no esté terminada)
                if matricula.codigo_fin_periodo is not None:
                    messages.warning(request, f"No se puede cambiar estado de {matricula.fk_alumno.fk_persona_alumno.nom1_persona} porque su período ya terminó.")
                    return redirect('matricula')
                
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

    # ========== NUEVO: AGREGAR ESTADÍSTICAS A CADA MATRÍCULA ==========
    for matricula in allMatriculas:
        # Agregar estadísticas como atributo del objeto matricula
        matricula.estadisticas = calcular_estadisticas_matricula(matricula)
        # También puedes agregarlas como atributo del alumno si prefieres
        matricula.fk_alumno.estadisticas = matricula.estadisticas

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

    # Obtener matrículas del año siguiente para renovaciones
    anio_actual = datetime.now().year
    anio_siguiente = anio_actual + 1

    # Matrículas que YA renovaron para el próximo año
    matriculas_renovadas = Matricula.objects.filter(
        fecha_inicio__year=anio_siguiente,
        estado_matricula=True
    ).select_related(
        'fk_alumno__fk_persona_alumno',
        'fk_categoria'
    ).order_by('-fecha_inicio')

    # Matrículas con período terminado (con código pero NO renovaron)
    matriculas_terminadas = allMatriculas.filter(
        codigo_fin_periodo__isnull=False
    ).exclude(
        fk_alumno__in=matriculas_renovadas.values_list('fk_alumno', flat=True)
    )

    # Preparar datos para renovaciones
    renovaciones = []
    for matricula in matriculas_renovadas:
        # Buscar matrícula del año anterior
        matricula_anterior = Matricula.objects.filter(
            fk_alumno=matricula.fk_alumno,
            fecha_inicio__year=anio_actual
        ).first()
        
        renovaciones.append({
            'alumno': matricula.fk_alumno,
            'matricula_anterior': matricula_anterior,
            'matricula_actual': matricula,
            'fecha_renovacion': matricula.fecha_inicio,
            'categoria_anterior': matricula_anterior.fk_categoria.nom_categoria if matricula_anterior else 'No registrada',
            'categoria_actual': matricula.fk_categoria.nom_categoria
        })

    # Preparar datos para alumnos terminados
    alumnos_terminados = []
    for matricula in matriculas_terminadas:
        alumnos_terminados.append({
            'alumno': matricula.fk_alumno,
            'matricula': matricula,
            'codigo': matricula.codigo_fin_periodo,
            'fecha_terminacion': matricula.fecha_terminacion,
            'categoria': matricula.fk_categoria.nom_categoria,
            'estado_codigo': 'VENCIDO' if 'VENCIDO' in matricula.codigo_fin_periodo else 'VIGENTE'
        })

    # Calcular contadores
    contador_activos = allMatriculas.filter(estado_matricula=True).count()
    contador_inactivos = allMatriculas.filter(estado_matricula=False).count()
    contador_renovados = matriculas_renovadas.count()
    contador_terminados = matriculas_terminadas.count()

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
        'anio_siguiente': anio_siguiente,
        'anio_actual': anio_actual,
        'renovaciones': renovaciones,
        'alumnos_terminados': alumnos_terminados,
        'contador_activos': contador_activos,
        'contador_inactivos': contador_inactivos,
        'contador_renovados': contador_renovados,
        'contador_terminados': contador_terminados,
    })