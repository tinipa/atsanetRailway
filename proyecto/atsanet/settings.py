from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-s%+imnlby6f$tz+%#f7%%-k6x(5k(n#730v_lg6#ibneziqb4+'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# MODIFICADO: Permitir conexiones desde Cloudflare Tunnel
ALLOWED_HOSTS = ['*']  # Para desarrollo con tunnel

# AÑADIDO: Configuración para CSRF con Cloudflare Tunnel
CSRF_TRUSTED_ORIGINS = [
    'https://*.trycloudflare.com',  # Para túneles temporales con HTTPS
    'http://*.trycloudflare.com',   # Para túneles temporales con HTTP
]

# AÑADIDO: Confiar en los headers de proxy de Cloudflare
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'partida',
    'matricula',
    'entrenador',
    'entrenamiento',
    'sesionentrenamiento',
    'reportes',
    'renovacion',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
]

ROOT_URLCONF = 'atsanet.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'emails/templates'),],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'partida.context_processors.usuarioAutenticado'
            ],
        },
    },
]

WSGI_APPLICATION = 'atsanet.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'atsanet',
        'USER': 'root',
        'PASSWORD': 'root',
        'HOST': 'localhost',
        'PORT': '3306', 
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'es-es'

TIME_ZONE = 'America/Bogota'

USE_I18N = True

USE_TZ = False


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'

# Django buscará automáticamente archivos estáticos en la carpeta 'static' de cada app
# No es necesario STATICFILES_DIRS a menos que tengas archivos estáticos globales

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

MEDIA_URL = '/media/'  

MEDIA_ROOT = BASE_DIR / 'media'

# Configuracion de correo electronico
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'atsanet.ats@gmail.com'  # Tu Gmail completo
EMAIL_HOST_PASSWORD = 'afsp kpma pxrr bvaj'  # La contraseña de 16 caracteres
DEFAULT_FROM_EMAIL = 'atsanet.ats@gmail.com'

# Configuración de autenticación
LOGIN_URL = '/iniciosesion/'  
LOGIN_REDIRECT_URL = '/usuario/'  
LOGOUT_REDIRECT_URL = '/' 

# Configuración de sesiones
SESSION_COOKIE_AGE = 3600  # 1 hora en segundos
SESSION_SAVE_EVERY_REQUEST = True  # Renovar sesión con cada request
SESSION_EXPIRE_AT_BROWSER_CLOSE = False  # La sesión no expira al cerrar el navegador

# AÑADIDO: Permitir iframes en desarrollo (para Cloudflare Tunnel)
X_FRAME_OPTIONS = 'ALLOWALL'  # Solo para desarrollo