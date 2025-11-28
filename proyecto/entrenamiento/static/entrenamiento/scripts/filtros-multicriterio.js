document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Filtros multicriterio cargado correctamente');
    
    // ==================== SISTEMA DE FILTROS ====================
    
    const filtroCategoria = document.getElementById('filtro-categoria');
    const filtroNombre = document.getElementById('filtro-nombre');
    const btnAplicarFiltros = document.getElementById('btn-aplicar-filtros');
    const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');
    const btnLimpiarFiltros2 = document.getElementById('btn-limpiar-filtros-2');
    const tablaEntrenamientos = document.getElementById('tabla-entrenamientos');
    const sinResultados = document.getElementById('sin-resultados');
    const totalVisible = document.getElementById('total-visible');
    const totalEntrenamientos = document.getElementById('total-entrenamientos');
    
    // Inicializar contador
    actualizarContador();
    
    // Aplicar filtros
    if (btnAplicarFiltros) {
        btnAplicarFiltros.addEventListener('click', aplicarFiltros);
    }
    
    // Limpiar filtros
    if (btnLimpiarFiltros) {
        btnLimpiarFiltros.addEventListener('click', limpiarFiltros);
    }
    
    if (btnLimpiarFiltros2) {
        btnLimpiarFiltros2.addEventListener('click', limpiarFiltros);
    }
    
    // Filtrar en tiempo real al presionar Enter en el campo de nombre
    if (filtroNombre) {
        filtroNombre.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                aplicarFiltros();
            }
        });
    }
    
    function aplicarFiltros() {
        const categoriaSeleccionada = filtroCategoria ? filtroCategoria.value.toLowerCase() : '';
        const nombreBuscado = filtroNombre ? filtroNombre.value.toLowerCase().trim() : '';
        
        const filas = document.querySelectorAll('.fila-entrenamiento');
        let visibles = 0;
        
        filas.forEach(fila => {
            const categorias = fila.getAttribute('data-categorias').toLowerCase();
            const nombre = fila.getAttribute('data-nombre');
            
            let mostrar = true;
            
            // Filtro por categoría
            if (categoriaSeleccionada && !categorias.includes(categoriaSeleccionada)) {
                mostrar = false;
            }
            
            // Filtro por nombre
            if (nombreBuscado && !nombre.includes(nombreBuscado)) {
                mostrar = false;
            }
            
            // Mostrar u ocultar fila con animación
            if (mostrar) {
                fila.style.display = '';
                fila.style.animation = 'fadeIn 0.3s ease';
                visibles++;
            } else {
                fila.style.display = 'none';
            }
        });
        
        // Mostrar mensaje si no hay resultados
        if (visibles === 0 && filas.length > 0) {
            if (sinResultados) sinResultados.style.display = 'block';
            if (tablaEntrenamientos) tablaEntrenamientos.style.display = 'none';
        } else {
            if (sinResultados) sinResultados.style.display = 'none';
            if (tablaEntrenamientos) tablaEntrenamientos.style.display = '';
        }
        
        actualizarContador();
        
        // Feedback visual
        if (btnAplicarFiltros) {
            btnAplicarFiltros.innerHTML = '<i class="fas fa-check"></i> Filtros Aplicados';
            btnAplicarFiltros.style.background = '#27ae60';
            setTimeout(() => {
                btnAplicarFiltros.innerHTML = '<i class="fas fa-filter"></i> Aplicar Filtros';
                btnAplicarFiltros.style.background = '';
            }, 1500);
        }
    }
    
    function limpiarFiltros() {
        if (filtroCategoria) filtroCategoria.value = '';
        if (filtroNombre) filtroNombre.value = '';
        
        const filas = document.querySelectorAll('.fila-entrenamiento');
        filas.forEach(fila => {
            fila.style.display = '';
            fila.style.animation = 'fadeIn 0.3s ease';
        });
        
        if (sinResultados) sinResultados.style.display = 'none';
        if (tablaEntrenamientos) tablaEntrenamientos.style.display = '';
        
        actualizarContador();
        
        // Feedback visual
        if (btnLimpiarFiltros) {
            btnLimpiarFiltros.innerHTML = '<i class="fas fa-check"></i> Limpiado';
            btnLimpiarFiltros.style.background = '#3498db';
            setTimeout(() => {
                btnLimpiarFiltros.innerHTML = '<i class="fas fa-eraser"></i> Limpiar Filtros';
                btnLimpiarFiltros.style.background = '';
            }, 1500);
        }
    }
    
    function actualizarContador() {
        const filas = document.querySelectorAll('.fila-entrenamiento');
        const visibles = Array.from(filas).filter(f => f.style.display !== 'none').length;
        
        if (totalVisible) totalVisible.textContent = visibles;
        if (totalEntrenamientos) totalEntrenamientos.textContent = filas.length;
    }
    
    // ==================== SISTEMA DE ORDENAMIENTO ====================
    
    let ordenActual = {
        columna: null,
        direccion: 'asc' // 'asc' o 'desc'
    };
    
    const columnaSortable = document.querySelector('.sortable[data-column="categoria"]');
    
    if (columnaSortable) {
        columnaSortable.addEventListener('click', function() {
            const columna = this.getAttribute('data-column');
            
            // Cambiar dirección si es la misma columna
            if (ordenActual.columna === columna) {
                ordenActual.direccion = ordenActual.direccion === 'asc' ? 'desc' : 'asc';
            } else {
                ordenActual.columna = columna;
                ordenActual.direccion = 'asc';
            }
            
            ordenarTabla(columna, ordenActual.direccion);
            actualizarIconoOrden(this, ordenActual.direccion);
        });
    }
    
    /**
     * Extrae el número de edad de una categoría
     * Ejemplos: "4-7 años" -> 4, "8 años" -> 8, "12 años" -> 12
     */
    function extraerEdadCategoria(textoCategoria) {
        // Buscar el primer número en el texto
        const match = textoCategoria.match(/(\d+)/);
        return match ? parseInt(match[1]) : 999; // 999 para categorías sin número
    }
    
    /**
     * Extrae la edad mínima de múltiples categorías separadas por comas
     * Ejemplo: "8 años, 12 años" -> 8
     */
    function extraerEdadMinima(categorias) {
        const categoriasArray = categorias.split(',').map(c => c.trim());
        const edades = categoriasArray.map(cat => extraerEdadCategoria(cat));
        return Math.min(...edades);
    }
    
    function ordenarTabla(columna, direccion) {
        const tbody = tablaEntrenamientos.querySelector('tbody');
        const filas = Array.from(tbody.querySelectorAll('.fila-entrenamiento'));
        
        filas.sort((a, b) => {
            let valorA, valorB;
            
            if (columna === 'categoria') {
                // Obtener el texto de las categorías
                const categoriasA = a.getAttribute('data-categorias');
                const categoriasB = b.getAttribute('data-categorias');
                
                // Extraer la edad mínima de cada conjunto de categorías
                valorA = extraerEdadMinima(categoriasA);
                valorB = extraerEdadMinima(categoriasB);
                
                console.log(`Comparando: "${categoriasA}" (${valorA}) vs "${categoriasB}" (${valorB})`);
            }
            
            // Ordenar numéricamente
            if (direccion === 'asc') {
                return valorA - valorB;
            } else {
                return valorB - valorA;
            }
        });
        
        // Reinsertar filas ordenadas
        filas.forEach(fila => {
            tbody.appendChild(fila);
            fila.style.animation = 'fadeIn 0.3s ease';
        });
        
        console.log(`✅ Tabla ordenada por categoría (${direccion === 'asc' ? 'ascendente' : 'descendente'})`);
    }
    
    function actualizarIconoOrden(columna, direccion) {
        // Resetear todos los iconos
        document.querySelectorAll('.sortable .sort-icon').forEach(icon => {
            icon.innerHTML = '<i class="fas fa-sort"></i>';
        });
        
        // Actualizar icono de la columna ordenada
        const icon = columna.querySelector('.sort-icon');
        if (direccion === 'asc') {
            icon.innerHTML = '<i class="fas fa-sort-up" style="color: #3498db;"></i>';
        } else {
            icon.innerHTML = '<i class="fas fa-sort-down" style="color: #3498db;"></i>';
        }
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