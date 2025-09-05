(function(){
  const btn = document.getElementById('backToTop');
  const path = document.getElementById('btpProgress');
  const len = 100; // stroke-dasharray base
  function update(){
    if(!btn || !path) return;
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const sc = h.scrollTop;
    const ratio = max>0 ? sc/max : 0;
    if(sc > 320) btn.classList.add('visible');
    else btn.classList.remove('visible');
    path.style.strokeDashoffset = (len - ratio * len).toString();
  }
  btn && btn.addEventListener('click', ()=> window.scrollTo({ top:0, behavior:'smooth'}));
  document.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', update);
  update();
})();
