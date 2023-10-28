document.addEventListener('DOMContentLoaded', function() {
     eventListener();

     darkMode();
} );

function darkMode() {
    const botonDarkMode = document.querySelector('.dark-mode-boton');
    const navegacion = document.querySelector('.navegacion');
  
    botonDarkMode.addEventListener('click', function() {
      document.body.classList.toggle('dark-mode');
  
      if (navegacion.classList.contains('dark-mode')) {
        navegacion.classList.remove('dark-mode');
      } else {
        navegacion.classList.add('dark-mode');
      }
    });
  }
  


function eventListener(){
    const mobileMenu = document.querySelector('.mobile-menu');

    mobileMenu.addEventListener('click', navegacionResponsive); 
}

function navegacionResponsive(){
    const navegacion = document.querySelector('.navegacion');

    if(navegacion.classList.contains('mostrar')) {
        navegacion.classList.remove('mostrar');
    } else{
        navegacion.classList.add('mostrar');
    }
}

