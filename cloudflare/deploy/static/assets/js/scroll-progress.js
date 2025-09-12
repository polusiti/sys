(function(){
  const fill = document.getElementById('scrollProgressFill');
  function update(){
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const ratio = max > 0 ? (h.scrollTop / max) : 0;
    if(fill) fill.style.width = (ratio * 100) + '%';
  }
  document.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', update);
  update();
})();
