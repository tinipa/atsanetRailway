const targets = document.querySelectorAll("[data-target]");
const content = document.querySelectorAll("[data-content]");

// Restaurar pestaña activa si existe en sessionStorage
document.addEventListener('DOMContentLoaded', function(){
  try{
    const savedTab = sessionStorage.getItem('activeTab');
    if(savedTab){
      content.forEach((c) => {
        c.classList.remove("active");
      });
      const tabToActivate = document.querySelector(savedTab);
      if(tabToActivate){
        tabToActivate.classList.add("active");
      }
      sessionStorage.removeItem('activeTab');
    }
  }catch(_){/* ignore */}
});

targets.forEach((target) => {
  target.addEventListener("click", () => {
    content.forEach((c) => {
      c.classList.remove("active");
    });

    const t = document.querySelector(target.dataset.target);
    t.classList.add("active");
    
    // Guardar la pestaña activa en sessionStorage
    try{
      sessionStorage.setItem('activeTab', target.dataset.target);
    }catch(_){/* ignore */}
  });
});

// Inicializar AOS (Animate On Scroll)
document.addEventListener('DOMContentLoaded', function() {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            offset: 200,
            once: false
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const menuItems = document.querySelectorAll('.menu li');
    const contents = document.querySelectorAll('[data-content]');

    // MODIFICADO: Verificar primero si hay un parámetro tab en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get('tab');
    
    menuItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            // Remover active de todos
            menuItems.forEach(mi => mi.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            // Añadir active al seleccionado
            item.classList.add('active');
            contents[index].classList.add('active');
        });
    });

    // AÑADIDO: Si no hay parámetro tab, activar la primera pestaña por defecto
    if (!tabFromUrl && menuItems.length > 0 && contents.length > 0) {
        menuItems[0].classList.add('active');
        contents[0].classList.add('active');
    }
});



