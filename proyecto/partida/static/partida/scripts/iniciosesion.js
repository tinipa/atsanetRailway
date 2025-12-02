// Validación en tiempo real para el formulario de inicio de sesión
document.addEventListener('DOMContentLoaded', () => {
  const formularioLogin = document.querySelector("form");

  if (formularioLogin) {
    const campos = formularioLogin.querySelectorAll("input");

    campos.forEach((campo) => {
      campo.addEventListener("input", (e) => validarCampoLogin(e.target));
      campo.addEventListener("blur", (e) => validarCampoLogin(e.target));
    });

    // Validación completa antes de enviar
    formularioLogin.addEventListener("submit", (e) => {
      let formularioValido = true;
      
      campos.forEach((campo) => {
        if (!validarCampoLogin(campo)) {
          formularioValido = false;
        }
      });

      if (!formularioValido) {
        e.preventDefault();
        alert("Por favor, ingrese el numero de identificación correctamente con su contraseña de al menos 8 caracteres.");
      }
    });
  }
});

function validarCampoLogin(campo) {
  const contenedor = campo.parentElement;
  const errorMsg = contenedor.querySelector(".error-message") || crearMensajeError(campo, contenedor);
  
  errorMsg.textContent = "";
  campo.classList.remove("invalid", "valid");

  // Validar campo vacío
  if (campo.hasAttribute("required") && !campo.value.trim()) {
    mostrarErrorLogin(campo, errorMsg, "Este campo es obligatorio");
    return false;
  }

  // Si el campo está vacío y no es requerido, no validar más
  if (!campo.value.trim()) {
    return true;
  }
  
  // Validación según el nombre del campo
  switch(campo.name) {
    case "username":
      // Validar solo números
      if (!/^\d+$/.test(campo.value)) {
        mostrarErrorLogin(campo, errorMsg, "Solo se permiten números");
        return false;
      }
      
      // Validar longitud mínima
      if (campo.value.length < 6) {
        mostrarErrorLogin(campo, errorMsg, "Debe tener mínimo 6 dígitos");
        return false;
      }
      
      // Validar longitud máxima
      if (campo.value.length > 10) {
        mostrarErrorLogin(campo, errorMsg, "Máximo 10 dígitos");
        return false;
      }
      
      // Validar rango de INTEGER
      const MAX_INTEGER = 2147483647;
      const numero = parseInt(campo.value, 10);
      
      if (numero > MAX_INTEGER) {
        mostrarErrorLogin(campo, errorMsg, "Ingrese un número de identificación válido");
        return false;
      }
      break;

    case "password":
      if (campo.value.length < 8) {
        mostrarErrorLogin(campo, errorMsg, "La contraseña debe tener al menos 8 caracteres");
        return false;
      }
      
      break;
  }

  campo.classList.add("valid");
  return true;
}

function crearMensajeError(campo, contenedor) {
  const errorMsg = document.createElement("span");
  errorMsg.className = "error-message";
  contenedor.appendChild(errorMsg);
  return errorMsg;
}

function mostrarErrorLogin(campo, errorMsg, mensaje) {
  campo.classList.add("invalid");
  errorMsg.textContent = mensaje;
}