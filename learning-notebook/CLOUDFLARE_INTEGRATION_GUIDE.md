# Learning Notebook - Cloudflare統合ガイド

## 📋 実装完了内容

### 1. Cloudflare Worker API実装
**ファイル**: `/home/higuc/cloudflare-auth-worker.js`

以下のエンドポイントを追加しました：

#### 学習データ取得
- `GET /api/note/questions?subject=X&level=Y&limit=N`
  - D1データベースから問題を取得
  - パラメータ:
    - `subject`: 科目名 (english-vocabulary, math, physics等)
    - `level`: 難易度 (オプション)
    - `limit`: 取得件数 (デフォルト100, 最大500)

#### ユーザー進捗管理
- `GET /api/note/progress?subject=X`
  - ユーザーの学習進捗を取得
  - 認証必須 (Authorizationヘッダー)

- `POST /api/note/progress`
  - 学習進捗を保存
  - Body: `{ subject, total_questions, correct_answers }`

#### 学習セッション管理
- `POST /api/note/session/start`
  - 学習セッション開始
  - Body: `{ subject, level }`

- `POST /api/note/session/end`
  - 学習セッション終了
  - Body: `{ sessionId, score, total_questions, duration_minutes }`

### 2. データベーススキーマ拡張

#### migration-add-source.sql
**ファイル**: `/home/higuc/sys/learning-notebook/migration-add-source.sql`

既存のquestionsテーブルに以下のカラムを追加：
- `source TEXT` - データソース識別子 ('learning-notebook', 'testapp', 'data-repo')
- `word TEXT` - 語彙問題用の単語フィールド
- `is_listening BOOLEAN` - リスニング問題フラグ

インデックスとビューも作成：
- `idx_questions_source_subject` - source + subject + active
- `idx_questions_source_difficulty` - source + difficulty + active
- `note_questions_view` - learning-notebook問題用ビュー
- `note_user_progress_view` - ユーザー進捗用ビュー

#### migration-insert-questions.sql
**ファイル**: `/home/higuc/sys/learning-notebook/migration-insert-questions.sql`

合計80問のデータをINSERT：
- 英語単語（english-vocabulary）: 15問
- 英文法（english-grammar）: 10問
- 英語リスニング（english-listening）: 10問
- 数学（math）: 15問
- 物理（physics）: 15問
- 化学（chemistry）: 15問

### 3. フロントエンド実装

#### login.js
**ファイル**: `/home/higuc/sys/learning-notebook/js/login.js`

- パスキー認証実装（WebAuthn API）
- 新規ユーザー登録フロー
  1. ユーザー情報登録 (`/api/auth/register`)
  2. パスキー登録開始 (`/api/auth/passkey/register/begin`)
  3. ブラウザでクレデンシャル作成
  4. パスキー登録完了 (`/api/auth/passkey/register/complete`)

- ログインフロー
  1. パスキーログイン開始 (`/api/auth/passkey/login/begin`)
  2. ブラウザでクレデンシャル取得
  3. パスキーログイン完了 (`/api/auth/passkey/login/complete`)
  4. セッショントークン保存

- ゲストログイン機能（LocalStorageのみ）

#### study.js
**ファイル**: `/home/higuc/sys/learning-notebook/js/study.js`

- APIから問題データを取得（`/api/note/questions`）
- ローカルのJavaScriptファイル参照を削除
- 学習セッション開始・終了処理
- 進捗保存をAPI経由に変更（認証済みユーザー）
- ゲストユーザーはLocalStorageに保存

#### profile.js
**ファイル**: `/home/higuc/sys/learning-notebook/js/profile.js`

- APIから進捗データを取得（`/api/note/progress`）
- 科目別進捗をAPI形式から変換
- ゲストユーザーはLocalStorageから取得
- 実績・統計表示

## 🚀 デプロイ手順

### 1. D1データベースのセットアップ

```bash
# 1. D1データベースが存在することを確認
wrangler d1 list

# 2. スキーマ拡張を適用
wrangler d1 execute data-manager-auth-db --file=sys/learning-notebook/migration-add-source.sql

# 3. 問題データを挿入
wrangler d1 execute data-manager-auth-db --file=sys/learning-notebook/migration-insert-questions.sql

# 4. データが正しく挿入されたか確認
wrangler d1 execute data-manager-auth-db --command="SELECT COUNT(*), source FROM questions GROUP BY source"
```

### 2. Cloudflare Workerのデプロイ

```bash
# Workerをデプロイ
wrangler deploy cloudflare-auth-worker.js

# デプロイ後、エンドポイントURLを確認
# 例: https://data-manager-auth.higuc.workers.dev
```

### 3. API Base URLの設定

以下のファイルでAPI_BASE_URLを本番環境のURLに更新：

1. `/home/higuc/sys/learning-notebook/js/login.js:2`
2. `/home/higuc/sys/learning-notebook/js/study.js:2`
3. `/home/higuc/sys/learning-notebook/js/profile.js:2`

```javascript
// 本番環境のWorker URLに変更
const API_BASE_URL = 'https://data-manager-auth.higuc.workers.dev';
```

### 4. HTMLファイルの更新（必要に応じて）

login.htmlに登録フォームとログインフォームの切り替えUIが必要です：

```html
<!-- 登録フォーム -->
<form id="registerForm" style="display: none;">
    <input type="text" id="userId" placeholder="ユーザーID" required>
    <input type="text" id="displayName" placeholder="表示名" required>
    <input type="text" id="inquiryNumber" placeholder="お問い合わせ番号" required>
    <button type="submit" onclick="handleRegister(event)">パスキーで登録</button>
    <button type="button" onclick="showLoginForm()">ログインへ戻る</button>
</form>

<!-- ログインフォーム -->
<form id="loginForm">
    <input type="text" id="loginUserId" placeholder="ユーザーID" required>
    <button type="submit" onclick="handleLogin(event)">パスキーでログイン</button>
    <button type="button" onclick="showRegisterForm()">新規登録</button>
    <button type="button" onclick="guestLogin()">ゲストとして続ける</button>
</form>
```

## 🧪 テスト手順

### 1. データベース確認

```bash
# 問題データが正しく挿入されているか確認
wrangler d1 execute data-manager-auth-db --command="SELECT id, subject, title FROM questions WHERE source='learning-notebook' LIMIT 5"

# ユーザーテーブル確認
wrangler d1 execute data-manager-auth-db --command="SELECT * FROM users LIMIT 5"
```

### 2. API動作確認

```bash
# 問題取得テスト
curl "https://data-manager-auth.higuc.workers.dev/api/note/questions?subject=math&limit=5"

# ヘルスチェック
curl "https://data-manager-auth.higuc.workers.dev/api/health"
```

### 3. フロントエンド動作確認

1. **パスキー登録テスト**
   - ブラウザでlogin.htmlを開く
   - 「新規登録」を選択
   - ユーザー情報を入力
   - パスキー登録プロンプトが表示されることを確認
   - 登録完了後、ログイン画面に戻ることを確認

2. **パスキーログインテスト**
   - 登録したユーザーIDでログイン
   - パスキー認証プロンプトが表示されることを確認
   - 認証成功後、科目選択画面に遷移することを確認

3. **学習機能テスト**
   - 科目を選択
   - 問題がAPI経由で読み込まれることを確認（開発者ツールのNetworkタブ）
   - 問題に解答
   - 進捗が保存されることを確認

4. **プロフィールテスト**
   - プロフィール画面を開く
   - 進捗データがAPI経由で表示されることを確認
   - 科目別進捗が正しく表示されることを確認

### 4. ゲストモードテスト

1. ゲストログイン
2. 問題が正常に表示されることを確認
3. 進捗がLocalStorageに保存されることを確認

## 📝 重要な変更点

### LocalStorageの使用方法変更

**認証済みユーザー**:
- `sessionToken`: セッショントークン（API認証用）
- `currentUser`: 基本ユーザー情報（キャッシュ用）

**ゲストユーザー**:
- `currentUser`: { id: 'guest', isGuest: true, ... }
- `studyData_guest`: 学習進捗データ（LocalStorage保存）

### API認証

認証が必要なエンドポイントには以下のヘッダーが必要：
```javascript
headers: {
    'Authorization': `Bearer ${sessionToken}`,
    'Content-Type': 'application/json'
}
```

### CORS設定

Worker側で以下のオリジンを許可しています：
- `https://data.allfrom0.top`
- `https://polusiti.github.io`
- `http://localhost:3000`
- `http://127.0.0.1:5500`

追加が必要な場合は環境変数 `ALLOWED_ORIGINS` で設定可能です。

## 🔧 トラブルシューティング

### パスキーが動作しない
- HTTPSが必須です（localhost除く）
- ブラウザがWebAuthnをサポートしているか確認
- デバイスに生体認証またはPINが設定されているか確認

### APIエラー: "Origin not allowed"
- CORS設定を確認
- フロントエンドのオリジンがWorkerの許可リストに含まれているか確認

### 問題データが表示されない
- D1にデータが正しく挿入されているか確認
- API_BASE_URLが正しいか確認
- ネットワークタブでAPIリクエストのステータスを確認

### 進捗が保存されない
- セッショントークンが有効か確認（`/api/auth/me`でテスト）
- API呼び出し時に認証ヘッダーが含まれているか確認

## 📚 次のステップ

1. **UI/UX改善**
   - パスキー登録・ログインのガイダンス追加
   - ローディング表示の追加
   - エラーハンドリングの強化

2. **機能追加**
   - 問題のお気に入り機能
   - 学習統計のグラフ表示
   - 友達機能・ランキング

3. **パフォーマンス最適化**
   - 問題データのキャッシング
   - プリフェッチの実装
   - Service Worker導入

4. **セキュリティ強化**
   - レート制限の実装
   - セッションタイムアウトの調整
   - CSRF対策

## 🎯 完了チェックリスト

- [x] Cloudflare Worker APIエンドポイント実装
- [x] D1スキーマ拡張
- [x] 問題データ移行スクリプト作成
- [x] login.js - パスキー認証実装
- [x] study.js - API連携実装
- [x] profile.js - API連携実装
- [x] login.html - パスキー認証UI実装
- [x] study.html - 古いデータファイル参照削除
- [ ] D1データベースにスキーマ適用
- [ ] D1データベースに問題データ挿入
- [ ] Cloudflare Workerデプロイ
- [ ] 動作テスト実施
- [ ] 本番環境デプロイ

---

**作成日**: 2025-10-16
**バージョン**: 1.0
**担当**: Claude Code
