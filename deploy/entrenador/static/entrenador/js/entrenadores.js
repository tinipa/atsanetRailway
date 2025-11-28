// Scripts for entrenadores page
// Handles filling modals and edit actions

// Función para mostrar mensajes sin recargar
function mostrarMensaje(tipo, texto){
    // Crear elemento de mensaje
    const mensaje = document.createElement('div');
    mensaje.className = 'mensaje-ajax mensaje-' + tipo;
    mensaje.textContent = texto;
    mensaje.style.cssText = 'position:fixed; top:20px; right:20px; z-index:9999; padding:15px 25px; border-radius:8px; font-weight:600; box-shadow:0 4px 12px rgba(0,0,0,0.15); animation:slideIn 0.3s ease-out;';
    
    if(tipo === 'success'){
        mensaje.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        mensaje.style.color = '#fff';
    } else if(tipo === 'error'){
        mensaje.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        mensaje.style.color = '#fff';
    } else {
        mensaje.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        mensaje.style.color = '#fff';
    }
    
    document.body.appendChild(mensaje);
    
    // Eliminar después de 3 segundos
    setTimeout(function(){
        mensaje.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(function(){
            mensaje.remove();
        }, 300);
    }, 3000);
}

// Agregar animaciones CSS
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
}
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', function(){
    // Restaurar posición de scroll si existe
    try{
        const savedY = sessionStorage.getItem('entrenadores_scrollY');
        if(savedY){
            setTimeout(function(){ window.scrollTo(0, parseInt(savedY, 10) || 0); }, 0);
            sessionStorage.removeItem('entrenadores_scrollY');
        }
    }catch(_){/* ignore */}
    // Manejo del botón "Limpiar" en la barra de filtros
    var buscarInput = document.getElementById('buscar-input');
    var btnLimpiar = document.getElementById('btn-limpiar');
    
    if(buscarInput && btnLimpiar){
        // Mostrar/ocultar botón Limpiar según contenido del input
        function toggleLimpiarButton(){
            if(buscarInput.value.trim() !== ''){
                btnLimpiar.style.display = 'inline-block';
            } else {
                btnLimpiar.style.display = 'none';
            }
        }
        
        // Inicializar estado del botón
        toggleLimpiarButton();
        
        // Actualizar cuando cambia el input
        buscarInput.addEventListener('input', toggleLimpiarButton);
        
        // Limpiar búsqueda y recargar
        btnLimpiar.addEventListener('click', function(){
            buscarInput.value = '';
            // Ir a la misma página sin parámetros de búsqueda
            try{ sessionStorage.setItem('entrenadores_scrollY', String(window.scrollY)); }catch(_){}
            window.location.href = window.location.pathname;
        });
    }

    // Guardar scroll al enviar el formulario de filtros (re-carga la página)
    document.querySelectorAll('.filtros-form').forEach(function(form){
        form.addEventListener('submit', function(){
            try{ sessionStorage.setItem('entrenadores_scrollY', String(window.scrollY)); }catch(_){}
        });
    });

    // Barra de búsqueda para postulantes
    var postBuscarInput = document.getElementById('postulantes-buscar-input');
    var postBtnLimpiar = document.getElementById('postulantes-btn-limpiar');
    if(postBuscarInput && postBtnLimpiar){
        function togglePostLimpiar(){
            if(postBuscarInput.value.trim() !== ''){
                postBtnLimpiar.style.display = 'inline-block';
            } else {
                postBtnLimpiar.style.display = 'none';
            }
        }
        togglePostLimpiar();
        postBuscarInput.addEventListener('input', togglePostLimpiar);
        postBtnLimpiar.addEventListener('click', function(e){
            e.preventDefault();
            postBuscarInput.value='';
            try{ 
                sessionStorage.setItem('entrenadores_scrollY', String(window.scrollY)); 
                sessionStorage.setItem('activeTab', '#postulantes');
            }catch(_){}
            // Recargar la página sin el parámetro q_post
            const params = new URLSearchParams(window.location.search);
            params.delete('q_post');
            window.location.href = window.location.pathname + '?' + params.toString();
        });
    }

    // Guardar scroll y pestaña activa al enviar la búsqueda de postulantes
    document.querySelectorAll('.postulantes-search-form').forEach(function(form){
        form.addEventListener('submit', function(e){
            e.preventDefault(); // Prevenir el envío normal
            try{ 
                sessionStorage.setItem('entrenadores_scrollY', String(window.scrollY)); 
                sessionStorage.setItem('activeTab', '#postulantes');
            }catch(_){}
            
            // Construir la URL y recargar
            const params = new URLSearchParams(window.location.search);
            const q_post = form.querySelector('input[name="q_post"]').value;
            params.set('q_post', q_post);
            window.location.href = window.location.pathname + '?' + params.toString();
        });
    });

    // Confirmación al cambiar rol (excluye selects de acción de postulantes)
    document.querySelectorAll('.role-select').forEach(function(select){
        // si es select de acción de postulante, este bloque no aplica
        if(select.name === 'accion_postulante') return;
        select.addEventListener('change', function(e){
            const nuevoRol = this.value;
            const rolActual = this.getAttribute('data-current-role');
            if(confirm('¿Estás seguro de cambiar el rol a ' + nuevoRol + '?')){
                // Enviar por AJAX en lugar de submit normal
                const form = this.form;
                const formData = new FormData(form);
                
                fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if(data.success){
                        // Actualizar el atributo data-current-role
                        this.setAttribute('data-current-role', nuevoRol);
                        // Mostrar mensaje de éxito
                        mostrarMensaje('success', data.message || 'Rol actualizado correctamente');
                    } else {
                        // Revertir el select
                        this.value = rolActual;
                        mostrarMensaje('error', data.message || 'Error al actualizar el rol');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    this.value = rolActual;
                    mostrarMensaje('error', 'Error de conexión al actualizar el rol');
                });
            } else {
                this.value = rolActual;
            }
        });
    });

    // Menú de acciones para postulantes (Aceptar/Rechazar) con confirmación por AJAX
    document.querySelectorAll('.btn-aceptar').forEach(function(btn){
        btn.addEventListener('click', function(e){
            e.preventDefault();
            if(!confirm('¿Aceptar a este postulante como Entrenador?')){
                return;
            }
            // Guardar pestaña activa antes de la acción
            try{
                sessionStorage.setItem('activeTab', '#postulantes');
            }catch(_){/* ignore */}
            
            const form = btn.closest('form');
            const formData = new FormData(form);
            fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(r => r.json())
            .then(data => {
                if(data.success){
                    mostrarMensaje('success', data.message || 'Postulante aceptado');
                    // Opcional: eliminar tarjeta de postulante al aceptar
                    const card = btn.closest('.postulante-card');
                    if(card) card.remove();
                }else{
                    mostrarMensaje('error', data.message || 'No se pudo aceptar');
                }
            })
            .catch(err => {
                console.error(err);
                mostrarMensaje('error', 'Error de conexión');
            });
        });
    });

    document.querySelectorAll('.btn-rechazar').forEach(function(btn){
        btn.addEventListener('click', function(e){
            e.preventDefault();
            if(!confirm('¿Rechazar este postulante?')){
                return;
            }
            // Guardar pestaña activa antes de la acción
            try{
                sessionStorage.setItem('activeTab', '#postulantes');
            }catch(_){/* ignore */}
            
            const form = btn.closest('form');
            const formData = new FormData(form);
            fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(r => r.json())
            .then(data => {
                if(data.success){
                    mostrarMensaje('success', data.message || 'Postulante rechazado');
                    // Quitar tarjeta del DOM sin recargar
                    const card = btn.closest('.postulante-card');
                    if(card) card.remove();
                }else{
                    mostrarMensaje('error', data.message || 'No se pudo rechazar');
                }
            })
            .catch(err => {
                console.error(err);
                mostrarMensaje('error', 'Error de conexión');
            });
        });
    });
    
    // Confirmación al cambiar estado (toggle)
    document.querySelectorAll('.estado-checkbox').forEach(function(cb){
        // asegurarse de tener el atributo data-current-state inicial
        if(!cb.hasAttribute('data-current-state')){
            cb.setAttribute('data-current-state', cb.checked ? '1' : '0');
        }

        cb.addEventListener('change', function(e){
            const checkedNow = this.checked;
            const currentState = this.getAttribute('data-current-state') === '1';
            const nuevoEstadoLabel = checkedNow ? 'Activo' : 'Inactivo';

            if(confirm('¿Estás seguro de cambiar el estado a ' + nuevoEstadoLabel + '?')){
                // Enviar por AJAX
                const form = this.closest('form');
                const formData = new FormData(form);
                
                fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if(data.success){
                        // actualizar el atributo para reflejar el nuevo estado
                        this.setAttribute('data-current-state', checkedNow ? '1' : '0');
                        // Actualizar clase visual de la tarjeta inmediatamente
                        const card = this.closest('.entrenador-card');
                        if(card){
                            if(checkedNow){
                                card.classList.remove('inactivo');
                                // Forzar repaint
                                void card.offsetHeight;
                            } else {
                                card.classList.add('inactivo');
                                // Forzar repaint
                                void card.offsetHeight;
                            }
                        }
                        mostrarMensaje('success', data.message || 'Estado actualizado correctamente');
                    } else {
                        // revertir checkbox al estado anterior
                        this.checked = currentState;
                        mostrarMensaje('error', data.message || 'Error al actualizar el estado');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    this.checked = currentState;
                    mostrarMensaje('error', 'Error de conexión al actualizar el estado');
                });
            } else {
                // revertir checkbox al estado anterior
                this.checked = currentState;
            }
        });
    });
    
    // Rellenar el modal 'verdatos' con la información del botón pulsado
    document.querySelectorAll('.btn-ver').forEach(function(btn){
        btn.addEventListener('click', function(e){
            const d = e.currentTarget.dataset;
            // formatear fecha como dd/mm/aa si es posible
            function formatFechaCorta(s){
                if(!s) return '';
                try{
                    // Caso común: 'YYYY-MM-DD' o empieza así
                    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
                    if(m){
                        const yy = m[1].slice(2);
                        return m[3] + '/' + m[2] + '/' + yy;
                    }
                    // Intentar con Date
                    const dt = new Date(s);
                    if(!isNaN(dt)){
                        const dd = String(dt.getDate()).padStart(2,'0');
                        const mm = String(dt.getMonth()+1).padStart(2,'0');
                        const yy = String(dt.getFullYear()).slice(2);
                        return dd + '/' + mm + '/' + yy;
                    }
                    return s;
                }catch(_){ return s; }
            }
            document.getElementById('v_tipoid').textContent = d.tipoid || '';
            document.getElementById('v_idpersona').textContent = d.idpersona || '';
            document.getElementById('v_nombres').textContent = (d.nom1 || '') + (d.nom2 ? ' ' + d.nom2 : '');
            document.getElementById('v_apellidos').textContent = (d.ape1 || '') + (d.ape2 ? ' ' + d.ape2 : '');
            document.getElementById('v_fecha_nac').textContent = formatFechaCorta(d.fecha_nac);
            document.getElementById('v_genero').textContent = d.genero || '';
            document.getElementById('v_rh').textContent = d.rh || '';
            document.getElementById('v_eps').textContent = d.eps || '';
            document.getElementById('v_direc').textContent = d.direc || '';
            document.getElementById('v_tel').textContent = d.tel || '';
            document.getElementById('v_email').textContent = d.email || '';
            
            // Nuevos campos de experiencia profesional
            document.getElementById('v_experiencia').textContent = (d.experiencia || '0') + ' años';
            document.getElementById('v_especialidad').textContent = d.especialidad || 'No especificada';
            
            // Hoja de vida
            const hojaVidaEl = document.getElementById('v_hoja_vida');
            if(d.hojaVida && d.hojaVida.trim() !== ''){
                hojaVidaEl.innerHTML = '<a href="' + d.hojaVida + '" target="_blank" style="color: #1976d2; text-decoration: underline;">📄 Ver documento</a>';
            } else {
                hojaVidaEl.textContent = 'No adjuntado';
            }
            
            // Tarjeta profesional
            const tarjetaProfEl = document.getElementById('v_tarjeta_prof');
            if(d.tarjetaProf && d.tarjetaProf.trim() !== ''){
                tarjetaProfEl.innerHTML = '<a href="' + d.tarjetaProf + '" target="_blank" style="color: #1976d2; text-decoration: underline;">📄 Ver documento</a>';
            } else {
                tarjetaProfEl.textContent = 'No adjuntado';
            }
            
            // Cargar habilidades desde el servidor
            const habilidadesEl = document.getElementById('v_habilidades');
            habilidadesEl.innerHTML = '<p style="text-align:center; color:#64748b;">Cargando habilidades...</p>';
            
            // Hacer petición AJAX para obtener las habilidades del postulante
            // Importante: fk_personal en personal_t_habilidad referencia persona.id (PK interno),
            // no el campo visible id_persona. Usamos data-personapk enviado desde el template.
            const idPersonaParaHabilidades = d.personapk || d.idpersona; // preferir PK interno
            const urlHabilidades = '/entrenadores/?obtener_habilidades=' + encodeURIComponent(idPersonaParaHabilidades);
            console.log('========== DEBUG HABILIDADES ==========');
            console.log('Persona ID para habilidades (PK interno):', idPersonaParaHabilidades);
            console.log('URL completa:', urlHabilidades);
            
            fetch(urlHabilidades, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                console.log('Response status:', response.status);
                console.log('Response headers:', response.headers);
                if (!response.ok) {
                    throw new Error('HTTP error! status: ' + response.status);
                }
                return response.text(); // Primero como texto para ver qué llega
            })
            .then(text => {
                console.log('Response text raw:', text);
                const data = JSON.parse(text);
                console.log('Datos JSON parseados:', data);
                console.log('data.success:', data.success);
                console.log('data.habilidades:', data.habilidades);
                console.log('Cantidad de habilidades:', data.habilidades ? data.habilidades.length : 0);
                
                if(data.success && data.habilidades && data.habilidades.length > 0){
                    console.log('Mostrando habilidades:', data.habilidades);
                    habilidadesEl.innerHTML = data.habilidades.map(function(hab){
                        return '<div style="background: white; padding: 8px 12px; border-radius: 8px; font-size: 0.9rem; color: #0e245c; border: 1px solid #e2e8f0;">✓ ' + hab + '</div>';
                    }).join('');
                } else if (data.success && data.habilidades && data.habilidades.length === 0) {
                    console.log('Success pero sin habilidades');
                    habilidadesEl.innerHTML = '<p style="text-align:center; color:#64748b; font-style:italic;">No hay habilidades registradas</p>';
                } else {
                    console.error('Error en respuesta:', data.message);
                    habilidadesEl.innerHTML = '<p style="text-align:center; color:#ef4444;">Error: ' + (data.message || 'Error desconocido') + '</p>';
                }
                console.log('========== FIN DEBUG HABILIDADES ==========');
            })
            .catch(error => {
                console.error('Error CATCH al cargar habilidades:', error);
                habilidadesEl.innerHTML = '<p style="text-align:center; color:#ef4444;">Error al cargar habilidades: ' + error.message + '</p>';
            });
        });
    });

    // Rellenar el modal 'editar' con los datos de la fila y bloquear campos no editables
    document.querySelectorAll('.editar').forEach(function(btn){
        btn.addEventListener('click', function(e){
            const d = e.currentTarget.dataset;
            // llenar inputs del modal editar
            const setVal = function(id, val){ const el = document.getElementById(id); if(el) el.value = val || ''; };
            setVal('tipo_identificacion', d.tipoid);
            setVal('id', d.idpersona);
            setVal('nom1_persona', d.nom1);
            setVal('nom2_persona', d.nom2);
            setVal('ape1_persona', d.ape1);
            setVal('ape2_persona', d.ape2);
            // set selects (genero, eps) and disabled rhs + hidden rhs
            if(document.getElementById('tipo_personal')) document.getElementById('tipo_personal').value = d.rol || '';
            // DEBUG: resaltar temporalmente el select de rol y registrar en consola para confirmar que existe
            (function(){
                var tp = document.getElementById('tipo_personal');
                if(tp){
                    console.log('DEBUG: select #tipo_personal encontrado. valor=', tp.value);
                    tp.style.boxShadow = '0 0 0 4px rgba(255,255,0,0.6)';
                    // quitar el resaltado después de 2.5s
                    setTimeout(function(){ tp.style.boxShadow = ''; }, 2500);
                } else {
                    console.log('DEBUG: select #tipo_personal NO encontrado en el modal');
                }
            })();
            if(document.getElementById('genero')) document.getElementById('genero').value = d.genero || '';
            // format fecha_nacimiento to Spanish human readable form but keep original if parsing fails
            if(d.fecha_nac){
                try{
                    var dt = new Date(d.fecha_nac);
                    if(!isNaN(dt)){
                        // format as dd/mm/yyyy
                        var day = String(dt.getDate()).padStart(2,'0');
                        var month = String(dt.getMonth()+1).padStart(2,'0');
                        var year = dt.getFullYear();
                        var fmt = day + '/' + month + '/' + year;
                        setVal('fecha_nacimiento', fmt);
                    } else {
                        setVal('fecha_nacimiento', d.fecha_nac);
                    }
                }catch(err){
                    setVal('fecha_nacimiento', d.fecha_nac);
                }
            } else {
                setVal('fecha_nacimiento', '');
            }
            // tipo de sangre: mostrar en select disabled, enviar por hidden
            var rhsSelect = document.getElementById('rhs');
            var rhsHidden = document.getElementById('rhs_hidden');
            if(rhsSelect) rhsSelect.value = d.rh || '';
            if(rhsHidden) rhsHidden.value = d.rh || '';
            if(document.getElementById('eps')) document.getElementById('eps').value = d.eps || '';
            setVal('direc_persona', d.direc);
            setVal('tel_persona', d.tel);
            setVal('email_persona', d.email);

            // Campos que asumimos no editables: tipo_identidad, número de identificación y fecha de nacimiento
            // Usar readOnly en vez de disabled para que el valor se envíe con el formulario
            ['tipo_identificacion','id','fecha_nacimiento'].forEach(function(fid){
                const el = document.getElementById(fid);
                if(el) el.readOnly = true;
            });
            // Añadir título y clase visual para indicar que no son editables
            ['tipo_identificacion','id','fecha_nacimiento'].forEach(function(fid){
                const el = document.getElementById(fid);
                if(el){
                    el.title = 'No se puede cambiar';
                    el.classList.add('no-editable');
                }
            });
        });
    });

    // Manejador AJAX para el formulario de edición completo
    const formEditarEntrenador = document.getElementById('form-editar-entrenador');
    // helper: encontrar tarjeta por id_persona
    function findCardByIdPersona(idPersona){
        const btn = document.querySelector('.entrenador-card .editar[data-idpersona="' + idPersona + '"]');
        return btn ? btn.closest('.entrenador-card') : null;
    }
    function buildNombreDisplay(n1, n2, a1, a2){
        const n2i = n2 ? (' ' + n2.trim().slice(0,1) + '.') : '';
        const a2i = a2 ? (' ' + a2.trim().slice(0,1) + '.') : '';
        return (n1 || '').trim() + n2i + ' ' + (a1 || '').trim() + a2i;
    }
    if(formEditarEntrenador){
        formEditarEntrenador.addEventListener('submit', function(e){
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = this.querySelector('.btn-enviar');
            const originalText = submitBtn.textContent;
            const idPersona = formData.get('id');
            const nom1 = formData.get('nom1_persona') || '';
            const nom2 = formData.get('nom2_persona') || '';
            const ape1 = formData.get('ape1_persona') || '';
            const ape2 = formData.get('ape2_persona') || '';
            const email = formData.get('email_persona') || '';
            
            // Deshabilitar botón y mostrar estado de carga
            submitBtn.disabled = true;
            submitBtn.textContent = 'Guardando...';
            
            fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                if(data.success){
                    mostrarMensaje('success', data.message || 'Datos guardados correctamente');
                    // Actualizar tarjeta sin recargar
                    const card = findCardByIdPersona(idPersona);
                    if(card){
                        const nombreEl = card.querySelector('.nombre');
                        const emailEl = card.querySelector('.email');
                        if(nombreEl) nombreEl.textContent = buildNombreDisplay(nom1, nom2, ape1, ape2);
                        if(emailEl) emailEl.textContent = email;
                        // actualizar dataset del botón editar
                        const btnEdit = card.querySelector('.editar');
                        if(btnEdit){
                            btnEdit.dataset.nom1 = nom1;
                            btnEdit.dataset.nom2 = nom2;
                            btnEdit.dataset.ape1 = ape1;
                            btnEdit.dataset.ape2 = ape2;
                            btnEdit.dataset.email = email;
                        }
                    }
                    // Cerrar modal
                    const modalEl = document.getElementById('editar');
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if(modal) modal.hide();
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                } else {
                    mostrarMensaje('error', data.message || 'Error al guardar los datos');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                mostrarMensaje('error', 'Error de conexión al guardar los datos');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            });
        });
    }

    // Manejador del formulario de edición de jornada
    const formEditarJornada = document.getElementById('form-editar-jornada');
    if(formEditarJornada){
        formEditarJornada.addEventListener('submit', function(e){
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = this.querySelector('.btn-jornada-submit');
            const originalText = submitBtn.textContent;
            
            // Deshabilitar botón y mostrar estado de carga
            submitBtn.disabled = true;
            submitBtn.textContent = 'Guardando...';
            
            fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                if(data.success){
                    mostrarMensaje('success', data.message || 'Jornada actualizada correctamente');
                    // Cerrar modal
                    const modalEl = document.getElementById('editarJornada');
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if(modal) modal.hide();
                    // Guardar pestaña activa y recargar página
                    try{
                        sessionStorage.setItem('activeTab', '#jornadas');
                    }catch(_){}
                    setTimeout(function(){ window.location.reload(); }, 500);
                } else {
                    mostrarMensaje('error', data.message || 'Error al actualizar la jornada');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                mostrarMensaje('error', 'Error de conexión al actualizar la jornada');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            });
        });
    }

    // Manejador del formulario de creación de jornada
    const formCrearJornada = document.getElementById('form-crear-jornada');
    if(formCrearJornada){
        formCrearJornada.addEventListener('submit', function(e){
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = this.querySelector('.btn-jornada-submit');
            const originalText = submitBtn.textContent;
            
            // IMPORTANTE: Agregar el campo accion_jornada que viene del botón submit
            formData.append('accion_jornada', 'crear');
            
            // Deshabilitar botón y mostrar estado de carga
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creando...';
            
            fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                if(data.success){
                    mostrarMensaje('success', data.message || 'Jornada creada correctamente');
                    // Limpiar formulario
                    this.reset();
                    // Guardar pestaña activa y recargar página
                    try{
                        sessionStorage.setItem('activeTab', '#jornadas');
                    }catch(_){}
                    setTimeout(function(){ window.location.reload(); }, 500);
                } else {
                    mostrarMensaje('error', data.message || 'Error al crear la jornada');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                mostrarMensaje('error', 'Error de conexión al crear la jornada');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            });
        });
    }

    // Nota: los campos no editables (id, fecha_nacimiento, tipo de sangre) se mantienen como no editables
});

// ================== NUEVA LÓGICA PUNTAJES Y MEJORES POSTULANTES ==================
document.addEventListener('DOMContentLoaded', () => {
    const btnPuntajes = document.getElementById('btn-puntajes');
    const btnMejores = document.getElementById('btn-mejores');
    const btnRestaurar = null; // botón eliminado
    const btnLimpiarPuntajes = document.getElementById('btn-limpiar-puntajes');
    const puntajesWrap = document.getElementById('puntajesPostulantes');
    const mensajeMejores = document.getElementById('mejoresMensaje');
    const gridPostulantes = document.querySelector('.postulante-cards-grid');

    if(btnPuntajes){
        btnPuntajes.addEventListener('click', () => {
            btnPuntajes.disabled = true;
            fetch('/entrenadores/?puntajes_postulantes=1', { headers: { 'X-Requested-With':'XMLHttpRequest' }})
                .then(r => r.json())
                .then(data => {
                    btnPuntajes.disabled = false;
                    if(data.success){
                        // Ocultar cualquier mensaje previo y contenedor de tabla (ya no usado)
                        puntajesWrap.style.display = 'none';
                        mensajeMejores.textContent = '';
                        // Colocar puntaje en cada tarjeta
                        data.puntajes.forEach(p => {
                            const badge = document.querySelector(`.pc-score[data-score-for='${p.id_persona}']`);
                            if(badge){
                                const valEl = badge.querySelector('.pc-score-value');
                                const extraEl = badge.querySelector('.pc-score-extra');
                                if(valEl){
                                    valEl.textContent = `${p.total} pts`;
                                }
                                if(extraEl){
                                    extraEl.textContent = `Exp:${p.experiencia} | Hab:${p.habilidades} | ExpPts:${p.puntos_experiencia} HabPts:${p.puntos_habilidades}`;
                                }
                                badge.style.display = 'inline-block';
                                // Todos con color azul para mostrar puntajes
                                badge.style.background = '#dbeafe';
                                badge.style.borderColor = '#93c5fd';
                                badge.style.color = '#1e3a8a';
                            }
                        });
                    } else {
                        mensajeMejores.textContent = 'Error al obtener puntajes.';
                    }
                })
                .catch(err => {
                    btnPuntajes.disabled = false;
                    mensajeMejores.textContent = 'Fallo petición: ' + err.message;
                });
        });
    }

    if(btnMejores){
        btnMejores.addEventListener('click', () => {
            btnMejores.disabled = true;
            fetch('/entrenadores/?mejores_postulantes=1', { headers: { 'X-Requested-With':'XMLHttpRequest' }})
                .then(r => r.json())
                .then(data => {
                    btnMejores.disabled = false;
                    if(data.success){
                        // Aceptar tanto data.candidatos como data.mejores para compatibilidad
                        const candidatos = (data.candidatos || data.mejores || []);
                        const idSet = new Set(candidatos.map(m => String(m.id_persona)));
                        const cards = gridPostulantes.querySelectorAll('.postulante-card');
                        let visibles = 0;
                        cards.forEach(card => {
                            const btnVer = card.querySelector('.btn-ver');
                            const idPersona = btnVer ? btnVer.getAttribute('data-idpersona') : null;
                            if(idPersona && idSet.has(idPersona)){
                                card.style.display = '';
                                visibles++;
                                const m = candidatos.find(c => String(c.id_persona) === idPersona);
                                const badge = card.querySelector(`.pc-score[data-score-for='${idPersona}']`);
                                if(badge && m){
                                    // Asegurar estructura
                                    let valEl = badge.querySelector('.pc-score-value');
                                    let extraEl = badge.querySelector('.pc-score-extra');
                                    if(!valEl){
                                        valEl = document.createElement('span');
                                        valEl.className = 'pc-score-value';
                                        badge.appendChild(valEl);
                                    }
                                    if(!extraEl){
                                        extraEl = document.createElement('span');
                                        extraEl.className = 'pc-score-extra';
                                        extraEl.style.cssText = 'display:block; font-size:0.65rem; font-weight:500; margin-top:2px; color:#334155;';
                                        badge.appendChild(extraEl);
                                    }
                                    const puntosExp = m.experiencia * 10;
                                    const puntosHab = m.habilidades * 5;
                                    const total = puntosExp + puntosHab;
                                    valEl.textContent = `${total} pts`;
                                    extraEl.textContent = `Exp:${m.experiencia} | Hab:${m.habilidades} | ExpPts:${puntosExp} HabPts:${puntosHab}`;
                                    badge.style.display='inline-block';
                                    // Colores según cumplimiento
                                    if(m.cumple_experiencia && m.cumple_habilidades){
                                        badge.style.background = '#86efac';
                                        badge.style.borderColor = '#4ade80';
                                        badge.style.color = '#14532d';
                                    } else if(m.cumple_experiencia && !m.cumple_habilidades){
                                        // Solo experiencia: azul claro
                                        badge.style.background = '#93c5fd';
                                        badge.style.borderColor = '#60a5fa';
                                        badge.style.color = '#1e3a8a';
                                    } else if(!m.cumple_experiencia && m.cumple_habilidades){
                                        badge.style.background = '#c4b5fd';
                                        badge.style.borderColor = '#a78bfa';
                                        badge.style.color = '#4c1d95';
                                    } else {
                                        badge.style.background = '#2563eb';
                                        badge.style.borderColor = '#1d4ed8';
                                        badge.style.color = '#fff';
                                    }
                                    // Mensaje debajo (crear si no existe)
                                    let msgEl = card.querySelector('.pc-score-message');
                                    if(!msgEl){
                                        msgEl = document.createElement('div');
                                        msgEl.className = 'pc-score-message';
                                        msgEl.style.cssText = 'margin-top:4px; font-size:0.65rem; font-weight:500;';
                                        badge.insertAdjacentElement('afterend', msgEl);
                                    }
                                    msgEl.textContent = m.mensaje;
                                }
                            } else {
                                card.style.display = 'none';
                            }
                        });
                        puntajesWrap.style.display = 'none';
                        if(visibles === 0){
                            mensajeMejores.innerHTML = '<span style="color:#dc2626; font-weight:600;">No hay postulantes que cumplan los criterios (experiencia ≥4 años o habilidades ≥4).</span>';
                        } else {
                            mensajeMejores.innerHTML = `Se seleccionaron <strong>${visibles}</strong> postulante(s) con <strong>4 o más años de experiencia</strong> o <strong>4 o más habilidades registradas</strong>.<br><span style="font-size:0.65rem; color:#475569;">Colores: verde claro = ambos criterios, azul claro = solo experiencia, morado claro = solo habilidades.</span>`;
                        }
                        // Ya no se usa botón restaurar; limpiar puntajes restaura vista
                    } else {
                        mensajeMejores.textContent = 'Error al filtrar mejores postulantes.';
                        // Sin botón restaurar
                    }
                })
                .catch(err => {
                    btnMejores.disabled = false;
                    mensajeMejores.textContent = 'Fallo petición: ' + err.message;
                    // Sin botón restaurar
                });

        });
    }

    // Limpiar puntajes (independiente de haber presionado Mejores antes)
    if(btnLimpiarPuntajes){
        btnLimpiarPuntajes.addEventListener('click', () => {
            const badges = document.querySelectorAll('.pc-score');
            badges.forEach(b => {
                b.style.display = 'none';
                const val = b.querySelector('.pc-score-value');
                const extra = b.querySelector('.pc-score-extra');
                if (val) val.textContent = '';
                if (extra) extra.textContent = 'Exp:0 | Hab:0';
                b.style.background = '#eef2ff';
                b.style.borderColor = '#c7d2fe';
                b.style.color = '#1e3a8a';
            });
            const msgs = document.querySelectorAll('.pc-score-message');
            msgs.forEach(m => m.textContent = '');
            mensajeMejores.textContent = '';
            // Sin botón restaurar
            btnPuntajes.disabled = false;
            btnMejores.disabled = false;
            gridPostulantes.querySelectorAll('.postulante-card').forEach(card => card.style.display = '');
        });
    }

    // Botón 'Ver todos' removido; limpiar puntajes hace la restauración
});
// ================== FIN NUEVA LÓGICA ==================
