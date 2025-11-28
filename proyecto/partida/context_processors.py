from .other import obtener_informacion

def usuarioAutenticado(request):
    return {'info_u': obtener_informacion(request.user)}

