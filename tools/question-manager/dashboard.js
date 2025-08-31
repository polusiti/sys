class Dashboard {
    constructor() {
        this.currentUser = null;
        this.stats = {
            totalQuestions: 0,
            activeUsers: 0,
            todayCreated: 0,
            averageDifficulty: 0
        };
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.loadUserInfo();

    checkAuthentication() {
        this.currentUser = AuthenticationSystem.getCurrentUser();
        
        if (!this.currentUser) {
            // 管理者としてリダイレクト
            window.location.href = "login.html";
            return;
        }
        
    }

    loadUserInfo() {
        const userName = document.getElementById("userName");
        const userRole = document.getElementById("userRole");
        const userAvatar = document.getElementById("userAvatar");
        
        if (userName) userName.textContent = this.currentUser.displayName;
        if (userRole) userRole.textContent = this.getRoleDisplayName(this.currentUser.role);
        if (userAvatar) userAvatar.textContent = this.currentUser.displayName.charAt(0);
    }

    getRoleDisplayName(role) {
        const roleNames = {
            "admin": "管理者"
        };
        return roleNames[role] || role;
    }

                }
            }
        });

        if (hasLimitedPermissions && permissionAlert) {
            permissionAlert.style.display = "block";
        }
    }

        return this.permissions.includes(permission);
    }

        return descriptions[permission] || permission;
    }

    async loadStatistics() {
        try {
            // 実際の問題データから統計を計算
            const questions = await this.loadAllQuestions();
            
            this.stats.totalQuestions = questions.length;
            this.stats.activeUsers = this.getActiveUsersCount();
            this.stats.todayCreated = this.getTodayCreatedCount(questions);
            this.stats.averageDifficulty = this.calculateAverageDifficulty(questions);
            
            this.updateStatisticsDisplay();
        } catch (error) {
            console.error("Failed to load statistics:", error);
            this.setDefaultStatistics();
        }
    }

    async loadAllQuestions() {
        const questionFiles = [
            "/data/questions/quiz-choice-questions.json",
            "/data/questions/quiz-f1-questions.json",
            "/data/questions/quiz-f2-questions.json"
        ];

        const allQuestions = [];
        
        for (const file of questionFiles) {
            try {
                const response = await fetch(file);
                if (response.ok) {
                    const questions = await response.json();
                    allQuestions.push(...questions);
                }
            } catch (error) {
                console.warn(`Failed to load ${file}:`, error);
            }
        }
        
        return allQuestions;
    }

    getActiveUsersCount() {
        const accessLog = JSON.parse(localStorage.getItem("access_log") || "[]");
        const oneDayAgo = new Date().getTime() - 24 * 60 * 60 * 1000;
        
        const recentUsers = new Set();
        accessLog.forEach(log => {
            const logTime = new Date(log.time).getTime();
            if (logTime > oneDayAgo) {
                recentUsers.add(log.user);
            }
        });
        
        return recentUsers.size;
    }

    getTodayCreatedCount(questions) {
        const today = new Date().toDateString();
        return questions.filter(q => {
            const createdDate = new Date(q.metadata?.createdAt || 0).toDateString();
            return createdDate === today;
        }).length;
    }

    calculateAverageDifficulty(questions) {
        if (questions.length === 0) return 0;
        
        const totalDifficulty = questions.reduce((sum, q) => sum + (q.difficulty || 1), 0);
        return (totalDifficulty / questions.length).toFixed(1);
    }

    updateStatisticsDisplay() {
        document.getElementById("totalQuestions").textContent = this.stats.totalQuestions;
        document.getElementById("activeUsers").textContent = this.stats.activeUsers;
        document.getElementById("todayCreated").textContent = this.stats.todayCreated;
        document.getElementById("averageDifficulty").textContent = this.stats.averageDifficulty;
    }

    setDefaultStatistics() {
        // デフォルト値を設定（データ読み込み失敗時）
        this.stats = {
            totalQuestions: 16,
            activeUsers: 3,
            todayCreated: 2,
            averageDifficulty: 2.3
        };
        this.updateStatisticsDisplay();
    }

    loadRecentActivity() {
        const activityList = document.getElementById("recentActivity");
        const accessLog = JSON.parse(localStorage.getItem("access_log") || "[]");
        
        if (accessLog.length === 0) {
            return; // デフォルトのアクティビティを表示
        }
        
        // 最新3件のアクティビティを表示
        const recentActivities = accessLog.slice(-3).reverse();
        activityList.innerHTML = recentActivities.map(log => {
            const timeAgo = this.getTimeAgo(new Date(log.time));
            return `
                <li>
                    <span>🔐 ${log.user}がログイン</span>
                    <span class="activity-time">${timeAgo}</span>
                </li>
            `;
        }).join("");
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return "今";
        if (diffMins < 60) return `${diffMins}分前`;
        if (diffHours < 24) return `${diffHours}時間前`;
        return `${diffDays}日前`;
    }

    setupEventListeners() {
        // キーボードショートカット
        document.addEventListener("keydown", (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case "n": // Ctrl+N: 新規問題作成
                        e.preventDefault();
                            this.openQuestionEditor();
                        }
                        break;
                    case "f": // Ctrl+F: 問題検索
                        e.preventDefault();
                            this.openQuestionManager();
                        }
                        break;
                    case "q": // Ctrl+Q: ログアウト
                        e.preventDefault();
                        this.logout();
                        break;
                }
            }
        });
    }

    // ナビゲーションメソッド
    openMobileCreator() {
            return;
        }
        window.location.href = "mobile-creator";
    }

    openQuestionEditor() {
            return;
        }
        window.open("advanced-editor", "_blank");
    }

    openQuestionManager() {
            return;
        }
        window.location.href = "index";
    }

    openBulkImport() {
            return;
        }
        window.open("bulk-import", "_blank", "width=1000,height=800");
    }

    openQuizTest() {
            return;
        }
        window.open("../quiz/index.html", "_blank");
    }

    openAnalytics() {
            return;
        }
        window.open("analytics", "_blank");
    }

        window.open("user-management", "_blank");
    }


    logout() {
        if (confirm("ログアウトしますか？")) {
            AuthenticationSystem.logout();
        }
    }
}

// グローバル関数
let dashboard;

function openMobileCreator() {
    dashboard?.openMobileCreator();
}

function openQuestionEditor() {
    dashboard?.openQuestionEditor();
}

function openQuestionManager() {
    dashboard?.openQuestionManager();
}

function openBulkImport() {
    dashboard?.openBulkImport();
}

function openQuizTest() {
    dashboard?.openQuizTest();
}

function openAnalytics() {
    dashboard?.openAnalytics();
}


function logout() {
    dashboard?.logout();
}

function showHelp() {
    const helpContent = `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
            <h2 style="color: #4f46e5; margin-bottom: 20px;">📖 問題管理システム ヘルプ</h2>
            
            <h3 style="margin-top: 20px; margin-bottom: 10px;">🚀 基本的な使い方</h3>
            <ul style="margin-left: 20px; margin-bottom: 20px;">
                <li><strong>問題作成:</strong> スマホ問題作成または新規問題作成から問題を作成できます</li>
                <li><strong>問題管理:</strong> 問題管理・検索から既存の問題を確認・編集できます</li>
                <li><strong>データ管理:</strong> 一括インポートで大量の問題をまとめて追加できます</li>
                <li><strong>テスト:</strong> クイズテストで作成した問題の動作確認ができます</li>
            </ul>
            
            <h3 style="margin-top: 20px; margin-bottom: 10px;">📱 スマホでの使用方法</h3>
            <ul style="margin-left: 20px; margin-bottom: 20px;">
                <li>「スマホ問題作成」はタッチ操作に最適化されています</li>
                <li>テンプレートを選んでから問題文を入力してください</li>
                <li>数学問題では LaTeX 記法が使用できます（例: \\pi, \\frac{1}{2}）</li>
                <li>PWA として端末にインストールして使用できます</li>
            </ul>
            
            
            <h3 style="margin-top: 20px; margin-bottom: 10px;">💡 ヒント</h3>
            <ul style="margin-left: 20px; margin-bottom: 20px;">
                <li>問題IDは重複しないよう注意してください</li>
                <li>LaTeX記法は CloudLaTeX と同じ形式です</li>
                <li>定期的にバックアップを作成することをお勧めします</li>
                <li>スマホでの作成が最も効率的です</li>
            </ul>
            
            <h3 style="margin-top: 20px; margin-bottom: 10px;">❓ よくある質問</h3>
            <ul style="margin-left: 20px;">
                <li><strong>Q:</strong> 問題が保存されない<br>
                    <strong>A:</strong> ブラウザの設定でLocalStorageが無効になっていないか確認してください</li>
                <li><strong>Q:</strong> LaTeX が表示されない<br>
                    <strong>A:</strong> インターネット接続を確認し、ページを再読み込みしてください</li>
                <li><strong>Q:</strong> PWAとしてインストールしたい<br>
                    <strong>A:</strong> ブラウザのメニューから「ホーム画面に追加」を選択してください</li>
            </ul>
        </div>
    `;
    
    const helpWindow = window.open("", "help", "width=800,height=600,scrollbars=yes,resizable=yes");
    helpWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>ヘルプ - 問題管理システム</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
                h2 { border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
                h3 { color: #374151; }
                ul li { margin-bottom: 8px; }
                strong { color: #1f2937; }
            </style>
        </head>
        <body>
            ${helpContent}
            <div style="text-align: center; margin-top: 30px;">
                <button onclick="window.close()" style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer;">閉じる</button>
            </div>
        </body>
        </html>
    `);
}

function showKeyboardShortcuts() {
    alert(`キーボードショートカット:\\n\\nCtrl+N: 新規問題作成\\nCtrl+F: 問題検索\\nCtrl+Q: ログアウト`);
}

function downloadTemplates() {
    const templates = {
        "math_choice_template": {
            "id": "math-template-001",
            "answerFormat": "A1",
            "subject": "math",
            "topic": "計算問題",
            "difficulty": 2,
            "tags": ["数学", "計算", "基礎"],
            "questionContent": {
                "stem": "次の計算をしなさい。",
                "text": "$\\frac{2}{3} + \\frac{1}{4} = ?$",
                "latex": true,
                "images": []
            },
            "answerData": {
                "type": "multiple-choice",
                "choices": ["$\\frac{3}{7}$", "$\\frac{5}{12}$", "$\\frac{11}{12}$", "$\\frac{8}{12}$"],
                "correctAnswers": [2],
                "closeAnswers": []
            },
            "explanation": {
                "text": "分母を通分してから計算します。\\n$\\frac{2}{3} + \\frac{1}{4} = \\frac{8}{12} + \\frac{3}{12} = \\frac{11}{12}$",
                "latex": true
            },
            "metadata": {
                "estimatedTime": 180,
                "createdAt": new Date().toISOString()
            },
            "active": true
        },
        "english_choice_template": {
            "id": "english-template-001",
            "answerFormat": "A1",
            "subject": "english",
            "topic": "文法",
            "difficulty": 2,
            "tags": ["英語", "文法", "基礎"],
            "questionContent": {
                "stem": "空欄に入る最も適切な語を選びなさい。",
                "text": "I ( ) to the library yesterday.",
                "latex": false,
                "images": []
            },
            "answerData": {
                "type": "multiple-choice",
                "choices": ["go", "goes", "went", "going"],
                "correctAnswers": [2],
                "closeAnswers": []
            },
            "explanation": {
                "text": "yesterday（昨日）があるので過去形を使います。goの過去形はwentです。",
                "latex": false
            },
            "metadata": {
                "estimatedTime": 120,
                "createdAt": new Date().toISOString()
            },
            "active": true
        },
        "science_choice_template": {
            "id": "science-template-001",
            "answerFormat": "A1",
            "subject": "science",
            "topic": "物理",
            "difficulty": 3,
            "tags": ["理科", "物理", "運動"],
            "questionContent": {
                "stem": "物体の運動について答えなさい。",
                "text": "初速度0で自由落下する物体が2秒後に到達する速度は何m/sか。（重力加速度g=10m/s²とする）",
                "latex": false,
                "images": []
            },
            "answerData": {
                "type": "multiple-choice",
                "choices": ["10 m/s", "20 m/s", "30 m/s", "40 m/s"],
                "correctAnswers": [1],
                "closeAnswers": []
            },
            "explanation": {
                "text": "自由落下の速度の公式 v = gt を使用します。\\nv = 10 × 2 = 20 m/s",
                "latex": false
            },
            "metadata": {
                "estimatedTime": 240,
                "createdAt": new Date().toISOString()
            },
            "active": true
        },
        "free_text_template": {
            "id": "freetext-template-001",
            "answerFormat": "F2",
            "subject": "general",
            "topic": "記述問題",
            "difficulty": 3,
            "tags": ["記述", "自由回答"],
            "questionContent": {
                "stem": "以下の質問に自由に答えなさい。",
                "text": "あなたが考える効果的な学習方法について、具体例を挙げて説明してください。",
                "latex": false,
                "images": []
            },
            "answerData": {
                "type": "text",
                "expectedAnswer": "学習方法の例と理由を含む回答",
                "keywords": ["反復", "理解", "実践", "記憶"]
            },
            "explanation": {
                "text": "効果的な学習方法には個人差がありますが、一般的には反復学習、理解重視、実践的な応用などが挙げられます。",
                "latex": false
            },
            "metadata": {
                "estimatedTime": 600,
                "createdAt": new Date().toISOString()
            },
            "active": true
        }
    };

    const zip = {
        "問題テンプレート集.json": JSON.stringify(templates, null, 2),
        "README.txt": `問題テンプレート集

このファイルには以下のテンプレートが含まれています：

1. math_choice_template - 数学4択問題のテンプレート
2. english_choice_template - 英語4択問題のテンプレート  
3. science_choice_template - 理科4択問題のテンプレート
4. free_text_template - 記述式問題のテンプレート

使用方法：
1. 一括インポート機能を使用してテンプレートを読み込み
2. 各テンプレートをコピーして問題文や選択肢を修正
3. 新しいIDを付けて保存

注意事項：
- 問題IDは重複しないよう変更してください
- LaTeX記法はCloudLaTeX形式です（\\pi, \\frac{}{} など）
- 難易度は1-5の範囲で設定してください
`
    };

    // JSONファイルとしてダウンロード
    const blob = new Blob([zip["問題テンプレート集.json"]], {
        type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "問題テンプレート集.json";
    a.click();
    URL.revokeObjectURL(url);

    // README もダウンロード
    setTimeout(() => {
        const readmeBlob = new Blob([zip["README.txt"]], {
            type: "text/plain; charset=utf-8"
        });
        const readmeUrl = URL.createObjectURL(readmeBlob);
        const readmeA = document.createElement("a");
        readmeA.href = readmeUrl;
        readmeA.download = "テンプレート使用方法.txt";
        readmeA.click();
        URL.revokeObjectURL(readmeUrl);
    }, 1000);

    // 成功メッセージを表示
    const toast = document.createElement("div");
    toast.textContent = "📄 テンプレートファイルをダウンロードしました";
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #22c55e;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 9999;
        transform: translateX(100px);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.style.transform = "translateX(0)", 100);
    setTimeout(() => {
        toast.style.transform = "translateX(100px)";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showSystemInfo() {
    const user = AuthenticationSystem.getCurrentUser();
    const info = `システム情報:\\n\\nユーザー: ${user?.displayName}\\nログイン時刻: ${new Date(user?.loginTime).toLocaleString()}\\nブラウザ: ${navigator.userAgent.split(" ")[0]}`;
    alert(info);
}

// 初期化
document.addEventListener("DOMContentLoaded", () => {
    dashboard = new Dashboard();
});
