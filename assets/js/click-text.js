(function(){
  const words = ['わからん','は？','はあ','へえ','なんで','いや','ちがう','だろ','まじ？','うわ'];
  document.addEventListener('click', (e)=>{
    if(e.target.closest('.menu-toggle, .theme-toggle, .btn, a, button')) return; // UI操作は除外
    const span = document.createElement('span');
    span.className = 'click-text';
    const w = words[Math.floor(Math.random()*words.length)];
    span.textContent = w;
    span.style.left = e.pageX + 'px';
    span.style.top = e.pageY + 'px';
    span.style.color = `hsl(${Math.random()*360},70%,55%)`;
    document.body.appendChild(span);
    setTimeout(()=> span.remove(), 900);
  });
})();
