(function(){
  const obsTargets = document.querySelectorAll('.obs');
  if(!('IntersectionObserver' in window) || obsTargets.length === 0) {
    obsTargets.forEach(el => el.classList.add('_in'));
    return;
  }
  const io = new IntersectionObserver(entries=>{
    entries.forEach(ent=>{
      if(ent.isIntersecting){
        ent.target.classList.add('_in');
        io.unobserve(ent.target);
      }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });
  obsTargets.forEach(t=>io.observe(t));
})();
