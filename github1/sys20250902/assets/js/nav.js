(function(){
  // Mobile toggle
  const menuBtn = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');
  if(menuBtn){
    menuBtn.addEventListener('click', ()=>{
      const open = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!open));
      mobileNav.hidden = open;
      menuBtn.classList.toggle('open', !open);
    });
  }

  // Active nav indicator
  const navList = document.getElementById('navList');
  const indicator = document.getElementById('navIndicator');
  if(navList && indicator){
    function moveIndicator(el){
      const rect = el.getBoundingClientRect();
      const host = navList.getBoundingClientRect();
      indicator.style.width = rect.width + 'px';
      indicator.style.transform = `translateX(${rect.left - host.left}px)`;
    }
    const links = navList.querySelectorAll('.nav-link');
    links.forEach(link=>{
      link.addEventListener('mouseenter', () => moveIndicator(link));
      link.addEventListener('focus', () => moveIndicator(link));
      link.addEventListener('click', () => {
        links.forEach(l=>l.classList.remove('active'));
        link.classList.add('active');
      });
    });
    // 初期
    const active = navList.querySelector('.nav-link.active') || links[0];
    if(active) moveIndicator(active);
    window.addEventListener('resize', ()=> {
      const act = navList.querySelector('.nav-link.active');
      if(act) moveIndicator(act);
    });
  }

  // Shrink header on scroll
  const header = document.getElementById('siteHeader');
  let lastY = 0;
  window.addEventListener('scroll', ()=> {
    const y = window.scrollY;
    if(!header) return;
    header.dataset.shrink = (y > 120).toString();
    lastY = y;
  }, { passive:true });
})();
