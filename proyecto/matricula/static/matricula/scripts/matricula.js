const filtroNombre = document.getElementById('filtro-nombre');
    const filtroCategoria = document.getElementById('filtro-categoria');
    const filtroEstado = document.getElementById('filtro-estado');
    const btnBuscar = document.getElementById('btn-buscar');
    const btnLimpiar = document.getElementById('btn-limpiar');

    function filtrarAlumnos() {
        const nombre = filtroNombre.value.toLowerCase();
        const categoria = filtroCategoria.value;
        const estado = filtroEstado.value;

        document.querySelectorAll('.alumno-card').forEach(card => {
            const coincideNombre = card.dataset.alumnoNombre.toLowerCase().includes(nombre);
            const coincideCategoria = !categoria || card.dataset.categoria === categoria;
            const coincideEstado = !estado || card.dataset.estado === estado;
            card.style.display = (coincideNombre && coincideCategoria && coincideEstado) ? '' : 'none';
        });
    }

    filtroNombre.addEventListener('input', filtrarAlumnos);
    filtroCategoria.addEventListener('change', filtrarAlumnos);
    filtroEstado.addEventListener('change', filtrarAlumnos);

    btnBuscar.addEventListener('click', filtrarAlumnos);

    btnLimpiar.addEventListener('click', () => {
        filtroNombre.value = '';
        filtroCategoria.value = '';
        filtroEstado.value = '';
        filtrarAlumnos();
    });