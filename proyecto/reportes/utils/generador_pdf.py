from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.pdfgen import canvas
from datetime import datetime
import os
from django.conf import settings

def generar_certificado_individual(datos_alumno, datos_reporte):
    """
    Genera un certificado PDF para un alumno individual
    
    Args:
        datos_alumno: dict con información del alumno
        datos_reporte: dict con estadísticas del reporte
    
    Returns:
        ruta del archivo PDF generado
    """
    # Crear directorio para PDFs si no existe
    pdf_dir = os.path.join(settings.MEDIA_ROOT, 'certificados')
    os.makedirs(pdf_dir, exist_ok=True)
    
    # Nombre del archivo
    fecha_actual = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"certificado_{datos_alumno['id_persona']}_{fecha_actual}.pdf"
    filepath = os.path.join(pdf_dir, filename)
    
    # Crear el PDF
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )
    
    # Contenedor para los elementos
    elements = []
    
    # Estilos
    styles = getSampleStyleSheet()
    
    # Estilo para el título
    titulo_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#0e245c'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    # Estilo para subtítulos
    subtitulo_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#1976d2'),
        spaceAfter=20,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    # Estilo para el cuerpo
    cuerpo_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=12,
        textColor=colors.black,
        spaceAfter=12,
        alignment=TA_JUSTIFY,
        leading=18
    )
    
    # Estilo centrado
    centrado_style = ParagraphStyle(
        'CustomCenter',
        parent=styles['BodyText'],
        fontSize=12,
        textColor=colors.black,
        spaceAfter=12,
        alignment=TA_CENTER
    )
    
    # Estilo para datos importantes
    datos_style = ParagraphStyle(
        'CustomDatos',
        parent=styles['BodyText'],
        fontSize=11,
        textColor=colors.HexColor('#263a5e'),
        spaceAfter=8,
        alignment=TA_LEFT,
        leftIndent=40
    )
    
    # ENCABEZADO
    elements.append(Spacer(1, 0.5*inch))
    
    # Título principal
    titulo = Paragraph("CLUB DEPORTIVO ATLÉTICO SANTANDER", titulo_style)
    elements.append(titulo)
    elements.append(Spacer(1, 0.3*inch))
    
    # Subtítulo
    subtitulo = Paragraph("CERTIFICADO DEPORTIVO.", subtitulo_style)
    elements.append(subtitulo)
    elements.append(Spacer(1, 0.4*inch))
    
    # Texto principal
    texto_principal = f"""
    El Club Deportivo Atlético Santander certifica que el(la) alumno(a):
    """
    elements.append(Paragraph(texto_principal, cuerpo_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # DATOS DEL ALUMNO
    nombre_completo = f"<b>{datos_alumno['nombre_completo']}</b>"
    elements.append(Paragraph(nombre_completo, centrado_style))
    elements.append(Spacer(1, 0.1*inch))
    
    # Información del alumno
    info_alumno = f"""
    <b>Tipo de Identificación:</b> {datos_alumno['tipo_identificacion']}<br/>
    <b>Número de Identificación:</b> {datos_alumno['numero_identificacion']}<br/>
    <b>Categoría:</b> {datos_alumno['categoria']}
    """
    elements.append(Paragraph(info_alumno, datos_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # Texto de certificación
    texto_certificacion = f"""
    Ha participado activamente en las actividades deportivas del club durante el período 
    comprendido entre el <b>{datos_reporte['fecha_inicio']}</b> y el <b>{datos_reporte['fecha_fin']}</b>, 
    demostrando los siguientes resultados:
    """
    elements.append(Paragraph(texto_certificacion, cuerpo_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # TABLA DE ESTADÍSTICAS
    data_tabla = [
        ['CONCEPTO', 'RESULTADO'],
        ['Total de Entrenamientos', str(datos_reporte['total_entrenamientos'])],
        ['Asistencias Registradas', str(datos_reporte['total_asistencias'])],
        ['Porcentaje de Asistencia', f"{datos_reporte['porcentaje_asistencia']}%"],
        ['Objetivos Evaluados', str(datos_reporte['total_objetivos_evaluados'])],
        ['Objetivos Cumplidos', str(datos_reporte['total_objetivos_cumplidos'])],
        ['Porcentaje de Objetivos Cumplidos', f"{datos_reporte['porcentaje_objetivos']}%"],
    ]
    
    tabla = Table(data_tabla, colWidths=[8*cm, 6*cm])
    tabla.setStyle(TableStyle([
        # Encabezado
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        
        # Cuerpo
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f4f6fb')),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#263a5e')),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('ALIGN', (1, 1), (1, -1), 'CENTER'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 11),
        ('TOPPADDING', (0, 1), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 10),
        ('LEFTPADDING', (0, 1), (-1, -1), 15),
        ('RIGHTPADDING', (0, 1), (-1, -1), 15),
        
        # Bordes
        ('GRID', (0, 0), (-1, -1), 1, colors.white),
        ('BOX', (0, 0), (-1, -1), 2, colors.HexColor('#1976d2')),
        
        # Resaltar porcentajes
        ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#e3f2fd')),
        ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#e3f2fd')),
        ('FONTNAME', (1, 3), (1, 3), 'Helvetica-Bold'),
        ('FONTNAME', (1, 6), (1, 6), 'Helvetica-Bold'),
    ]))
    
    elements.append(tabla)
    elements.append(Spacer(1, 0.4*inch))
    
    # Texto de valoración según porcentajes
    if datos_reporte['porcentaje_asistencia'] >= 80 and datos_reporte['porcentaje_objetivos'] >= 80:
        valoracion = "El deportista ha demostrado un <b>rendimiento EXCELENTE</b>, cumpliendo satisfactoriamente con los objetivos propuestos y manteniendo una asistencia destacada."
    elif datos_reporte['porcentaje_asistencia'] >= 60 and datos_reporte['porcentaje_objetivos'] >= 60:
        valoracion = "El deportista ha demostrado un <b>rendimiento BUENO</b>, cumpliendo con los objetivos propuestos y manteniendo una asistencia regular."
    else:
        valoracion = "El deportista ha participado en las actividades programadas durante el período indicado."
    
    elements.append(Paragraph(valoracion, cuerpo_style))
    elements.append(Spacer(1, 0.5*inch))
    
    # Fecha de expedición
    fecha_expedicion = datetime.now().strftime('%d de %B de %Y')
    meses_es = {
        'January': 'enero', 'February': 'febrero', 'March': 'marzo',
        'April': 'abril', 'May': 'mayo', 'June': 'junio',
        'July': 'julio', 'August': 'agosto', 'September': 'septiembre',
        'October': 'octubre', 'November': 'noviembre', 'December': 'diciembre'
    }
    for mes_en, mes_es in meses_es.items():
        fecha_expedicion = fecha_expedicion.replace(mes_en, mes_es)
    
    texto_fecha = f"Expedido en Vélez, Santander, el día {fecha_expedicion}"
    elements.append(Paragraph(texto_fecha, centrado_style))
    elements.append(Spacer(1, 0.6*inch))
    
    # NUEVA: Imagen de la firma del director
    ruta_firma = os.path.join(settings.BASE_DIR, 'partida', 'static', 'partida', 'img', 'firmaDirector.png')
    if os.path.exists(ruta_firma):
        firma_img = Image(ruta_firma, width=4*cm, height=2*cm)
        firma_img.hAlign = 'CENTER'
        elements.append(firma_img)
        elements.append(Spacer(1, 0.1*inch))
    
    # Línea de firma
    linea_firma = "_" * 40
    elements.append(Paragraph(linea_firma, centrado_style))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("<b>Mateo Pérez</b>", centrado_style))
    elements.append(Paragraph("Administrador Club Deportivo Atlético Santander", centrado_style))
    
    # Construir el PDF
    doc.build(elements, onFirstPage=agregar_marca_agua, onLaterPages=agregar_marca_agua)
    
    return filepath

def agregar_marca_agua(canvas, doc):
    """Agrega marca de agua y borde decorativo al PDF"""
    canvas.saveState()
    
    # NUEVA: Agregar logo como marca de agua de fondo
    ruta_logo = os.path.join(settings.BASE_DIR, 'partida', 'static', 'partida', 'img', 'logo_club.png')
    
    if os.path.exists(ruta_logo):
        # Calcular posición centrada para el logo
        ancho_pagina = A4[0]
        alto_pagina = A4[1]
        
        # Tamaño grande para la marca de agua (70% del ancho de la página)
        ancho_logo = ancho_pagina * 0.7
        alto_logo = ancho_logo  # Asumiendo que el logo es cuadrado, ajusta si es necesario
        
        # Posición centrada
        x_logo = (ancho_pagina - ancho_logo) / 2
        y_logo = (alto_pagina - alto_logo) / 2
        
        # Dibujar el logo con transparencia
        canvas.setFillAlpha(0.08)  # 8% de opacidad para que sea sutil
        canvas.drawImage(
            ruta_logo,
            x_logo,
            y_logo,
            width=ancho_logo,
            height=alto_logo,
            mask='auto',
            preserveAspectRatio=True
        )
        canvas.setFillAlpha(1)  # Restaurar opacidad normal
    
    # Borde decorativo
    canvas.setStrokeColor(colors.HexColor('#1976d2'))
    canvas.setLineWidth(3)
    canvas.rect(1.5*cm, 1.5*cm, A4[0]-3*cm, A4[1]-3*cm, stroke=1, fill=0)
    
    # Línea decorativa interior
    canvas.setStrokeColor(colors.HexColor('#ff5252'))
    canvas.setLineWidth(1)
    canvas.rect(1.7*cm, 1.7*cm, A4[0]-3.4*cm, A4[1]-3.4*cm, stroke=1, fill=0)
    
    canvas.restoreState()