// API Base URL
const API_BASE_URL = 'https://questa-r2-api.t88596565.workers.dev';

// ログイン状態チェック
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) {
    window.location.href = 'login.html';
}

// ユーザーデータ
const username = currentUser.displayName || currentUser.username;
let studyData = {
    totalQuestions: 0,
    correctAnswers: 0,
    studyDays: 1,
    lastStudyDate: new Date().toISOString(),
    subjectProgress: {}
};

// ユーザープロフィール情報
const profileKey = currentUser.isGuest ? 'profile_guest' : `profile_${username}`;
let profileData = JSON.parse(localStorage.getItem(profileKey)) || {
    avatarType: 'color',
    avatarValue: '#3498db',
    bio: '',
    goal: ''
};

// APIから進捗データを取得
async function loadProgressData() {
    if (currentUser.isGuest) {
        // ゲストユーザーの場合はローカルストレージから取得
        const studyDataKey = 'studyData_guest';
        studyData = JSON.parse(localStorage.getItem(studyDataKey)) || studyData;
        displayUserData();
        return;
    }

    // 認証済みユーザーの場合はAPIから取得
    const sessionToken = localStorage.getItem('sessionToken');
    if (!sessionToken) {
        console.error('No session token found');
        displayUserData();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/note/progress`, {
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });

        const data = await response.json();
        if (data.success && data.progress.length > 0) {
            // API進捗データを既存形式に変換
            studyData.totalQuestions = 0;
            studyData.correctAnswers = 0;
            studyData.subjectProgress = {};

            data.progress.forEach(prog => {
                studyData.totalQuestions += prog.total_questions || 0;
                studyData.correctAnswers += prog.correct_answers || 0;

                // 科目名をマッピング
                const subjectKey = mapApiSubjectToLocal(prog.subject);
                if (subjectKey) {
                    studyData.subjectProgress[subjectKey] = {
                        total: prog.total_questions || 0,
                        correct: prog.correct_answers || 0
                    };
                }
            });

            // studyDaysはローカル計算（APIにはまだない）
            studyData.studyDays = Math.max(1, Object.keys(studyData.subjectProgress).length);
        }

        displayUserData();
    } catch (error) {
        console.error('Failed to load progress:', error);
        displayUserData();
    }
}

// API科目名をローカル科目名にマッピング
function mapApiSubjectToLocal(apiSubject) {
    const mapping = {
        'english-vocabulary': 'vocabulary',
        'english-listening': 'listening',
        'english-grammar': 'grammar',
        'english-reading': 'reading',
        'math': 'math',
        'physics': 'physics',
        'chemistry': 'chemistry'
    };
    return mapping[apiSubject];
}

// ユーザーデータを表示
function displayUserData() {
    // プロフィール表示
    document.getElementById('profileName').textContent = username;

    // アバター表示
    updateAvatarDisplay();

    // プロフィール詳細表示
    document.getElementById('bio').textContent = profileData.bio || 'まだ設定されていません';
    document.getElementById('goal').textContent = profileData.goal || 'まだ設定されていません';

    // 登録日
    const joinDate = new Date(currentUser.loginDate || currentUser.registeredAt || Date.now());
    document.getElementById('joinDate').textContent = joinDate.toLocaleDateString('ja-JP');

    // 統計表示
    document.getElementById('totalQuestions').textContent = studyData.totalQuestions;
    document.getElementById('correctAnswers').textContent = studyData.correctAnswers;

    const accuracy = studyData.totalQuestions > 0
        ? Math.round((studyData.correctAnswers / studyData.totalQuestions) * 100)
        : 0;
    document.getElementById('accuracy').textContent = accuracy + '%';
    document.getElementById('studyDays').textContent = studyData.studyDays;

    // 科目別進捗
    displaySubjectProgress(accuracy);

    // 実績表示
    displayAchievements(accuracy);
}

// 初期化
loadProgressData();

function updateAvatarDisplay() {
    const avatarDisplay = document.getElementById('avatarDisplay');
    const avatarText = document.getElementById('avatarText');
    
    if (profileData.avatarType === 'emoji') {
        avatarText.textContent = profileData.avatarValue;
        avatarDisplay.style.background = 'linear-gradient(135deg, #ecf0f1, #bdc3c7)';
        avatarText.style.fontSize = '48px';
    } else {
        avatarText.textContent = username.charAt(0).toUpperCase();
        const color1 = profileData.avatarValue;
        const color2 = adjustColor(color1, -20);
        avatarDisplay.style.background = `linear-gradient(135deg, ${color1}, ${color2})`;
        avatarText.style.fontSize = '36px';
    }
}

function adjustColor(color, amount) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// プロフィール詳細表示
document.getElementById('bio').textContent = profileData.bio || 'まだ設定されていません';
document.getElementById('goal').textContent = profileData.goal || 'まだ設定されていません';

// 科目別進捗を表示
function displaySubjectProgress(accuracy) {
    const subjectNames = {
        vocabulary: '英語 - 語彙',
        listening: '英語 - リスニング',
        grammar: '英語 - 文法',
        reading: '英語 - 読解',
        math: '数学',
        physics: '物理',
        chemistry: '化学'
    };

    const progressContainer = document.getElementById('subjectProgress');
    progressContainer.innerHTML = ''; // クリア

    Object.keys(subjectNames).forEach(key => {
        const progress = studyData.subjectProgress[key] || { total: 0, correct: 0 };
        const rate = progress.total > 0 ? Math.round((progress.correct / progress.total) * 100) : 0;

        const progressItem = document.createElement('div');
        progressItem.className = 'progress-item';
        progressItem.innerHTML = `
            <div class="progress-header">
                <span class="progress-name">${subjectNames[key]}</span>
                <span class="progress-rate">${rate}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${rate}%"></div>
            </div>
            <div class="progress-detail">${progress.correct} / ${progress.total} 問</div>
        `;
        progressContainer.appendChild(progressItem);
    });
}

// 実績を表示
function displayAchievements(accuracy) {
    const achievements = [
        { id: 'first_step', name: '最初の一歩', desc: '初めての問題に挑戦', condition: () => studyData.totalQuestions >= 1 },
        { id: 'beginner', name: '初心者', desc: '10問クリア', condition: () => studyData.totalQuestions >= 10 },
        { id: 'intermediate', name: '中級者', desc: '50問クリア', condition: () => studyData.totalQuestions >= 50 },
        { id: 'advanced', name: '上級者', desc: '100問クリア', condition: () => studyData.totalQuestions >= 100 },
        { id: 'master', name: 'マスター', desc: '500問クリア', condition: () => studyData.totalQuestions >= 500 },
        { id: 'perfect_10', name: '完璧主義', desc: '10問連続正解', condition: () => false },
        { id: 'week_warrior', name: '継続は力なり', desc: '7日連続学習', condition: () => studyData.studyDays >= 7 },
        { id: 'accuracy_80', name: '正確無比', desc: '正解率80%以上', condition: () => accuracy >= 80 && studyData.totalQuestions >= 20 },
        { id: 'all_subjects', name: '万能学習者', desc: '全科目学習', condition: () => Object.keys(studyData.subjectProgress).length >= 7 }
    ];

    const achievementsContainer = document.getElementById('achievements');
    achievementsContainer.innerHTML = ''; // クリア

    achievements.forEach(achievement => {
        const unlocked = achievement.condition();
        const achievementItem = document.createElement('div');
        achievementItem.className = `achievement-item ${unlocked ? 'unlocked' : 'locked'}`;
        achievementItem.innerHTML = `
            <div class="achievement-icon">${unlocked ? '★' : '☆'}</div>
            <div class="achievement-info">
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.desc}</div>
            </div>
        `;
        achievementsContainer.appendChild(achievementItem);
    });
}

// データリセット
function resetProgress() {
    if (confirm('本当に学習データをリセットしますか？この操作は取り消せません。')) {
        const initialData = {
            totalQuestions: 0,
            correctAnswers: 0,
            studyDays: 1,
            lastStudyDate: new Date().toISOString(),
            subjectProgress: {}
        };
        localStorage.setItem(studyDataKey, JSON.stringify(initialData));
        alert('学習データをリセットしました');
        location.reload();
    }
}

// アカウント削除
function deleteAccount() {
    if (confirm('本当にアカウントを削除しますか？すべてのデータが失われます。')) {
        if (confirm('最終確認：本当に削除しますか？')) {
            localStorage.removeItem('currentUser');
            localStorage.removeItem(studyDataKey);
            localStorage.removeItem(profileKey);
            alert('アカウントを削除しました');
            window.location.href = 'login.html';
        }
    }
}

// アバター選択モーダル
function openAvatarModal() {
    document.getElementById('avatarModal').classList.remove('hidden');
}

function closeAvatarModal() {
    document.getElementById('avatarModal').classList.add('hidden');
}

function selectAvatar(type, value) {
    profileData.avatarType = type;
    profileData.avatarValue = value;
    localStorage.setItem(profileKey, JSON.stringify(profileData));
    updateAvatarDisplay();
    closeAvatarModal();
}

// プロフィール編集モーダル
function openEditModal() {
    document.getElementById('editBio').value = profileData.bio || '';
    document.getElementById('editGoal').value = profileData.goal || '';
    document.getElementById('editModal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
}

function saveProfile(event) {
    event.preventDefault();
    
    profileData.bio = document.getElementById('editBio').value.trim();
    profileData.goal = document.getElementById('editGoal').value.trim();
    
    localStorage.setItem(profileKey, JSON.stringify(profileData));
    
    document.getElementById('bio').textContent = profileData.bio || 'まだ設定されていません';
    document.getElementById('goal').textContent = profileData.goal || 'まだ設定されていません';
    
    closeEditModal();
    alert('プロフィールを保存しました');
}
