// Funcionalidad para mostrar/ocultar contraseñas
document.addEventListener('DOMContentLoaded', () => {
  const toggleButtons = document.querySelectorAll('.toggle-eye');
  
  toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const targetInput = document.getElementById(targetId);
      
      if (targetInput.type === 'password') {
        targetInput.type = 'text';
        button.textContent = '🙈';
      } else {
        targetInput.type = 'password';
        button.textContent = '👁';
      }
    });
  });
});

// Validación en tiempo real para el formulario de entrenador
const formularioEntrenador = document.querySelector("form");

if (formularioEntrenador) {
  const campos = formularioEntrenador.querySelectorAll("input, select");

  campos.forEach((campo) => {
    campo.addEventListener("input", (e) => validarCampoEntrenador(e.target));
    campo.addEventListener("blur", (e) => validarCampoEntrenador(e.target));
  });
}

function validarCampoEntrenador(campo) {
  // Para campos de contraseña dentro de password-wrapper, buscar en el contenedor padre
  const contenedor = campo.closest('.password-wrapper') ? campo.closest('.input-container') : campo.parentElement;
  const errorMsg = contenedor.querySelector(".error-message") || crearMensajeErrorEntrenador(campo, contenedor);
  
  errorMsg.textContent = "";
  campo.classList.remove("invalid", "valid");

  // Validar campo vacío si es requerido
  if (campo.hasAttribute("required") && !campo.value.trim()) {
    mostrarError(campo, errorMsg, "Este campo es obligatorio");
    return false;
  }

  // Si el campo está vacío y no es requerido, no validar más
  if (!campo.value.trim()) {
    return true;
  }
  
  // Validación según el nombre del campo
  switch(campo.name) {
    // SELECT - tipo_identidad
    case "tipo_identidad":
      const tiposIdentidad = ["RC", "TI", "CC", "PAS"];
      if (!tiposIdentidad.includes(campo.value)) {
        mostrarError(campo, errorMsg, "Seleccione un tipo válido");
        return false;
      }
      break;

    // SELECT - genero
    case "genero":
      if (!["M", "F"].includes(campo.value)) {
        mostrarError(campo, errorMsg, "Seleccione un género válido");
        return false;
      }
      break;

    // SELECT - eps
    case "eps":
      const epsValidas = ["Sanitas", "Sura", "Compensar", "Salud Total", "Famisanar", 
                          "Capital Salud", "Aliansalud", "Salud Bolivar"];
      if (!epsValidas.includes(campo.value)) {
        mostrarError(campo, errorMsg, "Seleccione una EPS válida");
        return false;
      }
      break;

    // SELECT - rh (tipo sangre)
    case "rh":
      const tiposSangre = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
      if (!tiposSangre.includes(campo.value)) {
        mostrarError(campo, errorMsg, "Seleccione un tipo de sangre válido");
        return false;
      }
      break;

    // TABLA PERSONA - id (número de identificación)
    case "id":
      // Validar solo números
      if (!/^\d+$/.test(campo.value)) {
        mostrarError(campo, errorMsg, "Solo se permiten números");
        return false;
      }
      
      // Validar longitud mínima
      if (campo.value.length < 6) {
        mostrarError(campo, errorMsg, "Debe tener mínimo 6 dígitos");
        return false;
      }
      
      // Validar rango de INTEGER 
      const MAX_INTEGER = 2147483647;
      const numero = parseInt(campo.value, 10);
      
      if (numero > MAX_INTEGER) {
        mostrarError(campo, errorMsg, "Ingrese un número de identificación válido");
        return false;
      }
      
      // Validar que no tenga más de 10 dígitos
      if (campo.value.length > 10) {
        mostrarError(campo, errorMsg, "Máximo 10 dígitos");
        return false;
      }
      break;

    // TABLA PERSONA - nombres y apellidos (20 caracteres max)
    case "nom1_persona":
    case "nom2_persona":
    case "ape1_persona":
    case "ape2_persona":
      if (!/^[a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s]+$/.test(campo.value)) {
        mostrarError(campo, errorMsg, "Solo se permiten letras");
        return false;
      }
      if (campo.value.length > 20) {
        mostrarError(campo, errorMsg, "Máximo 20 caracteres");
        return false;
      }
      if (campo.value.length < 3) {
        mostrarError(campo, errorMsg, "Mínimo 3 caracteres");
        return false;
      }
      break;

    // TABLA PERSONA - fecha_nacimiento (date)
    case "fecha_nacimiento":
      const fechaNac = new Date(campo.value);
      const hoy = new Date();
      const minFecha = new Date("1960-01-01");
      const maxFecha = new Date("2004-12-31");
      
      if (fechaNac < minFecha || fechaNac > maxFecha) {
        mostrarError(campo, errorMsg, "La fecha debe estar entre 1960 y 2004");
        return false;
      }
      
      if (fechaNac > hoy) {
        mostrarError(campo, errorMsg, "La fecha no puede ser futura");
        return false;
      }
      break;

    // TABLA PERSONA - direc_persona (40 caracteres max)
    case "direc_persona":
      if (campo.value.length > 40) {
        mostrarError(campo, errorMsg, "Máximo 40 caracteres");
        return false;
      }
      if (campo.value.length < 10) {
        mostrarError(campo, errorMsg, "Mínimo 10 caracteres");
        return false;
      }
      break;

    // TABLA PERSONA - tel_persona (bigint - 10 dígitos)
    case "tel_persona":
      if (!/^\d+$/.test(campo.value)) {
        mostrarError(campo, errorMsg, "Solo números");
        return false;
      }
      if (campo.value.length !== 10) {
        mostrarError(campo, errorMsg, "Debe tener exactamente 10 dígitos");
        return false;
      }
      if (!campo.value.startsWith("3")) {
        mostrarError(campo, errorMsg, "Debe iniciar con 3 (celular colombiano)");
        return false;
      }
      break;

    // TABLA PERSONA - email_persona (40 caracteres max)
    case "email_persona":
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(campo.value)) {
        mostrarError(campo, errorMsg, "Email inválido");
        return false;
      }
      if (campo.value.length > 40) {
        mostrarError(campo, errorMsg, "Máximo 40 caracteres");
        return false;
      }
      break;

    // VALIDACIÓN DE CONTRASEÑAS
    case "contrasena":
      if (campo.value.length < 8) {
        mostrarError(campo, errorMsg, "La contraseña debe tener al menos 8 caracteres");
        return false;
      }
      // Validar complejidad: al menos una mayúscula, una minúscula y un número
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(campo.value)) {
        mostrarError(campo, errorMsg, "Debe contener al menos una mayúscula, una minúscula y un número");
        return false;
      }
      
      // Validar confirmación de contraseña si existe
      const confirmacion = document.getElementById("contrasena_c");
      if (confirmacion && confirmacion.value) {
        validarCampoEntrenador(confirmacion);
      }
      break;

    case "contrasena_c":
      const contrasenaOriginal = document.getElementById("contrasena");
      if (campo.value !== contrasenaOriginal.value) {
        mostrarError(campo, errorMsg, "Las contraseñas no coinciden");
        return false;
      }
      break;

    // VALIDACIÓN DE AÑOS DE EXPERIENCIA
    case "anios_experiencia":
      const anios = parseInt(campo.value, 10);
      if (isNaN(anios) || anios < 0) {
        mostrarError(campo, errorMsg, "Ingrese años de experiencia válidos");
        return false;
      }
      if (anios > 50) {
        mostrarError(campo, errorMsg, "Máximo 50 años de experiencia");
        return false;
      }
      break;

    // VALIDACIÓN DE DESCRIPCIÓN DE ESPECIALIDAD
    case "descripcion_especialidad":
      if (campo.value.length < 10) {
        mostrarError(campo, errorMsg, "Mínimo 10 caracteres");
        return false;
      }
      if (campo.value.length > 500) {
        mostrarError(campo, errorMsg, "Máximo 500 caracteres");
        return false;
      }
      break;

    // VALIDACIÓN DE ARCHIVOS PDF
    case "hoja_vida":
    case "tarjeta_profesional":
      if (campo.files && campo.files.length > 0) {
        const file = campo.files[0];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        // Validar tamaño
        if (file.size > maxSize) {
          mostrarError(campo, errorMsg, "El archivo no debe superar 5MB");
          return false;
        }
        
        // Validar tipo de archivo
        const validTypes = campo.name === "hoja_vida" 
          ? ['application/pdf'] 
          : ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        
        if (!validTypes.includes(file.type)) {
          const allowedFormats = campo.name === "hoja_vida" ? "PDF" : "PDF, JPG, PNG";
          mostrarError(campo, errorMsg, `Solo se permiten archivos ${allowedFormats}`);
          return false;
        }
      }
      break;
  }

  campo.classList.add("valid");
  return true;
}

function crearMensajeErrorEntrenador(campo, contenedor) {
  const errorMsg = document.createElement("span");
  errorMsg.className = "error-message";
  contenedor.appendChild(errorMsg);
  return errorMsg;
}

function mostrarError(campo, errorMsg, mensaje) {
  campo.classList.add("invalid");
  errorMsg.textContent = mensaje;
}

// Validación completa del formulario antes de enviar
if (formularioEntrenador) {
  formularioEntrenador.addEventListener("submit", (e) => {
    e.preventDefault(); // Prevenir envío tradicional
    
    let formularioValido = true;
    const campos = formularioEntrenador.querySelectorAll("input[required], select[required], textarea[required]");
    
    // Validar campos normales
    campos.forEach((campo) => {
      if (!validarCampoEntrenador(campo)) {
        formularioValido = false;
      }
    });

    // Validar años de experiencia (obligatorio)
    const aniosExp = document.getElementById("anios_experiencia");
    if (aniosExp) {
      if (!aniosExp.value || aniosExp.value.trim() === '') {
        formularioValido = false;
        const contenedor = aniosExp.parentElement;
        const errorMsg = contenedor.querySelector(".error-message") || crearMensajeErrorEntrenador(aniosExp, contenedor);
        mostrarError(aniosExp, errorMsg, "Los años de experiencia son obligatorios");
      } else if (!validarCampoEntrenador(aniosExp)) {
        formularioValido = false;
      }
    }

    // Validar descripción de especialidad (obligatorio)
    const descripcion = document.getElementById("descripcion_especialidad");
    if (descripcion) {
      if (!descripcion.value || descripcion.value.trim() === '') {
        formularioValido = false;
        const contenedor = descripcion.parentElement;
        const errorMsg = contenedor.querySelector(".error-message") || crearMensajeErrorEntrenador(descripcion, contenedor);
        mostrarError(descripcion, errorMsg, "La descripción de especialidad es obligatoria");
      } else if (!validarCampoEntrenador(descripcion)) {
        formularioValido = false;
      }
    }

    // Validar hoja de vida (obligatorio)
    const hojaVida = document.getElementById("hoja_vida");
    if (hojaVida) {
      if (!hojaVida.files || hojaVida.files.length === 0) {
        formularioValido = false;
        const contenedor = hojaVida.parentElement;
        const errorMsg = contenedor.querySelector(".error-message") || crearMensajeErrorEntrenador(hojaVida, contenedor);
        mostrarError(hojaVida, errorMsg, "La hoja de vida es obligatoria");
      } else if (!validarCampoEntrenador(hojaVida)) {
        formularioValido = false;
      }
    }

    // Validar tarjeta profesional (obligatorio)
    const tarjetaProf = document.getElementById("tarjeta_profesional");
    if (tarjetaProf) {
      if (!tarjetaProf.files || tarjetaProf.files.length === 0) {
        formularioValido = false;
        const contenedor = tarjetaProf.parentElement;
        const errorMsg = contenedor.querySelector(".error-message") || crearMensajeErrorEntrenador(tarjetaProf, contenedor);
        mostrarError(tarjetaProf, errorMsg, "La tarjeta profesional es obligatoria");
      } else if (!validarCampoEntrenador(tarjetaProf)) {
        formularioValido = false;
      }
    }

    // Validar habilidades (al menos una seleccionada) - OBLIGATORIO
    const habilidadesCheckboxes = document.querySelectorAll('input[name="habilidades"]:checked');
    console.log('Habilidades seleccionadas:', habilidadesCheckboxes.length);
    
    if (habilidadesCheckboxes.length === 0) {
      formularioValido = false;
      alert("⚠️ Debes seleccionar al menos una habilidad. Este campo es obligatorio.");
      
      // Scroll hacia la sección de habilidades
      const habilidadesSection = document.querySelector('.habilidades');
      if (habilidadesSection) {
        habilidadesSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        habilidadesSection.style.border = '3px solid #dc3545';
        habilidadesSection.style.animation = 'shake 0.5s';
        habilidadesSection.style.backgroundColor = '#fff3cd';
        setTimeout(() => {
          habilidadesSection.style.border = '';
          habilidadesSection.style.animation = '';
          habilidadesSection.style.backgroundColor = '';
        }, 2000);
      }
    }

    if (!formularioValido) {
      console.log('Formulario NO válido - deteniendo envío');
      alert("Por favor, corrija los errores en el formulario antes de enviar.");
      return;
    }
    
    console.log('Formulario válido - procediendo con el envío');

    // Enviar por AJAX
    const formData = new FormData(formularioEntrenador);
    const url = formularioEntrenador.action;

    fetch(url, {
      method: 'POST',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        mostrarMensaje(data.message, 'success');
        // Limpiar el formulario después de envío exitoso
        formularioEntrenador.reset();
        // Resetear las clases de validación
        campos.forEach(campo => {
          campo.classList.remove('valid', 'invalid');
          const errorMsg = campo.parentElement.querySelector('.error-message');
          if (errorMsg) {
            errorMsg.textContent = '';
          }
        });
      } else {
        mostrarMensaje(data.message, 'error');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      mostrarMensaje('Ocurrió un error al enviar la postulación', 'error');
    });
  });
}

// Función para mostrar mensajes al usuario
function mostrarMensaje(mensaje, tipo) {
  // Crear contenedor de alerta si no existe
  let alertContainer = document.querySelector('.alert-container');
  if (!alertContainer) {
    alertContainer = document.createElement('div');
    alertContainer.className = 'alert-container';
    alertContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
    `;
    document.body.appendChild(alertContainer);
  }

  // Crear alerta
  const alert = document.createElement('div');
  alert.className = `alert alert-${tipo === 'success' ? 'success' : 'danger'} alert-dismissible fade show`;
  alert.setAttribute('role', 'alert');
  alert.style.cssText = `
    margin-bottom: 10px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  `;
  
  alert.innerHTML = `
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  alertContainer.appendChild(alert);

  // Auto-ocultar después de 5 segundos
  setTimeout(() => {
    alert.classList.remove('show');
    setTimeout(() => alert.remove(), 150);
  }, 5000);
}
