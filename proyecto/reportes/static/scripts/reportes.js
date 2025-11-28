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
}

function limpiarFormularioGrupal() {
    document.getElementById('form-reporte-grupal').reset();
}

// Función para ir al detalle individual desde el reporte grupal
function verDetalleIndividual(matriculaId, categoriaId, fechaInicio, fechaFin) {
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
                    document.getElementById('reporteIndividual').scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                    
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
            }, 800); // Esperar 800ms para que se carguen los alumnos
        }
    }, 100);
}

// Inicialización cuando carga el DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('Módulo de reportes cargado correctamente');
    
    // Agregar event listeners a las filas del reporte grupal
    const filasClickeables = document.querySelectorAll('.fila-alumno-clickeable');
    filasClickeables.forEach(fila => {
        fila.addEventListener('click', function() {
            const matriculaId = this.getAttribute('data-matricula');
            const categoriaId = this.getAttribute('data-categoria');
            const fechaInicio = this.getAttribute('data-fecha-inicio');
            const fechaFin = this.getAttribute('data-fecha-fin');
            
            verDetalleIndividual(matriculaId, categoriaId, fechaInicio, fechaFin);
        });
    });
});