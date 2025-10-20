// カテゴリー詳細の定義
const categoryLevels = {
    vocabulary: {
        title: "英語 - 語彙",
        levels: [
            { id: "vocab_1", name: "1級", icon: "1級" },
            { id: "vocab_pre1", name: "準1級", icon: "準1" },
            { id: "vocab_2", name: "2級", icon: "2級" },
            { id: "vocab_other", name: "その他", icon: "基礎" }
        ]
    },
    listening: {
        title: "英語 - リスニング",
        levels: [
            { id: "listen_kyotsu", name: "共通テスト", icon: "共通" },
            { id: "listen_todai", name: "東大", icon: "東大" },
            { id: "listen_other", name: "その他", icon: "基礎" }
        ]
    },
    grammar: {
        title: "英語 - 文法",
        levels: [
            { id: "grammar_4choice", name: "四択問題", icon: "四択" },
            { id: "grammar_correct", name: "誤文訂正", icon: "訂正" },
            { id: "grammar_fill", name: "空所補充", icon: "補充" },
            { id: "grammar_arrange", name: "整序問題", icon: "整序" }
        ]
    },
    reading: {
        title: "英語 - 読解",
        levels: [
            { id: "read_1b", name: "1B", icon: "1B" },
            { id: "read_5", name: "5", icon: "5" }
        ]
    },
    math: {
        title: "数学",
        levels: [
            { id: "math_1a", name: "1A", icon: "1A" },
            { id: "math_2b", name: "2B", icon: "2B" },
            { id: "math_3c", name: "3C", icon: "3C" },
            { id: "math_random", name: "ランダム演習", icon: "🎲" }
        ]
    },
    physics: {
        title: "物理",
        levels: [
            { id: "physics_mechanics", name: "力学", icon: "力学" },
            { id: "physics_electric", name: "電磁気", icon: "電磁" },
            { id: "physics_wave", name: "波動", icon: "波動" },
            { id: "physics_thermo", name: "熱", icon: "熱力" },
            { id: "physics_atomic", name: "原子", icon: "原子" }
        ]
    },
    chemistry: {
        title: "化学",
        levels: [
            { id: "chem_theory", name: "理論", icon: "理論" },
            { id: "chem_inorganic", name: "無機", icon: "無機" },
            { id: "chem_organic", name: "有機", icon: "有機" }
        ]
    }
};

// URLパラメータから科目を取得
const urlParams = new URLSearchParams(window.location.search);
const category = urlParams.get('category');

// ページ初期化
if (category && categoryLevels[category]) {
    const categoryData = categoryLevels[category];
    document.getElementById('categoryTitle').textContent = categoryData.title;
    
    const levelGrid = document.getElementById('levelGrid');
    categoryData.levels.forEach(level => {
        const levelCard = document.createElement('div');
        levelCard.className = 'level-card';
        levelCard.onclick = () => startStudy(level.id);
        levelCard.innerHTML = `
            <div class="level-icon">${level.icon}</div>
            <div class="level-name">${level.name}</div>
        `;
        levelGrid.appendChild(levelCard);
    });
} else {
    document.getElementById('categoryTitle').textContent = 'カテゴリーが見つかりません';
}

function goBack() {
    // 英語カテゴリーの場合は英語メニューへ、それ以外は科目選択へ
    const englishCategories = ['vocabulary', 'listening', 'grammar', 'reading'];
    if (englishCategories.includes(category)) {
        location.href = 'english-menu.html';
    } else {
        location.href = 'subject-select.html';
    }
}

function startStudy(levelId) {
    location.href = `study.html?subject=${category}&level=${levelId}`;
}
