from django.db import models
from django.contrib.auth.models import User

class Acudiente(models.Model):
    id = models.AutoField(primary_key=True)
    idacudiente = models.IntegerField()
    nom1_acudiente = models.CharField(max_length=20)
    nom2_acudiente = models.CharField(max_length=20, blank=True, null=True)
    ape1_acudiente = models.CharField(max_length=20)
    ape2_acudiente = models.CharField(max_length=20, blank=True, null=True)
    tel_acudiente = models.BigIntegerField()
    parentesco = models.CharField(max_length=9, choices =[
        ('Padre', 'Padre'),
        ('Madre', 'Madre'),
        ('Madrastra', 'Madrastra'),
        ('Padrastro', 'Padrastro'),
        ('Tio', 'Tio'),
        ('Primo', 'Primo'),
        ('Hermano', 'Hermano'),
        ('Abuelo', 'Abuelo'),
        ('Cuidador', 'Cuidador'),
    ])
    class Meta:
        managed = True
        db_table = 'acudiente'

class Categoria(models.Model):
    idcategoria = models.AutoField(primary_key=True)
    nom_categoria = models.CharField(max_length=20)
    entrenamiento = models.ManyToManyField('Entrenamiento', through='CategoriaEntrenamiento')
    class Meta:
        managed = True
        db_table = 'categoria'

class Entrenamiento(models.Model):
    identrenamiento = models.AutoField(primary_key=True)
    nom_entrenamiento = models.CharField(max_length=30)
    descripcion = models.TextField()
    estado = models.IntegerField(default=1)  # BIT: 0 = inactivo, 1 = activo
    class Meta:
        managed = True
        db_table = 'entrenamiento'

class JornadaEntrenamientos(models.Model):
    idjornada = models.AutoField(primary_key=True)
    dia_jornada = models.CharField(max_length=7)
    hora_entrada = models.TimeField()
    hora_salida = models.TimeField()
    class Meta:
        managed = True
        db_table = 'jornada_entrenamientos'

class Objetivos(models.Model):
    idobjetivos = models.AutoField(primary_key=True)
    nom_objetivo = models.CharField(max_length=70)
    descripcion = models.TextField()
    estado = models.IntegerField(default=1)  # BIT: 0 = inactivo, 1 = activo
    class Meta:
        managed = True
        db_table = 'objetivos'


class Posicion(models.Model):
    idposicion = models.AutoField(primary_key=True)
    nom_posicion = models.CharField(max_length=5)
    desc_posicion = models.CharField(max_length=30)
    class Meta:
        managed = True
        db_table = 'posicion'

class Persona(models.Model):
    id = models.AutoField(primary_key=True)
    id_persona = models.IntegerField(unique=True)
    tipo_identidad = models.CharField(max_length=3, choices=[
        ('CC', 'CC'),
        ('TI', 'TI'),
        ('RC', 'RC'),
        ('PAS', 'PAS'),
        ])
    nom1_persona = models.CharField(max_length=20)
    nom2_persona = models.CharField(max_length=20, blank=True, null=True)
    ape1_persona = models.CharField(max_length=20)
    ape2_persona = models.CharField(max_length=20, blank=True, null=True)
    fecha_nacimiento = models.DateField()
    direc_persona = models.CharField(max_length=40)
    tel_persona = models.BigIntegerField()
    email_persona = models.CharField(max_length=40)
    genero = models.CharField(max_length=1, choices=[
        ('M', 'M'),
        ('F', 'F'),
        ])
    eps = models.CharField(max_length=13, choices=[
        ('Sanitas', 'Sanitas'),
        ('Sura', 'Sura'),
        ('Compensar', 'Compensar'),
        ('Salud Total', 'Salud Total'),
        ('Famisanar', 'Famisanar'),
        ('Capital Salud', 'Capital Salud'),
        ('Aliansalud', 'Aliansalud'),
        ('Salud Bolivar', 'Salud Bolivar'),
        ]) 
    rh = models.CharField(max_length=3, choices=[
        ('A+', 'A+'), 
        ('A-', 'A-'),
        ('B+', 'B+'), 
        ('B-', 'B-'),
        ('AB+', 'AB+'), 
        ('AB-', 'AB-'),
        ('O+', 'O+'), 
        ('O-', 'O-'),
        ])
    fecha_registro = models.DateField(null=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True)
    class Meta:
        managed = True
        db_table = 'persona'


class Alumno(models.Model):
    fk_persona_alumno = models.OneToOneField(Persona, models.CASCADE, db_column='fk_persona_alumno', primary_key=True)
    fk_acudiente = models.ForeignKey(Acudiente, models.CASCADE, db_column='fk_acudiente')
    fk_posicion = models.ForeignKey(Posicion, models.CASCADE, db_column='fk_posicion')
    #Documentos
    foto = models.ImageField(upload_to='fotos/', null=True)
    tradatos = models.FileField(upload_to='traDatos/', db_column='traDatos', null=True)
    automedica = models.FileField(upload_to='autoMedica/', db_column='autoMedica', null=True)
    certeps = models.FileField(upload_to='certEps/', db_column='certEps', null=True)
    otraescuela = models.FileField(upload_to='otraEscuela/', db_column='otraEscuela', null=True)
    #fin
    altura_metros = models.FloatField(null=True)
    peso_medidas = models.FloatField(null=True)
    imc_medidas = models.FloatField(null=True)
    talla = models.CharField(max_length=4, choices=[
        ('XXS', 'XXS'), 
        ('XS', 'XS'), 
        ('S', 'S'), 
        ('M', 'M'),
        ('L', 'L'), 
        ('XL', 'XL'), 
        ('XXL', 'XXL'), 
        ('XXXL', 'XXXL'),
    ], null=True, blank=True)
    calzado = models.IntegerField(null=True)
    pie_dominante = models.CharField(max_length=11, choices=[
        ('Derecho', 'Derecho'),
        ('Izquierdo', 'Izquierdo'),
        ('Ambidiestro', 'Ambidiestro'),
    ], null=True)
    estado_alumno = models.BooleanField(null=True)
    postulante = models.BooleanField(null=True)
    class Meta:
        managed = True
        db_table = 'alumno'

class Matricula(models.Model):
    idmatricula = models.AutoField(primary_key=True)
    fk_alumno = models.ForeignKey(Alumno, models.CASCADE, db_column='fk_alumno')
    fecha_inicio = models.DateTimeField()
    fecha_terminacion = models.DateTimeField(null=True)
    estado_matricula = models.IntegerField(default=1)  # BIT: 0 = inactiva, 1 = activa
    codigo_fin_periodo = models.CharField(max_length=20, unique=True, null=True)
    fecha_codigo = models.DateField(null=True, blank=True)
    fk_categoria = models.ForeignKey(Categoria, models.CASCADE, db_column='fk_categoria')
    class Meta:
        managed = True
        db_table = 'matricula'

class Sesionentrenamiento(models.Model):
    idsesion = models.AutoField(primary_key=True)
    fecha_entrenamiento = models.DateTimeField()
    fk_entrenamiento = models.ForeignKey(Entrenamiento, models.CASCADE, db_column='fk_entrenamiento')
    matriculas = models.ManyToManyField(Matricula, through='MatriculaSesion')
    class Meta:
        managed = True
        db_table = 'sesionentrenamiento'

class Asistencia(models.Model):
    idasistencia = models.AutoField(primary_key=True)
    fk_sesion_ms = models.ForeignKey(Sesionentrenamiento, models.CASCADE, db_column='fk_sesion_ms')
    fk_matricula_ms = models.ForeignKey(Matricula, models.CASCADE, db_column='fk_matricula_ms', related_name='asistencia_fk_matricula_ms_set')
    fecha_asistencia = models.DateTimeField()
    asistencia = models.IntegerField(default=0)  # BIT: 0 = ausente, 1 = presente
    observaciones = models.TextField()
    class Meta:
        managed = True
        db_table = 'asistencia'

class CalificacionObjetivos(models.Model):
    idcalificacion = models.AutoField(primary_key=True)
    fk_asistencia = models.ForeignKey(Asistencia, models.CASCADE, db_column='fk_asistencia')
    id_objetivo = models.IntegerField()
    evaluacion = models.BooleanField()
    observaciones = models.TextField()
    objetivo_evaluado = models.BooleanField(default=True)  # NUEVO: indica si se evaluó este objetivo en la sesión
    class Meta:
        managed = True
        db_table = 'calificacion_objetivos'

class PersonalT(models.Model):
    fk_persona = models.OneToOneField(Persona, models.CASCADE, db_column='fk_persona', primary_key=True)
    contrasena = models.CharField(max_length=64)
    tipo_personal = models.CharField(max_length=13, choices = [
        ('Administrador', 'Administrador'),
        ('Entrenador', 'Entrenador'),
    ])
    postulante = models.BooleanField(null=True)
    estado = models.BooleanField(null=True)
    estado_proceso = models.CharField(max_length=15, default='postulante', choices=[
        ('postulante', 'Postulante'),
        ('en_proceso', 'En Proceso'),
        ('aceptado', 'Aceptado'),
        ('rechazado', 'Rechazado'),
    ])
    experiencia = models.IntegerField(default=0)
    descripcion_especialidad = models.TextField(null=True, blank=True)
    categoria_experiencia = models.CharField(max_length=30, choices=[
        ('4 a 7 años', '4 a 7 años'),
        ('8 a 11 años', '8 a 11 años'),
        ('12 a 15 años', '12 a 15 años'),
        ('16 a 17 años', '16 a 17 años'),
        ('18 años', '18 años'),
    ], null=True, blank=True)

    hoja_vida = models.FileField(upload_to='hojaVida/', null=True)
    tarjeta_profesional = models.FileField(upload_to='carnetProfesional/', null=True)
    antecedentes = models.FileField(upload_to='antecedentes/', null=True)
    certificado_primeros_auxilios = models.FileField(upload_to='primerosAuxilios/', null=True)
    class Meta:
        managed = True
        db_table = 'personal_t'

class CategoriaEntrenamiento(models.Model):
    fk_categoria = models.ForeignKey(Categoria, models.CASCADE, db_column='fk_categoria')
    fk_entrenamiento = models.ForeignKey(Entrenamiento, models.CASCADE, db_column='fk_entrenamiento')
    class Meta:
        managed = True
        db_table = 'categoria_entrenamiento'
        unique_together = (('fk_categoria', 'fk_entrenamiento'),)

class EntrenamientoObjetivo(models.Model):
    fk_entrenamiento = models.ForeignKey(Entrenamiento, models.CASCADE, db_column='fk_entrenamiento')
    fk_objetivo = models.ForeignKey(Objetivos, models.CASCADE, db_column='fk_objetivo')
    class Meta:
        managed = True
        db_table = 'entrenamiento_objetivo'
        unique_together = (('fk_entrenamiento', 'fk_objetivo'),)

class MatriculaSesion(models.Model):
    fk_matricula = models.ForeignKey(Matricula, models.CASCADE, db_column='fk_matricula')
    fk_sesion = models.ForeignKey(Sesionentrenamiento, models.CASCADE, db_column='fk_sesion')
    class Meta:
        managed = True
        db_table = 'matricula_sesion'
        unique_together = (('fk_matricula', 'fk_sesion'),)

class Habilidad(models.Model):
    idhabilidad = models.AutoField(primary_key=True)
    descripcion = models.TextField()
    class Meta:
        managed = True
        db_table = 'habilidad'
        
class Experiencia(models.Model):
    idexperiencia = models.AutoField(primary_key=True)
    fk_persona_experiencia = models.ForeignKey(PersonalT, models.CASCADE, db_column='fk_persona_experiencia', related_name='experiencias_relacionadas')
    anios_experiencia = models.IntegerField(default=0)
    descripcion = models.TextField()
    certificado_experiencia = models.FileField(upload_to='certificadosExperiencia/', null=True, blank=True)
    class Meta:
        managed = True
        db_table = 'experiencia'

class PersonalTHabilidad(models.Model):
    fk_personal = models.ForeignKey(PersonalT, models.CASCADE, db_column='fk_personal')
    fk_habilidad = models.ForeignKey(Habilidad, models.CASCADE, db_column='fk_habilidad')
    class Meta:
        managed = True
        db_table = 'personal_t_habilidad'
        unique_together = (('fk_personal', 'fk_habilidad'),)

class PersonalJornadaCategoria(models.Model):
    fk_personal = models.ForeignKey(PersonalT, models.CASCADE, db_column='fk_personal')
    fk_jornada = models.ForeignKey(JornadaEntrenamientos, models.CASCADE, db_column='fk_jornada')
    fk_categoria = models.ForeignKey(Categoria, models.CASCADE, db_column='fk_categoria')

    class Meta:
        managed = True
        db_table = 'personal_jornada_categoria'
        unique_together = (('fk_personal', 'fk_jornada', 'fk_categoria'),)