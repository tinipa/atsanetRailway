// Variables para el control de evaluación
let alumnosPresentes = [];
let objetivosEntrenamiento = [];
let evaluacionData = [];
let objetivosActivosEnSesion = new Set();

// Función para cargar la evaluación del paso 3
function cargarEvaluacion() {
    const tbody = document.getElementById('tbody-evaluacion');
    const infoEvaluacion = document.querySelector('.info-evaluacion');
    const resumenDiv = document.querySelector('.resumen-evaluacion');
    
    try {
        // Obtener alumnos presentes del paso 2
        const nuevosAlumnosPresentes = asistenciaData.filter(a => a.presente === 1);
        
        // Obtener objetivos del paso 1
        objetivosEntrenamiento = datosTemporales.paso1.objetivos || [];
        
        // CORREGIDO: Verificar si hay datos previos guardados
        if (datosTemporales.paso3 && 
            datosTemporales.paso3.objetivos_evaluados && 
            datosTemporales.paso3.objetivos_evaluados.length > 0) {
            // Restaurar objetivos activos desde datosTemporales solo si existen
            objetivosActivosEnSesion = new Set(datosTemporales.paso3.objetivos_evaluados);
        } else {
            // CORREGIDO: Inicializar TODOS los objetivos como activos por defecto
            objetivosActivosEnSesion = new Set(objetivosEntrenamiento.map(obj => obj.id));
            // Guardar el estado inicial
            guardarEstadoEvaluacionEnTemporal();
        }
        
        if (nuevosAlumnosPresentes.length === 0) {
            tbody.innerHTML = `
                <tr id="sin-alumnos-presentes">
                    <td colspan="${objetivosEntrenamiento.length + 1}">
                        <i class="fas fa-user-times"></i>
                        <p>No hay alumnos presentes para evaluar</p>
                    </td>
                </tr>
            `;
            if (infoEvaluacion) infoEvaluacion.style.display = 'none';
            if (resumenDiv) resumenDiv.style.display = 'none';
            return;
        }
        
        if (objetivosEntrenamiento.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="2">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>No hay objetivos asociados a este entrenamiento</p>
                    </td>
                </tr>
            `;
            if (infoEvaluacion) infoEvaluacion.style.display = 'none';
            if (resumenDiv) resumenDiv.style.display = 'none';
            return;
        }
        
        // Renderizar toggles de objetivos
        renderizarTogglesObjetivos();
        
        // Generar encabezados dinámicos
        generarEncabezadosTabla();
        
        // Preservar evaluaciones existentes y agregar nuevos alumnos
        const evaluacionExistente = [...evaluacionData];
        const nuevaEvaluacionData = [];
        
        nuevosAlumnosPresentes.forEach(alumno => {
            // Buscar si este alumno ya tiene evaluaciones previas
            const evalPrevia = evaluacionExistente.find(e => e.matricula_id === alumno.matricula_id);
            
            if (evalPrevia) {
                // Sincronizar objetivos: mantener existentes, agregar nuevos si faltan
                const objetivosActualizados = objetivosEntrenamiento.map(obj => {
                    const evalObjetivoExistente = evalPrevia.objetivos.find(o => o.objetivo_id === obj.id);
                    
                    if (evalObjetivoExistente) {
                        return { ...evalObjetivoExistente };
                    } else {
                        return {
                            objetivo_id: obj.id,
                            aprobado: 0,
                            observaciones: 'Desaprobado',
                            objetivo_evaluado: objetivosActivosEnSesion.has(obj.id)
                        };
                    }
                });
                
                nuevaEvaluacionData.push({
                    matricula_id: alumno.matricula_id,
                    nombre_completo: alumno.nombre_completo,
                    objetivos: objetivosActualizados
                });
            } else {
                // Nuevo alumno, inicializar evaluación con todos los objetivos activos
                const objetivosEval = objetivosEntrenamiento.map(obj => ({
                    objetivo_id: obj.id,
                    aprobado: 0,
                    observaciones: 'Desaprobado',
                    objetivo_evaluado: objetivosActivosEnSesion.has(obj.id)
                }));
                
                nuevaEvaluacionData.push({
                    matricula_id: alumno.matricula_id,
                    nombre_completo: alumno.nombre_completo,
                    objetivos: objetivosEval
                });
            }
        });
        
        // Actualizar evaluacionData y alumnosPresentes
        evaluacionData = nuevaEvaluacionData;
        alumnosPresentes = nuevosAlumnosPresentes;
        
        // Renderizar tabla
        renderizarTablaEvaluacion();
        
        // CORREGIDO: Mostrar información CON la categoría
        const categoriaElem = document.getElementById('info-categoria-eval');
        const entrenamientoElem = document.getElementById('info-entrenamiento-eval');
        const alumnosPresentesElem = document.getElementById('total-alumnos-presentes');
        
        if (categoriaElem) categoriaElem.textContent = datosTemporales.paso1.categoriaNombre || '-';
        if (entrenamientoElem) entrenamientoElem.textContent = datosTemporales.paso1.entrenamientoNombre || '-';
        if (alumnosPresentesElem) alumnosPresentesElem.textContent = alumnosPresentes.length;
        if (infoEvaluacion) infoEvaluacion.style.display = 'block';
        
        actualizarResumenEvaluacion();
        if (resumenDiv) resumenDiv.style.display = 'block';
        
    } catch (error) {
        console.error('Error al cargar evaluación:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="2">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error al cargar la evaluación. Por favor, intenta nuevamente.</p>
                    <p style="font-size: 12px; color: #999;">${error.message}</p>
                </td>
            </tr>
        `;
    }
}

// Función para generar encabezados dinámicos
function generarEncabezadosTabla() {
    const trEncabezados = document.getElementById('encabezados-objetivos');
    
    if (!trEncabezados) {
        console.error('Elemento encabezados-objetivos no encontrado');
        return;
    }
    
    let html = '<th>Alumno</th>';
    
    objetivosEntrenamiento.forEach(objetivo => {
        const isActivo = objetivosActivosEnSesion.has(objetivo.id);
        const columnaClass = !isActivo ? 'objetivo-columna-deshabilitada' : '';
        
        html += `
            <th class="th-objetivo ${columnaClass}" 
                data-objetivo-id="${objetivo.id}"
                data-descripcion="${objetivo.descripcion || 'Sin descripción'}">
                <div class="objetivo-header">
                    <span class="objetivo-header-nombre">${objetivo.nombre}</span>
                    <div class="form-check form-switch" style="margin-top: 8px;">
                        <input class="form-check-input switch-objetivo-todos" 
                               type="checkbox" 
                               role="switch" 
                               id="switch-objetivo-todos-${objetivo.id}"
                               data-objetivo-id="${objetivo.id}"
                               ${!isActivo ? 'disabled' : ''}
                               title="Aprobar/Desaprobar todos">
                        <label class="form-check-label" 
                               for="switch-objetivo-todos-${objetivo.id}"
                               style="cursor: pointer; font-size: 11px; color: white; margin-left: 5px;">
                            Todos
                        </label>
                    </div>
                </div>
            </th>
        `;
    });
    
    trEncabezados.innerHTML = html;
    
    // Agregar event listeners a los switches de "Todos"
    agregarEventListenersSwitchTodos();
}

// Nueva función para manejar los switches de "Todos" por objetivo
function agregarEventListenersSwitchTodos() {
    document.querySelectorAll('.switch-objetivo-todos').forEach(switchTodos => {
        switchTodos.addEventListener('change', function() {
            const objetivoId = parseInt(this.dataset.objetivoId);
            const estaAprobado = this.checked;
            const objetivoIndex = objetivosEntrenamiento.findIndex(obj => obj.id === objetivoId);
            
            if (objetivoIndex === -1) return;
            
            // Cambiar el estado de ese objetivo para todos los alumnos
            evaluacionData.forEach((alumno, alumnoIndex) => {
                const evalObjetivo = alumno.objetivos[objetivoIndex];
                
                if (evalObjetivo && evalObjetivo.objetivo_evaluado) {
                    // Actualizar datos
                    evalObjetivo.aprobado = estaAprobado ? 1 : 0;
                    evalObjetivo.observaciones = estaAprobado ? 'Aprobado' : 'Desaprobado';
                    
                    // Actualizar UI
                    const matriculaId = alumno.matricula_id;
                    const switchAlumno = document.getElementById(`switch-obj-${matriculaId}-${objetivoId}`);
                    const badge = document.getElementById(`badge-obj-${matriculaId}-${objetivoId}`);
                    const textarea = document.getElementById(`comentario-${matriculaId}-${objetivoId}`);
                    const contador = document.getElementById(`contador-com-${matriculaId}-${objetivoId}`);
                    
                    if (switchAlumno) {
                        switchAlumno.checked = estaAprobado;
                        
                        if (badge) {
                            badge.textContent = estaAprobado ? 'Aprobado' : 'Desaprobado';
                            badge.classList.remove(estaAprobado ? 'badge-desaprobado' : 'badge-aprobado');
                            badge.classList.add(estaAprobado ? 'badge-aprobado' : 'badge-desaprobado');
                        }
                        
                        if (textarea) {
                            textarea.value = estaAprobado ? 'Aprobado' : 'Desaprobado';
                        }
                        
                        if (contador) {
                            contador.textContent = estaAprobado ? '8 / 150' : '12 / 150';
                        }
                    }
                }
            });
            
            // Actualizar resumen
            actualizarResumenEvaluacion();
            guardarEstadoEvaluacionEnTemporal();
        });
    });
}

// Función para actualizar el estado del switch "Todos" de un objetivo
function actualizarSwitchTodosObjetivo(objetivoId) {
    const objetivoIndex = objetivosEntrenamiento.findIndex(obj => obj.id === objetivoId);
    if (objetivoIndex === -1) return;
    
    const switchTodos = document.getElementById(`switch-objetivo-todos-${objetivoId}`);
    if (!switchTodos) return;
    
    // Contar cuántos alumnos tienen aprobado este objetivo
    const estadosObjetivo = evaluacionData.map(alumno => {
        const evalObj = alumno.objetivos[objetivoIndex];
        return evalObj && evalObj.objetivo_evaluado ? evalObj.aprobado : null;
    }).filter(estado => estado !== null);
    
    if (estadosObjetivo.length === 0) {
        switchTodos.checked = false;
        switchTodos.indeterminate = false;
        return;
    }
    
    const todosAprobados = estadosObjetivo.every(estado => estado === 1);
    const todosDesaprobados = estadosObjetivo.every(estado => estado === 0);
    
    if (todosAprobados) {
        switchTodos.checked = true;
        switchTodos.indeterminate = false;
    } else if (todosDesaprobados) {
        switchTodos.checked = false;
        switchTodos.indeterminate = false;
    } else {
        switchTodos.checked = false;
        switchTodos.indeterminate = true;
    }
}

// Nueva función para renderizar toggles de objetivos
function renderizarTogglesObjetivos() {
    const container = document.getElementById('objetivos-toggles');
    
    if (!container) {
        console.error('Contenedor objetivos-toggles no encontrado');
        return;
    }
    
    container.innerHTML = '';
    
    objetivosEntrenamiento.forEach(objetivo => {
        const isActivo = objetivosActivosEnSesion.has(objetivo.id);
        
        const toggleItem = document.createElement('div');
        toggleItem.className = `objetivo-toggle-item ${!isActivo ? 'inactivo' : ''}`;
        toggleItem.dataset.objetivoId = objetivo.id;
        
        toggleItem.innerHTML = `
            <label class="objetivo-toggle-switch">
                <input type="checkbox" 
                       class="toggle-objetivo-sesion"
                       data-objetivo-id="${objetivo.id}"
                       ${isActivo ? 'checked' : ''}>
                <span class="objetivo-toggle-slider"></span>
            </label>
            <div class="objetivo-toggle-info">
                <div class="objetivo-toggle-nombre">${objetivo.nombre}</div>
                <div class="objetivo-toggle-estado">
                    ${isActivo ? '✓ Se evaluará' : '✗ No se evaluará'}
                </div>
            </div>
        `;
        
        container.appendChild(toggleItem);
    });
    
    // Agregar event listeners a los toggles
    document.querySelectorAll('.toggle-objetivo-sesion').forEach(toggle => {
        toggle.addEventListener('change', function() {
            const objetivoId = parseInt(this.dataset.objetivoId);
            const toggleItem = this.closest('.objetivo-toggle-item');
            const estadoText = toggleItem.querySelector('.objetivo-toggle-estado');
            
            if (this.checked) {
                objetivosActivosEnSesion.add(objetivoId);
                toggleItem.classList.remove('inactivo');
                estadoText.textContent = '✓ Se evaluará';
            } else {
                objetivosActivosEnSesion.delete(objetivoId);
                toggleItem.classList.add('inactivo');
                estadoText.textContent = '✗ No se evaluará';
            }
            
            // Actualizar estado en evaluacionData
            evaluacionData.forEach(alumno => {
                const objIndex = alumno.objetivos.findIndex(o => o.objetivo_id === objetivoId);
                if (objIndex !== -1) {
                    alumno.objetivos[objIndex].objetivo_evaluado = this.checked;
                }
            });
            
            // Actualizar visibilidad de columnas
            actualizarVisibilidadColumnas();
            actualizarResumenEvaluacion();
            
            // Guardar estado en datosTemporales
            guardarEstadoEvaluacionEnTemporal();
        });
    });
}

// Nueva función para actualizar visibilidad de columnas
function actualizarVisibilidadColumnas() {
    // Actualizar encabezados
    document.querySelectorAll('.th-objetivo').forEach(th => {
        const objetivoId = parseInt(th.dataset.objetivoId);
        const isActivo = objetivosActivosEnSesion.has(objetivoId);
        
        if (isActivo) {
            th.classList.remove('objetivo-columna-deshabilitada');
        } else {
            th.classList.add('objetivo-columna-deshabilitada');
        }
        
        // Habilitar/deshabilitar el switch "Todos"
        const switchTodos = th.querySelector('.switch-objetivo-todos');
        if (switchTodos) {
            switchTodos.disabled = !isActivo;
        }
    });
    
    // Actualizar celdas
    document.querySelectorAll('.fila-evaluacion').forEach(fila => {
        const celdas = fila.querySelectorAll('td:not(:first-child)');
        celdas.forEach((celda, index) => {
            if (index >= objetivosEntrenamiento.length) return;
            
            const objetivoId = objetivosEntrenamiento[index].id;
            const isActivo = objetivosActivosEnSesion.has(objetivoId);
            
            if (isActivo) {
                celda.classList.remove('objetivo-columna-deshabilitada');
                const inputs = celda.querySelectorAll('input, textarea');
                inputs.forEach(input => input.disabled = false);
            } else {
                celda.classList.add('objetivo-columna-deshabilitada');
                const inputs = celda.querySelectorAll('input, textarea');
                inputs.forEach(input => input.disabled = true);
            }
        });
    });
}

// Renderizar tabla de evaluación
function renderizarTablaEvaluacion() {
    const tbody = document.getElementById('tbody-evaluacion');
    tbody.innerHTML = '';
    
    alumnosPresentes.forEach((alumno, indexAlumno) => {
        const tr = document.createElement('tr');
        tr.className = 'fila-evaluacion';
        
        const evalAlumno = evaluacionData[indexAlumno];
        
        let html = `
            <td>
                <span class="alumno-nombre-eval">${alumno.nombre_completo}</span>
            </td>
        `;
        
        objetivosEntrenamiento.forEach((objetivo, indexObjetivo) => {
            const isObjetivoActivo = objetivosActivosEnSesion.has(objetivo.id);
            const evalObjetivo = evalAlumno.objetivos[indexObjetivo];
            const isAprobado = evalObjetivo.aprobado === 1;
            const badgeClass = isAprobado ? 'badge-aprobado' : 'badge-desaprobado';
            const badgeText = isAprobado ? 'Aprobado' : 'Desaprobado';
            const checked = isAprobado ? 'checked' : '';
            
            const columnaClass = !isObjetivoActivo ? 'objetivo-columna-deshabilitada' : '';
            const disabled = !isObjetivoActivo ? 'disabled' : '';
            
            html += `
                <td class="${columnaClass}">
                    <div class="objetivo-celda">
                        <div class="form-check form-switch" style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                            <input class="form-check-input switch-objetivo" 
                                   type="checkbox" 
                                   role="switch" 
                                   id="switch-obj-${alumno.matricula_id}-${objetivo.id}" 
                                   data-matricula-id="${alumno.matricula_id}"
                                   data-objetivo-id="${objetivo.id}"
                                   data-alumno-index="${indexAlumno}"
                                   data-objetivo-index="${indexObjetivo}"
                                   ${checked}
                                   ${disabled}>
                            <label class="form-check-label" 
                                   for="switch-obj-${alumno.matricula_id}-${objetivo.id}">
                                <span class="badge badge-objetivo ${badgeClass}" 
                                      id="badge-obj-${alumno.matricula_id}-${objetivo.id}">
                                    ${badgeText}
                                </span>
                            </label>
                        </div>
                        <textarea class="comentario-objetivo" 
                                  id="comentario-${alumno.matricula_id}-${objetivo.id}"
                                  data-matricula-id="${alumno.matricula_id}"
                                  data-objetivo-id="${objetivo.id}"
                                  data-alumno-index="${indexAlumno}"
                                  data-objetivo-index="${indexObjetivo}"
                                  placeholder="Comentarios..."
                                  maxlength="150"
                                  ${disabled}>${evalObjetivo.observaciones}</textarea>
                        <div class="contador-comentario" id="contador-com-${alumno.matricula_id}-${objetivo.id}">
                            ${evalObjetivo.observaciones.length} / 150
                        </div>
                    </div>
                </td>
            `;
        });
        
        tr.innerHTML = html;
        tbody.appendChild(tr);
    });
    
    // Agregar event listeners
    agregarEventListenersEvaluacion();
    
    // Actualizar estados de switches "Todos"
    objetivosEntrenamiento.forEach(objetivo => {
        actualizarSwitchTodosObjetivo(objetivo.id);
    });
}

// Agregar event listeners para switches y textareas
function agregarEventListenersEvaluacion() {
    // Switches de objetivos individuales
    document.querySelectorAll('.switch-objetivo').forEach(switchEl => {
        switchEl.addEventListener('change', function() {
            const alumnoIndex = parseInt(this.dataset.alumnoIndex);
            const objetivoIndex = parseInt(this.dataset.objetivoIndex);
            const matriculaId = this.dataset.matriculaId;
            const objetivoId = parseInt(this.dataset.objetivoId);
            
            const badge = document.getElementById(`badge-obj-${matriculaId}-${objetivoId}`);
            const textarea = document.getElementById(`comentario-${matriculaId}-${objetivoId}`);
            const contador = document.getElementById(`contador-com-${matriculaId}-${objetivoId}`);
            
            if (this.checked) {
                badge.textContent = 'Aprobado';
                badge.classList.remove('badge-desaprobado');
                badge.classList.add('badge-aprobado');
                textarea.value = 'Aprobado';
                evaluacionData[alumnoIndex].objetivos[objetivoIndex].aprobado = 1;
                evaluacionData[alumnoIndex].objetivos[objetivoIndex].observaciones = 'Aprobado';
                contador.textContent = '8 / 150';
            } else {
                badge.textContent = 'Desaprobado';
                badge.classList.remove('badge-aprobado');
                badge.classList.add('badge-desaprobado');
                textarea.value = 'Desaprobado';
                evaluacionData[alumnoIndex].objetivos[objetivoIndex].aprobado = 0;
                evaluacionData[alumnoIndex].objetivos[objetivoIndex].observaciones = 'Desaprobado';
                contador.textContent = '12 / 150';
            }
            
            // Actualizar el estado del switch "Todos" de este objetivo
            actualizarSwitchTodosObjetivo(objetivoId);
            
            actualizarResumenEvaluacion();
            guardarEstadoEvaluacionEnTemporal();
        });
    });
    
    // Textareas de comentarios
    document.querySelectorAll('.comentario-objetivo').forEach(textarea => {
        textarea.addEventListener('input', function() {
            const alumnoIndex = parseInt(this.dataset.alumnoIndex);
            const objetivoIndex = parseInt(this.dataset.objetivoIndex);
            const contador = document.getElementById(`contador-com-${this.dataset.matriculaId}-${this.dataset.objetivoId}`);
            const length = this.value.length;
            
            evaluacionData[alumnoIndex].objetivos[objetivoIndex].observaciones = this.value;
            
            contador.textContent = `${length} / 150`;
            
            contador.classList.remove('warning', 'danger');
            if (length > 130) {
                contador.classList.add('danger');
            } else if (length > 100) {
                contador.classList.add('warning');
            }
            
            guardarEstadoEvaluacionEnTemporal();
        });
    });
}

// Guardar estado temporal de evaluación
function guardarEstadoEvaluacionEnTemporal() {
    const datosEval = obtenerDatosEvaluacion();
    
    datosTemporales.paso3 = {
        calificaciones: datosEval.calificaciones,
        objetivos_evaluados: datosEval.objetivos_evaluados
    };
    
    guardarEnLocalStorage();
}

// Actualizar resumen de evaluación
function actualizarResumenEvaluacion() {
    let totalObjetivosEvaluados = 0;
    let totalAprobados = 0;
    let totalDesaprobados = 0;
    
    evaluacionData.forEach(alumno => {
        alumno.objetivos.forEach(obj => {
            if (obj.objetivo_evaluado) {
                totalObjetivosEvaluados++;
                if (obj.aprobado === 1) {
                    totalAprobados++;
                } else {
                    totalDesaprobados++;
                }
            }
        });
    });
    
    document.getElementById('total-alumnos-eval').textContent = alumnosPresentes.length;
    document.getElementById('total-objetivos-evaluados').textContent = totalObjetivosEvaluados;
    document.getElementById('total-aprobados').textContent = totalAprobados;
    document.getElementById('total-desaprobados').textContent = totalDesaprobados;
}

// Obtener datos de evaluación para guardar
function obtenerDatosEvaluacion() {
    const calificaciones = [];
    
    evaluacionData.forEach(alumno => {
        alumno.objetivos.forEach(objetivo => {
            calificaciones.push({
                matricula_id: alumno.matricula_id,
                objetivo_id: objetivo.objetivo_id,
                aprobado: objetivo.aprobado,
                observaciones: objetivo.observaciones || '',
                objetivo_evaluado: objetivo.objetivo_evaluado
            });
        });
    });
    
    return {
        calificaciones: calificaciones,
        objetivos_evaluados: Array.from(objetivosActivosEnSesion)
    };
}