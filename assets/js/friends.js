(async function(){
  const url = 'data/friends.json';
  const listEl = document.getElementById('friendLinks');
  const inlineEl = document.getElementById('friendInline');
  const reloadBtn = document.getElementById('reloadLinksBtn');

  async function load(){
    try {
      // ローカルファイル実行時のCORS対応
      if (window.location.protocol === 'file:') {
        // フォールバックデータを使用
        const data = [
          {name: "Example Site", url: "https://example.com", avatar: "https://pub-d59d6e46c3154423956f648f8df909ae.r2.dev/61203.jpg", desc: "サンプルサイト"}
        ];
        renderSidebar(data);
        renderInline(data.slice(0,6));
        return;
      }
      
      const data = await fetch(url + '?t=' + Date.now()).then(r=>r.json());
      renderSidebar(data);
      renderInline(data.slice(0,6));
    } catch(err){
      if(listEl) listEl.innerHTML = '<li>読み込み失敗</li>';
      if(inlineEl) inlineEl.textContent = '友リンク読込エラー';
      console.error(err);
    }
  }
  function renderSidebar(data){
    if(!listEl) return;
    listEl.innerHTML = data.map(f=>`
      <li>
        <a href="${f.url}" target="_blank" rel="noopener">
          <img src="${f.avatar}" alt="" loading="lazy">
          <span class="fl-name">${escapeHtml(f.name)}</span>
          <span class="fl-desc">${escapeHtml(f.desc)}</span>
        </a>
      </li>
    `).join('');
  }
  function renderInline(data){
    if(!inlineEl) return;
    inlineEl.innerHTML = data.map(f=>`
      <a href="${f.url}" target="_blank" rel="noopener" title="${escapeAttr(f.desc)}">
        <img src="${f.avatar}" alt="">
        <span>${escapeHtml(f.name)}</span>
      </a>
    `).join('');
  }
  function escapeHtml(s){ return s.replace(/[&<>"']/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
  function escapeAttr(s){ return escapeHtml(s); }

  if(reloadBtn) reloadBtn.addEventListener('click', load);
  load();
})();
