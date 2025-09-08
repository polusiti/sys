(function(){
  const STORAGE_KEY = 'testapp-theme';
  const root = document.documentElement;
  const toggleBtn = document.getElementById('themeToggle');
  const iconSpan = document.querySelector('[data-theme-icon]');
  const themeChips = document.querySelectorAll('[data-set-theme]');

  function applyTheme(theme){
    root.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    updateIcon(theme);
  }
  function updateIcon(theme){
    if(!iconSpan) return;
    iconSpan.textContent = theme === 'dark' ? '🌙'
      : theme === 'reading' ? '📖'
      : '🌞';
  }
  function cycleTheme(){
    const current = root.getAttribute('data-theme') || 'light';
    const list = ['light','dark','reading'];
    const next = list[(list.indexOf(current)+1)%list.length];
    applyTheme(next);
  }
  // Load initial
  const saved = localStorage.getItem(STORAGE_KEY);
  if(saved){ applyTheme(saved); }
  // Toggle button
  if(toggleBtn){
    toggleBtn.addEventListener('click', cycleTheme);
  }
  // Chips
  themeChips.forEach(chip=>{
    chip.addEventListener('click', ()=>{
      applyTheme(chip.dataset.setTheme);
    });
  });
})();
