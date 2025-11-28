// Función para cargar alumnos por categoría vía AJAX
function cargarAlumnosPorCategoria(tipo) {
    const categoriaId = document.getElementById('categoriaIndividual').value;
    const selectAlumnos = document.getElementById('idAlumno');
    
    if (!categoriaId) {
        selectAlumnos.innerHTML = '<option value="">Seleccione primero una categoría</option>';
        selectAlumnos.disabled = true;
        return;
    }
    
    selectAlumnos.innerHTML = '<option value="">Cargando alumnos...</option>';
    selectAlumnos.disabled = true;
    
    fetch(`/reportes/api/alumnos-por-categoria/?categoriaId=${encodeURIComponent(categoriaId)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                selectAlumnos.innerHTML = '<option value="">Seleccione un alumno</option>';
                data.alumnos.forEach(alumno => {
                    const option = document.createElement('option');
                    option.value = alumno.idmatricula;
                    option.textContent = alumno.nombre_completo;
                    selectAlumnos.appendChild(option);
                });
                selectAlumnos.disabled = false;
            } else {
                selectAlumnos.innerHTML = '<option value="">Error al cargar alumnos</option>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            selectAlumnos.innerHTML = '<option value="">Error al cargar alumnos</option>';
            selectAlumnos.disabled = true;
        });
}

function limpiarFormularioIndividual() {
    document.getElementById('form-reporte-individual').reset();
    document.getElementById('idAlumno').innerHTML = '<option value="">Seleccione primero una categoría</option>';
    document.getElementById('idAlumno').disabled = true;
    
    // NUEVO: Limpiar la marca de origen desde reporte grupal
    sessionStorage.removeItem('desdeReporteGrupal');
}

function limpiarFormularioGrupal() {
    document.getElementById('form-reporte-grupal').reset();
}

// NUEVA FUNCIÓN: Limpiar formulario de entrenamientos
function limpiarFormularioEntrenamientos() {
    const form = document.getElementById('form-entrenamientos');
    if (form) {
        form.reset();
    }
    
    const resultados = document.querySelector('.resultados-entrenamientos');
    if (resultados) {
        resultados.style.display = 'none';
    }
}

// NUEVA FUNCIÓN: Limpiar filtros de entrenamientos
function limpiarFiltrosEntrenamientos() {
    document.getElementById('form-filtros-entrenamientos').reset();
    
    // Redirigir a la página sin parámetros GET
    window.location.href = '/reportes/#entrenamientos';
}

// Función para ir al detalle individual desde el reporte grupal
function verDetalleIndividual(matriculaId, categoriaId, fechaInicio, fechaFin) {
    // Guardar datos en sessionStorage para volver después
    sessionStorage.setItem('reporteGrupalCategoriaId', categoriaId);
    sessionStorage.setItem('reporteGrupalFechaInicio', fechaInicio);
    sessionStorage.setItem('reporteGrupalFechaFin', fechaFin);
    
    // NUEVO: Marcar que venimos desde el reporte grupal
    sessionStorage.setItem('desdeReporteGrupal', 'true');
    
    // Cambiar a la pestaña de Reporte Individual
    const pestanaIndividual = document.querySelector('[data-target="#reporteIndividual"]');
    if (pestanaIndividual) {
        pestanaIndividual.click();
    }
    
    // Pequeño delay para asegurar que la pestaña cambió
    setTimeout(() => {
        // Pre-cargar la categoría
        const selectCategoria = document.getElementById('categoriaIndividual');
        if (selectCategoria) {
            selectCategoria.value = categoriaId;
            
            // Cargar alumnos de esa categoría
            cargarAlumnosPorCategoria('individual');
            
            // Pre-cargar las fechas
            document.getElementById('fechaInicioIndividual').value = fechaInicio;
            document.getElementById('fechaFinIndividual').value = fechaFin;
            
            // Esperar a que se carguen los alumnos y luego seleccionar el alumno
            setTimeout(() => {
                const selectAlumno = document.getElementById('idAlumno');
                if (selectAlumno) {
                    selectAlumno.value = matriculaId;
                    
                    // Hacer scroll suave al formulario
                    const reporteIndividual = document.getElementById('reporteIndividual');
                    if (reporteIndividual) {
                        reporteIndividual.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                        });
                    }
                    
                    // Opcional: Resaltar el formulario brevemente
                    const form = document.getElementById('form-reporte-individual');
                    if (form) {
                        form.style.transition = 'all 0.3s ease';
                        form.style.boxShadow = '0 0 20px rgba(25, 118, 210, 0.5)';
                        setTimeout(() => {
                            form.style.boxShadow = '';
                        }, 1500);
                    }
                }
            }, 1000);
        }
    }, 200);
}

// NUEVA FUNCIÓN: Volver al reporte grupal con datos conservados
function volverAlReporteGrupal() {
    // Recuperar datos del sessionStorage
    const categoriaId = sessionStorage.getItem('reporteGrupalCategoriaId');
    const fechaInicio = sessionStorage.getItem('reporteGrupalFechaInicio');
    const fechaFin = sessionStorage.getItem('reporteGrupalFechaFin');
    
    if (!categoriaId || !fechaInicio || !fechaFin) {
        // Si no hay datos guardados, solo cambiar de pestaña
        const pestanaGrupal = document.querySelector('[data-target="#reporteGrupal"]');
        if (pestanaGrupal) {
            pestanaGrupal.click();
        }
        return;
    }
    
    // Cambiar a la pestaña de Reporte Grupal
    const pestanaGrupal = document.querySelector('[data-target="#reporteGrupal"]');
    if (pestanaGrupal) {
        pestanaGrupal.click();
    }
    
    // Pre-cargar los datos del formulario grupal
    setTimeout(() => {
        document.getElementById('categoriaGrupo').value = categoriaId;
        document.getElementById('fechaInicioGrupo').value = fechaInicio;
        document.getElementById('fechaFinGrupo').value = fechaFin;
        
        // Hacer scroll suave al reporte grupal
        const reporteGrupal = document.getElementById('reporteGrupal');
        if (reporteGrupal) {
            reporteGrupal.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
        
        // Automáticamente generar el reporte grupal
        const formGrupal = document.getElementById('form-reporte-grupal');
        if (formGrupal) {
            formGrupal.submit();
        }
        
        // NUEVO: Limpiar la marca después de volver
        sessionStorage.removeItem('desdeReporteGrupal');
    }, 200);
}

// MODIFICADA: Cargar detalle de entrenamiento
function cargarDetalleEntrenamiento(sesionId, filaDetalle) {
    fetch(`/reportes/api/detalle-entrenamiento/${sesionId}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const contenedorDetalle = filaDetalle.querySelector('.contenedor-detalle');
                
                // Construir HTML del detalle
                let html = `
                    <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                        <!-- Información General -->
                        <div style="border-bottom: 2px solid #1976d2; padding-bottom: 15px; margin-bottom: 20px;">
                            <h4 style="color: #0e245c; margin: 0 0 10px 0;">
                                <i class="fas fa-info-circle"></i> ${data.sesion.nombre_entrenamiento}
                            </h4>
                            <p style="margin: 5px 0; color: #666;">
                                <strong>Fecha:</strong> ${data.sesion.fecha} | 
                                <strong>Asistencia:</strong> ${data.sesion.total_asistieron}/${data.sesion.total_inscritos}
                            </p>
                            ${data.sesion.descripcion ? `
                            <p style="margin: 5px 0; color: #666;">
                                <strong>Descripción:</strong> ${data.sesion.descripcion}
                            </p>
                            ` : ''}
                        </div>

                        <!-- Lista de Alumnos -->
                        <h5 style="color: #0e245c; margin: 0 0 15px 0;">
                            <i class="fas fa-users"></i> Alumnos Participantes
                        </h5>
                `;

                // Agrupar alumnos por asistencia
                const alumnosAsistieron = data.alumnos.filter(a => a.asistio);
                const alumnosNoAsistieron = data.alumnos.filter(a => !a.asistio);

                // Alumnos que asistieron
                if (alumnosAsistieron.length > 0) {
                    html += `
                        <div style="margin-bottom: 20px;">
                            <h6 style="color: #2e7d32; background: #c8e6c9; padding: 10px; border-radius: 8px; margin: 0 0 10px 0;">
                                <i class="fas fa-check-circle"></i> Asistieron (${alumnosAsistieron.length})
                            </h6>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
                    `;

                    alumnosAsistieron.forEach(alumno => {
                        html += `
                            <div style="border: 2px solid #c8e6c9; border-radius: 8px; padding: 15px; background: white;">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                                    <div>
                                        <strong style="color: #0e245c; font-size: 15px;">${alumno.nombre_completo}</strong>
                                        <p style="margin: 5px 0 0 0; color: #666; font-size: 13px;">
                                            <i class="fas fa-tag"></i> ${alumno.categoria}
                                        </p>
                                    </div>
                                    <span class="badge bg-success" style="flex-shrink: 0;">PRESENTE</span>
                                </div>
                        `;

                        // MODIFICADO: Solo mostrar objetivos SI fueron evaluados para este alumno
                        if (alumno.objetivos.length > 0) {
                            html += `
                                <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; margin-top: 10px;">
                                    <strong style="color: #0e245c; font-size: 13px; display: block; margin-bottom: 8px;">
                                        <i class="fas fa-clipboard-check"></i> Objetivos Evaluados:
                                    </strong>
                            `;

                            alumno.objetivos.forEach(obj => {
                                const badgeClass = obj.cumplido ? 'bg-success' : 'bg-danger';
                                const badgeText = obj.cumplido ? 'CUMPLIDO' : 'NO CUMPLIDO';
                                const iconClass = obj.cumplido ? 'fa-check' : 'fa-times';
                                
                                html += `
                                    <div style="margin-bottom: 8px; padding: 8px; background: white; border-radius: 4px;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                            <span style="font-size: 13px; color: #333;">${obj.nombre}</span>
                                            <span class="badge ${badgeClass}" style="font-size: 10px;">
                                                <i class="fas ${iconClass}"></i> ${badgeText}
                                            </span>
                                        </div>
                                        ${obj.observaciones !== 'Sin observaciones' ? `
                                            <p style="margin: 0; font-size: 12px; color: #666; font-style: italic;">
                                                <i class="fas fa-comment"></i> ${obj.observaciones}
                                            </p>
                                        ` : ''}
                                    </div>
                                `;
                            });

                            html += `</div>`;
                        } else {
                            // MODIFICADO: Mensaje cuando no hay objetivos evaluados
                            html += `
                                <p style="margin: 10px 0 0 0; font-size: 13px; color: #999; font-style: italic;">
                                    <i class="fas fa-info-circle"></i> No se evaluaron objetivos en esta sesión
                                </p>
                            `;
                        }

                        if (alumno.observaciones_generales !== 'Sin observaciones') {
                            html += `
                                <div style="margin-top: 10px; padding: 8px; background: #fff3cd; border-radius: 6px;">
                                    <strong style="color: #856404; font-size: 12px;">
                                        <i class="fas fa-sticky-note"></i> Observaciones:
                                    </strong>
                                    <p style="margin: 5px 0 0 0; font-size: 12px; color: #856404;">
                                        ${alumno.observaciones_generales}
                                    </p>
                                </div>
                            `;
                        }

                        html += `</div>`;
                    });

                    html += `</div></div>`;
                }

                // Alumnos que no asistieron
                if (alumnosNoAsistieron.length > 0) {
                    html += `
                        <div>
                            <h6 style="color: #c62828; background: #ffcdd2; padding: 10px; border-radius: 8px; margin: 0 0 10px 0;">
                                <i class="fas fa-times-circle"></i> No Asistieron (${alumnosNoAsistieron.length})
                            </h6>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                    `;

                    alumnosNoAsistieron.forEach(alumno => {
                        html += `
                            <div style="border: 2px solid #ffcdd2; border-radius: 8px; padding: 15px; background: white;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <strong style="color: #0e245c; font-size: 15px;">${alumno.nombre_completo}</strong>
                                        <p style="margin: 5px 0 0 0; color: #666; font-size: 13px;">
                                            <i class="fas fa-tag"></i> ${alumno.categoria}
                                        </p>
                                    </div>
                                    <span class="badge bg-danger">AUSENTE</span>
                                </div>
                                ${alumno.observaciones_generales !== 'Sin observaciones' ? `
                                    <div style="margin-top: 10px; padding: 8px; background: #fff3cd; border-radius: 6px;">
                                        <strong style="color: #856404; font-size: 12px;">
                                            <i class="fas fa-sticky-note"></i> Observaciones:
                                        </strong>
                                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #856404;">
                                            ${alumno.observaciones_generales}
                                        </p>
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    });

                    html += `</div></div>`;
                }

                html += `</div>`;
                contenedorDetalle.innerHTML = html;
            } else {
                const contenedorDetalle = filaDetalle.querySelector('.contenedor-detalle');
                contenedorDetalle.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #dc3545;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 24px;"></i>
                        <p style="margin-top: 10px;">Error al cargar el detalle: ${data.error}</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            const contenedorDetalle = filaDetalle.querySelector('.contenedor-detalle');
            contenedorDetalle.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #dc3545;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 24px;"></i>
                    <p style="margin-top: 10px;">Error al cargar el detalle del entrenamiento</p>
                </div>
            `;
        });
}

// Inicialización cuando carga el DOM
document.addEventListener('DOMContentLoaded', function() {
    // Función para inicializar los event listeners de las filas
    function inicializarFilasClickeables() {
        const filasClickeables = document.querySelectorAll('.fila-alumno-clickeable');
        
        filasClickeables.forEach(fila => {
            fila.addEventListener('click', function(e) {
                // Evitar que el click en badges dispare el evento
                if (e.target.classList.contains('badge')) {
                    return;
                }
                
                const matriculaId = this.getAttribute('data-matricula');
                const categoriaId = this.getAttribute('data-categoria');
                const fechaInicio = this.getAttribute('data-fecha-inicio');
                const fechaFin = this.getAttribute('data-fecha-fin');
                
                verDetalleIndividual(matriculaId, categoriaId, fechaInicio, fechaFin);
            });
        });
    }
    
    // Inicializar al cargar la página
    inicializarFilasClickeables();
    
    // Re-inicializar cuando se genere un nuevo reporte grupal
    const reporteGrupal = document.getElementById('reporteGrupal');
    if (reporteGrupal) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    inicializarFilasClickeables();
                }
            });
        });
        
        observer.observe(reporteGrupal, {
            childList: true,
            subtree: true
        });
    }

    // NUEVO: Hacer scroll automático al reporte grupal cuando se genera
    const resultadosReporteGrupal = document.querySelector('#reporteGrupal .resultados-reporte');
    if (resultadosReporteGrupal) {
        // Verificar si estamos en la pestaña grupal
        const reporteGrupalTab = document.getElementById('reporteGrupal');
        if (reporteGrupalTab && reporteGrupalTab.classList.contains('active')) {
            setTimeout(() => {
                resultadosReporteGrupal.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 300);
        }
    }

    // NUEVO: Hacer scroll automático al reporte individual cuando se genera
    const resultadosReporteIndividual = document.querySelector('#reporteIndividual .resultados-reporte');
    if (resultadosReporteIndividual) {
        // Verificar si estamos en la pestaña individual
        const reporteIndividualTab = document.getElementById('reporteIndividual');
        if (reporteIndividualTab && reporteIndividualTab.classList.contains('active')) {
            setTimeout(() => {
                resultadosReporteIndividual.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 300);
        }
    }

    // NUEVO: Controlar la visibilidad del botón "Volver al Reporte Grupal"
    const btnVolverGrupal = document.getElementById('btn-volver-grupal');
    if (btnVolverGrupal) {
        const desdeReporteGrupal = sessionStorage.getItem('desdeReporteGrupal');
        if (desdeReporteGrupal === 'true') {
            btnVolverGrupal.style.display = 'inline-flex';
        } else {
            btnVolverGrupal.style.display = 'none';
        }
    }

    // NUEVO: Manejar el submit del formulario de entrenamientos
    const formEntrenamientos = document.getElementById('form-entrenamientos');
    if (formEntrenamientos) {
        formEntrenamientos.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const resultados = document.querySelector('.resultados-entrenamientos');
            if (resultados) {
                resultados.style.display = 'block';
                
                // Hacer scroll suave a los resultados
                setTimeout(() => {
                    resultados.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                }, 100);
            }
        });
    }

    // MODIFICADO: Manejar clics en filas de entrenamientos
    function inicializarFilasEntrenamiento() {
        const filasEntrenamiento = document.querySelectorAll('.fila-entrenamiento');
        
        filasEntrenamiento.forEach(fila => {
            // Remover event listener previo si existe
            fila.removeEventListener('click', handleFilaClick);
            // Agregar nuevo event listener
            fila.addEventListener('click', handleFilaClick);
        });
    }
    
    // Función manejadora de clics en filas de entrenamiento
    function handleFilaClick(event) {
        // Evitar que se dispare si se hace clic en un elemento interactivo
        if (event.target.closest('button, a')) {
            return;
        }
        
        const sesionId = this.getAttribute('data-sesion-id');
        const filaDetalle = document.getElementById(`detalle-${sesionId}`);
        const icono = this.querySelector('.icono-expandir');
        
        if (!filaDetalle || !icono) {
            console.error('No se encontró la fila de detalle o el ícono');
            return;
        }
        
        if (filaDetalle.style.display === 'none' || filaDetalle.style.display === '') {
            // Expandir
            filaDetalle.style.display = 'table-row';
            icono.style.transform = 'rotate(90deg)';
            icono.classList.remove('fa-chevron-right');
            icono.classList.add('fa-chevron-down');
            
            // Cargar detalle si no se ha cargado
            const contenedor = filaDetalle.querySelector('.contenedor-detalle');
            if (contenedor && contenedor.querySelector('.cargando-detalle')) {
                cargarDetalleEntrenamiento(sesionId, filaDetalle);
            }
        } else {
            // Contraer
            filaDetalle.style.display = 'none';
            icono.style.transform = 'rotate(0deg)';
            icono.classList.remove('fa-chevron-down');
            icono.classList.add('fa-chevron-right');
        }
    }
    
    // Inicializar las filas de entrenamiento al cargar
    inicializarFilasEntrenamiento();
    
    // Re-inicializar si se actualiza la tabla dinámicamente
    const tablaEntrenamientos = document.getElementById('tablaEntrenamientos');
    if (tablaEntrenamientos) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    inicializarFilasEntrenamiento();
                }
            });
        });
        
        observer.observe(tablaEntrenamientos, {
            childList: true,
            subtree: true
        });
    }

    // NUEVO: Si hay filtros aplicados, cambiar automáticamente a la pestaña de entrenamientos
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('categoria') || urlParams.has('fechaInicio') || urlParams.has('fechaFin')) {
        const pestanaEntrenamientos = document.querySelector('[data-target="#entrenamientos"]');
        if (pestanaEntrenamientos) {
            pestanaEntrenamientos.click();
            
            // Hacer scroll suave a los resultados
            setTimeout(() => {
                const infoReporte = document.querySelector('#entrenamientos .info-reporte');
                if (infoReporte) {
                    infoReporte.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                }
            }, 300);
        }
    }
    
    // NUEVO: Manejar el submit del formulario de filtros
    const formFiltrosEntrenamientos = document.getElementById('form-filtros-entrenamientos');
    if (formFiltrosEntrenamientos) {
        formFiltrosEntrenamientos.addEventListener('submit', function(e) {
            // Permitir el submit normal del formulario
            // Agregar hash para que mantenga la pestaña de entrenamientos
            this.action = '/reportes/#entrenamientos';
        });
    }
});