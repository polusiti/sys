// テーマ管理
const themeManager = {
    init() {
        // 保存されたテーマを読み込み
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        
        // トグルボタンの状態を更新
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.checked = savedTheme === 'dark';
        }
    },
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // アニメーション効果
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    },
    
    toggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
};

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
    themeManager.init();
});

// テーマ切り替え関数
function toggleTheme() {
    themeManager.toggle();
}
