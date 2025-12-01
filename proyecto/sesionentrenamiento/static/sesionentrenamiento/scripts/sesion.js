let currentStep = 1;
const totalSteps = 3;

const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const btnCancel = document.getElementById('btnCancel');

// Elementos del paso 1
const categoriaSelect = document.getElementById('categoria');
const entrenamientoSelect = document.getElementById('entrenamiento');
const previewContainer = document.getElementById('preview-container');

// Variables para almacenar datos
let entrenamientos = [];
let objetivos = [];

// Clave para localStorage
const STORAGE_KEY = 'sesion_entrenamiento_temp';

// Cargar datos temporales del localStorage si existen
let datosTemporales = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  paso1: {
    categoriaId: null,
    categoriaNombre: null,
    entrenamientoId: null,
    entrenamientoNombre: null,
    entrenamientoDescripcion: null,
    objetivos: []
  },
  paso2: {
    asistencia: []
  },
  paso3: {
    calificaciones: [],
    observaciones: null
  }
};

// Función para guardar en localStorage
function guardarEnLocalStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(datosTemporales));
}

// Función para limpiar localStorage
function limpiarLocalStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

function updateStepDisplay() {
  // Actualizar círculos y líneas del progreso
  document.querySelectorAll('.step').forEach((step, index) => {
    const stepNumber = index + 1;
    step.classList.remove('active', 'completed');
    
    if (stepNumber < currentStep) {
      step.classList.add('completed');
    } else if (stepNumber === currentStep) {
      step.classList.add('active');
    }
  });

  // Actualizar líneas de conexión
  document.querySelectorAll('.step-line').forEach((line, index) => {
    line.classList.remove('completed');
    if (index < currentStep - 1) {
      line.classList.add('completed');
    }
  });

  // Actualizar contenido visible
  document.querySelectorAll('.step-content').forEach((content) => {
    content.classList.remove('active');
  });
  document.querySelector(`[data-content-step="${currentStep}"]`).classList.add('active');

  // Actualizar estado de botones
  btnPrev.disabled = currentStep === 1;
  
  if (currentStep === totalSteps) {
    btnNext.textContent = 'Finalizar';
  } else {
    btnNext.textContent = 'Siguiente';
  }
}

function guardarPaso1() {
  const categoriaOption = categoriaSelect.options[categoriaSelect.selectedIndex];
  const entrenamientoOption = entrenamientoSelect.options[entrenamientoSelect.selectedIndex];
  
  datosTemporales.paso1 = {
    categoriaId: categoriaSelect.value,
    categoriaNombre: categoriaOption.textContent,
    entrenamientoId: entrenamientoSelect.value,
    entrenamientoNombre: entrenamientoOption.textContent,
    entrenamientoDescripcion: entrenamientoOption.dataset.descripcion,
    objetivos: objetivos.map(obj => ({
      id: obj.idobjetivos,
      nombre: obj.nom_objetivo,
      descripcion: obj.descripcion || obj.desc_objetivo || obj.descripcion_objetivo || ''
    }))
  };
  
  guardarEnLocalStorage();
}

function validarPaso2() {
  // Verificar que hay datos de asistencia
  if (!asistenciaData || asistenciaData.length === 0) {
    alert('No hay alumnos registrados para tomar asistencia.');
    return false;
  }
  
  // Verificar que al menos un alumno esté presente
  const alumnosPresentes = asistenciaData.filter(a => a.presente === 1);
  if (alumnosPresentes.length === 0) {
    alert('Debe marcar al menos un alumno como presente antes de continuar.');
    return false;
  }
  
  // Verificar que no haya observaciones vacías
  const observacionesVacias = asistenciaData.filter(a => {
    const obs = a.observaciones.trim();
    return obs === '' || obs.length === 0;
  });
  
  if (observacionesVacias.length > 0) {
    alert('Todos los alumnos deben tener observaciones. Por favor, complete los campos faltantes.');
    
    // Resaltar los campos vacíos
    observacionesVacias.forEach(alumno => {
      const textarea = document.getElementById(`observacion-${alumno.matricula_id}`);
      if (textarea) {
        textarea.style.borderColor = '#dc3545';
        textarea.style.borderWidth = '2px';
        
        // Quitar el resaltado después de 3 segundos
        setTimeout(() => {
          textarea.style.borderColor = '';
          textarea.style.borderWidth = '';
        }, 3000);
      }
    });
    
    return false;
  }
  
  return true;
}

function guardarPaso2() {
  datosTemporales.paso2 = {
      asistencia: obtenerDatosAsistencia()
  };
  
  guardarEnLocalStorage();
}

function guardarPaso3() {
  const datosEval = obtenerDatosEvaluacion();
  
  datosTemporales.paso3 = {
    calificaciones: datosEval.calificaciones,
    objetivos_evaluados: datosEval.objetivos_evaluados
  };
  
  guardarEnLocalStorage();
}

async function finalizarProceso() {
  try {
    const response = await fetch('/sesiones/api/crear-sesion/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')
      },
      body: JSON.stringify(datosTemporales)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const resultado = await response.json();
    
    if (resultado.success) {
      limpiarLocalStorage();
      alert('¡Sesión de entrenamiento guardada exitosamente!');
      setTimeout(() => {
        window.location.href = '/reportes/?tab=entrenamientos';
      }, 100);
    } else {
      alert('Error al guardar la sesión: ' + resultado.error);
    }
  } catch (error) {
    console.error('Error al finalizar proceso:', error);
    alert('Error al guardar la sesión: ' + error.message);
  }
}

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Event listener para cuando cambia la categoría
categoriaSelect.addEventListener('change', async function() {
  const categoriaId = this.value;
  
  entrenamientoSelect.innerHTML = '<option value="">Cargando entrenamientos...</option>';
  entrenamientoSelect.disabled = true;
  previewContainer.style.display = 'none';
  
  if (!categoriaId) {
    entrenamientoSelect.innerHTML = '<option value="">Primero seleccione una categoría...</option>';
    return;
  }
  
  try {
    const response = await fetch(`/sesiones/api/entrenamientos/${categoriaId}/`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    entrenamientos = await response.json();
    
    entrenamientoSelect.innerHTML = '<option value="">Seleccione un entrenamiento...</option>';
    
    if (entrenamientos.length === 0) {
      entrenamientoSelect.innerHTML = '<option value="">No hay entrenamientos disponibles</option>';
      entrenamientoSelect.disabled = true;
      return;
    }
    
    entrenamientos.forEach(ent => {
      const option = document.createElement('option');
      option.value = ent.identrenamiento;
      option.textContent = ent.nom_entrenamiento;
      option.dataset.descripcion = ent.descripcion;
      entrenamientoSelect.appendChild(option);
    });
    
    entrenamientoSelect.disabled = false;
  } catch (error) {
    console.error('Error al cargar entrenamientos:', error);
    entrenamientoSelect.innerHTML = '<option value="">Error al cargar entrenamientos</option>';
    alert('Error al cargar entrenamientos: ' + error.message);
  }
});

// Event listener para cuando cambia el entrenamiento
entrenamientoSelect.addEventListener('change', async function() {
  const entrenamientoId = this.value;
  
  if (!entrenamientoId) {
    previewContainer.style.display = 'none';
    return;
  }
  
  const selectedOption = this.options[this.selectedIndex];
  const categoriaOption = categoriaSelect.options[categoriaSelect.selectedIndex];
  
  document.getElementById('preview-categoria').textContent = categoriaOption.textContent;
  document.getElementById('preview-entrenamiento').textContent = selectedOption.textContent;
  document.getElementById('preview-descripcion').textContent = selectedOption.dataset.descripcion;
  
  try {
    const response = await fetch(`/sesiones/api/objetivos/${entrenamientoId}/`);
    objetivos = await response.json();
    
    const objetivosContainer = document.getElementById('preview-objetivos');
    objetivosContainer.innerHTML = '';

    if (objetivos && objetivos.length > 0) {
        objetivos.forEach(objetivo => {
            const div = document.createElement('div');
            div.className = 'objetivo-item';
            div.textContent = objetivo.nom_objetivo;
            
            const descripcion = objetivo.descripcion || 
                              objetivo.desc_objetivo || 
                              objetivo.descripcion_objetivo || 
                              'Sin descripción disponible';
            
            div.setAttribute('data-descripcion', descripcion);
            objetivosContainer.appendChild(div);
        });
    } else {
        objetivosContainer.innerHTML = '<p>No hay objetivos asociados</p>';
    }
    
    previewContainer.style.display = 'block';
  } catch (error) {
    console.error('Error al cargar objetivos:', error);
    document.getElementById('preview-objetivos').innerHTML = '<p style="color: #dc3545;">Error al cargar objetivos</p>';
  }
});

btnPrev.addEventListener('click', () => {
  if (currentStep > 1) {
    if (currentStep === 3) {
      guardarEstadoEvaluacionEnTemporal();
    } else if (currentStep === 2) {
      guardarPaso2();
    }
    
    currentStep--;
    updateStepDisplay();
  }
});

btnNext.addEventListener('click', async () => {
  if (currentStep === 1) {
    if (!categoriaSelect.value || !entrenamientoSelect.value) {
      alert('Por favor, seleccione una categoría y un entrenamiento antes de continuar.');
      return;
    }
    
    guardarPaso1();
    
    const originalText = btnNext.textContent;
    btnNext.disabled = true;
    btnNext.textContent = 'Cargando...';
    
    try {
      await cargarAlumnosAsistencia(categoriaSelect.value);
      
      document.getElementById('info-categoria-asistencia').textContent = 
        categoriaSelect.options[categoriaSelect.selectedIndex].textContent;
      
      currentStep++;
      updateStepDisplay();
    } catch (error) {
      console.error('Error al cargar asistencia:', error);
      alert('Error al cargar los datos de asistencia. Por favor, intente nuevamente.');
    } finally {
      btnNext.disabled = false;
      btnNext.textContent = originalText;
    }
    
  } else if (currentStep === 2) {
    if (!validarPaso2()) {
      return;
    }
    
    guardarPaso2();
    
    try {
      cargarEvaluacion();
      currentStep++;
      updateStepDisplay();
    } catch (error) {
      console.error('Error al cargar evaluación:', error);
      alert('Error al cargar la evaluación. Por favor, intente nuevamente.');
    }
    
  } else if (currentStep === 3) {
    guardarPaso3();
    await finalizarProceso();
  }
});

btnCancel.addEventListener('click', () => {
  const confirmCancel = confirm('Si termina la sesión de entrenamiento, los cambios no serán guardados. ¿Está seguro de que desea cancelar?');
  
  if (confirmCancel) {
    limpiarLocalStorage();
    window.location.href = '/usuario/';
  }
});

// Inicializar vista
updateStepDisplay();