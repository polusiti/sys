# システム統合ガイド

## 🚀 システム概要

allfrom0.topで稼働する学習システムの完全統合ガイド。mana管理画面から学習システムまで、全ての機能と設定を網羅。

## 📁 プロジェクト構成

```
sys/ (ルート)
├── pages/                    # アプリケーションページ
│   ├── login.html
│   ├── subject-select.html
│   ├── english-menu.html
│   ├── study.html
│   └── mana/                 # 管理画面
│       ├── index.html
│       ├── english-listening/
│       ├── english-vocabulary/
│       ├── english-grammar/
│       ├── math/
│       ├── physics/
│       └── chemistry/
├── js/                       # JavaScript
├── css/                      # スタイルシート
├── docs/                     # ドキュメント (統合済)
├── _redirects               # Cloudflare Pages 設定
└── _headers                 # セキュリティ設定
```

---

## 🛠️ デプロイと設定

### Cloudflare Pages デプロイ

#### 1. 準備
```bash
cd /home/higuc/sys
git add -A
git commit -m "デプロイ準備完了"
git push origin main
```

#### 2. Cloudflare Pages 設定
1. **Dashboard** → **Pages** → **Create a project**
2. GitHubリポジトリ: `polusiti/sys`
3. **Build settings**:
   - Production branch: `main`
   - Build command: (空欄)
   - Build output directory: `/`
   - Root directory: (空欄)

#### 3. カスタムドメイン
- `allfrom0.top` を設定

### API設定

#### Cloudflare Workers (AutoRAG + DeepSeek)
```bash
# 1. プロジェクト初期化
npx wrangler init autorag-worker --yes

# 2. シークレット設定
wrangler secret put DEEPSEEK_API_KEY
wrangler secret put CF_API_TOKEN

# 3. デプロイ
wrangler deploy
```

#### D1データベース
- エンドポイント: `https://questa-r2-api.t88596565.workers.dev`
- 認証: ADMIN_TOKEN

---

## 🎯 Mana管理システム

### 科目別管理画面
- **英語リスニング**: passage形式、音声ファイル対応
- **英単語**: 自動選択肢生成
- **英文法**: 4/5選択肢トグル
- **数学**: KaTeX数式サポート、ライブプレビュー
- **物理**: 科学数式対応
- **化学**: 化学式対応

### 共通機能
- CRUD操作 (作成・読取・更新・削除)
- リアルタイムプレビュー
- API連携 (D1 SQLite)
- 難易度・カテゴリ分類

### 実装状況
- ✅ APIエンドポイント (CRUD完了)
- ✅ 全6科目の基本画面
- ⚠️ 編集機能 (3科目のみ実装)
- ❌ フィルタリング機能
- ❌ バルク操作

---

## 🎓 学習システム

### 機能一覧
- 科目選択
- 問題表示 (KaTeX対応)
- 音声再生 (R2連携)
- passageモード (リスニング)
- 学習履歴

### API連携
- manaで作成した問題を自動取得
- R2音声ファイル再生
- リアルタイム更新

---

## 📊 統合状況

### 完了済み
- [x] API連携 (POST/GET/PUT/DELETE)
- [x] mana画面全6科目
- [x] 学習システム表示
- [x] 数式レンダリング (KaTeX)
- [x] 音声ファイル再生

### 要実装
- [ ] 残り3科目の編集機能
- [ ] フィルタリング機能
- [ ] エラーハンドリング改善
- [ ] バルク操作
- [ ] 学習履歴連携

---

## 🔧 API仕様

### 問題管理
```javascript
// 作成
POST /api/note/questions
{
  "subject": "math",
  "title": "問題タイトル",
  "question_text": "$x^2 + 2x + 1 = 0$ の解は？",
  "correct_answer": "$x = -1$",
  "difficulty_level": "medium",
  "tags": ["algebra"]
}

// 取得
GET /api/note/questions?subject=math&limit=10

// 更新
PUT /api/note/questions/{id}

// 削除
DELETE /api/note/questions/{id}
```

### 音声管理
```javascript
// アップロード (リスニング問題)
POST /api/upload/audio
FormData: audio file

// レスポンス
{
  "url": "https://pub-xxx.r2.dev/audio/...",
  "filename": "audio_file.mp3"
}
```

---

## 🔒 セキュリティ設定

### _headers
```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: no-referrer-when-downgrade
```

### 認証
- ADMIN_TOKEN (ハードコード、要改善)
- DeepSeek API Key
- Cloudflare AI Search Token

---

## 💰 コスト最適化

### Cloudflare料金
- **Pages**: 無料 tier
- **Workers**: 無料 tier (100,000リクエスト/日)
- **D1**: 無料 tier (5GB)
- **R2**: $0.015/GB/月 + 操作料

### 最適化策
- CDNキャッシュ活用
- データ圧縮
- レート制限
- 自動クリーンアップ

---

## 🚨 トラブルシューティング

### 一般問題
1. **API接続エラー**: トークン確認
2. **画面表示問題**: パス確認
3. **音声再生問題**: R2 URL確認

### デプロイ問題
1. **ビルド失敗**: 設定確認
2. **DNS問題**: ドメイン設定確認
3. **パーミッション**: トークン権限確認

---

## 📈 モニタリング

```bash
# Workerログ
wrangler tail

# D1使用量
cloudflare d1 database info

# R2使用量
cloudflare r2 bucket stats
```

---

## 🎯 次期開発

### 短期目標
1. ブラウザ動作検証
2. 編集機能拡充
3. フィルタリング実装
4. エラーハンドリング改善

### 中期目標
1. バルク操作機能
2. 学習履歴連携
3. パフォーマンス制御
4. 分析機能

### 長期目標
1. 多言語対応
2. インポート/エクスポート
3. リアルタイム更新
4. モバイルアプリ

---

## ⚠️ 既知のエラーと対策

### 🚨 緊急エラー対応

#### APIエラー (過去の実績)
```bash
# エラー例1: API URL不一致
❌ https://questa-r2-api-fixed.t88596565.workers.dev
✅ https://questa-r2-api.t88596565.workers.dev

# エラー例2: POSTデータ形式不正
❌ {"title": "テスト"}  # 必須項目不足
✅ {"id": "test_123", "subject": "math", "title": "テスト", ...}
```

#### Mana画面エラー
```javascript
// エラー: 編集機能が未実装
if (editFunction === "開発中です") {
  console.log("実装が必要な科目: 物理・化学・リスニング");
}
```

### 🔍 エラー検出方法

#### 1. ブラウザコンソール
```javascript
// Mana画面で確認すべきエラー
- TypeError: Cannot read property 'id' of undefined
- NetworkError: Failed to fetch
- ReferenceError: function is not defined
```

#### 2. APIテスト
```bash
# 健全性チェック
curl -X GET "https://questa-r2-api.t88596565.workers.dev/api/note/questions?subject=math&limit=1"

# POSTテスト
curl -X POST "https://questa-r2-api.t88596565.workers.dev/api/note/questions" \
  -H "Content-Type: application/json" \
  -d '{"id":"test","subject":"math","title":"テスト","question_text":"1+1=","correct_answer":"2"}'
```

#### 3. ローカルテスト
```bash
# 静的ファイルチェック
python3 -m http.server 8000
# http://localhost:8000/pages/mana/index.html
```

---

## 🛡️ 未来のミス予防策

### 📋 開発チェックリスト

#### デプロイ前確認
- [ ] APIベースURLの正確性を確認
- [ ] 全ページの表示をテスト
- [ ] mana管理画面のCRUD操作を確認
- [ ] 音声ファイル再生をテスト
- [ ] 数式表示（KaTeX）を確認
- [ ] レスポンシブデザインを確認

#### コード変更時
- [ ] 既存機能の回帰テスト
- [ ] APIエンドポイントの変更を反映
- [ ] 環境変数の設定を確認
- [ ] エラーハンドリングの実装
- [ ] ログ出力の追加

### 🔒 セキュリティ予防策

#### 認証関連
```javascript
// ❌ 脆弱な実装 (現在)
const ADMIN_TOKEN = "hardcoded_token";

// ✅ 安全な実装 (今後)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
// または
const token = await getSecureToken();
```

#### APIセキュリティ
```javascript
// レート制限の実装例
const rateLimit = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const requests = rateLimit.get(ip) || [];
  const recent = requests.filter(t => now - t < 60000);

  if (recent.length > 100) return false;

  recent.push(now);
  rateLimit.set(ip, recent);
  return true;
}
```

### 🔄 変更管理

#### Git運用ルール
```bash
# ブランチ命名規則
feature/mana-edit-physics     # 新機能
fix/api-url-correction        # バグ修正
docs/update-system-guide      # ドキュメント更新

# コミットメッセージ規則
feat: add physics edit function
fix: correct API base URL
docs: update troubleshooting section
refactor: improve error handling
```

#### バージョン管理
```javascript
// package.json
{
  "version": "3.0.0",
  "scripts": {
    "test": "npm run test:api && npm run test:ui",
    "test:api": "node scripts/test-api.js",
    "test:ui": "node scripts/test-ui.js"
  }
}
```

### 🚨 エラーハンドリング実装

#### グローバルエラー処理
```javascript
// 全てのmana画面に実装
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  // エラーログをサーバーに送信
  sendErrorLog({
    error: e.error.message,
    url: window.location.href,
    timestamp: new Date().toISOString()
  });
});

// APIエラーハンドリング
async function apiCall(url, options) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    showErrorNotification(`通信エラー: ${error.message}`);
    throw error;
  }
}
```

#### Mana画面共通エラー処理
```javascript
// mana-base.js (全mana画面で読み込み)
class ManaErrorHandler {
  static showError(message, details = null) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'mana-error';
    errorDiv.innerHTML = `
      <h3>⚠️ エラーが発生しました</h3>
      <p>${message}</p>
      ${details ? `<details><summary>詳細</details><pre>${details}</pre></details>` : ''}
      <button onclick="this.parentElement.remove()">閉じる</button>
    `;
    document.body.appendChild(errorDiv);
  }

  static async safeApiCall(func, fallback = null) {
    try {
      return await func();
    } catch (error) {
      this.showError(`API通信に失敗しました`, error.message);
      return fallback;
    }
  }
}
```

### 📊 監視とアラート

#### ログ収集
```javascript
// 簡易的なエラーログ収集
function collectError(error, context) {
  const logData = {
    error: error.message,
    stack: error.stack,
    context: {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      ...context
    }
  };

  // 本番環境のみログ送信
  if (window.location.hostname !== 'localhost') {
    // エラーログ送信API (未実装)
    // fetch('/api/logs/error', { method: 'POST', body: JSON.stringify(logData) });
    console.log('Error log:', logData);
  }
}
```

---

## 🎯 緊急時対応フロー

### サイトダウン時
1. **即時確認**: Cloudflare DashboardでPages/Workersの状態確認
2. **ログ確認**: `wrangler tail`でエラーを特定
3. **ロールバック**: `git revert`で直前の正常状態に戻す
4. **修正デプロイ**: 問題修正後、再デプロイ
5. **監視強化**: 1時間は頻繁に状態を確認

### APIエラー時
1. **エンドポイント確認**: curlでAPI応答をテスト
2. **データベース確認**: D1コンソールでデータ状態を確認
3. **トークン確認**: 環境変数が正しく設定されているか確認
4. **Worker再デプロイ**: `wrangler deploy`でWorkerを更新

---

**最終更新**: 2025-10-31
**バージョン**: v3.0 (エラー予防策追加版)
**担当者**: システム管理者