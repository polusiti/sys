(function(){
  const btn = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');
  if(!btn || !mobileNav) return;
  btn.addEventListener('click', ()=>{
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    if(expanded){
      mobileNav.hidden = true;
      btn.classList.remove('open');
    } else {
      mobileNav.hidden = false;
      btn.classList.add('open');
    }
  });
  // Accessibility: hide on focus out (optional)
  mobileNav.addEventListener('keydown', e=>{
    if(e.key === 'Escape'){
      btn.click();
      btn.focus();
    }
  });
})();
