# 問題解答システム with ユーザー認証

Workers APIを使用した問題解答システムに、ユーザー認証・履歴追跡・コメント機能を追加。

## 🚀 本番環境 (allfrom0.top)

本システムは `allfrom0.top/example` で稼働中です。

## 📋 機能

### 🔐 認証システム
- **シンプルログイン**: ユーザー名のみで認証
- **自動ユーザー作成**: 初回ログイン時に自動でアカウント作成
- **セッション管理**: ログイン状態の維持

### 📊 学習履歴
- **統計追跡**: 総解答数、正解数、正答率を記録
- **リアルタイム更新**: 解答時に即座に統計更新
- **個人ダッシュボード**: ログイン後に学習進捗表示

### 💬 コメント機能
- **問題別コメント**: 各問題に対してコメント投稿可能
- **公開表示**: 全ユーザーのコメントを共有
- **タイムスタンプ**: 投稿日時表示

### 🎯 問題システム
- **R2連携**: Cloudflare R2から問題データ取得
- **複数教科対応**: 英語、日本語、数学
- **難易度選択**: 簡単・普通・難しいから選択
- **音声対応**: 音声ファイル付き問題にも対応

## 🛠 技術スタック

- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript + HTML/CSS
- **Storage**: Cloudflare R2 (via Workers API)
- **Authentication**: シンプルユーザー名ベース
- **Deployment**: allfrom0.top

## 📖 使用方法

1. **アクセス**: `https://allfrom0.top/example`
2. **ログイン**: 任意のユーザー名を入力してログイン
3. **教科選択**: 英語・日本語・数学から選択
4. **設定**: 問題数・難易度を設定
5. **学習開始**: 問題を解答
6. **コメント**: 解答後にコメントを投稿可能

## 🔧 開発・デプロイ

### ローカル開発
```bash
npm install
npm start
# http://localhost:3000 でアクセス
```

### 本番環境設定
- PORT: 3000
- NODE_ENV: production
- Workers API連携設定済み

## 🗂 ファイル構成

```
example/
├── server.js              # メインサーバー
├── public/
│   └── index.html         # フロントエンド UI
├── workers-api-client.js  # R2 API クライアント
├── package.json          # 依存関係
├── .env                  # 環境変数
└── README.md            # このファイル
```

## 🔄 API エンドポイント

### 認証
- `POST /api/auth/login` - ユーザーログイン
- `GET /api/auth/user/:username/stats` - ユーザー統計取得

### 問題・セッション
- `GET /api/subjects` - 教科一覧取得
- `POST /api/session/start` - 学習セッション開始
- `GET /api/session/:id/question/:index` - 問題取得
- `POST /api/session/:id/answer/:index` - 解答送信

### コメント
- `GET /api/questions/:id/comments` - 問題のコメント取得
- `POST /api/questions/:id/comments` - コメント投稿

## 🚀 今後の予定

- **R2データ永続化**: ユーザーデータ・コメントのR2保存
- **詳細統計**: より詳細な学習分析機能
- **認証強化**: 必要に応じてパスワード認証追加
- **モバイル最適化**: スマートフォン対応改善