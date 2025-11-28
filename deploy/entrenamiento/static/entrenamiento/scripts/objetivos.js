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

// Inicializar funcionalidad del modal crear objetivo
function inicializarModalCrearObjetivo() {
    const nombreInput = document.getElementById('nuevo_nombre_objetivo');
    const descripcionTextarea = document.getElementById('nuevo_descripcion_objetivo');
    const contadorNombre = document.getElementById('contador-nombre-objetivo');
    const contadorDescripcion = document.getElementById('contador-descripcion-objetivo');
    const formCrear = document.getElementById('form-crear-objetivo');
    
    // Contador de caracteres para nombre
    if (nombreInput && contadorNombre) {
        nombreInput.removeEventListener('input', contadorNombreHandler);
        
        function contadorNombreHandler() {
            const length = this.value.length;
            const maxLength = 30;
            const remaining = maxLength - length;
            
            contadorNombre.textContent = `${length} / ${maxLength} caracteres`;
            contadorNombre.classList.remove('normal', 'advertencia', 'peligro');
            
            if (length >= maxLength) {
                contadorNombre.classList.add('peligro');
                contadorNombre.textContent = `⚠️ ${length} / ${maxLength} caracteres (límite alcanzado)`;
            } else if (length > maxLength * 0.8) {
                contadorNombre.classList.add('advertencia');
                contadorNombre.textContent = `${length} / ${maxLength} caracteres (${remaining} restantes)`;
            } else {
                contadorNombre.classList.add('normal');
            }
        }
        
        nombreInput.addEventListener('input', contadorNombreHandler);
    }
    
    // Contador de caracteres para descripción
    if (descripcionTextarea && contadorDescripcion) {
        descripcionTextarea.removeEventListener('input', contadorDescripcionHandler);
        
        function contadorDescripcionHandler() {
            const length = this.value.length;
            const maxLength = 300;
            const remaining = maxLength - length;
            
            contadorDescripcion.textContent = `${length} / ${maxLength} caracteres`;
            contadorDescripcion.classList.remove('normal', 'advertencia', 'peligro');
            
            if (length >= maxLength) {
                contadorDescripcion.classList.add('peligro');
                contadorDescripcion.textContent = `⚠️ ${length} / ${maxLength} caracteres (límite alcanzado)`;
            } else if (length > maxLength * 0.8) {
                contadorDescripcion.classList.add('advertencia');
                contadorDescripcion.textContent = `${length} / ${maxLength} caracteres (${remaining} restantes)`;
            } else {
                contadorDescripcion.classList.add('normal');
            }
        }
        
        descripcionTextarea.addEventListener('input', contadorDescripcionHandler);
    }
    
    // Manejar submit del formulario
    if (formCrear) {
        formCrear.removeEventListener('submit', submitHandler);
        
        function submitHandler(e) {
            e.preventDefault();
            crearNuevoObjetivo();
        }
        
        formCrear.addEventListener('submit', submitHandler);
    }
}

// Variable global para almacenar información de calificaciones
let infoCalificacionesObjetivo = {
    tiene_calificaciones: false,
    total_calificaciones: 0
};

// Inicializar funcionalidad del modal editar objetivo
function inicializarModalEditarObjetivo() {
    const nombreInput = document.getElementById('editar_nombre_objetivo');
    const descripcionTextarea = document.getElementById('editar_descripcion_objetivo');
    const contadorNombre = document.getElementById('contador-editar-nombre-objetivo');
    const contadorDescripcion = document.getElementById('contador-editar-descripcion-objetivo');
    const formEditar = document.getElementById('form-editar-objetivo');
    
    // Actualizar contadores inicialmente
    if (nombreInput && contadorNombre) {
        const length = nombreInput.value.length;
        const maxLength = 30;
        contadorNombre.textContent = `${length} / ${maxLength} caracteres`;
        contadorNombre.classList.add('normal');
    }
    
    if (descripcionTextarea && contadorDescripcion) {
        const length = descripcionTextarea.value.length;
        const maxLength = 300;
        contadorDescripcion.textContent = `${length} / ${maxLength} caracteres`;
        contadorDescripcion.classList.add('normal');
    }
    
    // Contador de caracteres para nombre
    if (nombreInput && contadorNombre) {
        nombreInput.removeEventListener('input', contadorEditarNombreHandler);
        
        function contadorEditarNombreHandler() {
            const length = this.value.length;
            const maxLength = 30;
            const remaining = maxLength - length;
            
            contadorNombre.textContent = `${length} / ${maxLength} caracteres`;
            contadorNombre.classList.remove('normal', 'advertencia', 'peligro');
            
            if (length >= maxLength) {
                contadorNombre.classList.add('peligro');
                contadorNombre.textContent = `⚠️ ${length} / ${maxLength} caracteres (límite alcanzado)`;
            } else if (length > maxLength * 0.8) {
                contadorNombre.classList.add('advertencia');
                contadorNombre.textContent = `${length} / ${maxLength} caracteres (${remaining} restantes)`;
            } else {
                contadorNombre.classList.add('normal');
            }
        }
        
        nombreInput.addEventListener('input', contadorEditarNombreHandler);
    }
    
    // Contador de caracteres para descripción
    if (descripcionTextarea && contadorDescripcion) {
        descripcionTextarea.removeEventListener('input', contadorEditarDescripcionHandler);
        
        function contadorEditarDescripcionHandler() {
            const length = this.value.length;
            const maxLength = 300;
            const remaining = maxLength - length;
            
            contadorDescripcion.textContent = `${length} / ${maxLength} caracteres`;
            contadorDescripcion.classList.remove('normal', 'advertencia', 'peligro');
            
            if (length >= maxLength) {
                contadorDescripcion.classList.add('peligro');
                contadorDescripcion.textContent = `⚠️ ${length} / ${maxLength} caracteres (límite alcanzado)`;
            } else if (length > maxLength * 0.8) {
                contadorDescripcion.classList.add('advertencia');
                contadorDescripcion.textContent = `${length} / ${maxLength} caracteres (${remaining} restantes)`;
            } else {
                contadorDescripcion.classList.add('normal');
            }
        }
        
        descripcionTextarea.addEventListener('input', contadorEditarDescripcionHandler);
    }
    
    // Manejar submit del formulario
    if (formEditar) {
        formEditar.removeEventListener('submit', submitEditarHandler);
        
        function submitEditarHandler(e) {
            e.preventDefault();
            editarObjetivo();
        }
        
        formEditar.addEventListener('submit', submitEditarHandler);
    }
}

// Ordenar tabla de objetivos
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

// Filtrar objetivos en la tabla
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

// Actualizar contador de objetivos
function actualizarContadorObjetivos() {
    const totalVisible = document.getElementById('total-visible-objetivos');
    const totalObjetivos = document.getElementById('total-objetivos');
    
    if (totalVisible && totalObjetivos) {
        const filasVisibles = document.querySelectorAll('.fila-objetivo:not([style*="display: none"])').length;
        totalVisible.textContent = filasVisibles;
        totalObjetivos.textContent = document.querySelectorAll('.fila-objetivo').length;
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

// Abrir modal para crear objetivo
function abrirModalCrearObjetivo() {
    limpiarFormularioCrearObjetivo();
    
    const modal = new bootstrap.Modal(document.getElementById('crearObjetivoModal'));
    modal.show();
}

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

// Crear nuevo objetivo
function crearNuevoObjetivo() {
    const nombreInput = document.getElementById('nuevo_nombre_objetivo');
    const descripcionTextarea = document.getElementById('nuevo_descripcion_objetivo');
    
    const nombre = nombreInput.value.trim();
    const descripcion = descripcionTextarea.value.trim();
    
    if (!nombre) {
        alert('❌ El nombre del objetivo es obligatorio');
        nombreInput.focus();
        return;
    }
    
    if (nombre.length > 30) {
        alert('❌ El nombre no puede exceder 30 caracteres');
        nombreInput.focus();
        return;
    }
    
    if (!descripcion) {
        alert('❌ La descripción del objetivo es obligatoria');
        descripcionTextarea.focus();
        return;
    }
    
    if (descripcion.length > 300) {
        alert('❌ La descripción no puede exceder 300 caracteres');
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
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    
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
            alert('❌ Error: ' + (data.error || 'No se pudo crear el objetivo'));
        }
    })
    .catch(error => {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoOriginal;
        console.error('Error:', error);
        alert('❌ Error de conexión al crear el objetivo. Por favor, intenta nuevamente.');
    });
}

// Abrir modal para editar objetivo
function abrirModalEditarObjetivo(e) {
    const objetivoId = e.currentTarget.dataset.id;
    
    fetch(`/entrenamientos/api/objetivo/${objetivoId}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                document.getElementById('editar_id_objetivo').value = data.objetivo.idobjetivos;
                document.getElementById('editar_nombre_objetivo').value = data.objetivo.nom_objetivo;
                document.getElementById('editar_descripcion_objetivo').value = data.objetivo.descripcion;
                
                infoCalificacionesObjetivo = {
                    tiene_calificaciones: data.objetivo.tiene_calificaciones,
                    total_calificaciones: data.objetivo.total_calificaciones
                };
                
                const modal = new bootstrap.Modal(document.getElementById('editarObjetivoModal'));
                modal.show();
            } else {
                alert('❌ Error: ' + (data.error || 'No se pudo cargar el objetivo'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('❌ Error de conexión al cargar el objetivo. Por favor, intenta nuevamente.');
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
        alert('❌ El nombre del objetivo es obligatorio');
        nombreInput.focus();
        return;
    }
    
    if (nombre.length > 30) {
        alert('❌ El nombre no puede exceder 30 caracteres');
        nombreInput.focus();
        return;
    }
    
    if (!descripcion) {
        alert('❌ La descripción del objetivo es obligatoria');
        descripcionTextarea.focus();
        return;
    }
    
    if (descripcion.length > 300) {
        alert('❌ La descripción no puede exceder 300 caracteres');
        descripcionTextarea.focus();
        return;
    }
    
    mostrarConfirmacionEdicion(nombre, descripcion, objetivoId);
}

// Mostrar confirmación personalizada antes de guardar
function mostrarConfirmacionEdicion(nombre, descripcion, objetivoId) {
    let mensaje = '⚠️ ADVERTENCIA IMPORTANTE\n\n';
    mensaje += '¿Está seguro de que desea guardar estos cambios?\n\n';
    mensaje += '📝 Los cambios afectarán:\n\n';
    mensaje += '• Sesiones de entrenamiento donde se use este objetivo\n';
    mensaje += '• Calificaciones de alumnos asociadas a este objetivo\n';
    mensaje += '• Reportes y estadísticas que incluyan este objetivo\n\n';
    
    if (infoCalificacionesObjetivo.tiene_calificaciones) {
        mensaje += `📊 Este objetivo tiene ${infoCalificacionesObjetivo.total_calificaciones} calificación(es) asociada(s)\n\n`;
    }
    
    mensaje += '💡 Los cambios se aplicarán inmediatamente en todo el sistema.\n\n';
    mensaje += '¿Desea continuar?';
    
    if (confirm(mensaje)) {
        guardarEdicionObjetivo(objetivoId, nombre, descripcion);
    }
}

// Guardar la edición del objetivo
function guardarEdicionObjetivo(objetivoId, nombre, descripcion) {
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
            
            mostrarNotificacion(`✓ Objetivo "${nombre}" actualizado exitosamente`, 'success');
            
            actualizarFilaObjetivo(data.objetivo);
            
        } else {
            alert('❌ Error: ' + (data.error || 'No se pudo actualizar el objetivo'));
        }
    })
    .catch(error => {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoOriginal;
        console.error('Error:', error);
        alert('❌ Error de conexión al actualizar el objetivo. Por favor, intenta nuevamente.');
    });
}

// Actualizar fila del objetivo en la tabla
function actualizarFilaObjetivo(objetivo) {
    const botonEditar = document.querySelector(`#tabla-objetivos .editar[data-id="${objetivo.idobjetivos}"]`);
    
    if (!botonEditar) {
        console.error('No se encontró el botón editar para el objetivo:', objetivo.idobjetivos);
        return;
    }
    
    let fila = botonEditar.closest('tr.fila-objetivo');
    
    if (!fila) {
        fila = botonEditar.closest('tr');
        
        if (fila && !fila.classList.contains('fila-objetivo')) {
            console.error('La fila encontrada no es de objetivos');
            return;
        }
    }
    
    if (!fila) {
        console.error('No se encontró la fila para el objetivo:', objetivo.idobjetivos);
        return;
    }
    
    actualizarContenidoFila(fila, objetivo);
}

function actualizarContenidoFila(fila, objetivo) {
    fila.dataset.nombre = objetivo.nom_objetivo.toLowerCase();
    fila.dataset.descripcion = (objetivo.descripcion || '').toLowerCase();
    
    const celdaNombre = fila.querySelector('td:first-child');
    if (celdaNombre) {
        celdaNombre.innerHTML = `
            <strong>${objetivo.nom_objetivo}</strong>
            <br>
            <small style="color: #666;">${objetivo.descripcion || 'Sin descripción'}</small>
        `;
    }
    
    const todasLasCeldas = fila.querySelectorAll('td');
    todasLasCeldas.forEach(celda => {
        celda.style.animation = 'none';
        celda.style.background = '';
        void celda.offsetWidth;
        celda.style.animation = 'pulseCelda 0.6s ease-in-out';
        
        setTimeout(() => {
            celda.style.animation = '';
        }, 600);
    });
}

// Confirmar eliminación de objetivo
function confirmarEliminarObjetivo(e) {
    const objetivoId = e.currentTarget.dataset.id;
    const objetivoNombre = e.currentTarget.dataset.nombre;
    
    // Mostrar indicador de carga
    const btnOriginal = e.currentTarget;
    const textoOriginal = btnOriginal.innerHTML;
    btnOriginal.disabled = true;
    btnOriginal.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    
    // Verificar si el objetivo se puede eliminar
    fetch(`/entrenamientos/api/objetivo/${objetivoId}/verificar-eliminar/`)
        .then(response => response.json())
        .then(data => {
            btnOriginal.disabled = false;
            btnOriginal.innerHTML = textoOriginal;
            
            if (data.success) {
                if (data.puede_eliminar) {
                    // El objetivo puede eliminarse
                    let mensaje = '⚠️ CONFIRMAR ELIMINACIÓN\n\n';
                    mensaje += `¿Está seguro de que desea eliminar el objetivo "${objetivoNombre}"?\n\n`;
                    mensaje += '📋 Esta acción:\n\n';
                    mensaje += '• Eliminará el objetivo del sistema\n';
                    mensaje += '• Lo quitará de todos los entrenamientos asociados\n';
                    mensaje += '• No afectará calificaciones (no tiene ninguna)\n\n';
                    mensaje += '⚠️ Esta acción NO se puede deshacer.\n\n';
                    mensaje += '¿Desea continuar?';
                    
                    if (confirm(mensaje)) {
                        eliminarObjetivo(objetivoId, objetivoNombre);
                    }
                } else {
                    // El objetivo NO puede eliminarse
                    let mensaje = '❌ NO SE PUEDE ELIMINAR\n\n';
                    mensaje += `El objetivo "${objetivoNombre}" no puede ser eliminado porque:\n\n`;
                    mensaje += `📊 Tiene ${data.total_calificaciones} calificación(es) asociada(s)\n\n`;
                    mensaje += '💡 Alternativas:\n\n';
                    mensaje += '• Puede desactivar el objetivo usando el interruptor de estado\n';
                    mensaje += '• Los objetivos inactivos no aparecerán en nuevos entrenamientos\n';
                    mensaje += '• Las calificaciones existentes se mantendrán intactas\n';
                    
                    alert(mensaje);
                }
            } else {
                alert('❌ Error: ' + (data.error || 'No se pudo verificar el objetivo'));
            }
        })
        .catch(error => {
            btnOriginal.disabled = false;
            btnOriginal.innerHTML = textoOriginal;
            console.error('Error:', error);
            alert('❌ Error de conexión al verificar el objetivo. Por favor, intenta nuevamente.');
        });
}

// Eliminar objetivo del sistema
function eliminarObjetivo(objetivoId, objetivoNombre) {
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
            // Eliminar la fila de la tabla
            const fila = document.querySelector(`#tabla-objetivos .eliminar-objetivo[data-id="${objetivoId}"]`)?.closest('.fila-objetivo');
            
            if (fila) {
                // Animar la eliminación
                fila.style.animation = 'fadeOut 0.5s ease-out';
                
                setTimeout(() => {
                    fila.remove();
                    
                    // Verificar si quedan objetivos
                    const filasRestantes = document.querySelectorAll('.fila-objetivo');
                    if (filasRestantes.length === 0) {
                        const tbody = document.querySelector('#tabla-objetivos tbody');
                        tbody.innerHTML = `
                            <tr id="fila-vacia-objetivos">
                                <td colspan="3" style="text-align: center; padding: 40px; color: #999;">
                                    <i class="fas fa-bullseye" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                                    <p style="font-size: 16px; font-weight: 500;">No hay objetivos registrados</p>
                                </td>
                            </tr>
                        `;
                    }
                    
                    actualizarContadorObjetivos();
                    mostrarNotificacion(`✓ Objetivo "${objetivoNombre}" eliminado exitosamente`, 'success');
                }, 500);
            }
        } else {
            alert('❌ Error: ' + (data.error || 'No se pudo eliminar el objetivo'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('❌ Error de conexión al eliminar el objetivo. Por favor, intenta nuevamente.');
    });
}

// Agregar objetivo a la tabla dinámicamente
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
    nuevaFila.style.animation = 'fadeIn 0.5s ease-in';
    
    nuevaFila.innerHTML = `
        <td style="text-align: center;">
            <strong>${objetivo.nom_objetivo}</strong>
            <br>
            <small style="color: #666;">${objetivo.descripcion || 'Sin descripción'}</small>
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
                          id="badge-objetivo-${objetivo.idobjetivos}">
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
    
    const switchEl = nuevaFila.querySelector('.switch-estado-objetivo');
    if (switchEl) {
        switchEl.addEventListener('change', cambiarEstadoObjetivo);
    }
    
    const btnEditar = nuevaFila.querySelector('.editar');
    if (btnEditar) {
        btnEditar.addEventListener('click', abrirModalEditarObjetivo);
    }
    
    // IMPORTANTE: Agregar evento al botón eliminar
    const btnEliminar = nuevaFila.querySelector('.eliminar-objetivo');
    if (btnEliminar) {
        btnEliminar.addEventListener('click', confirmarEliminarObjetivo);
    }
}

// Función auxiliar para obtener el token CSRF
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

// Función auxiliar para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'success') {
    const color = tipo === 'success' ? '#28a745' : '#dc3545';
    
    const notificacion = document.createElement('div');
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${color};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 500;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notificacion.remove(), 300);
    }, 3000);
}