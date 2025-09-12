(function(){
  const KEY = 'testapp-theme';
  const root = document.documentElement;
  const cycleBtn = document.getElementById('themeCycleBtn');
  const iconSpan = document.querySelector('[data-theme-icon]');
  const chips = document.querySelectorAll('[data-set-theme]');
  const pills = document.querySelectorAll('.theme-pill');

  const order = ['light','dark','reading'];

  function apply(theme){
    root.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
    updateIcon(theme);
  }
  function updateIcon(theme){
    if(!iconSpan) return;
    iconSpan.textContent = theme === 'dark' ? '🌙'
      : theme === 'reading' ? '📖'
      : '🌞';
  }
  function cycle(){
    const now = root.getAttribute('data-theme') || 'light';
    const nxt = order[(order.indexOf(now)+1)%order.length];
    apply(nxt);
  }
  const saved = localStorage.getItem(KEY);
  if(saved && order.includes(saved)) { apply(saved); }

  if(cycleBtn) cycleBtn.addEventListener('click', cycle);
  [...chips, ...pills].forEach(btn=>{
    btn.addEventListener('click', () => apply(btn.dataset.setTheme));
  });
})();
