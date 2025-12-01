/**
 * Script para la plantilla2.html
 * Maneja el reloj en tiempo real y otras funcionalidades globales
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // ============================================
    // RELOJ EN TIEMPO REAL
    // ============================================
    
    function actualizarReloj() {
        const ahora = new Date();
        
        // Array de días de la semana en español
        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        
        // Array de meses en español
        const meses = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];
        
        // Obtener componentes de la fecha
        const diaSemana = diasSemana[ahora.getDay()];
        const dia = ahora.getDate();
        const mes = meses[ahora.getMonth()];
        const anio = ahora.getFullYear();
        
        // Obtener componentes de la hora
        const horas = String(ahora.getHours()).padStart(2, '0');
        const minutos = String(ahora.getMinutes()).padStart(2, '0');
        const segundos = String(ahora.getSeconds()).padStart(2, '0');
        
        // Formatear fecha: "Lunes, 22 de abril del 2025"
        const fechaTexto = `${diaSemana}, ${dia} de ${mes} del ${anio}`;
        
        // Formatear hora: "14:05:15"
        const horaTexto = `${horas}:${minutos}:${segundos}`;
        
        // Actualizar el DOM
        const fechaElemento = document.getElementById('fecha-texto');
        const horaElemento = document.getElementById('hora-texto');
        
        if (fechaElemento) {
            fechaElemento.textContent = fechaTexto;
        }
        
        if (horaElemento) {
            horaElemento.textContent = horaTexto;
        }
    }
    
    // Inicializar el reloj si los elementos existen
    if (document.getElementById('reloj-sistema')) {
        // Actualizar inmediatamente al cargar la página
        actualizarReloj();
        
        // Actualizar cada segundo (1000 ms)
        setInterval(actualizarReloj, 1000);
    }
    
    // ============================================
    // OTRAS FUNCIONALIDADES GLOBALES
    // ============================================
    
    // Resaltar el enlace activo en el menú de navegación
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    navLinks.forEach(link => {
        const linkPath = new URL(link.href).pathname;
        if (currentPath.startsWith(linkPath) && linkPath !== '/') {
            link.classList.add('active');
        }
    });
    
    // ============================================
    // ANIMACIONES Y EFECTOS VISUALES
    // ============================================
    
    // Efecto de pulso en el reloj cada minuto
    let ultimoMinuto = new Date().getMinutes();
    
    setInterval(() => {
        const minutoActual = new Date().getMinutes();
        if (minutoActual !== ultimoMinuto) {
            const relojContainer = document.getElementById('reloj-sistema');
            if (relojContainer) {
                relojContainer.style.animation = 'pulse 0.5s ease';
                setTimeout(() => {
                    relojContainer.style.animation = '';
                }, 500);
            }
            ultimoMinuto = minutoActual;
        }
    }, 1000);
    
    // ============================================
    // CONFIRMACIÓN AL CERRAR SESIÓN
    // ============================================
    
    const btnCerrarSesion = document.querySelector('#cerrarsesion button');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', function(e) {
            e.preventDefault();
            
            Swal.fire({
                title: '¿Cerrar sesión?',
                text: '¿Estás seguro de que deseas cerrar tu sesión?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#1976d2',
                cancelButtonColor: '#ff1744',
                confirmButtonText: 'Sí, cerrar sesión',
                cancelButtonText: 'Cancelar',
                background: '#fff',
                customClass: {
                    popup: 'swal-custom-popup'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '/iniciosesion';
                }
            });
        });
    }
});