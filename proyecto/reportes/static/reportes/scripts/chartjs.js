// Variable global para el gráfico de radar
let graficoRadarTop10Instance = null;

// Variable global para el gráfico de barras
let graficoBarrasTop10Instance = null;

/**
 * Genera el gráfico de radar para el top 10 de mejores alumnos
 * @param {Array} datos - Array con los datos de los alumnos del reporte grupal
 */
function generarGraficoRadarTop10(datos) {
    const ctx = document.getElementById('graficoRadarTop10');
    if (!ctx) {
        console.warn('No se encontró el elemento canvas con id "graficoRadarTop10"');
        return;
    }

    // Destruir gráfico existente si lo hay
    if (graficoRadarTop10Instance) {
        graficoRadarTop10Instance.destroy();
        graficoRadarTop10Instance = null;
    }

    // Calcular promedio de rendimiento y ordenar
    const datosConPromedio = datos.map(alumno => ({
        ...alumno,
        promedioRendimiento: (alumno.porcentajeAsistencia + alumno.porcentajeObjetivos) / 2
    }));

    // Ordenar por promedio de rendimiento (mayor a menor) y tomar top 10
    const top10 = datosConPromedio
        .sort((a, b) => b.promedioRendimiento - a.promedioRendimiento)
        .slice(0, 10);

    // Validar que hay datos
    if (top10.length === 0) {
        console.warn('No hay datos suficientes para generar el gráfico');
        return;
    }

    // Preparar datos para el gráfico
    const nombres = top10.map(alumno => {
        // Acortar nombres largos para mejor visualización
        const nombre = alumno.nombreCompleto;
        return nombre.length > 25 ? nombre.substring(0, 22) + '...' : nombre;
    });

    const asistencias = top10.map(alumno => alumno.porcentajeAsistencia);
    const objetivos = top10.map(alumno => alumno.porcentajeObjetivos);

    // Crear el gráfico de radar
    graficoRadarTop10Instance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: nombres,
            datasets: [
                {
                    label: '% Asistencia',
                    data: asistencias,
                    backgroundColor: 'rgba(244, 67, 54, 0.2)',
                    borderColor: 'rgba(244, 67, 54, 1)',
                    borderWidth: 3,
                    pointBackgroundColor: 'rgba(244, 67, 54, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(244, 67, 54, 1)',
                    pointHoverRadius: 7
                },
                {
                    label: '% Objetivos Cumplidos',
                    data: objetivos,
                    backgroundColor: 'rgba(33, 150, 243, 0.2)',
                    borderColor: 'rgba(33, 150, 243, 1)',
                    borderWidth: 3,
                    pointBackgroundColor: 'rgba(33, 150, 243, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(33, 150, 243, 1)',
                    pointHoverRadius: 7
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    min: 0,
                    max: 100,
                    ticks: {
                        stepSize: 20,
                        callback: function(value) {
                            return value + '%';
                        },
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        backdropColor: 'rgba(255, 255, 255, 0.8)',
                        backdropPadding: 4
                    },
                    pointLabels: {
                        font: {
                            size: 11,
                            weight: 'bold'
                        },
                        color: '#0e245c',
                        padding: 10
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        lineWidth: 1
                    },
                    angleLines: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        lineWidth: 1
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            const alumno = top10[context.dataIndex];
                            let label = context.dataset.label + ': ' + context.parsed.r.toFixed(1) + '%';
                            
                            // Agregar información adicional
                            if (context.datasetIndex === 0) {
                                label += '\nTotal Entrenamientos: ' + alumno.totalEntrenamientos;
                                label += '\nAsistencias: ' + alumno.totalAsistencias;
                            } else {
                                label += '\nObjetivos Evaluados: ' + alumno.totalObjetivosEvaluados;
                                label += '\nObjetivos Cumplidos: ' + alumno.totalObjetivosCumplidos;
                            }
                            
                            return label;
                        },
                        afterLabel: function(context) {
                            if (context.datasetIndex === 1) {
                                const alumno = top10[context.dataIndex];
                                const promedio = alumno.promedioRendimiento.toFixed(1);
                                return '\n━━━━━━━━━━━━━━━\nPromedio General: ' + promedio + '%';
                            }
                            return '';
                        }
                    }
                }
            },
            interaction: {
                mode: 'point',
                intersect: true
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            }
        }
    });
}

/**
 * Genera el gráfico de barras para el top 10 de mejores alumnos
 * @param {Array} datos - Array con los datos de los alumnos del reporte grupal
 */
function generarGraficoBarrasTop10(datos) {
    const ctx = document.getElementById('graficoBarrasTop10');
    if (!ctx) {
        console.warn('No se encontró el elemento canvas con id "graficoBarrasTop10"');
        return;
    }

    // Destruir gráfico existente si lo hay
    if (graficoBarrasTop10Instance) {
        graficoBarrasTop10Instance.destroy();
        graficoBarrasTop10Instance = null;
    }

    // Calcular promedio de rendimiento y ordenar
    const datosConPromedio = datos.map(alumno => ({
        ...alumno,
        promedioRendimiento: (alumno.porcentajeAsistencia + alumno.porcentajeObjetivos) / 2
    }));

    // Ordenar por promedio de rendimiento (mayor a menor) y tomar top 10
    const top10 = datosConPromedio
        .sort((a, b) => b.promedioRendimiento - a.promedioRendimiento)
        .slice(0, 10);

    // Validar que hay datos
    if (top10.length === 0) {
        console.warn('No hay datos suficientes para generar el gráfico');
        return;
    }

    // Preparar datos para el gráfico
    const nombres = top10.map(alumno => {
        // Acortar nombres largos para mejor visualización
        const nombre = alumno.nombreCompleto;
        return nombre.length > 20 ? nombre.substring(0, 17) + '...' : nombre;
    });

    const asistencias = top10.map(alumno => alumno.porcentajeAsistencia);
    const objetivos = top10.map(alumno => alumno.porcentajeObjetivos);

    // Crear el gráfico de barras
    graficoBarrasTop10Instance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: nombres,
            datasets: [
                {
                    label: '% Asistencia',
                    data: asistencias,
                    backgroundColor: 'rgba(244, 67, 54, 0.8)',
                    borderColor: 'rgba(244, 67, 54, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                },
                {
                    label: '% Objetivos Cumplidos',
                    data: objetivos,
                    backgroundColor: 'rgba(33, 150, 243, 0.8)',
                    borderColor: 'rgba(33, 150, 243, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
                    max: 100,
                    ticks: {
                        stepSize: 10,
                        callback: function(value) {
                            return value + '%';
                        },
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        lineWidth: 1
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 11,
                            weight: 'bold'
                        },
                        color: '#0e245c',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'rect'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        title: function(tooltipItems) {
                            return top10[tooltipItems[0].dataIndex].nombreCompleto;
                        },
                        label: function(context) {
                            const alumno = top10[context.dataIndex];
                            let label = context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '%';
                            
                            // Agregar información adicional
                            if (context.datasetIndex === 0) {
                                label += '\nTotal Entrenamientos: ' + alumno.totalEntrenamientos;
                                label += '\nAsistencias: ' + alumno.totalAsistencias;
                            } else {
                                label += '\nObjetivos Evaluados: ' + alumno.totalObjetivosEvaluados;
                                label += '\nObjetivos Cumplidos: ' + alumno.totalObjetivosCumplidos;
                            }
                            
                            return label;
                        },
                        afterLabel: function(context) {
                            if (context.datasetIndex === 1) {
                                const alumno = top10[context.dataIndex];
                                const promedio = alumno.promedioRendimiento.toFixed(1);
                                return '\n━━━━━━━━━━━━━━━\nPromedio General: ' + promedio + '%';
                            }
                            return '';
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart',
                delay: (context) => {
                    let delay = 0;
                    if (context.type === 'data' && context.mode === 'default') {
                        delay = context.dataIndex * 100 + context.datasetIndex * 50;
                    }
                    return delay;
                },
                // Animación de aparición desde abajo
                y: {
                    duration: 1500,
                    from: (ctx) => {
                        if (ctx.type === 'data') {
                            return ctx.chart.scales.y.getPixelForValue(0);
                        }
                    }
                },
                // Animación de opacidad
                opacity: {
                    duration: 1200,
                    from: 0,
                    to: 1,
                    easing: 'easeInOutQuad'
                }
            },
            // Animaciones al pasar el mouse
            transitions: {
                active: {
                    animation: {
                        duration: 300
                    }
                }
            },
            // Efecto hover personalizado
            onHover: (event, activeElements) => {
                event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
            }
        }
    });
}

/**
 * Destruye el gráfico de radar si existe
 */
function destruirGraficoRadar() {
    if (graficoRadarTop10Instance) {
        graficoRadarTop10Instance.destroy();
        graficoRadarTop10Instance = null;
    }
}

/**
 * Destruye el gráfico de barras si existe
 */
function destruirGraficoBarras() {
    if (graficoBarrasTop10Instance) {
        graficoBarrasTop10Instance.destroy();
        graficoBarrasTop10Instance = null;
    }
}

// Inicialización automática cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si existe el elemento y los datos
    const canvasElementRadar = document.getElementById('graficoRadarTop10');
    const canvasElementBarras = document.getElementById('graficoBarrasTop10');
    
    // Verificar si la variable existe y tiene datos
    if (canvasElementRadar && typeof datosReporteGrupal !== 'undefined' && datosReporteGrupal && datosReporteGrupal.length > 0) {
        generarGraficoRadarTop10(datosReporteGrupal);
    }
    
    if (canvasElementBarras && typeof datosReporteGrupal !== 'undefined' && datosReporteGrupal && datosReporteGrupal.length > 0) {
        generarGraficoBarrasTop10(datosReporteGrupal);
    }
});