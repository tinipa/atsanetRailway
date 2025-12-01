console.log('🔍 Filtros multicriterio cargado correctamente');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado - Inicializando filtros y ordenamiento');
    
    // Variables para filtros
    const filtroCategoria = document.getElementById('filtro-categoria');
    const filtroNombre = document.getElementById('filtro-nombre');
    const btnAplicarFiltros = document.getElementById('btn-aplicar-filtros');
    const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');
    const btnLimpiarFiltros2 = document.getElementById('btn-limpiar-filtros-2');
    
    // Contadores
    const totalVisible = document.getElementById('total-visible');
    const totalEntrenamientos = document.getElementById('total-entrenamientos');
    const sinResultados = document.getElementById('sin-resultados');
    const tablaEntrenamientos = document.getElementById('tabla-entrenamientos');
    
    // Inicializar contador total
    const todasLasFilas = document.querySelectorAll('.fila-entrenamiento');
    
    if (totalEntrenamientos) {
        totalEntrenamientos.textContent = todasLasFilas.length;
    }
    if (totalVisible) {
        totalVisible.textContent = todasLasFilas.length;
    }

    // ============ FUNCIÓN AUXILIAR PARA EXTRAER EDAD ============
    function extraerEdadInicial(textoCategoria) {
        // Extraer el primer número de la categoría
        // Ejemplos: "4 a 7 años" -> 4, "12 a 15 años" -> 12, "18 años" -> 18
        const match = textoCategoria.match(/(\d+)/);
        if (match) {
            return parseInt(match[1]);
        }
        // Si no encuentra número, retorna un valor muy alto para enviarlo al final
        return 9999;
    }

    // ============ ORDENAMIENTO POR CATEGORÍA ============
    let ordenActual = {
        columna: null,
        direccion: 'asc'
    };

    const columnaCategoria = document.querySelector('th.sortable[data-column="categoria"]');
    
    if (columnaCategoria) {
        columnaCategoria.addEventListener('click', function() {
            const columna = this.getAttribute('data-column');
            
            // Determinar dirección
            if (ordenActual.columna === columna) {
                ordenActual.direccion = ordenActual.direccion === 'asc' ? 'desc' : 'asc';
            } else {
                ordenActual.columna = columna;
                ordenActual.direccion = 'asc';
            }
            
            // Actualizar iconos
            document.querySelectorAll('th.sortable').forEach(th => {
                const icono = th.querySelector('.sort-icon i');
                if (icono) {
                    icono.className = 'fas fa-sort';
                    icono.style.color = '#999';
                }
            });
            
            const iconoActual = this.querySelector('.sort-icon i');
            if (iconoActual) {
                if (ordenActual.direccion === 'asc') {
                    iconoActual.className = 'fas fa-sort-up';
                    iconoActual.style.color = '#1976d2';
                } else {
                    iconoActual.className = 'fas fa-sort-down';
                    iconoActual.style.color = '#1976d2';
                }
            }
            
            // Ordenar tabla
            ordenarTablaPorCategoria(ordenActual.direccion);
        });
    }

    function ordenarTablaPorCategoria(direccion) {
        let tbody = document.querySelector('#tabla-entrenamientos tbody');
        
        if (!tbody) {
            tbody = document.querySelector('table tbody');
        }
        
        if (!tbody) {
            mostrarMensajeOrdenamiento('⚠️ Error: No se encontró la tabla', '#dc3545');
            return;
        }
        
        // Buscar TODAS las filas
        const todasFilas = Array.from(tbody.querySelectorAll('tr.fila-entrenamiento'));
        
        if (todasFilas.length === 0) {
            mostrarMensajeOrdenamiento('⚠️ No hay entrenamientos para ordenar', '#f39c12');
            return;
        }
        
        // Ordenar las filas por edad numérica
        todasFilas.sort((a, b) => {
            let textoA = (a.getAttribute('data-categorias') || '').trim();
            let textoB = (b.getAttribute('data-categorias') || '').trim();
            
            // Extraer la edad inicial de cada categoría
            let edadA = extraerEdadInicial(textoA);
            let edadB = extraerEdadInicial(textoB);
            
            // Comparación numérica
            if (direccion === 'asc') {
                return edadA - edadB; // Ascendente: 4, 8, 12, 16, 18
            } else {
                return edadB - edadA; // Descendente: 18, 16, 12, 8, 4
            }
        });
        
        // Limpiar tbody (mantener fila vacía si existe)
        const filaVacia = tbody.querySelector('#fila-vacia');
        tbody.innerHTML = '';
        
        // Agregar filas ordenadas con animación
        todasFilas.forEach((fila, index) => {
            fila.style.opacity = '0';
            fila.style.transform = 'translateX(-20px)';
            tbody.appendChild(fila);
            
            setTimeout(() => {
                fila.style.transition = 'all 0.3s ease';
                fila.style.opacity = '1';
                fila.style.transform = 'translateX(0)';
            }, index * 30);
        });
        
        // Si no hay filas visibles después de ordenar, mostrar mensaje
        const filasVisibles = Array.from(todasFilas).filter(f => f.style.display !== 'none');
        if (filasVisibles.length === 0 && filaVacia) {
            tbody.appendChild(filaVacia);
        }
        
        // Mensaje de éxito con descripción más clara
        const textoOrden = direccion === 'asc' 
            ? 'Menor a Mayor (4→18 años) ⬆' 
            : 'Mayor a Menor (18→4 años) ⬇';
        mostrarMensajeOrdenamiento(`✅ Ordenado por edad: ${textoOrden}`, '#28a745');
    }

    function mostrarMensajeOrdenamiento(texto, color) {
        const mensaje = document.createElement('div');
        mensaje.textContent = texto;
        mensaje.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${color};
            color: white;
            padding: 12px 20px;
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
        }, 2500);
    }

    // ============ FUNCIONES DE FILTRADO ============
    function aplicarFiltros() {
        const categoriaSeleccionada = filtroCategoria?.value.toLowerCase().trim() || '';
        const nombreBuscado = filtroNombre?.value.toLowerCase().trim() || '';
        
        const filas = document.querySelectorAll('.fila-entrenamiento');
        let contadorVisible = 0;
        
        filas.forEach(fila => {
            const categorias = (fila.getAttribute('data-categorias') || '').toLowerCase();
            const nombre = (fila.getAttribute('data-nombre') || '').toLowerCase();
            
            const coincideCategoria = !categoriaSeleccionada || categorias.includes(categoriaSeleccionada);
            const coincideNombre = !nombreBuscado || nombre.includes(nombreBuscado);
            
            if (coincideCategoria && coincideNombre) {
                fila.style.display = '';
                contadorVisible++;
            } else {
                fila.style.display = 'none';
            }
        });
        
        // Actualizar contador
        if (totalVisible) {
            totalVisible.textContent = contadorVisible;
        }
        
        // Mostrar/ocultar mensaje de sin resultados
        if (contadorVisible === 0) {
            if (sinResultados) sinResultados.style.display = 'block';
            if (tablaEntrenamientos) tablaEntrenamientos.style.display = 'none';
        } else {
            if (sinResultados) sinResultados.style.display = 'none';
            if (tablaEntrenamientos) tablaEntrenamientos.style.display = 'table';
        }
        
        // Mensaje de feedback
        if (categoriaSeleccionada || nombreBuscado) {
            mostrarMensajeOrdenamiento(
                `✓ Filtros aplicados: ${contadorVisible} resultado(s) encontrado(s)`,
                '#28a745'
            );
        }
    }

    function limpiarFiltros() {
        if (filtroCategoria) filtroCategoria.value = '';
        if (filtroNombre) filtroNombre.value = '';
        
        const filas = document.querySelectorAll('.fila-entrenamiento');
        filas.forEach(fila => {
            fila.style.display = '';
        });
        
        if (totalVisible) {
            totalVisible.textContent = filas.length;
        }
        
        if (sinResultados) sinResultados.style.display = 'none';
        if (tablaEntrenamientos) tablaEntrenamientos.style.display = 'table';
        
        mostrarMensajeOrdenamiento('✓ Filtros limpiados', '#6c757d');
    }

    // Event listeners para filtros
    if (btnAplicarFiltros) {
        btnAplicarFiltros.addEventListener('click', aplicarFiltros);
    }

    if (btnLimpiarFiltros) {
        btnLimpiarFiltros.addEventListener('click', limpiarFiltros);
    }

    if (btnLimpiarFiltros2) {
        btnLimpiarFiltros2.addEventListener('click', limpiarFiltros);
    }

    // Aplicar filtro al presionar Enter
    if (filtroNombre) {
        filtroNombre.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                aplicarFiltros();
            }
        });
    }

    // Aplicar filtro automático al cambiar categoría
    if (filtroCategoria) {
        filtroCategoria.addEventListener('change', aplicarFiltros);
    }
});

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .sortable:hover {
        background-color: #f0f0f0;
        transition: background-color 0.2s ease;
    }
    
    .filtro-select:focus,
    .filtro-input:focus {
        border-color: #3498db;
        outline: none;
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }
`;
document.head.appendChild(style);