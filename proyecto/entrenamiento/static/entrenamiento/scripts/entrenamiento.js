document.addEventListener('DOMContentLoaded', function() {
    // Al inicio del archivo, verificar si tiene categorías
    if (typeof TOTAL_CATEGORIAS !== 'undefined' && TOTAL_CATEGORIAS === 0 && ES_ENTRENADOR) {
        // Deshabilitar formularios si no tiene categorías
        const formCrear = document.getElementById('form-crear-entrenamiento');
        if (formCrear) {
            const inputs = formCrear.querySelectorAll('input, select, textarea, button[type="submit"]');
            inputs.forEach(input => input.disabled = true);
        }
    }
    
    const modalEditar = document.getElementById('editarEntrenamiento');
    
    let objetivosActuales = [];
    let objetivoSeleccionado = null;
    
    // Variables para el formulario de crear
    let objetivosCrear = [];
    let objetivoSeleccionadoCrear = null;

    // ============ MODAL EDITAR ============
    if (modalEditar) {
        modalEditar.addEventListener('show.bs.modal', function(event) {
            const button = event.relatedTarget;
            const entrenamientoId = button.getAttribute('data-id');
            
            if (!entrenamientoId) {
                alert('No se pudo obtener el ID del entrenamiento');
                return;
            }
            
            cargarDatosEntrenamiento(entrenamientoId);
            
            setTimeout(() => {
                inicializarBuscadorObjetivos();
            }, 100);
        });
        
        modalEditar.addEventListener('hidden.bs.modal', function() {
            objetivosActuales = [];
            objetivoSeleccionado = null;
            
            const buscarInput = document.getElementById('buscar_objetivo');
            const sugerenciasContainer = document.getElementById('objetivos-sugerencias');
            const categoriaSelect = document.getElementById('edit_categoria');
            
            // Limpiar inputs
            if (buscarInput) buscarInput.value = '';
            if (sugerenciasContainer) {
                sugerenciasContainer.style.display = 'none';
                sugerenciasContainer.innerHTML = '';
            }
            
            // Rehabilitar categoría
            if (categoriaSelect) {
                categoriaSelect.disabled = false;
                categoriaSelect.style.backgroundColor = '';
                categoriaSelect.style.cursor = '';
                categoriaSelect.title = '';
            }
            
            // Eliminar mensaje de bloqueo si existe
            const mensajeBloqueo = document.querySelector('.mensaje-sesiones-bloqueadas');
            if (mensajeBloqueo) {
                mensajeBloqueo.remove();
            }
        });
    }

    // ============ FORMULARIO CREAR ============
    inicializarFormularioCrear();

    function inicializarFormularioCrear() {
        const crearNombreInput = document.getElementById('crear_nombre');
        const crearDescripcionTextarea = document.getElementById('crear_descripcion');
        
        // Contadores de caracteres para crear - MEJORADOS
        if (crearNombreInput) {
            const contadorNombre = document.getElementById('contador-crear-nombre');
            
            crearNombreInput.addEventListener('input', function() {
                const length = this.value.length;
                const maxLength = 30;
                contadorNombre.textContent = `${length} / ${maxLength} caracteres`;
                
                // Cambiar clases según el límite
                contadorNombre.classList.remove('normal', 'warning', 'danger');
                
                if (length > maxLength) {
                    contadorNombre.classList.add('danger');
                    contadorNombre.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${length} / ${maxLength} caracteres (límite excedido)`;
                } else if (length > maxLength * 0.8) {
                    contadorNombre.classList.add('warning');
                } else {
                    contadorNombre.classList.add('normal');
                }
            });
        }
        
        if (crearDescripcionTextarea) {
            const contadorDescripcion = document.getElementById('contador-crear-descripcion');
            
            crearDescripcionTextarea.addEventListener('input', function() {
                const length = this.value.length;
                const maxLength = 300;
                contadorDescripcion.textContent = `${length} / ${maxLength} caracteres`;
                
                // Cambiar clases según el límite
                contadorDescripcion.classList.remove('normal', 'warning', 'danger');
                
                if (length > maxLength) {
                    contadorDescripcion.classList.add('danger');
                    contadorDescripcion.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${length} / ${maxLength} caracteres (límite excedido)`;
                } else if (length > maxLength * 0.8) {
                    contadorDescripcion.classList.add('warning');
                } else {
                    contadorDescripcion.classList.add('normal');
                }
            });
        }
        
        // Inicializar buscador de objetivos para crear
        inicializarBuscadorObjetivosCrear();
        
        // Manejar submit del formulario crear
        const formCrear = document.getElementById('form-crear-entrenamiento');
        if (formCrear) {
            formCrear.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const categoriaSelect = document.getElementById('crear_categoria');
                const categoriasSeleccionadas = Array.from(categoriaSelect.selectedOptions).map(opt => opt.value);
                const nombre = document.getElementById('crear_nombre').value;
                const descripcion = document.getElementById('crear_descripcion').value;
                
                if (categoriasSeleccionadas.length === 0) {
                    alert('⚠️ Por favor, selecciona al menos una categoría');
                    categoriaSelect.focus();
                    return;
                }
                
                if (nombre.trim() === '') {
                    alert('⚠️ El nombre del entrenamiento es obligatorio');
                    document.getElementById('crear_nombre').focus();
                    return;
                }
                
                if (nombre.length > 30) {
                    alert('⚠️ El nombre del entrenamiento no puede superar los 30 caracteres\nActualmente tiene: ' + nombre.length + ' caracteres');
                    document.getElementById('crear_nombre').focus();
                    return;
                }
                
                if (descripcion.length > 300) {
                    alert('⚠️ La descripción es demasiado larga\nMáximo permitido: 300 caracteres\nActualmente tiene: ' + descripcion.length + ' caracteres');
                    document.getElementById('crear_descripcion').focus();
                    return;
                }
                
                if (objetivosCrear.length === 0) {
                    alert('⚠️ Debes agregar al menos un objetivo');
                    document.getElementById('crear_buscar_objetivo').focus();
                    return;
                }
                
                const formData = new FormData(this);
                
                // Eliminar el campo categorias antiguo
                formData.delete('categorias');
                
                // Agregar cada categoría seleccionada
                categoriasSeleccionadas.forEach((categoriaId, index) => {
                    formData.append(`categorias[${index}]`, categoriaId);
                });
                
                // Agregar objetivos
                objetivosCrear.forEach((objetivo, index) => {
                    formData.append(`objetivos[${index}]`, objetivo.id);
                });
                
                const btnSubmit = this.querySelector('button[type="submit"]');
                const textoOriginal = btnSubmit.innerHTML;
                btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
                btnSubmit.disabled = true;
                
                fetch('/entrenamientos/api/entrenamiento/crear/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                })
                .then(response => response.json())
                .then(data => {
                    btnSubmit.innerHTML = textoOriginal;
                    btnSubmit.disabled = false;
                    
                    if (data.success) {
                        alert('✅ Entrenamiento creado correctamente para ' + data.categorias_asignadas + ' categoría(s)');
                        
                        // Limpiar el formulario
                        limpiarFormularioCrear();
                        
                        // Redirigir a la pestaña de "Consultar Entrenamientos"
                        const tabEntrenamientos = document.querySelector('[data-target="#entrenamientos"]');
                        if (tabEntrenamientos) {
                            tabEntrenamientos.click();
                        }
                        
                        // Recargar después de un breve delay para mostrar la pestaña
                        setTimeout(() => {
                            location.reload();
                        }, 300);
                    } else {
                        alert('❌ Error al crear: ' + (data.error || 'Error desconocido'));
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    btnSubmit.innerHTML = textoOriginal;
                    btnSubmit.disabled = false;
                    alert('❌ Error al crear el entrenamiento. Por favor, intenta nuevamente.');
                });
            });
        }
    }

    function inicializarBuscadorObjetivosCrear() {
        const buscarObjetivoInput = document.getElementById('crear_buscar_objetivo');
        const sugerenciasContainer = document.getElementById('crear-objetivos-sugerencias');
        const btnAgregarObjetivo = document.getElementById('crear-btn-agregar-objetivo');
        let timeoutBusqueda = null;

        if (!buscarObjetivoInput || !sugerenciasContainer) return;

        buscarObjetivoInput.addEventListener('input', function() {
            const query = this.value.trim();
            
            clearTimeout(timeoutBusqueda);
            
            if (query.length < 2) {
                sugerenciasContainer.style.display = 'none';
                objetivoSeleccionadoCrear = null;
                return;
            }
            
            sugerenciasContainer.innerHTML = '<div style="padding: 15px; text-align: center; color: #3498db;"><i class="fas fa-spinner fa-spin"></i> Buscando...</div>';
            sugerenciasContainer.style.display = 'block';
            
            timeoutBusqueda = setTimeout(() => {
                fetch(`/entrenamientos/buscar-objetivos/?q=${encodeURIComponent(query)}`)
                    .then(response => {
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        return response.json();
                    })
                    .then(data => {
                        mostrarSugerenciasCrear(data.objetivos || [], sugerenciasContainer, buscarObjetivoInput);
                    })
                    .catch(error => {
                        sugerenciasContainer.innerHTML = '<div style="padding: 15px; color: #e74c3c; text-align: center;"><i class="fas fa-exclamation-triangle"></i> Error al buscar</div>';
                    });
            }, 300);
        });

        buscarObjetivoInput.addEventListener('keydown', function(e) {
            const sugerencias = sugerenciasContainer.querySelectorAll('.objetivo-sugerencia');
            if (sugerencias.length === 0) return;

            let currentIndex = Array.from(sugerencias).findIndex(s => s.classList.contains('selected'));

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (currentIndex < sugerencias.length - 1) {
                    if (currentIndex >= 0) sugerencias[currentIndex].classList.remove('selected');
                    currentIndex++;
                    sugerencias[currentIndex].classList.add('selected');
                    sugerencias[currentIndex].scrollIntoView({ block: 'nearest' });
                    actualizarEstiloSeleccionado(sugerencias);
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (currentIndex > 0) {
                    sugerencias[currentIndex].classList.remove('selected');
                    currentIndex--;
                    sugerencias[currentIndex].classList.add('selected');
                    sugerencias[currentIndex].scrollIntoView({ block: 'nearest' });
                    actualizarEstiloSeleccionado(sugerencias);
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentIndex >= 0) sugerencias[currentIndex].click();
            } else if (e.key === 'Escape') {
                sugerenciasContainer.style.display = 'none';
            }
        });

        document.addEventListener('click', function(e) {
            if (!buscarObjetivoInput.contains(e.target) && 
                !sugerenciasContainer.contains(e.target) &&
                (!btnAgregarObjetivo || e.target !== btnAgregarObjetivo)) {
                sugerenciasContainer.style.display = 'none';
            }
        });

        if (btnAgregarObjetivo) {
            btnAgregarObjetivo.addEventListener('click', function() {
                agregarObjetivoCrear(buscarObjetivoInput);
            });
        }
    }

    function mostrarSugerenciasCrear(objetivos, container, inputElement) {
        if (!objetivos || objetivos.length === 0) {
            container.innerHTML = '<div style="padding: 15px; text-align: center; color: #95a5a6;"><i class="fas fa-search" style="font-size: 20px; margin-bottom: 5px; display: block;"></i><span style="font-size: 14px;">No se encontraron resultados</span></div>';
            container.style.display = 'block';
            return;
        }
        
        const idsActuales = objetivosCrear.map(obj => obj.id);
        const objetivosFiltrados = objetivos.filter(obj => !idsActuales.includes(obj.idobjetivos));
        
        if (objetivosFiltrados.length === 0) {
            container.innerHTML = '<div style="padding: 15px; text-align: center; color: #f39c12;"><i class="fas fa-info-circle" style="font-size: 20px; margin-bottom: 5px; display: block;"></i><span style="font-size: 14px; display: block;">Todos los objetivos encontrados<br>ya están agregados</span></div>';
            container.style.display = 'block';
            return;
        }
        
        let html = '';
        objetivosFiltrados.forEach((objetivo, index) => {
            html += `
                <div class="objetivo-sugerencia ${index === 0 ? 'selected' : ''}" 
                     data-id="${objetivo.idobjetivos}"  
                     data-nombre="${objetivo.nom_objetivo}"
                     style="padding: 12px 15px; cursor: pointer; border-bottom: 1px solid #ecf0f1; transition: all 0.2s ease; display: flex; align-items: center; gap: 10px; background: ${index === 0 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white'}; color: ${index === 0 ? 'white' : '#2c3e50'};">
                    <i class="fas fa-bullseye" style="color: ${index === 0 ? 'white' : '#3498db'};"></i>
                    <span>${objetivo.nom_objetivo}</span>
                </div>
            `;
        });
        
        container.innerHTML = html;
        container.style.display = 'block';
        
        document.querySelectorAll('.objetivo-sugerencia').forEach(item => {
            item.addEventListener('mouseenter', function() {
                document.querySelectorAll('.objetivo-sugerencia').forEach(s => s.classList.remove('selected'));
                this.classList.add('selected');
                actualizarEstiloSeleccionado(document.querySelectorAll('.objetivo-sugerencia'));
            });
            
            item.addEventListener('click', function() {
                seleccionarObjetivoCrear(this.dataset.id, this.dataset.nombre, inputElement, container);
            });
        });
    }

    function seleccionarObjetivoCrear(id, nombre, inputElement, container) {
        objetivoSeleccionadoCrear = { id, nombre };
        inputElement.value = nombre;
        container.style.display = 'none';
    }

    function agregarObjetivoCrear(buscarObjetivoInput) {
        if (!objetivoSeleccionadoCrear) {
            alert('Por favor, selecciona un objetivo de la lista de sugerencias');
            if (buscarObjetivoInput) buscarObjetivoInput.focus();
            return;
        }
        
        if (objetivosCrear.some(obj => obj.id == objetivoSeleccionadoCrear.id)) {
            alert('Este objetivo ya está agregado');
            return;
        }
        
        objetivosCrear.push({
            id: objetivoSeleccionadoCrear.id,
            nom_objetivo: objetivoSeleccionadoCrear.nombre
        });
        
        if (buscarObjetivoInput) buscarObjetivoInput.value = '';
        objetivoSeleccionadoCrear = null;
        
        renderizarListaObjetivosCrear();
        
        mostrarMensajeExito('✓ Objetivo agregado');
    }

    function renderizarListaObjetivosCrear() {
        const listaContainer = document.getElementById('crear-objetivos-lista');
        
        if (!listaContainer) return;
        
        if (objetivosCrear.length === 0) {
            listaContainer.innerHTML = '<p style="color: #999; text-align: center; padding: 20px; background: #f9f9f9; border-radius: 8px;">No hay objetivos agregados</p>';
            return;
        }
        
        let html = '<ul style="list-style: none; padding: 0; margin: 0;">';
        objetivosCrear.forEach(objetivo => {
            html += `
                <li style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border: 1px solid #e0e0e0; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); margin-bottom: 10px; border-radius: 8px; transition: all 0.3s ease; gap: 20px;">
                    <span style="font-weight: 500; color: #2c3e50; flex: 1; display: flex; align-items: center;">
                        <i class="fas fa-bullseye" style="margin-right: 12px; color: #3498db; font-size: 18px;"></i>
                        <span style="line-height: 1.5;">${objetivo.nom_objetivo}</span>
                    </span>
                    <button type="button" 
                            class="btn-eliminar-objetivo-crear" 
                            data-id="${objetivo.id}"
                            style="background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; border: none; padding: 8px 18px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1); white-space: nowrap; flex-shrink: 0;">
                        <i class="fas fa-trash-alt" style="margin-right: 5px;"></i>Eliminar
                    </button>
                </li>
            `;
        });
        html += '</ul>';
        
        listaContainer.innerHTML = html;
        
        document.querySelectorAll('.btn-eliminar-objetivo-crear').forEach(btn => {
            btn.addEventListener('click', function() {
                eliminarObjetivoCrear(this.dataset.id);
            });
            
            btn.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.05)';
                this.style.boxShadow = '0 4px 8px rgba(231, 76, 60, 0.3)';
            });
            btn.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
                this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            });
        });
    }

    function eliminarObjetivoCrear(idObjetivo) {
        if (confirm('¿Estás seguro de eliminar este objetivo?')) {
            objetivosCrear = objetivosCrear.filter(obj => obj.id != idObjetivo);
            renderizarListaObjetivosCrear();
        }
    }

    window.limpiarFormularioCrear = function() {
        document.getElementById('form-crear-entrenamiento').reset();
        objetivosCrear = [];
        objetivoSeleccionadoCrear = null;
        renderizarListaObjetivosCrear();
        document.getElementById('crear_buscar_objetivo').value = '';
        document.getElementById('crear-objetivos-sugerencias').style.display = 'none';
    };

    // ============ FUNCIONES EDITAR (mantener código existente) ============
    function cargarDatosEntrenamiento(id) {
        const url = `/entrenamientos/api/entrenamiento/${id}/`;
        
        fetch(url)
            .then(response => {
                return response.text().then(text => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${text}`);
                    }
                    
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        throw new Error('La respuesta no es JSON válido: ' + text);
                    }
                });
            })
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                
                document.getElementById('id_entrenamiento').value = data.id;
                document.getElementById('edit_nombre').value = data.nom_entrenamiento;
                document.getElementById('edit_descripcion').value = data.descripcion || '';
                document.getElementById('edit_categoria').value = data.categoria_id || '';
                
                objetivosActuales = data.objetivos || [];
                
                // Verificar si tiene sesiones asociadas
                const tieneSesiones = data.tiene_sesiones || false;
                const sesionesCount = data.sesiones_count || 0;
                
                // Obtener elementos a bloquear/desbloquear
                const buscarObjetivoInput = document.getElementById('buscar_objetivo');
                const btnAgregarObjetivo = document.getElementById('btn-agregar-objetivo');
                const categoriaSelect = document.getElementById('edit_categoria');
                const seccionObjetivos = document.querySelector('.datosObjetivos');
                
                if (tieneSesiones) {
                    // Deshabilitar select de categoría
                    if (categoriaSelect) {
                        categoriaSelect.disabled = true;
                        categoriaSelect.style.backgroundColor = '#f0f0f0';
                        categoriaSelect.style.cursor = 'not-allowed';
                        categoriaSelect.title = 'No se puede cambiar la categoría porque el entrenamiento tiene sesiones asociadas';
                    }
                    
                    // Deshabilitar controles de objetivos
                    if (buscarObjetivoInput) {
                        buscarObjetivoInput.disabled = true;
                        buscarObjetivoInput.placeholder = 'No se pueden modificar objetivos (entrenamiento tiene sesiones asociadas)';
                        buscarObjetivoInput.style.backgroundColor = '#f0f0f0';
                        buscarObjetivoInput.style.cursor = 'not-allowed';
                    }
                    
                    if (btnAgregarObjetivo) {
                        btnAgregarObjetivo.disabled = true;
                        btnAgregarObjetivo.style.opacity = '0.5';
                        btnAgregarObjetivo.style.cursor = 'not-allowed';
                        btnAgregarObjetivo.title = 'No se pueden agregar objetivos porque el entrenamiento tiene sesiones asociadas';
                    }
                    
                    // Mostrar mensaje informativo
                    if (seccionObjetivos) {
                        let mensajeExistente = seccionObjetivos.querySelector('.mensaje-sesiones-bloqueadas');
                        if (!mensajeExistente) {
                            const mensajeBloqueo = document.createElement('div');
                            mensajeBloqueo.className = 'mensaje-sesiones-bloqueadas';
                            mensajeBloqueo.style.cssText = `
                                background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
                                border: 2px solid #ffc107;
                                border-radius: 10px;
                                padding: 15px 20px;
                                margin-bottom: 20px;
                                display: flex;
                                align-items: center;
                                gap: 15px;
                                box-shadow: 0 2px 8px rgba(255, 193, 7, 0.2);
                            `;
                            mensajeBloqueo.innerHTML = `
                                <i class="fas fa-lock" style="font-size: 24px; color: #f39c12;"></i>
                                <div>
                                    <strong style="display: block; color: #856404; margin-bottom: 5px;">⚠️ Edición Limitada</strong>
                                    <span style="color: #856404; font-size: 14px;">
                                        Este entrenamiento está asociado a <strong>${sesionesCount}</strong> sesión(es) de entrenamiento.
                                        Solo puedes editar el <strong>nombre</strong> y la <strong>descripción</strong>.
                                        <br>La categoría y los objetivos no pueden modificarse.
                                    </span>
                                </div>
                            `;
                            
                            // Insertar el mensaje al inicio del formulario
                            const formulario = document.getElementById('form-editar-entrenamiento');
                            if (formulario) {
                                formulario.insertBefore(mensajeBloqueo, formulario.firstChild);
                            }
                        }
                    }
                } else {
                    // Habilitar select de categoría
                    if (categoriaSelect) {
                        categoriaSelect.disabled = false;
                        categoriaSelect.style.backgroundColor = '';
                        categoriaSelect.style.cursor = '';
                        categoriaSelect.title = '';
                    }
                    
                    // Habilitar controles de objetivos
                    if (buscarObjetivoInput) {
                        buscarObjetivoInput.disabled = false;
                        buscarObjetivoInput.placeholder = 'Buscar objetivo...';
                        buscarObjetivoInput.style.backgroundColor = '';
                        buscarObjetivoInput.style.cursor = '';
                    }
                    
                    if (btnAgregarObjetivo) {
                        btnAgregarObjetivo.disabled = false;
                        btnAgregarObjetivo.style.opacity = '';
                        btnAgregarObjetivo.style.cursor = '';
                        btnAgregarObjetivo.title = '';
                    }
                    
                    // Eliminar mensaje si existe
                    const mensajeExistente = document.querySelector('.mensaje-sesiones-bloqueadas');
                    if (mensajeExistente) {
                        mensajeExistente.remove();
                    }
                }
                
                renderizarListaObjetivos(tieneSesiones);
                
                const nombreInput = document.getElementById('edit_nombre');
                const descripcionTextarea = document.getElementById('edit_descripcion');
                if (nombreInput) nombreInput.dispatchEvent(new Event('input'));
                if (descripcionTextarea) descripcionTextarea.dispatchEvent(new Event('input'));
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al cargar los datos del entrenamiento: ' + error.message);
            });
    }

    function renderizarListaObjetivos(tieneSesiones = false) {
        const listaContainer = document.getElementById('objetivos-lista');
        
        if (!listaContainer) return;
        
        if (objetivosActuales.length === 0) {
            listaContainer.innerHTML = '<p style="color: #999; text-align: center; padding: 20px; background: #f9f9f9; border-radius: 8px;">No hay objetivos asignados</p>';
            return;
        }
        
        let html = '<ul style="list-style: none; padding: 0; margin: 0;">';
        objetivosActuales.forEach(objetivo => {
            html += `
                <li style="display: flex; 
                           justify-content: space-between; 
                           align-items: center; 
                           padding: 15px 20px; 
                           border: 1px solid #e0e0e0;
                           background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                           margin-bottom: 10px;
                           border-radius: 8px;
                           transition: all 0.3s ease;
                           gap: 20px;">
                    <span style="font-weight: 500; 
                                 color: #2c3e50; 
                                 flex: 1;
                                 display: flex;
                                 align-items: center;">
                        <i class="fas fa-bullseye" style="margin-right: 12px; color: #3498db; font-size: 18px;"></i>
                        <span style="line-height: 1.5;">${objetivo.nom_objetivo}</span>
                    </span>
                    ${!tieneSesiones ? `
                        <button type="button" 
                                class="btn-eliminar-objetivo" 
                                data-id="${objetivo.id}"
                                style="background: linear-gradient(135deg, #e74c3c, #c0392b); 
                                       color: white; 
                                       border: none; 
                                       padding: 8px 18px; 
                                       border-radius: 6px; 
                                       cursor: pointer;
                                       font-size: 13px;
                                       font-weight: 500;
                                       transition: all 0.3s ease;
                                       box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                       white-space: nowrap;
                                       flex-shrink: 0;">
                            <i class="fas fa-trash-alt" style="margin-right: 5px;"></i>Eliminar
                        </button>
                    ` : `
                        <span style="background: #6c757d;
                                     color: white;
                                     padding: 8px 18px;
                                     border-radius: 6px;
                                     font-size: 13px;
                                     font-weight: 500;
                                     white-space: nowrap;
                                     flex-shrink: 0;
                                     opacity: 0.7;">
                            <i class="fas fa-lock" style="margin-right: 5px;"></i>Bloqueado
                        </span>
                    `}
                </li>
            `;
        });
        html += '</ul>';
        
        listaContainer.innerHTML = html;
        
        // Solo agregar eventos si no tiene sesiones
        if (!tieneSesiones) {
            document.querySelectorAll('.btn-eliminar-objetivo').forEach(btn => {
                btn.addEventListener('click', function() {
                    eliminarObjetivo(this.dataset.id);
                });
                
                btn.addEventListener('mouseenter', function() {
                    this.style.transform = 'scale(1.05)';
                    this.style.boxShadow = '0 4px 8px rgba(231, 76, 60, 0.3)';
                });
                btn.addEventListener('mouseleave', function() {
                    this.style.transform = 'scale(1)';
                    this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                });
            });
        }
    }

    function eliminarObjetivo(idObjetivo) {
        if (confirm('¿Estás seguro de eliminar este objetivo?')) {
            objetivosActuales = objetivosActuales.filter(obj => obj.id != idObjetivo);
            renderizarListaObjetivos();
        }
    }

    function inicializarBuscadorObjetivos() {
        const buscarObjetivoInput = document.getElementById('buscar_objetivo');
        const sugerenciasContainer = document.getElementById('objetivos-sugerencias');
        const btnAgregarObjetivo = document.getElementById('btn-agregar-objetivo');
        let timeoutBusqueda = null;

        if (!buscarObjetivoInput || !sugerenciasContainer) return;

        const nuevoInput = buscarObjetivoInput.cloneNode(true);
        buscarObjetivoInput.parentNode.replaceChild(nuevoInput, buscarObjetivoInput);
        
        const inputBusqueda = document.getElementById('buscar_objetivo');
        const containerSugerencias = document.getElementById('objetivos-sugerencias');

        inputBusqueda.addEventListener('input', function() {
            const query = this.value.trim();
            
            clearTimeout(timeoutBusqueda);
            
            if (query.length < 2) {
                containerSugerencias.style.display = 'none';
                objetivoSeleccionado = null;
                return;
            }
            
            containerSugerencias.innerHTML = '<div style="padding: 15px; text-align: center; color: #3498db;"><i class="fas fa-spinner fa-spin"></i> Buscando...</div>';
            containerSugerencias.style.display = 'block';
            
            timeoutBusqueda = setTimeout(() => {
                fetch(`/entrenamientos/buscar-objetivos/?q=${encodeURIComponent(query)}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        mostrarSugerencias(data.objetivos || [], containerSugerencias, inputBusqueda);
                    })
                    .catch(error => {
                        containerSugerencias.innerHTML = `
                            <div style="padding: 15px; color: #e74c3c; text-align: center;">
                                <i class="fas fa-exclamation-triangle"></i> Error al buscar
                            </div>
                        `;
                    });
            }, 300);
        });

        inputBusqueda.addEventListener('keydown', function(e) {
            const sugerencias = containerSugerencias.querySelectorAll('.objetivo-sugerencia');
            if (sugerencias.length === 0) return;

            let currentIndex = Array.from(sugerencias).findIndex(s => s.classList.contains('selected'));

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (currentIndex < sugerencias.length - 1) {
                    if (currentIndex >= 0) sugerencias[currentIndex].classList.remove('selected');
                    currentIndex++;
                    sugerencias[currentIndex].classList.add('selected');
                    sugerencias[currentIndex].scrollIntoView({ block: 'nearest' });
                    actualizarEstiloSeleccionado(sugerencias);
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (currentIndex > 0) {
                    sugerencias[currentIndex].classList.remove('selected');
                    currentIndex--;
                    sugerencias[currentIndex].classList.add('selected');
                    sugerencias[currentIndex].scrollIntoView({ block: 'nearest' });
                    actualizarEstiloSeleccionado(sugerencias);
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentIndex >= 0) {
                    sugerencias[currentIndex].click();
                }
            } else if (e.key === 'Escape') {
                containerSugerencias.style.display = 'none';
            }
        });

        const cerrarSugerencias = function(e) {
            if (!inputBusqueda.contains(e.target) && 
                !containerSugerencias.contains(e.target) &&
                (!btnAgregarObjetivo || e.target !== btnAgregarObjetivo)) {
                containerSugerencias.style.display = 'none';
            }
        };
        
        document.removeEventListener('click', cerrarSugerencias);
        document.addEventListener('click', cerrarSugerencias);

        if (btnAgregarObjetivo) {
            const nuevoBtn = btnAgregarObjetivo.cloneNode(true);
            btnAgregarObjetivo.parentNode.replaceChild(nuevoBtn, btnAgregarObjetivo);
            
            document.getElementById('btn-agregar-objetivo').addEventListener('click', function() {
                agregarObjetivo(inputBusqueda);
            });
        }
    }

    function actualizarEstiloSeleccionado(sugerencias) {
        sugerencias.forEach(s => {
            if (s.classList.contains('selected')) {
                s.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                s.style.color = 'white';
                const icon = s.querySelector('i');
                if (icon) icon.style.color = 'white';
            } else {
                s.style.background = 'white';
                s.style.color = '#2c3e50';
                const icon = s.querySelector('i');
                if (icon) icon.style.color = '#3498db';
            }
        });
    }

    function mostrarSugerencias(objetivos, container, inputElement) {
        if (!objetivos || objetivos.length === 0) {
            container.innerHTML = `
                <div style="padding: 15px; text-align: center; color: #95a5a6;">
                    <i class="fas fa-search" style="font-size: 20px; margin-bottom: 5px; display: block;"></i>
                    <span style="font-size: 14px;">No se encontraron resultados</span>
                </div>
            `;
            container.style.display = 'block';
            return;
        }
        
        const idsActuales = objetivosActuales.map(obj => obj.id);
        const objetivosFiltrados = objetivos.filter(obj => !idsActuales.includes(obj.idobjetivos));
        
        if (objetivosFiltrados.length === 0) {
            container.innerHTML = `
                <div style="padding: 15px; text-align: center; color: #f39c12;">
                    <i class="fas fa-info-circle" style="font-size: 20px; margin-bottom: 5px; display: block;"></i>
                    <span style="font-size: 14px; display: block;">Todos los objetivos encontrados<br>ya están agregados</span>
                </div>
            `;
            container.style.display = 'block';
            return;
        }
        
        let html = '';
        objetivosFiltrados.forEach((objetivo, index) => {
            html += `
                <div class="objetivo-sugerencia ${index === 0 ? 'selected' : ''}" 
                     data-id="${objetivo.idobjetivos}"  
                     data-nombre="${objetivo.nom_objetivo}"
                     style="padding: 12px 15px; 
                            cursor: pointer; 
                            border-bottom: 1px solid #ecf0f1;
                            transition: all 0.2s ease;
                            display: flex;
                            align-items: center;
                            gap: 10px;
                            background: ${index === 0 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white'};
                            color: ${index === 0 ? 'white' : '#2c3e50'};">
                    <i class="fas fa-bullseye" style="color: ${index === 0 ? 'white' : '#3498db'};"></i>
                    <span>${objetivo.nom_objetivo}</span>
                </div>
            `;
        });
        
        container.innerHTML = html;
        container.style.display = 'block';
        
        document.querySelectorAll('.objetivo-sugerencia').forEach(item => {
            item.addEventListener('mouseenter', function() {
                document.querySelectorAll('.objetivo-sugerencia').forEach(s => s.classList.remove('selected'));
                this.classList.add('selected');
                actualizarEstiloSeleccionado(document.querySelectorAll('.objetivo-sugerencia'));
            });
            
            item.addEventListener('click', function() {
                seleccionarObjetivo(this.dataset.id, this.dataset.nombre, inputElement, container);
            });
        });
    }

    function seleccionarObjetivo(id, nombre, inputElement, container) {
        objetivoSeleccionado = { id, nombre };
        inputElement.value = nombre;
        container.style.display = 'none';
    }

    function agregarObjetivo(buscarObjetivoInput) {
        if (!objetivoSeleccionado) {
            alert('Por favor, selecciona un objetivo de la lista de sugerencias');
            if (buscarObjetivoInput) buscarObjetivoInput.focus();
            return;
        }
        
        if (objetivosActuales.some(obj => obj.id == objetivoSeleccionado.id)) {
            alert('Este objetivo ya está agregado');
            return;
        }
        
        objetivosActuales.push({
            id: objetivoSeleccionado.id,
            nom_objetivo: objetivoSeleccionado.nombre
        });
        
        if (buscarObjetivoInput) buscarObjetivoInput.value = '';
        objetivoSeleccionado = null;
        
        renderizarListaObjetivos();
        
        mostrarMensajeExito('✓ Objetivo agregado');
    }

    const formEditar = document.getElementById('form-editar-entrenamiento');
    if (formEditar) {
        formEditar.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const categoria = document.getElementById('edit_categoria').value;
            const nombre = document.getElementById('edit_nombre').value;
            const descripcion = document.getElementById('edit_descripcion').value;
            
            if (!categoria || categoria === '') {
                alert('⚠️ Por favor, selecciona una categoría');
                document.getElementById('edit_categoria').focus();
                return;
            }
            
            if (nombre.trim() === '') {
                alert('⚠️ El nombre del entrenamiento es obligatorio');
                document.getElementById('edit_nombre').focus();
                return;
            }
            
            if (nombre.length > 30) {
                alert('⚠️ El nombre del entrenamiento no puede superar los 30 caracteres\nActualmente tiene: ' + nombre.length + ' caracteres');
                document.getElementById('edit_nombre').focus();
                return;
            }
            
            const maxDescripcion = 300; 
            if (descripcion.length > maxDescripcion) {
                alert('⚠️ La descripción es demasiado larga\nMáximo permitido: ' + maxDescripcion + ' caracteres\nActualmente tiene: ' + descripcion.length + ' caracteres');
                document.getElementById('edit_descripcion').focus();
                return;
            }
            
            const formData = new FormData(this);
            
            objetivosActuales.forEach((objetivo, index) => {
                formData.append(`objetivos[${index}]`, objetivo.id);
            });
            
            const btnSubmit = this.querySelector('button[type="submit"]');
            const textoOriginal = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            btnSubmit.disabled = true;
            
            fetch(`/entrenamientos/api/entrenamiento/editar/`, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                }
            })
            .then(response => response.json())
            .then(data => {
                btnSubmit.innerHTML = textoOriginal;
                btnSubmit.disabled = false;
                
                if (data.success) {
                    alert('✅ Entrenamiento actualizado correctamente');
                    location.reload();
                } else {
                    alert('❌ Error al actualizar: ' + (data.error || 'Error desconocido'));
                }
            })
            .catch(error => {
                console.error('Error:', error);
                btnSubmit.innerHTML = textoOriginal;
                btnSubmit.disabled = false;
                alert('❌ Error al guardar los cambios. Por favor, intenta nuevamente.');
            });
        });
        
        const nombreInput = document.getElementById('edit_nombre');
        if (nombreInput) {
            const contadorNombre = document.createElement('small');
            contadorNombre.style.cssText = 'color: #666; font-size: 12px; margin-top: 5px; display: block;';
            nombreInput.parentElement.appendChild(contadorNombre);
            
            nombreInput.addEventListener('input', function() {
                const length = this.value.length;
                const maxLength = 30;
                contadorNombre.textContent = `${length}/${maxLength} caracteres`;
                
                if (length > maxLength) {
                    contadorNombre.style.color = '#e74c3c';
                    contadorNombre.textContent = `⚠️ ${length}/${maxLength} caracteres (excedido)`;
                } else if (length > maxLength * 0.8) {
                    contadorNombre.style.color = '#f39c12';
                } else {
                    contadorNombre.style.color = '#27ae60';
                }
            });
        }
        
        const descripcionTextarea = document.getElementById('edit_descripcion');
        if (descripcionTextarea) {
            const contadorDescripcion = document.createElement('small');
            contadorDescripcion.style.cssText = 'color: #666; font-size: 12px; margin-top: 5px; display: block;';
            descripcionTextarea.parentElement.appendChild(contadorDescripcion);
            
            descripcionTextarea.addEventListener('input', function() {
                const length = this.value.length;
                const maxLength = 300; 
                contadorDescripcion.textContent = `${length}/${maxLength} caracteres`;
                
                if (length > maxLength) {
                    contadorDescripcion.style.color = '#e74c3c';
                    contadorDescripcion.textContent = `⚠️ ${length}/${maxLength} caracteres (excedido)`;
                } else if (length > maxLength * 0.8) { 
                    contadorDescripcion.style.color = '#f39c12';
                } else {
                    contadorDescripcion.style.color = '#27ae60';
                }
            });
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

    // ============ FUNCIONALIDAD ELIMINAR ENTRENAMIENTO ============
    document.addEventListener('click', function(e) {
        if (e.target && (e.target.classList.contains('eliminar-entrenamiento') || e.target.closest('.eliminar-entrenamiento'))) {
            const button = e.target.classList.contains('eliminar-entrenamiento') ? e.target : e.target.closest('.eliminar-entrenamiento');
            const entrenamientoId = button.getAttribute('data-id');
            const entrenamientoNombre = button.getAttribute('data-nombre');
            
            if (!entrenamientoId) {
                alert('⚠️ No se pudo obtener el ID del entrenamiento');
                return;
            }
            
            // Confirmación con más detalles
            const confirmar = confirm(
                `⚠️ ¿Estás seguro de que deseas eliminar el entrenamiento?\n\n` +
                `Nombre: ${entrenamientoNombre}\n\n` +
                `Esta acción no se puede deshacer.`
            );
            
            if (!confirmar) return;
            
            // Deshabilitar el botón durante la operación
            const textoOriginal = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
            button.disabled = true;
            
            // Crear FormData
            const formData = new FormData();
            formData.append('id_entrenamiento', entrenamientoId);
            
            // Realizar petición AJAX
            fetch('/entrenamientos/api/entrenamiento/eliminar/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Mostrar mensaje de éxito
                    alert('✅ ' + data.message);
                    
                    // Eliminar la fila de la tabla con animación
                    const fila = button.closest('tr');
                    fila.style.transition = 'all 0.3s ease';
                    fila.style.backgroundColor = '#ffebee';
                    fila.style.opacity = '0';
                    
                    setTimeout(() => {
                        fila.remove();
                        
                        // Verificar si quedan entrenamientos
                        const tbody = document.querySelector('#tabla-entrenamientos tbody');
                        const filasRestantes = tbody.querySelectorAll('.fila-entrenamiento');
                        
                        if (filasRestantes.length === 0) {
                            tbody.innerHTML = `
                                <tr id="fila-vacia">
                                    <td colspan="4" style="text-align: center;">No hay entrenamientos registrados</td>
                                </tr>
                            `;
                        }
                        
                        // Actualizar contador si existe
                        const totalVisible = document.getElementById('total-visible');
                        const totalEntrenamientos = document.getElementById('total-entrenamientos');
                        if (totalVisible && totalEntrenamientos) {
                            const nuevoTotal = parseInt(totalEntrenamientos.textContent) - 1;
                            totalVisible.textContent = nuevoTotal;
                            totalEntrenamientos.textContent = nuevoTotal;
                        }
                    }, 300);
                } else {
                    // Restaurar botón en caso de error
                    button.innerHTML = textoOriginal;
                    button.disabled = false;
                    alert('❌ ' + (data.error || 'Error al eliminar el entrenamiento'));
                }
            })
            .catch(error => {
                console.error('Error:', error);
                button.innerHTML = textoOriginal;
                button.disabled = false;
                alert('❌ Error de conexión al eliminar el entrenamiento. Por favor, intenta nuevamente.');
            });
        }
    });
    
    // ============ FUNCIONALIDAD CAMBIAR ESTADO ENTRENAMIENTO ============
    document.addEventListener('change', function(e) {
        if (e.target && e.target.classList.contains('switch-estado-entrenamiento')) {
            const switchElement = e.target;
            const entrenamientoId = switchElement.getAttribute('data-id');
            const nuevoEstado = switchElement.checked;
            const badgeElement = document.getElementById(`badge-estado-${entrenamientoId}`);
            
            // Guardar estado anterior por si hay error
            const estadoAnterior = !nuevoEstado;
            
            // Deshabilitar el switch mientras se procesa
            switchElement.disabled = true;
            
            // Crear FormData
            const formData = new FormData();
            formData.append('id_entrenamiento', entrenamientoId);
            formData.append('estado', nuevoEstado);
            
            // Realizar petición AJAX
            fetch('/entrenamientos/api/entrenamiento/cambiar-estado/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                }
            })
            .then(response => response.json())
            .then(data => {
                switchElement.disabled = false;
                
                if (data.success) {
                    // Actualizar el badge con el nuevo estado
                    if (badgeElement) {
                        badgeElement.textContent = data.estado_texto;
                        badgeElement.className = `badge ${nuevoEstado ? 'bg-success' : 'bg-secondary'}`;
                    }
                    
                    // Actualizar el estado del switch para asegurar sincronización
                    switchElement.checked = nuevoEstado;
                    
                    // Mostrar mensaje de éxito
                    mostrarMensajeExito(
                        `✓ Estado actualizado: ${data.estado_texto}`,
                        nuevoEstado ? '#28a745' : '#6c757d'
                    );
                } else {
                    // Revertir el switch en caso de error
                    switchElement.checked = estadoAnterior;
                    alert('❌ Error: ' + (data.error || 'No se pudo cambiar el estado'));
                }
            })
            .catch(error => {
                // Revertir el switch en caso de error de conexión
                switchElement.checked = estadoAnterior;
                switchElement.disabled = false;
                console.error('Error:', error);
                alert('❌ Error de conexión al cambiar el estado. Por favor, intenta nuevamente.');
            });
        }
    });

    // Función mejorada para mostrar mensajes con color personalizado
    function mostrarMensajeExito(texto, color = '#27ae60') {
        const mensaje = document.createElement('div');
        mensaje.textContent = texto;
        mensaje.style.cssText = `
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: ${color}; 
            color: white; 
            padding: 15px 25px; 
            border-radius: 8px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
            z-index: 10000; 
            font-weight: 500;
            animation: slideIn 0.3s ease-out;
        `;
        document.body.appendChild(mensaje);
        
        setTimeout(() => {
            mensaje.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => mensaje.remove(), 300);
        }, 2000);
    }

    // Agregar animaciones CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
        
        @keyframes fadeOut {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // ============ ORDENAMIENTO DE TABLA ============
    // COMENTAR O ELIMINAR TODO ESTE BLOQUE porque ya está en filtros-multicriterio.js
    /*
    let ordenActual = {
        columna: null,
        direccion: 'asc'
    };

    const columnaCategoria = document.querySelector('th.sortable[data-column="categoria"]');
    if (columnaCategoria) {
        console.log('Columna de categoría encontrada');
        
        columnaCategoria.addEventListener('click', function() {
            // ... código de ordenamiento ...
        });
    }

    function ordenarTabla(columna, direccion) {
        // ... función de ordenamiento ...
    }
    */
    // FIN DEL BLOQUE COMENTADO
});
