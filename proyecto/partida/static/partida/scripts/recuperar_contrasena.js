document.addEventListener('DOMContentLoaded', () => {
  const formulario = document.querySelector("form");
  const nuevaContrasena = document.getElementById('nueva_contrasena');
  const confirmarContrasena = document.getElementById('confirmar_contrasena');

  if (formulario) {
    [nuevaContrasena, confirmarContrasena].forEach(campo => {
      campo.addEventListener("input", () => validarContrasenas());
      campo.addEventListener("blur", () => validarContrasenas());
    });

    formulario.addEventListener("submit", (e) => {
      if (!validarContrasenas()) {
        e.preventDefault();
        alert("Por favor, corrija los errores antes de continuar.");
      }
    });
  }
});

function validarContrasenas() {
  const nuevaContrasena = document.getElementById('nueva_contrasena');
  const confirmarContrasena = document.getElementById('confirmar_contrasena');
  
  let valido = true;
  
  // Validar nueva contraseña
  const errorNueva = nuevaContrasena.parentElement.querySelector(".error-message") || 
                     crearMensajeError(nuevaContrasena);
  errorNueva.textContent = "";
  nuevaContrasena.classList.remove("invalid", "valid");
  
  if (nuevaContrasena.value) {
    if (nuevaContrasena.value.length < 8) {
      mostrarError(nuevaContrasena, errorNueva, "Mínimo 8 caracteres");
      valido = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(nuevaContrasena.value)) {
      mostrarError(nuevaContrasena, errorNueva, "Debe contener mayúscula, minúscula y número");
      valido = false;
    } else {
      nuevaContrasena.classList.add("valid");
    }
  }
  
  // Validar confirmación
  const errorConfirmar = confirmarContrasena.parentElement.querySelector(".error-message") || 
                         crearMensajeError(confirmarContrasena);
  errorConfirmar.textContent = "";
  confirmarContrasena.classList.remove("invalid", "valid");
  
  if (confirmarContrasena.value) {
    if (confirmarContrasena.value !== nuevaContrasena.value) {
      mostrarError(confirmarContrasena, errorConfirmar, "Las contraseñas no coinciden");
      valido = false;
    } else {
      confirmarContrasena.classList.add("valid");
    }
  }
  
  return valido;
}

function crearMensajeError(campo) {
  const errorMsg = document.createElement("span");
  errorMsg.className = "error-message";
  campo.parentElement.appendChild(errorMsg);
  return errorMsg;
}

function mostrarError(campo, errorMsg, mensaje) {
  campo.classList.add("invalid");
  errorMsg.textContent = mensaje;
}