// API Base URL
const API_BASE_URL = 'https://api.allfrom0.top';

// ログイン状態チェック（統一認証マネージャー経由）
let currentUser = null;
function checkAuth() {
    if (typeof authManager !== 'undefined' && authManager) {
        currentUser = authManager.getCurrentUser();
    } else {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
    }

    if (!currentUser) {
        window.location.href = '/pages/login.html';
    }
}
checkAuth();

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

        // 学習履歴・統計を取得
        await loadStudyHistory();
        await loadStudyStats();

        displayUserData();
    } catch (error) {
        console.error('Failed to load progress:', error);
        displayUserData();
    }
}

// 学習履歴を取得
async function loadStudyHistory() {
    if (currentUser.isGuest) return;

    try {
        const sessionToken = localStorage.getItem('sessionToken');
        const response = await fetch(`${API_BASE_URL}/api/study/history?userId=${currentUser.userId}&limit=10`, {
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });
        const data = await response.json();

        if (data.success && data.sessions) {
            displayStudyHistory(data.sessions);
        }
    } catch (error) {
        console.error('Failed to load study history:', error);
    }
}

// 学習統計を取得
async function loadStudyStats() {
    if (currentUser.isGuest) return;

    try {
        const sessionToken = localStorage.getItem('sessionToken');
        const response = await fetch(`${API_BASE_URL}/api/study/stats?userId=${currentUser.userId}`, {
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });
        const data = await response.json();

        if (data.success) {
            // 総学習時間を分に変換
            const totalMinutes = Math.floor((data.totalStudySeconds || 0) / 60);
            console.log('Total study time:', totalMinutes, 'minutes');

            // 統計データがある場合は表示を更新
            if (data.stats && data.stats.length > 0) {
                let totalQ = 0;
                let correctQ = 0;

                data.stats.forEach(stat => {
                    totalQ += stat.total_questions || 0;
                    correctQ += stat.correct_questions || 0;
                });

                // グローバルデータを更新
                if (totalQ > 0) {
                    studyData.totalQuestions = totalQ;
                    studyData.correctAnswers = correctQ;
                }
            }
        }
    } catch (error) {
        console.error('Failed to load study stats:', error);
    }
}

// 学習履歴を表示
function displayStudyHistory(sessions) {
    const historyContainer = document.getElementById('studyHistory');
    if (!historyContainer) return;

    if (!sessions || sessions.length === 0) {
        historyContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">まだ学習履歴がありません</p>';
        return;
    }

    const subjectNames = {
        'english-vocabulary': '英語 - 語彙',
        'english-listening': '英語 - リスニング',
        'english-grammar': '英語 - 文法',
        'english-reading': '英語 - 読解',
        'math': '数学',
        'physics': '物理',
        'chemistry': '化学'
    };

    const levelNames = {
        // 数学
        'math_1a': '数学1A',
        'math_2b': '数学2B',
        'math_3c': '数学3C',
        // 英語語彙
        'vocab_1': '英検1級',
        'vocab_pre1': '英検準1級',
        'vocab_2': '英検2級',
        // 英語リスニング
        'listen_kyotsu': '共通テスト',
        'listen_todai': '東大',
        // 英語文法
        'grammar_4choice': '四択',
        'grammar_correct': '誤文訂正',
        // 物理
        'physics_mechanics': '力学',
        'physics_electric': '電磁気'
    };

    let html = '<div style="display: flex; flex-direction: column; gap: 15px;">';

    sessions.slice(0, 10).forEach(session => {
        const startTime = new Date(session.started_at);
        const endTime = session.ended_at ? new Date(session.ended_at) : null;
        const duration = session.duration_seconds || 0;
        const accuracy = session.total_questions > 0
            ? Math.round((session.correct_questions / session.total_questions) * 100)
            : 0;

        html += `
            <div style="padding: 15px; background: var(--button-bg); border: 2px solid var(--card-border); border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <div>
                        <div style="font-size: 16px; font-weight: 600; color: var(--text-primary);">
                            ${subjectNames[session.subject] || session.subject}
                            ${session.difficulty_level ? ' - ' + (levelNames[session.difficulty_level] || session.difficulty_level) : ''}
                        </div>
                        <div style="font-size: 14px; color: var(--text-secondary); margin-top: 5px;">
                            ${startTime.toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 20px; font-weight: bold; color: ${accuracy >= 80 ? '#27ae60' : accuracy >= 60 ? '#f39c12' : '#e74c3c'};">
                            ${accuracy}%
                        </div>
                        <div style="font-size: 13px; color: var(--text-secondary);">
                            ${session.correct_questions || 0} / ${session.total_questions || 0} 問
                        </div>
                    </div>
                </div>
                ${duration > 0 ? `
                    <div style="font-size: 13px; color: var(--text-secondary);">
                        学習時間: ${Math.floor(duration / 60)}分${duration % 60}秒
                    </div>
                ` : ''}
            </div>
        `;
    });

    html += '</div>';
    historyContainer.innerHTML = html;
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
            window.location.href = '/pages/login.html';
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
