# partida/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import PersonalT, PersonalJornadaCategoria

#Funcion para guardar todos los datos del la sesion iniciada y enlazandolos con sus categoias
def obtener_informacion(user):
    datosAutenticado = {
        'nombre_apellido': None,
        'id': None,
        'tipo_personal': None,
        'estado': None,
        'categorias': [],
        'administrador': False,
    }

    if user.is_authenticated:
        try:
            persona = user.persona
            nombre_apellido = f"{persona.nom1_persona} {persona.ape1_persona}"

            personalt = persona.personalt
            tipo_personal = personalt.tipo_personal
            estado = personalt.estado

            '''
            allcategorias = personalt.personaljornadacategoria_set.all()
            categorias = [(c.fk_categoria.idcategoria, c.fk_categoria.nom_categoria) for c in allcategorias]
            '''

            allcategorias = PersonalJornadaCategoria.objects.filter(fk_personal=personalt).select_related('fk_categoria')
            categorias = [(c.fk_categoria.idcategoria, c.fk_categoria.nom_categoria) for c in allcategorias]

            administrador = len(categorias) == 0

            datosAutenticado = {
                'nombre_apellido': nombre_apellido,
                'id':personalt,
                'tipo_personal': tipo_personal,
                'estado': estado,
                'categorias': categorias,
                'administrador': administrador,
            }
        except Exception as e:
            print("error:", e)

    return datosAutenticado


#Señal para guardar a un personal_t con estado = 1, esto se hace de forma automatica cada vez que se le cambia el estado
#SIGNALS
@receiver(post_save, sender=PersonalT)
def crear_o_actualizar_usuario(sender, instance, **kwargs):
    persona = instance.fk_persona

    if instance.estado:
        user, created = User.objects.get_or_create(
            username=persona.id_persona,
            defaults={
                'first_name': persona.nom1_persona,
                'last_name': persona.ape1_persona,
                'is_staff': False,
                'is_active': True,
            }
        )

        user.first_name = persona.nom1_persona
        user.last_name = persona.ape1_persona
        user.set_password(instance.contrasena) 
        user.save()

        if persona.user != user:
            persona.user = user
            persona.save()
       
        print(f"Usuario {'creado' if created else 'actualizado'}: {user.username}")

    else:
        try:
            user = User.objects.get(username=persona.id_persona)
            user.is_active = False
            user.save()
            print(f"Usuario desactivado: {user.username}")
        except User.DoesNotExist:
            pass