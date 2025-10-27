# 学習ノート - Learning Notebook

教育用の学習支援Webアプリケーション。複数科目の四択問題を提供し、ユーザーの学習進捗を追跡します。

**🔒 Cloudflare統合版**: パスキー認証、D1データベース、R2ストレージに対応しました。

## 📋 機能

### ユーザー管理
- **パスキー認証**: 生体認証（指紋・顔認証）による安全なログイン（WebAuthn）
- **ユーザー登録**: ユーザーID、表示名、お問い合わせ番号で登録
- **セッション管理**: Cloudflare Workers + D1による安全なセッション管理
- **ゲストモード**: アカウント作成不要で即座に学習開始（LocalStorageのみ）
- **プロフィール管理**: アバター、自己紹介、学習目標の設定
- **アカウント削除**: 全データ削除機能

### 学習システム
- **複数科目対応**:
  - 英語（語彙、リスニング、文法、読解、**英作文添削**）
  - 数学
  - 物理
  - 化学
- **四択問題形式**: ランダム出題、即時フィードバック
- **AI英作文添削**: DeepSeek APIによる自由英作文の添削機能
  - 3段階レベル設定（初級・中級・上級）
  - 3種類文章タイプ（一般・ビジネス・学術）
  - 詳細な添削結果とスコア表示
- **進捗追跡**: 解答数、正答率、学習日数、科目別統計
- **クラウド同期**: 認証済みユーザーはD1データベースで進捗を保存
- **前回の続きから**: 最後に学習した科目・レベルに簡単アクセス

### 実績システム
9種類の実績を収集：
- 最初の一歩（1問）
- 初心者（10問）
- 中級者（50問）
- 上級者（100問）
- マスター（500問）
- 継続は力なり（7日連続）
- 正確無比（正答率80%以上）
- 万能学習者（全科目学習）

### UI/UX
- **ノート風デザイン**: 手書き風の装飾とカジュアルなデザイン
- **ダークモード**: 目に優しい低コントラストテーマ
- **レスポンシブ**: モバイル・タブレット対応
- **PWA対応**: アプリライクな体験

## 🚀 使い方

### Cloudflare統合版（本番環境）

詳細は [`CLOUDFLARE_INTEGRATION_GUIDE.md`](CLOUDFLARE_INTEGRATION_GUIDE.md) を参照してください。

1. **初回セットアップ**:
   ```bash
   # D1データベースにスキーマ適用
   wrangler d1 execute data-manager-auth-db --file=sys/learning-notebook/migration-add-source.sql

   # 問題データを挿入
   wrangler d1 execute data-manager-auth-db --file=sys/learning-notebook/migration-insert-questions.sql

   # Workerをデプロイ
   wrangler deploy cloudflare-auth-worker.js
   ```

2. **ブラウザでアクセス**:
   - パスキーで新規登録
   - 生体認証でログイン
   - 科目を選択して学習開始

### ローカル開発版
1. ブラウザで `index.html` を開く
2. ゲストとして開始
3. 科目を選択して学習開始（LocalStorageに保存）

### デプロイ
- **本番**: Cloudflare Workers + Pages
- **開発**: 静的ホスティング（GitHub Pages、Netlify、Vercel等）

## 📁 ディレクトリ構造

```
learning-notebook/
├── pages/              # HTMLページ
│   ├── login.html      # ログイン画面
│   ├── subject-select.html  # 科目選択
│   ├── english-menu.html    # 英語カテゴリ選択
│   ├── category-detail.html # レベル選択
│   ├── study.html      # 学習画面
│   └── profile.html    # プロフィール
├── js/                 # JavaScript機能
│   ├── login.js        # ログイン処理
│   ├── study.js        # 学習ロジック
│   ├── profile.js      # プロフィール管理
│   ├── category-detail.js  # レベル選択
│   └── theme.js        # テーマ切替
├── css/                # スタイル
│   └── theme-toggle.css  # ダークモードトグル
├── data/               # 問題データ
│   ├── english-vocabulary.js
│   ├── english-listening.js
│   ├── english-grammar.js
│   ├── english-reading.js
│   ├── math.js
│   ├── physics.js
│   └── chemistry.js
├── style.css           # メインスタイル（1967行）
├── index.html          # エントリーポイント
└── README.md           # このファイル
```

## 💾 データ構造

### Cloudflare統合版（認証済みユーザー）
- **D1データベース**:
  - `users`: ユーザー情報（ID、表示名、お問い合わせ番号、ロール）
  - `passkeys`: パスキー情報（credentialId、公開鍵）
  - `sessions`: セッション情報（トークン、有効期限）
  - `questions`: 問題データ（科目、問題文、正解、difficulty等）
  - `user_progress`: 学習進捗（科目別の解答数、正答数）
  - `study_sessions`: 学習セッション（開始/終了時刻、スコア）

- **localStorage**（キャッシュ用）:
  - `sessionToken`: セッショントークン（API認証用）
  - `currentUser`: ユーザー基本情報（キャッシュ）

### ローカル版（ゲストユーザー）
すべてのデータはlocalStorageに保存：
- `currentUser`: 現在のユーザー情報
- `studyData_guest`: 学習データ（問題数、正答数等）
- `profile_guest`: プロフィール情報
- `lastStudy_guest`: 前回の学習情報

### 問題データ形式（D1）
```sql
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  question_text TEXT NOT NULL,
  correct_answer TEXT,
  source TEXT DEFAULT 'learning-notebook',
  word TEXT,              -- 語彙問題用
  is_listening BOOLEAN,   -- リスニング問題フラグ
  difficulty_level TEXT,
  mode TEXT,              -- 'katex' for math
  created_at TEXT,
  active INTEGER DEFAULT 1
);
```

## 🛠️ 技術スタック

### フロントエンド
- **JavaScript**: Vanilla JavaScript（ライブラリ依存なし）
- **認証**: WebAuthn API（パスキー）
- **スタイリング**: カスタムCSS
- **フォント**: Google Fonts（Klee One、Zen Kurenaido）
- **数式**: KaTeX
- **音声**: Web Speech Synthesis API（ダミー実装）

### バックエンド（Cloudflare統合版）
- **サーバー**: Cloudflare Workers（エッジコンピューティング）
- **データベース**: Cloudflare D1（SQLite互換）
- **ストレージ**: Cloudflare R2（将来実装予定）
- **認証**: SimpleWebAuthn（パスキー）
- **セッション**: D1ベースのセッション管理

### 開発ツール
- **デプロイ**: Wrangler CLI
- **バージョン管理**: Git
- **ホスティング**: Cloudflare Pages / Workers

## ⚠️ 注意事項

### セキュリティ
- ✅ パスキー認証による強固なセキュリティ（生体認証）
- ✅ HTTPS必須（localhost除く）
- ✅ CORS設定による不正アクセス防止
- ⚠️ ゲストモードはLocalStorageのみ（ブラウザ内でデータ閲覧可能）

### データ永続性
- ✅ 認証済みユーザー: Cloudflare D1で永続保存
- ⚠️ ゲストユーザー: ブラウザデータ削除で全データ消失

### ブラウザ対応
- パスキー（WebAuthn）対応ブラウザが必要:
  - Chrome 67+
  - Safari 13+
  - Firefox 60+
  - Edge 18+
- 生体認証デバイス（指紋リーダー、Face ID等）推奨

## 🎯 実装完了機能

### ✅ 完了
- パスキー認証（登録・ログイン）
- D1データベース統合
- 問題データAPI（80問）
- 学習進捗クラウド同期
- セッション管理
- ゲストモード（LocalStorage）

### 🚧 実装中
- R2ストレージ統合（音声・画像）
- 問題データ拡充（各科目100問以上）

### 📝 将来の改善予定

#### 優先度: 高
- R2ストレージで音声ファイル管理
- 問題データ拡充（各科目100問以上）
- エラーハンドリング改善
- ローディング表示追加

#### 優先度: 中
- Service Worker（オフライン対応）
- 連続正解カウントシステム
- 学習履歴グラフ（Chart.js）
- 復習機能（間違えた問題優先）

#### 優先度: 低
- 多言語対応（i18n）
- ソーシャル機能（ランキング、友達機能）
- ユーザー作成システム（問題投稿・承認フロー）
- メール通知機能

## 📖 開発背景

`risou.md`に記載された理想に基づき、以下を実現しています：
- ✅ D1データベースによるデータ永続化
- 🚧 R2ストレージでのメディア管理（将来実装）
- 🚧 ユーザー作成システム（問題投稿・承認フロー）（将来実装）
- ✅ PWA配信（アプリストア非依存）
- ✅ 収益モデルなし（副次サービスで対応）
- ✅ パスキー認証による安全なログイン
- ✅ 退会機能とデータ削除機能

## 📊 コードメトリクス

- **総ファイル数**: 25+
- **主要JSファイル**: 6個（約800行）
  - `login.js`: 244行（パスキー認証）
  - `study.js`: 366行（問題取得・学習ロジック）
  - `profile.js`: 200行（進捗表示）
- **CSSファイル**: style.css 1967行
- **HTMLページ**: 6個
- **データファイル**:
  - 問題データJS: 7個（削除予定）
  - SQLマイグレーション: 2個
- **APIエンドポイント**: 5個
  - GET `/api/note/questions`
  - GET/POST `/api/note/progress`
  - POST `/api/note/session/start`
  - POST `/api/note/session/end`

## 🔗 関連ドキュメント

- [`CLOUDFLARE_INTEGRATION_GUIDE.md`](CLOUDFLARE_INTEGRATION_GUIDE.md) - Cloudflare統合の詳細手順
- [`migration-add-source.sql`](migration-add-source.sql) - D1スキーマ拡張
- [`migration-insert-questions.sql`](migration-insert-questions.sql) - 問題データ移行
- [`../risou.md`](../risou.md) - プロジェクトの理想と方向性
- [`../cloudflare/README.md`](../cloudflare/README.md) - Cloudflare設定

## 📄 ライセンス

このプロジェクトは教育目的で作成されています。

## 🤝 貢献

問題データの追加、バグ修正、機能改善のプルリクエストを歓迎します。

特に以下の貢献を求めています：
- 問題データの拡充（各科目100問以上）
- 新しい科目の追加
- UI/UXの改善提案
- バグ報告

---

**更新日**: 2025-10-16
**バージョン**: 2.0 (Cloudflare統合版)
🤖 Generated with [Claude Code](https://claude.com/claude-code)
