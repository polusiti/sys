(function(){
  const targets = document.querySelectorAll('.obs');
  if(!('IntersectionObserver' in window)){
    targets.forEach(t=> t.classList.add('_in'));
    return;
  }
  const io = new IntersectionObserver(entries=>{
    entries.forEach(ent=>{
      if(ent.isIntersecting){
        ent.target.classList.add('_in');
        io.unobserve(ent.target);
      }
    });
  }, { threshold:0.15, rootMargin:'0px 0px -5% 0px' });
  targets.forEach(t=> io.observe(t));
})();
