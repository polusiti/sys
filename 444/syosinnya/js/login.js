// ログイン処理
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username) {
        alert('ユーザー名を入力してください');
        return;
    }
    
    // ユーザー情報を保存
    const userData = {
        username: username,
        loginDate: new Date().toISOString(),
        isGuest: false
    };
    
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    // 学習データの初期化（既存データがない場合）
    if (!localStorage.getItem(`studyData_${username}`)) {
        const initialData = {
            totalQuestions: 0,
            correctAnswers: 0,
            studyDays: 1,
            lastStudyDate: new Date().toISOString(),
            subjectProgress: {}
        };
        localStorage.setItem(`studyData_${username}`, JSON.stringify(initialData));
    }
    
    // 科目選択画面へ
    window.location.href = 'subject-select.html';
}

// ゲストログイン
function guestLogin() {
    const userData = {
        username: 'ゲスト',
        loginDate: new Date().toISOString(),
        isGuest: true
    };
    
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    // ゲスト用の学習データ
    if (!localStorage.getItem('studyData_guest')) {
        const initialData = {
            totalQuestions: 0,
            correctAnswers: 0,
            studyDays: 1,
            lastStudyDate: new Date().toISOString(),
            subjectProgress: {}
        };
        localStorage.setItem('studyData_guest', JSON.stringify(initialData));
    }
    
    window.location.href = 'subject-select.html';
}

// ページ読み込み時にログイン状態をチェック
window.addEventListener('DOMContentLoaded', () => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        // 既にログイン済みの場合は科目選択へ
        window.location.href = 'subject-select.html';
    }
});
