// Variables para el control de asistencia
let alumnosAsistencia = [];
let asistenciaData = [];

// Función para cargar alumnos de la categoría - debe retornar una promesa
async function cargarAlumnosAsistencia(categoriaId) {
    const tbody = document.getElementById('tbody-asistencia');
    const infoCategoria = document.querySelector('.info-asistencia');
    const contadorDiv = document.querySelector('.contador-asistencia');
    
    try {
        tbody.innerHTML = `
            <tr id="cargando-alumnos">
                <td colspan="3" style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    <p style="font-size: 16px; font-weight: 500;">Cargando alumnos...</p>
                </td>
            </tr>
        `;
        
        const response = await fetch(`/sesiones/api/alumnos/${categoriaId}/`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        alumnosAsistencia = await response.json();
        
        // Inicializar datos de asistencia
        asistenciaData = alumnosAsistencia.map(alumno => ({
            matricula_id: alumno.matricula_id,
            nombre_completo: alumno.nombre_completo,
            presente: 0,
            observaciones: 'No asistió'  // Texto por defecto para ausentes
        }));
        
        if (alumnosAsistencia.length === 0) {
            tbody.innerHTML = `
                <tr id="sin-alumnos">
                    <td colspan="3" style="text-align: center; padding: 40px; color: #999;">
                        <i class="fas fa-user-slash" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                        <p style="font-size: 16px; font-weight: 500;">No hay alumnos matriculados en esta categoría</p>
                    </td>
                </tr>
            `;
            infoCategoria.style.display = 'none';
            contadorDiv.style.display = 'none';
            return;
        }
        
        // Renderizar tabla
        tbody.innerHTML = '';
        alumnosAsistencia.forEach((alumno, index) => {
            const tr = document.createElement('tr');
            tr.className = 'fila-asistencia';
            tr.innerHTML = `
                <td>
                    <span class="alumno-nombre">${alumno.nombre_completo}</span>
                </td>
                <td style="text-align: center;">
                    <div class="form-check form-switch" style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <input class="form-check-input switch-asistencia" 
                               type="checkbox" 
                               role="switch" 
                               id="switch-asistencia-${alumno.matricula_id}" 
                               data-matricula-id="${alumno.matricula_id}"
                               data-index="${index}">
                        <label class="form-check-label" 
                               for="switch-asistencia-${alumno.matricula_id}" 
                               style="cursor: pointer; font-weight: 500;">
                            <span class="badge badge-asistencia badge-ausente" 
                                  id="badge-asistencia-${alumno.matricula_id}">
                                Ausente
                            </span>
                        </label>
                    </div>
                </td>
                <td>
                    <textarea class="observacion-input" 
                              id="observacion-${alumno.matricula_id}"
                              data-matricula-id="${alumno.matricula_id}"
                              data-index="${index}"
                              maxlength="200">No asistió</textarea>
                    <div class="contador-observacion" id="contador-obs-${alumno.matricula_id}">
                        10 / 200
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Agregar event listeners
        agregarEventListenersAsistencia();
        
        // Mostrar información
        infoCategoria.style.display = 'block';
        contadorDiv.style.display = 'block';
        actualizarContadores();
        
        // Resetear el switch de "Seleccionar todos"
        const switchTodos = document.getElementById('switch-seleccionar-todos');
        if (switchTodos) {
            switchTodos.checked = false;
        }
        
    } catch (error) {
        console.error('Error al cargar alumnos:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 40px; color: #dc3545;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    <p style="font-size: 16px; font-weight: 500;">Error al cargar los alumnos</p>
                </td>
            </tr>
        `;
        throw error;
    }
}

// Agregar event listeners a los switches y textareas
function agregarEventListenersAsistencia() {
    // Switch de seleccionar/deseleccionar todos
    const switchTodos = document.getElementById('switch-seleccionar-todos');
    if (switchTodos) {
        switchTodos.addEventListener('change', function() {
            const todasLasCheckboxes = document.querySelectorAll('.switch-asistencia');
            const estaSeleccionado = this.checked;
            
            todasLasCheckboxes.forEach((checkbox, idx) => {
                if (checkbox.checked !== estaSeleccionado) {
                    checkbox.checked = estaSeleccionado;
                    
                    const matriculaId = checkbox.dataset.matriculaId;
                    const index = parseInt(checkbox.dataset.index);
                    const badge = document.getElementById(`badge-asistencia-${matriculaId}`);
                    const textarea = document.getElementById(`observacion-${matriculaId}`);
                    const contador = document.getElementById(`contador-obs-${matriculaId}`);
                    
                    if (estaSeleccionado) {
                        // Marcar como presente
                        badge.textContent = 'Presente';
                        badge.classList.remove('badge-ausente');
                        badge.classList.add('badge-presente');
                        asistenciaData[index].presente = 1;
                        textarea.value = 'Asistió puntualmente';
                        asistenciaData[index].observaciones = 'Asistió puntualmente';
                        contador.textContent = '21 / 200';
                    } else {
                        // Marcar como ausente
                        badge.textContent = 'Ausente';
                        badge.classList.remove('badge-presente');
                        badge.classList.add('badge-ausente');
                        asistenciaData[index].presente = 0;
                        textarea.value = 'No asistió';
                        asistenciaData[index].observaciones = 'No asistió';
                        contador.textContent = '10 / 200';
                    }
                }
            });
            
            actualizarContadores();
        });
    }
    
    // Switches individuales de asistencia
    document.querySelectorAll('.switch-asistencia').forEach(switchEl => {
        switchEl.addEventListener('change', function() {
            const matriculaId = this.dataset.matriculaId;
            const index = parseInt(this.dataset.index);
            const badge = document.getElementById(`badge-asistencia-${matriculaId}`);
            const textarea = document.getElementById(`observacion-${matriculaId}`);
            
            if (this.checked) {
                // Presente
                badge.textContent = 'Presente';
                badge.classList.remove('badge-ausente');
                badge.classList.add('badge-presente');
                asistenciaData[index].presente = 1;
                
                // Cambiar texto de observaciones a "Asistió puntualmente"
                textarea.value = 'Asistió puntualmente';
                asistenciaData[index].observaciones = 'Asistió puntualmente';
                
                // Actualizar contador
                const contador = document.getElementById(`contador-obs-${matriculaId}`);
                contador.textContent = '21 / 200';
                
            } else {
                // Ausente
                badge.textContent = 'Ausente';
                badge.classList.remove('badge-presente');
                badge.classList.add('badge-ausente');
                asistenciaData[index].presente = 0;
                
                // Cambiar texto de observaciones a "No asistió"
                textarea.value = 'No asistió';
                asistenciaData[index].observaciones = 'No asistió';
                
                // Actualizar contador
                const contador = document.getElementById(`contador-obs-${matriculaId}`);
                contador.textContent = '10 / 200';
            }
            
            // Actualizar estado del switch "Seleccionar todos"
            actualizarSwitchTodos();
            actualizarContadores();
        });
    });
    
    // Textareas de observaciones
    document.querySelectorAll('.observacion-input').forEach(textarea => {
        textarea.addEventListener('input', function() {
            const index = parseInt(this.dataset.index);
            const contador = document.getElementById(`contador-obs-${this.dataset.matriculaId}`);
            const length = this.value.length;
            
            asistenciaData[index].observaciones = this.value;
            
            contador.textContent = `${length} / 200`;
            
            // Cambiar color según longitud
            contador.classList.remove('warning', 'danger');
            if (length > 160) {
                contador.classList.add('danger');
            } else if (length > 120) {
                contador.classList.add('warning');
            }
        });
    });
}

// Actualizar el estado del switch "Seleccionar todos"
function actualizarSwitchTodos() {
    const switchTodos = document.getElementById('switch-seleccionar-todos');
    const todasLasCheckboxes = document.querySelectorAll('.switch-asistencia');
    
    if (switchTodos && todasLasCheckboxes.length > 0) {
        const todasSeleccionadas = Array.from(todasLasCheckboxes).every(cb => cb.checked);
        const ningunaSeleccionada = Array.from(todasLasCheckboxes).every(cb => !cb.checked);
        
        if (todasSeleccionadas) {
            switchTodos.checked = true;
            switchTodos.indeterminate = false;
        } else if (ningunaSeleccionada) {
            switchTodos.checked = false;
            switchTodos.indeterminate = false;
        } else {
            switchTodos.checked = false;
            switchTodos.indeterminate = true;
        }
    }
}

// Actualizar contadores de asistencia
function actualizarContadores() {
    const presentes = asistenciaData.filter(a => a.presente === 1).length;
    const ausentes = asistenciaData.filter(a => a.presente === 0).length;
    const total = asistenciaData.length;
    
    document.getElementById('contador-presentes').textContent = presentes;
    document.getElementById('contador-ausentes').textContent = ausentes;
    document.getElementById('contador-total').textContent = total;
}

// Obtener datos de asistencia para guardar
function obtenerDatosAsistencia() {
    return asistenciaData.map(item => ({
        matricula_id: item.matricula_id,
        presente: item.presente,
        observaciones: item.observaciones
    }));
}