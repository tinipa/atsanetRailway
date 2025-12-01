from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from datetime import timedelta

def send_aceptado_email(alumno, categoria):
    """Envía email cuando un postulante es aceptado"""
    context = {
        'alumno_nombre': alumno.fk_persona_alumno.nom1_persona,
        'alumno_apellido': alumno.fk_persona_alumno.ape1_persona,
        'categoria_nombre': categoria.nom_categoria,
        'fecha_inicio': '23 de Enero 2024',
        'horario': 'Martes, jueves y sábados: 2:00 p.m. - 4:00 p.m.',
        'lugar': 'Sede Principal - Cancha Sintética'
    }
    
    html_content = render_to_string('emails/aceptado.html', context)
    text_content = strip_tags(html_content)
    
    email = EmailMultiAlternatives(
        subject='¡Felicidades! Has sido aceptado en el Club Deportivo Atletico Santander',
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[alumno.fk_persona_alumno.email_persona],
        reply_to=[settings.DEFAULT_FROM_EMAIL]
    )
    email.attach_alternative(html_content, "text/html")
    return email.send()

def send_rechazado_email_con_mensaje(alumno, mensaje_personalizado=""):
    """Envía email de rechazo con mensaje personalizado opcional"""
    context = {
        'alumno_nombre': alumno.fk_persona_alumno.nom1_persona,
        'alumno_apellido': alumno.fk_persona_alumno.ape1_persona,
        'mensaje_personalizado': mensaje_personalizado if mensaje_personalizado else None
    }
    
    html_content = render_to_string('emails/rechazado_con_mensaje.html', context)
    text_content = strip_tags(html_content)
    
    email = EmailMultiAlternatives(
        subject='Información sobre tu postulación - Club Deportivo Atletico Santander',
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[alumno.fk_persona_alumno.email_persona],
        reply_to=[settings.DEFAULT_FROM_EMAIL]
    )
    email.attach_alternative(html_content, "text/html")
    return email.send()

def send_fin_periodo_email(matricula):
    """Envía email con código de renovación al terminar período"""
    fecha_vencimiento = (matricula.fecha_codigo + timedelta(days=15)).strftime("%d/%m/%Y")
    
    context = {
        'alumno_nombre': matricula.fk_alumno.fk_persona_alumno.nom1_persona,
        'codigo': matricula.codigo_fin_periodo,
        'fecha_vencimiento': fecha_vencimiento,
        'periodo_renovacion': 'Enero 15 a Enero 30 del proximo año',
    }   
    
    html_content = render_to_string('emails/fin_periodo.html', context)
    text_content = strip_tags(html_content)
    
    email = EmailMultiAlternatives(
        subject='Código de Renovación - Club Deportivo Atletico Santander',
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[matricula.fk_alumno.fk_persona_alumno.email_persona],
        reply_to=[settings.DEFAULT_FROM_EMAIL]
    )
    email.attach_alternative(html_content, "text/html")
    return email.send()

def send_carnet_email(alumno, pdf_carnet):
    """Envía email con el carnet adjunto"""
    context = {
        'alumno_nombre': alumno.fk_persona_alumno.nom1_persona,
        'alumno_apellido': alumno.fk_persona_alumno.ape1_persona,
    }
    
    html_content = render_to_string('emails/carnet.html', context)
    text_content = strip_tags(html_content)
    
    email = EmailMultiAlternatives(
        subject='Carnet - Club Deportivo Atletico Santander',
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[alumno.fk_persona_alumno.email_persona],
        reply_to=[settings.DEFAULT_FROM_EMAIL]
    )
    email.attach_alternative(html_content, "text/html")
    
    # Adjuntar el PDF del carnet
    email.attach(f'carnet_{alumno.fk_persona_alumno.id_persona}.pdf', pdf_carnet, 'application/pdf')
    
    return email.send()