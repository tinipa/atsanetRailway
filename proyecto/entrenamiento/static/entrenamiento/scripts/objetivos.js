// ===================================
// GESTIÓN DE OBJETIVOS
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    initObjetivos();
});

function initObjetivos() {
    // Búsqueda en tiempo real
    const buscarInput = document.getElementById('buscar-objetivo-tabla');
    if (buscarInput) {
        buscarInput.addEventListener('input', filtrarObjetivos);
    }

    // Botón crear nuevo objetivo
    const btnCrear = document.getElementById('btn-crear-nuevo-objetivo');
    if (btnCrear) {
        btnCrear.addEventListener('click', abrirModalCrearObjetivo);
    }

    // Switches de estado - SOLO de la tabla de objetivos
    const switches = document.querySelectorAll('#tabla-objetivos .switch-estado-objetivo');
    switches.forEach(switchEl => {
        switchEl.addEventListener('change', cambiarEstadoObjetivo);
    });

    // Botones editar - SOLO de la tabla de objetivos
    const botonesEditar = document.querySelectorAll('#tabla-objetivos .fila-objetivo .editar');
    botonesEditar.forEach(btn => {
        btn.addEventListener('click', abrirModalEditarObjetivo);
    });

    // Botones eliminar - SOLO de la tabla de objetivos
    const botonesEliminar = document.querySelectorAll('#tabla-objetivos .fila-objetivo .eliminar-objetivo');
    botonesEliminar.forEach(btn => {
        btn.addEventListener('click', confirmarEliminarObjetivo);
    });

    // Ordenamiento de columnas
    const columnasOrdenables = document.querySelectorAll('.sortable-objetivo');
    columnasOrdenables.forEach(columna => {
        columna.addEventListener('click', ordenarTablaObjetivos);
    });

    // Actualizar contador inicial
    actualizarContadorObjetivos();
    
    // Escuchar cuando el modal de crear se abre
    const modalCrear = document.getElementById('crearObjetivoModal');
    if (modalCrear) {
        modalCrear.addEventListener('shown.bs.modal', function () {
            inicializarModalCrearObjetivo();
        });
    }
    
    // Escuchar cuando el modal de editar se abre
    const modalEditar = document.getElementById('editarObjetivoModal');
    if (modalEditar) {
        modalEditar.addEventListener('shown.bs.modal', function () {
            inicializarModalEditarObjetivo();
        });
    }
}

// ============================================
// FUNCIONES DE MODALES
// ============================================

// Abrir modal para crear objetivo
function abrirModalCrearObjetivo() {
    limpiarFormularioCrearObjetivo();
    
    const modal = new bootstrap.Modal(document.getElementById('crearObjetivoModal'));
    modal.show();
}

// Abrir modal para editar objetivo
function abrirModalEditarObjetivo(e) {
    const objetivoId = e.currentTarget.dataset.id;
    
    // Obtener datos del objetivo
    fetch(`/entrenamientos/api/objetivo/${objetivoId}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const objetivo = data.objetivo;
                
                // Llenar el formulario
                document.getElementById('editar_id_objetivo').value = objetivo.idobjetivos;
                document.getElementById('editar_nombre_objetivo').value = objetivo.nom_objetivo;
                document.getElementById('editar_descripcion_objetivo').value = objetivo.descripcion;
                
                // Guardar información de calificaciones
                infoCalificacionesObjetivo = {
                    tiene_calificaciones: objetivo.tiene_calificaciones || false,
                    total_calificaciones: objetivo.total_calificaciones || 0
                };
                
                // Mostrar el modal
                const modal = new bootstrap.Modal(document.getElementById('editarObjetivoModal'));
                modal.show();
            } else {
                alert('❌ Error: ' + (data.error || 'No se pudo cargar el objetivo'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('❌ Error de conexión al cargar el objetivo');
        });
}

// Variable global para información de calificaciones
let infoCalificacionesObjetivo = {
    tiene_calificaciones: false,
    total_calificaciones: 0
};

// Limpiar formulario de crear objetivo
function limpiarFormularioCrearObjetivo() {
    const nombreInput = document.getElementById('nuevo_nombre_objetivo');
    const descripcionTextarea = document.getElementById('nuevo_descripcion_objetivo');
    const contadorNombre = document.getElementById('contador-nombre-objetivo');
    const contadorDescripcion = document.getElementById('contador-descripcion-objetivo');
    
    if (nombreInput) nombreInput.value = '';
    if (descripcionTextarea) descripcionTextarea.value = '';
    
    if (contadorNombre) {
        contadorNombre.textContent = '0 / 30 caracteres';
        contadorNombre.classList.remove('advertencia', 'peligro');
        contadorNombre.classList.add('normal');
    }
    
    if (contadorDescripcion) {
        contadorDescripcion.textContent = '0 / 300 caracteres';
        contadorDescripcion.classList.remove('advertencia', 'peligro');
        contadorDescripcion.classList.add('normal');
    }
}

// Inicializar modal crear objetivo
function inicializarModalCrearObjetivo() {
    const nombreInput = document.getElementById('nuevo_nombre_objetivo');
    const descripcionTextarea = document.getElementById('nuevo_descripcion_objetivo');
    const contadorNombre = document.getElementById('contador-nombre-objetivo');
    const contadorDescripcion = document.getElementById('contador-descripcion-objetivo');
    const formCrear = document.getElementById('form-crear-objetivo');
    
    // Contador de caracteres para nombre
    if (nombreInput && contadorNombre) {
        nombreInput.removeEventListener('input', contadorNombreHandler);
        nombreInput.addEventListener('input', contadorNombreHandler);
    }
    
    // Contador de caracteres para descripción
    if (descripcionTextarea && contadorDescripcion) {
        descripcionTextarea.removeEventListener('input', contadorDescripcionHandler);
        descripcionTextarea.addEventListener('input', contadorDescripcionHandler);
    }
    
    // Manejar submit del formulario
    if (formCrear) {
        formCrear.removeEventListener('submit', submitHandler);
        formCrear.addEventListener('submit', submitHandler);
    }
    
    // Handlers
    function contadorNombreHandler() {
        actualizarContador(this, contadorNombre, 30);
    }
    
    function contadorDescripcionHandler() {
        actualizarContador(this, contadorDescripcion, 300);
    }
    
    function submitHandler(e) {
        e.preventDefault();
        crearNuevoObjetivo();
    }
}

// Inicializar modal editar objetivo
function inicializarModalEditarObjetivo() {
    const nombreInput = document.getElementById('editar_nombre_objetivo');
    const descripcionTextarea = document.getElementById('editar_descripcion_objetivo');
    const contadorNombre = document.getElementById('contador-editar-nombre-objetivo');
    const contadorDescripcion = document.getElementById('contador-editar-descripcion-objetivo');
    const formEditar = document.getElementById('form-editar-objetivo');
    
    // Actualizar contadores inicialmente
    if (nombreInput && contadorNombre) {
        actualizarContador(nombreInput, contadorNombre, 30);
    }
    
    if (descripcionTextarea && contadorDescripcion) {
        actualizarContador(descripcionTextarea, contadorDescripcion, 300);
    }
    
    // Event listeners
    if (nombreInput && contadorNombre) {
        nombreInput.removeEventListener('input', contadorEditarNombreHandler);
        nombreInput.addEventListener('input', contadorEditarNombreHandler);
    }
    
    if (descripcionTextarea && contadorDescripcion) {
        descripcionTextarea.removeEventListener('input', contadorEditarDescripcionHandler);
        descripcionTextarea.addEventListener('input', contadorEditarDescripcionHandler);
    }
    
    if (formEditar) {
        formEditar.removeEventListener('submit', submitEditarHandler);
        formEditar.addEventListener('submit', submitEditarHandler);
    }
    
    // Handlers
    function contadorEditarNombreHandler() {
        actualizarContador(this, contadorNombre, 30);
    }
    
    function contadorEditarDescripcionHandler() {
        actualizarContador(this, contadorDescripcion, 300);
    }
    
    function submitEditarHandler(e) {
        e.preventDefault();
        editarObjetivo();
    }
}

// Función auxiliar para actualizar contadores
function actualizarContador(inputElement, contadorElement, maxLength) {
    const length = inputElement.value.length;
    const remaining = maxLength - length;
    
    contadorElement.textContent = `${length} / ${maxLength} caracteres`;
    contadorElement.classList.remove('normal', 'advertencia', 'peligro');
    
    if (length >= maxLength) {
        contadorElement.classList.add('peligro');
        contadorElement.textContent = `⚠️ ${length} / ${maxLength} caracteres (límite alcanzado)`;
    } else if (length > maxLength * 0.8) {
        contadorElement.classList.add('advertencia');
        contadorElement.textContent = `${length} / ${maxLength} caracteres (${remaining} restantes)`;
    } else {
        contadorElement.classList.add('normal');
    }
}

// ============================================
// FUNCIONES CRUD
// ============================================

// Crear nuevo objetivo
function crearNuevoObjetivo() {
    const nombreInput = document.getElementById('nuevo_nombre_objetivo');
    const descripcionTextarea = document.getElementById('nuevo_descripcion_objetivo');
    
    const nombre = nombreInput.value.trim();
    const descripcion = descripcionTextarea.value.trim();
    
    if (!nombre) {
        mostrarAlerta('❌ El nombre del objetivo es obligatorio', 'error');
        nombreInput.focus();
        return;
    }
    
    if (nombre.length > 30) {
        mostrarAlerta('❌ El nombre no puede exceder 30 caracteres', 'error');
        nombreInput.focus();
        return;
    }
    
    if (!descripcion) {
        mostrarAlerta('❌ La descripción del objetivo es obligatoria', 'error');
        descripcionTextarea.focus();
        return;
    }
    
    if (descripcion.length > 300) {
        mostrarAlerta('❌ La descripción no puede exceder 300 caracteres', 'error');
        descripcionTextarea.focus();
        return;
    }
    
    const formData = new FormData();
    formData.append('nombre_objetivo', nombre);
    formData.append('descripcion_objetivo', descripcion);
    formData.append('estado', 'true');
    
    const btnSubmit = document.querySelector('#form-crear-objetivo button[type="submit"]');
    const textoOriginal = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    
    fetch('/entrenamientos/api/objetivo/crear/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoOriginal;
        
        if (data.success) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('crearObjetivoModal'));
            modal.hide();
            
            mostrarNotificacion(`✓ Objetivo "${nombre}" creado exitosamente`, 'success');
            
            agregarObjetivoATabla(data.objetivo);
            limpiarFormularioCrearObjetivo();
            actualizarContadorObjetivos();
            
        } else {
            if (data.nombre_existente) {
                mostrarAlertaDuplicado(nombre, data.nombre_existente, nombreInput);
            } else {
                mostrarAlerta('❌ ' + (data.error || 'No se pudo crear el objetivo'), 'error');
            }
        }
    })
    .catch(error => {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoOriginal;
        console.error('Error:', error);
        mostrarAlerta('❌ Error de conexión al crear el objetivo. Por favor, intenta nuevamente.', 'error');
    });
}

// Editar objetivo
function editarObjetivo() {
    const objetivoId = document.getElementById('editar_id_objetivo').value;
    const nombreInput = document.getElementById('editar_nombre_objetivo');
    const descripcionTextarea = document.getElementById('editar_descripcion_objetivo');
    
    const nombre = nombreInput.value.trim();
    const descripcion = descripcionTextarea.value.trim();
    
    if (!nombre) {
        mostrarAlerta('❌ El nombre del objetivo es obligatorio', 'error');
        nombreInput.focus();
        return;
    }
    
    if (nombre.length > 30) {
        mostrarAlerta('❌ El nombre no puede exceder 30 caracteres', 'error');
        nombreInput.focus();
        return;
    }
    
    if (!descripcion) {
        mostrarAlerta('❌ La descripción del objetivo es obligatoria', 'error');
        descripcionTextarea.focus();
        return;
    }
    
    if (descripcion.length > 300) {
        mostrarAlerta('❌ La descripción no puede exceder 300 caracteres', 'error');
        descripcionTextarea.focus();
        return;
    }
    
    const formData = new FormData();
    formData.append('id_objetivo', objetivoId);
    formData.append('nombre_objetivo', nombre);
    formData.append('descripcion_objetivo', descripcion);
    
    const btnSubmit = document.querySelector('#form-editar-objetivo button[type="submit"]');
    const textoOriginal = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    
    fetch('/entrenamientos/api/objetivo/editar/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoOriginal;
        
        if (data.success) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('editarObjetivoModal'));
            modal.hide();
            
            mostrarNotificacion(`✓ ${data.message}`, 'success');
            
            actualizarFilaObjetivo(data.objetivo);
            
        } else {
            mostrarAlerta('❌ ' + (data.error || 'No se pudo actualizar el objetivo'), 'error');
        }
    })
    .catch(error => {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoOriginal;
        console.error('Error:', error);
        mostrarAlerta('❌ Error de conexión al actualizar el objetivo', 'error');
    });
}

// Confirmar eliminar objetivo
function confirmarEliminarObjetivo(e) {
    const objetivoId = e.currentTarget.dataset.id;
    const nombreObjetivo = e.currentTarget.dataset.nombre;
    
    // Primero verificar si se puede eliminar
    fetch(`/entrenamientos/api/objetivo/${objetivoId}/verificar-eliminar/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (data.puede_eliminar) {
                    const confirmacion = confirm(
                        `¿Estás seguro de que deseas eliminar el objetivo "${nombreObjetivo}"?\n\n` +
                        `Esta acción no se puede deshacer.`
                    );
                    
                    if (confirmacion) {
                        eliminarObjetivo(objetivoId);
                    }
                } else {
                    alert(
                        `❌ NO SE PUEDE ELIMINAR\n\n` +
                        `El objetivo "${nombreObjetivo}" tiene ${data.total_calificaciones} calificación(es) asociada(s).\n\n` +
                        `No es posible eliminar objetivos que ya han sido utilizados en evaluaciones.`
                    );
                }
            } else {
                alert('❌ Error: ' + (data.error || 'No se pudo verificar el objetivo'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('❌ Error de conexión al verificar el objetivo');
        });
}

// Eliminar objetivo
function eliminarObjetivo(objetivoId) {
    const formData = new FormData();
    formData.append('id_objetivo', objetivoId);
    
    fetch('/entrenamientos/api/objetivo/eliminar/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarNotificacion(`✓ ${data.message}`, 'success');
            
            eliminarFilaObjetivo(objetivoId);
            actualizarContadorObjetivos();
            
        } else {
            alert('❌ Error: ' + (data.error || 'No se pudo eliminar el objetivo'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('❌ Error de conexión al eliminar el objetivo');
    });
}

// ============================================
// FUNCIONES DE UI
// ============================================

// Agregar objetivo a la tabla
function agregarObjetivoATabla(objetivo) {
    const tbody = document.querySelector('#tabla-objetivos tbody');
    const filaVacia = document.getElementById('fila-vacia-objetivos');
    
    if (filaVacia) {
        filaVacia.remove();
    }
    
    const nuevaFila = document.createElement('tr');
    nuevaFila.className = 'fila-objetivo';
    nuevaFila.dataset.nombre = objetivo.nom_objetivo.toLowerCase();
    nuevaFila.dataset.descripcion = objetivo.descripcion.toLowerCase();
    nuevaFila.dataset.estado = objetivo.estado ? '1' : '0';
    
    nuevaFila.innerHTML = `
        <td style="text-align: center;">
            <strong>${objetivo.nom_objetivo}</strong>
            <br>
            <small style="color: #666;">${objetivo.descripcion}</small>
        </td>
        <td>
            <div class="form-check form-switch" style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                <input class="form-check-input switch-estado-objetivo" type="checkbox" 
                       role="switch" id="switch-objetivo-${objetivo.idobjetivos}" 
                       data-id="${objetivo.idobjetivos}" 
                       ${objetivo.estado ? 'checked' : ''}
                       style="cursor: pointer; width: 50px; height: 25px;">
                <label class="form-check-label" for="switch-objetivo-${objetivo.idobjetivos}" 
                       style="cursor: pointer; font-weight: 500; min-width: 60px;">
                    <span class="badge ${objetivo.estado ? 'bg-success' : 'bg-secondary'}" 
                          id="badge-objetivo-${objetivo.idobjetivos}>
                        ${objetivo.estado ? 'Activo' : 'Inactivo'}
                    </span>
                </label>
            </div>
        </td>
        <td>
            <div class="btn-container" style="display: flex; gap: 10px; justify-content: center;">
                <button type="button" class="editar" data-id="${objetivo.idobjetivos}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button type="button" class="rechazar eliminar-objetivo" 
                        data-id="${objetivo.idobjetivos}"
                        data-nombre="${objetivo.nom_objetivo}">
                    <i class="fas fa-trash-alt"></i> Eliminar
                </button>
            </div>
        </td>
    `;
    
    tbody.insertBefore(nuevaFila, tbody.firstChild);
    
    // Re-aplicar event listeners
    const switchEl = nuevaFila.querySelector('.switch-estado-objetivo');
    switchEl.addEventListener('change', cambiarEstadoObjetivo);
    
    const btnEditar = nuevaFila.querySelector('.editar');
    btnEditar.addEventListener('click', abrirModalEditarObjetivo);
    
    const btnEliminar = nuevaFila.querySelector('.eliminar-objetivo');
    btnEliminar.addEventListener('click', confirmarEliminarObjetivo);
    
    nuevaFila.style.animation = 'fadeIn 0.5s ease-in';
}

// Actualizar fila de objetivo
function actualizarFilaObjetivo(objetivo) {
    // Buscar la fila por el ID del objetivo (más confiable que por nombre)
    const filas = document.querySelectorAll('.fila-objetivo');
    let filaEncontrada = null;
    
    filas.forEach(fila => {
        const btnEditar = fila.querySelector('.editar');
        if (btnEditar && btnEditar.dataset.id == objetivo.idobjetivos) {
            filaEncontrada = fila;
        }
    });
    
    if (filaEncontrada) {
        // Actualizar los data attributes
        filaEncontrada.dataset.nombre = objetivo.nom_objetivo.toLowerCase();
        filaEncontrada.dataset.descripcion = objetivo.descripcion.toLowerCase();
        
        // Actualizar el contenido de la celda del nombre y descripción
        const celdaNombre = filaEncontrada.querySelector('td:first-child');
        if (celdaNombre) {
            celdaNombre.innerHTML = `
                <strong>${objetivo.nom_objetivo}</strong>
                <br>
                <small style="color: #666;">${objetivo.descripcion}</small>
            `;
            
            // Animación de actualización
            celdaNombre.style.animation = 'pulseCelda 1s ease';
            setTimeout(() => {
                celdaNombre.style.animation = '';
            }, 1000);
        }
        
        // Actualizar el data-nombre del botón eliminar
        const btnEliminar = filaEncontrada.querySelector('.eliminar-objetivo');
        if (btnEliminar) {
            btnEliminar.dataset.nombre = objetivo.nom_objetivo;
        }
        
        // Scroll suave hacia la fila actualizada
        filaEncontrada.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Resaltar brevemente la fila actualizada
        filaEncontrada.style.backgroundColor = '#d4edda';
        setTimeout(() => {
            filaEncontrada.style.backgroundColor = '';
        }, 2000);
    } else {
        console.warn('No se encontró la fila del objetivo con ID:', objetivo.idobjetivos);
        // Si no se encuentra la fila, recargar la página como fallback
        setTimeout(() => {
            location.reload();
        }, 1500);
    }
}

// Eliminar fila de objetivo
function eliminarFilaObjetivo(objetivoId) {
    const fila = document.querySelector(`.fila-objetivo .editar[data-id="${objetivoId}"]`)?.closest('.fila-objetivo');
    
    if (fila) {
        fila.style.animation = 'fadeOut 0.5s ease';
        setTimeout(() => {
            fila.remove();
            
            const tbody = document.querySelector('#tabla-objetivos tbody');
            if (tbody.querySelectorAll('.fila-objetivo').length === 0) {
                const filaVacia = document.createElement('tr');
                filaVacia.id = 'fila-vacia-objetivos';
                filaVacia.innerHTML = `
                    <td colspan="3" style="text-align: center; padding: 40px; color: #999;">
                        <i class="fas fa-bullseye" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                        <p style="font-size: 16px; font-weight: 500;">No hay objetivos registrados</p>
                    </td>
                `;
                tbody.appendChild(filaVacia);
            }
        }, 500);
    }
}

// Cambiar estado del objetivo
function cambiarEstadoObjetivo(e) {
    const switchEl = e.target;
    const objetivoId = switchEl.dataset.id;
    const nuevoEstado = switchEl.checked;
    const badge = document.getElementById(`badge-objetivo-${objetivoId}`);
    const fila = switchEl.closest('.fila-objetivo');
    
    const estadoAnterior = !nuevoEstado;
    switchEl.disabled = true;

    const formData = new FormData();
    formData.append('id_objetivo', objetivoId);
    formData.append('estado', nuevoEstado ? 'true' : 'false');
    
    fetch('/entrenamientos/api/objetivo/cambiar-estado/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        switchEl.disabled = false;
        
        if (data.success) {
            if (badge) {
                badge.textContent = data.estado_texto;
                badge.className = `badge ${data.nuevo_estado ? 'bg-success' : 'bg-secondary'}`;
            }
            
            fila.dataset.estado = data.nuevo_estado ? '1' : '0';
            switchEl.checked = data.nuevo_estado;
            
            mostrarNotificacion(`✓ ${data.message}`, 'success');
        } else {
            switchEl.checked = estadoAnterior;
            
            if (badge) {
                badge.textContent = estadoAnterior ? 'Activo' : 'Inactivo';
                badge.className = `badge ${estadoAnterior ? 'bg-success' : 'bg-secondary'}`;
            }
            fila.dataset.estado = estadoAnterior ? '1' : '0';
            
            alert('❌ Error: ' + (data.error || 'No se pudo cambiar el estado'));
        }
    })
    .catch(error => {
        switchEl.checked = estadoAnterior;
        switchEl.disabled = false;
        
        if (badge) {
            badge.textContent = estadoAnterior ? 'Activo' : 'Inactivo';
            badge.className = `badge ${estadoAnterior ? 'bg-success' : 'bg-secondary'}`;
        }
        fila.dataset.estado = estadoAnterior ? '1' : '0';
        
        console.error('Error:', error);
        alert('❌ Error de conexión al cambiar el estado. Por favor, intenta nuevamente.');
    });
}

// Filtrar objetivos
function filtrarObjetivos() {
    const filtro = this.value.toLowerCase().trim();
    const filas = document.querySelectorAll('.fila-objetivo');
    const filaVacia = document.getElementById('fila-vacia-objetivos');
    let visibles = 0;

    filas.forEach(fila => {
        const nombreObjetivo = fila.dataset.nombre || '';
        const descripcion = fila.dataset.descripcion || '';

        if (nombreObjetivo.includes(filtro) || descripcion.includes(filtro)) {
            fila.style.display = '';
            visibles++;
        } else {
            fila.style.display = 'none';
        }
    });

    if (filaVacia) {
        filaVacia.style.display = 'none';
    }

    const sinObjetivos = document.getElementById('sin-objetivos');
    const tabla = document.getElementById('tabla-objetivos');
    
    if (sinObjetivos && tabla) {
        if (visibles === 0 && filtro !== '') {
            tabla.style.display = 'none';
            sinObjetivos.style.display = 'block';
        } else {
            tabla.style.display = 'table';
            sinObjetivos.style.display = 'none';
        }
    }

    actualizarContadorObjetivos();
}

// Ordenar tabla
function ordenarTablaObjetivos(e) {
    const columna = e.currentTarget;
    const tipoColumna = columna.dataset.column;
    const ordenActual = columna.dataset.order || 'none';
    
    let nuevoOrden;
    if (ordenActual === 'none' || ordenActual === 'desc') {
        nuevoOrden = 'asc';
    } else {
        nuevoOrden = 'desc';
    }
    
    document.querySelectorAll('.sortable-objetivo').forEach(col => {
        col.removeAttribute('data-order');
        const icon = col.querySelector('.sort-icon-objetivo i');
        if (icon) {
            icon.className = 'fas fa-sort';
        }
    });
    
    columna.dataset.order = nuevoOrden;
    
    const tbody = document.querySelector('#tabla-objetivos tbody');
    const filas = Array.from(tbody.querySelectorAll('.fila-objetivo'));
    
    filas.sort((a, b) => {
        let valorA, valorB;
        
        if (tipoColumna === 'nombre') {
            valorA = a.dataset.nombre || '';
            valorB = b.dataset.nombre || '';
            
            if (nuevoOrden === 'asc') {
                return valorA.localeCompare(valorB);
            } else {
                return valorB.localeCompare(valorA);
            }
        } else if (tipoColumna === 'estado') {
            valorA = parseInt(a.dataset.estado) || 0;
            valorB = parseInt(b.dataset.estado) || 0;
            
            if (nuevoOrden === 'asc') {
                return valorA - valorB;
            } else {
                return valorB - valorA;
            }
        }
        
        return 0;
    });
    
    const filaVacia = tbody.querySelector('#fila-vacia-objetivos');
    tbody.innerHTML = '';
    
    if (filas.length === 0 && filaVacia) {
        tbody.appendChild(filaVacia);
    } else {
        filas.forEach(fila => tbody.appendChild(fila));
    }
    
    const icon = columna.querySelector('.sort-icon-objetivo i');
    if (icon) {
        if (nuevoOrden === 'asc') {
            icon.className = 'fas fa-sort-up';
        } else {
            icon.className = 'fas fa-sort-down';
        }
    }
}

// Actualizar contador
function actualizarContadorObjetivos() {
    const contador = document.getElementById('total-objetivos-contador');
    if (contador) {
        const total = document.querySelectorAll('.fila-objetivo').length;
        contador.textContent = total;
    }
}

// Mostrar alerta duplicado
function mostrarAlertaDuplicado(nombreIngresado, nombreExistente, inputElement) {
    const mensaje = `⚠️ NOMBRE DUPLICADO\n\n` +
                   `El objetivo que intentas crear ya existe:\n\n` +
                   `📝 Nombre ingresado: "${nombreIngresado}"\n` +
                   `✅ Ya existe como: "${nombreExistente}"\n\n` +
                   `💡 Los nombres de objetivos no distinguen mayúsculas/minúsculas.\n` +
                   `Por favor, elige un nombre diferente.`;
    
    alert(mensaje);
    
    if (inputElement) {
        inputElement.focus();
        inputElement.select();
        inputElement.style.borderColor = '#dc3545';
        inputElement.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';
        
        setTimeout(() => {
            inputElement.style.borderColor = '';
            inputElement.style.boxShadow = '';
        }, 3000);
    }
}

// Mostrar alerta
function mostrarAlerta(mensaje, tipo = 'info') {
    const colores = {
        'success': '#28a745',
        'error': '#dc3545',
        'warning': '#ffc107',
        'info': '#17a2b8'
    };
    
    const color = colores[tipo] || colores.info;
    
    const alerta = document.createElement('div');
    alerta.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${color};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10001;
        font-weight: 500;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    `;
    alerta.textContent = mensaje;
    document.body.appendChild(alerta);
    
    setTimeout(() => {
        alerta.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => alerta.remove(), 300);
    }, 4000);
}

// Función getCookie para CSRF
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

// Función mostrarNotificacion (si no existe en otro archivo)
function mostrarNotificacion(mensaje, tipo = 'success') {
    mostrarAlerta(mensaje, tipo);
}