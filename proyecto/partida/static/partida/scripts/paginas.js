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



