// Script de validación y funcionalidad del formulario de entrenador
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

  // Validación en tiempo real del ID de persona
  const inputId = document.getElementById('id');
  const mensajeValidacion = document.getElementById('id-validation-message');
  let timeoutId = null;

  if (inputId && mensajeValidacion) {
    inputId.addEventListener('input', function() {
      const idPersona = this.value.trim();
      
      // Limpiar timeout anterior
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Si el campo está vacío, ocultar mensaje
      if (!idPersona) {
        mensajeValidacion.style.display = 'none';
        inputId.style.borderColor = '';
        return;
      }
      
      // Validar que sea un número
      if (!/^\d+$/.test(idPersona)) {
        mensajeValidacion.textContent = '⚠️ Solo se permiten números';
        mensajeValidacion.style.display = 'block';
        mensajeValidacion.style.backgroundColor = '#fee2e2';
        mensajeValidacion.style.color = '#991b1b';
        mensajeValidacion.style.borderLeft = '4px solid #dc2626';
        inputId.style.borderColor = '#dc2626';
        return;
      }
      
      // Esperar 500ms después de que el usuario deje de escribir
      timeoutId = setTimeout(() => {
        // Hacer petición AJAX para validar si el ID existe
        fetch(`/verificar-id-persona/?id_persona=${idPersona}`, {
          method: 'GET',
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.existe) {
            mensajeValidacion.textContent = `❌ El ID ${idPersona} ya se encuentra registrado en el sistema. Por favor, usa otro número de identificación.`;
            mensajeValidacion.style.display = 'block';
            mensajeValidacion.style.backgroundColor = '#fee2e2';
            mensajeValidacion.style.color = '#991b1b';
            mensajeValidacion.style.borderLeft = '4px solid #dc2626';
            inputId.style.borderColor = '#dc2626';
            inputId.setCustomValidity('Este ID ya está registrado');
          } else {
            mensajeValidacion.textContent = `✅ ID ${idPersona} disponible`;
            mensajeValidacion.style.display = 'block';
            mensajeValidacion.style.backgroundColor = '#d1fae5';
            mensajeValidacion.style.color = '#065f46';
            mensajeValidacion.style.borderLeft = '4px solid #10b981';
            inputId.style.borderColor = '#10b981';
            inputId.setCustomValidity('');
          }
        })
        .catch(error => {
          console.error('Error al verificar ID:', error);
          mensajeValidacion.style.display = 'none';
          inputId.style.borderColor = '';
        });
      }, 500);
    });
  }

  // Inicializar experiencias
  inicializarExperiencias();
  
  // Inicializar validación de seguridad de contraseña
  const inputContrasena = document.getElementById('contrasena');
  if (inputContrasena) {
    inputContrasena.addEventListener('input', validarSeguridadContrasena);
    inputContrasena.addEventListener('keyup', validarSeguridadContrasena);
  }
  
  // Limitar selección de habilidades a máximo 5
  const habilidadesCheckboxes = document.querySelectorAll('input[name="habilidades"]:not([data-obligatorio])');
  habilidadesCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const totalSeleccionadas = document.querySelectorAll('input[name="habilidades"]:checked').length;
      if (totalSeleccionadas > 5) {
        e.target.checked = false;
        alert('⚠️ Solo puedes seleccionar máximo 5 habilidades en total (incluyendo Primeros auxilios que es obligatorio).');
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

    // Validar años de experiencia (todas las experiencias)
    const inputsAniosExp = document.querySelectorAll('input[name="anios_experiencia[]"]');
    inputsAniosExp.forEach(input => {
      if (!input.value || input.value.trim() === '') {
        formularioValido = false;
        const contenedor = input.closest('.input-container');
        const errorMsg = contenedor.querySelector(".error-message") || crearMensajeErrorEntrenador(input, contenedor);
        mostrarError(input, errorMsg, "Los años de experiencia son obligatorios");
      }
    });
    
    // Validar suma total de años de experiencia
    if (!validarAniosTotalesExperiencia()) {
      formularioValido = false;
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

    // Validar habilidades (al menos 1 adicional a primeros auxilios, máximo 5 total) - OBLIGATORIO
    const habilidadesCheckboxes = document.querySelectorAll('input[name="habilidades"]:checked');
    const habilidadesNoObligatorias = Array.from(habilidadesCheckboxes).filter(cb => !cb.hasAttribute('data-obligatorio'));
    
    console.log('Habilidades seleccionadas (total):', habilidadesCheckboxes.length);
    console.log('Habilidades adicionales (sin obligatorias):', habilidadesNoObligatorias.length);
    
    if (habilidadesNoObligatorias.length === 0) {
      formularioValido = false;
      alert("⚠️ Debes seleccionar al menos 1 habilidad adicional (además de Primeros auxilios que es obligatorio).");
      
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
    } else if (habilidadesCheckboxes.length > 5) {
      formularioValido = false;
      alert("⚠️ Puedes seleccionar máximo 5 habilidades en total (incluyendo Primeros auxilios).");
      
      // Scroll hacia la sección de habilidades
      const habilidadesSection = document.querySelector('.habilidades');
      if (habilidadesSection) {
        habilidadesSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        habilidadesSection.style.border = '3px solid #ffc107';
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
        // Mostrar modal de confirmación profesional
        const modal = new bootstrap.Modal(document.getElementById('modalConfirmacion'));
        modal.show();
        
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

// Funcionalidad para agregar múltiples experiencias
let experienciaCount = 1;
const MAX_EXPERIENCIAS = 4;
const MAX_ANIOS_POR_EXPERIENCIA = 10; // Máximo realista por experiencia
const MAX_ANIOS_TOTALES = 30; // Máximo total realista de años de experiencia

// Función para actualizar numeración y estado del botón (debe estar fuera)
function actualizarNumeracionExperiencias() {
  const experienciasList = document.getElementById('experiencias-list');
  const btnAgregarExperiencia = document.getElementById('btn-agregar-experiencia');
  
  if (!experienciasList || !btnAgregarExperiencia) return;
  
  const items = experienciasList.querySelectorAll('.experiencia-item');
  const cantidadExperiencias = items.length;
  
  items.forEach((item, index) => {
    const h3 = item.querySelector('h3');
    if (h3) {
      h3.textContent = `Experiencia #${index + 1}`;
    }
  });
  
  console.log(`Experiencias actuales: ${cantidadExperiencias}, Máximo: ${MAX_EXPERIENCIAS}`);
  
  // Habilitar/deshabilitar botón de agregar según límite
  if (cantidadExperiencias >= MAX_EXPERIENCIAS) {
    btnAgregarExperiencia.disabled = true;
    btnAgregarExperiencia.style.opacity = '0.5';
    btnAgregarExperiencia.style.cursor = 'not-allowed';
    btnAgregarExperiencia.style.pointerEvents = 'none';
    btnAgregarExperiencia.title = `Máximo ${MAX_EXPERIENCIAS} experiencias permitidas`;
    console.log('Botón DESHABILITADO - Límite alcanzado');
  } else {
    btnAgregarExperiencia.disabled = false;
    btnAgregarExperiencia.style.opacity = '1';
    btnAgregarExperiencia.style.cursor = 'pointer';
    btnAgregarExperiencia.style.pointerEvents = 'auto';
    btnAgregarExperiencia.title = 'Agregar otra experiencia';
    console.log('Botón HABILITADO - Puede agregar más experiencias');
  }
}

function inicializarExperiencias() {
  const btnAgregarExperiencia = document.getElementById('btn-agregar-experiencia');
  const experienciasList = document.getElementById('experiencias-list');

  if (btnAgregarExperiencia && experienciasList) {
    btnAgregarExperiencia.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Verificar si ya se alcanzó el límite de experiencias
      const experienciasActuales = experienciasList.querySelectorAll('.experiencia-item').length;
      if (experienciasActuales >= MAX_EXPERIENCIAS) {
        alert(`⚠️ Solo puedes agregar máximo ${MAX_EXPERIENCIAS} experiencias laborales.`);
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
      
      // Verificar si el botón está deshabilitado
      if (btnAgregarExperiencia.disabled) {
        return false;
      }
      
      const nuevaExperiencia = document.createElement('div');
      nuevaExperiencia.className = 'experiencia-item';
      nuevaExperiencia.setAttribute('data-index', experienciaCount);
      
      nuevaExperiencia.innerHTML = `
        <h3>Experiencia #${experienciaCount + 1}</h3>
        <div class="experiencia-fields">
          <div class="input-container input-small">
            <label for="anios_experiencia_${experienciaCount}">Años de Experiencia:*</label>
            <input type="number" name="anios_experiencia[]" id="anios_experiencia_${experienciaCount}" min="0" max="${MAX_ANIOS_POR_EXPERIENCIA}" required placeHolder="Ej: 3" class="input-anios-experiencia">
            <span class="error-message"></span>
            <small class="text-muted" style="display: block; margin-top: 5px; color: #6c757d;">El valor debe ser menor o igual a 10 años</small>
          </div>
          <div class="input-container">
            <label for="certificado_experiencia_${experienciaCount}">Certificado Laboral (PDF):*</label>
            <input type="file" name="certificado_experiencia[]" id="certificado_experiencia_${experienciaCount}" accept=".pdf" required>
            <small class="text-muted">📄 Certificado que compruebe tu experiencia. Formato: PDF, Máximo 5MB</small>
          </div>
          <button type="button" class="btn-eliminar-experiencia" data-index="${experienciaCount}">
            🗑️ Eliminar esta experiencia
          </button>
        </div>
      `;
      
      experienciasList.appendChild(nuevaExperiencia);
      experienciaCount++;
      
      // Actualizar numeración
      actualizarNumeracionExperiencias();
      
      // Agregar validación al input de años
      const inputAnios = nuevaExperiencia.querySelector('.input-anios-experiencia');
      if (inputAnios) {
        inputAnios.addEventListener('input', validarAniosTotalesExperiencia);
        inputAnios.addEventListener('blur', validarAniosTotalesExperiencia);
      }
      
      // Agregar evento al botón eliminar
      const btnEliminar = nuevaExperiencia.querySelector('.btn-eliminar-experiencia');
      btnEliminar.addEventListener('click', (e) => {
        e.preventDefault();
        nuevaExperiencia.remove();
        actualizarNumeracionExperiencias();
        validarAniosTotalesExperiencia(); // Revalidar después de eliminar
      });
    });
  }

  // Inicializar validación para la primera experiencia
  const primerInputAnios = document.getElementById('anios_experiencia_0');
  if (primerInputAnios) {
    primerInputAnios.addEventListener('input', validarAniosTotalesExperiencia);
    primerInputAnios.addEventListener('blur', validarAniosTotalesExperiencia);
  }
  
  // Verificar estado inicial del botón
  actualizarNumeracionExperiencias();
}

// Función para validar la suma total de años de experiencia
function validarAniosTotalesExperiencia() {
  const inputsAnios = document.querySelectorAll('input[name="anios_experiencia[]"]');
  let totalAnios = 0;
  let hayErrores = false;
  
  inputsAnios.forEach(input => {
    const valor = parseInt(input.value) || 0;
    
    // Validar que no exceda el máximo por experiencia
    const contenedor = input.closest('.input-container');
    const errorMsg = contenedor.querySelector('.error-message');
    
    // SIEMPRE validar primero si excede el máximo
    if (valor > MAX_ANIOS_POR_EXPERIENCIA) {
      input.classList.add('invalid');
      input.classList.remove('valid');
      if (errorMsg) {
        errorMsg.textContent = `Máximo ${MAX_ANIOS_POR_EXPERIENCIA} años por experiencia`;
        errorMsg.style.color = '#dc3545';
        errorMsg.style.fontSize = '0.875rem';
        errorMsg.style.marginTop = '0.25rem';
        errorMsg.style.display = 'block';
      }
      hayErrores = true;
    } else if (valor < 0) {
      input.classList.add('invalid');
      input.classList.remove('valid');
      if (errorMsg) {
        errorMsg.textContent = 'Los años no pueden ser negativos';
        errorMsg.style.color = '#dc3545';
        errorMsg.style.fontSize = '0.875rem';
        errorMsg.style.marginTop = '0.25rem';
        errorMsg.style.display = 'block';
      }
      hayErrores = true;
    } else if (valor === 0 || !input.value) {
      // Si está vacío o es 0, no marcar como válido ni inválido
      input.classList.remove('invalid');
      input.classList.remove('valid');
      if (errorMsg) {
        errorMsg.textContent = '';
        errorMsg.style.display = 'none';
      }
    } else {
      // Solo si está entre 1 y 10, marcar como válido
      input.classList.remove('invalid');
      input.classList.add('valid');
      if (errorMsg) {
        errorMsg.textContent = '';
        errorMsg.style.display = 'none';
      }
    }
    
    totalAnios += valor;
  });
  
  // Validar suma total de años
  if (totalAnios > MAX_ANIOS_TOTALES) {
    inputsAnios.forEach(input => {
      const contenedor = input.closest('.input-container');
      const errorMsg = contenedor.querySelector('.error-message');
      input.classList.add('invalid');
      input.classList.remove('valid');
    });
    
    // Mostrar alerta general
    const experienciaSection = document.querySelector('.experienciaProfesional');
    let alertaTotal = experienciaSection.querySelector('.alerta-total-anios');
    
    if (!alertaTotal) {
      alertaTotal = document.createElement('div');
      alertaTotal.className = 'alerta-total-anios';
      alertaTotal.style.cssText = `
        background: #fff3cd;
        border: 2px solid #ffc107;
        border-radius: 8px;
        padding: 15px;
        margin: 10px 0;
        color: #856404;
        font-weight: bold;
        text-align: center;
      `;
      experienciaSection.insertBefore(alertaTotal, experienciaSection.querySelector('.experiencia-profesional-layout'));
    }
    
    alertaTotal.innerHTML = `⚠️ La suma total de años de experiencia (${totalAnios} años) excede el máximo permitido de ${MAX_ANIOS_TOTALES} años. Por favor, verifica los datos.`;
    alertaTotal.style.display = 'block';
    hayErrores = true;
  } else {
    // Eliminar alerta si existe
    const alertaTotal = document.querySelector('.alerta-total-anios');
    if (alertaTotal) {
      alertaTotal.style.display = 'none';
    }
  }
  
  return !hayErrores;
}

// Función para validar y mostrar el nivel de seguridad de la contraseña
function validarSeguridadContrasena() {
  const password = document.getElementById('contrasena').value;
  const strengthText = document.getElementById('password-strength-text');
  const strengthBar = document.getElementById('password-strength-bar-fill');
  
  if (!strengthText || !strengthBar) return;
  
  // Calcular puntuación de seguridad
  let strength = 0;
  let nivel = '';
  let color = '';
  let ancho = 0;
  
  if (password.length === 0) {
    strengthText.textContent = '';
    strengthBar.style.width = '0%';
    return;
  }
  
  // Criterios de seguridad
  const criterios = {
    longitud: password.length >= 8,
    minuscula: /[a-z]/.test(password),
    mayuscula: /[A-Z]/.test(password),
    numero: /\d/.test(password),
    especial: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/]/.test(password),
    longitudMayor: password.length >= 12
  };
  
  // Calcular puntos
  if (criterios.longitud) strength += 20;
  if (criterios.minuscula) strength += 20;
  if (criterios.mayuscula) strength += 20;
  if (criterios.numero) strength += 20;
  if (criterios.especial) strength += 10;
  if (criterios.longitudMayor) strength += 10;
  
  // Determinar nivel
  if (strength < 40) {
    nivel = 'Nivel de seguridad: Débil';
    color = '#dc3545'; // Rojo
    ancho = 25;
  } else if (strength < 60) {
    nivel = 'Nivel de seguridad: Regular';
    color = '#ffc107'; // Amarillo
    ancho = 50;
  } else if (strength < 80) {
    nivel = 'Nivel de seguridad: Buena';
    color = '#17a2b8'; // Azul
    ancho = 75;
  } else {
    nivel = 'Nivel de seguridad: Excelente';
    color = '#28a745'; // Verde
    ancho = 100;
  }
  
  // Actualizar UI
  strengthText.textContent = nivel;
  strengthText.style.color = color;
  strengthBar.style.width = ancho + '%';
  strengthBar.style.backgroundColor = color;
}

