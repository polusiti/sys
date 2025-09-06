# 語彙学習システム with ユーザー認証・コメント機能

English Vocabulary Practice System - R2統合・ユーザー認証・公開コメント機能搭載

## 🚀 本番環境

**URL**: `https://allfrom0.top/example`  
**システム**: 英語語彙力向上のための4択問題練習システム

## 🎯 主要機能

### 📚 語彙学習システム
- **4択問題**: 英単語の意味を4つの選択肢から選択
- **レベル別学習**: Level 1-4の段階的学習
- **R2データ連携**: Cloudflare R2から最新の語彙問題を取得
- **フォールバック**: R2接続失敗時の静的問題データ

### 🔐 ユーザー認証
- **シンプルログイン**: ユーザー名のみでアクセス
- **自動ユーザー作成**: 初回ログイン時に自動でアカウント作成
- **学習履歴追跡**: 個別ユーザーの学習進捗管理

### 💬 公開コメントシステム
- **問題別コメント**: 各語彙問題にコメント投稿可能
- **公開共有**: 全ユーザーのコメントを表示
- **学習サポート**: ユーザー間での学習支援

### 📊 学習統計
- **リアルタイム統計**: 正解数・正答率・セッション統計
- **個人ダッシュボード**: ユーザー別学習進捗表示
- **セッション管理**: 複数問の連続学習セッション

## 🛠 技術仕様

### バックエンド
- **Node.js + Express**: API サーバー
- **R2統合**: Workers API Client経由でR2データアクセス
- **語彙問題特化**: 選択肢ベースの解答検証システム

### フロントエンド
- **選択肢UI**: クリックして選択する直感的インターフェース
- **視覚的フィードバック**: 正解・不正解の色分け表示
- **レスポンシブ**: PC・スマートフォン対応

### データストレージ
- **Cloudflare R2**: 語彙問題データの永続化
- **Workers API**: `https://questa-r2-api.t88596565.workers.dev/api`
- **questaバケット**: 全問題データを統一管理

## 📖 使用方法

### 1. システムアクセス
```
https://allfrom0.top/example
```

### 2. ログイン・学習開始
1. **ユーザーID入力**: 任意のユーザー名でログイン
2. **難易度選択**: easy(Level 1) / medium(Level 2) / hard(Level 3,4)
3. **問題数設定**: 5問・10問・20問・30問から選択
4. **学習開始**: ランダム出題された語彙問題を解答

### 3. 問題形式例
```
「book」の意味として最も適切なものを選びなさい。

book

A. 本
B. 机  
C. 椅子
D. 鉛筆

正解: A. 本
解説: bookは「本、書物」という意味です
```

## 🔄 API エンドポイント

### 認証系
- `POST /api/auth/login` - ユーザーログイン・作成
- `GET /api/auth/user/:username/stats` - ユーザー学習統計

### 学習システム
- `GET /api/subjects` - 語彙問題統計取得
- `POST /api/session/start` - 学習セッション開始
- `GET /api/session/:id/question/:index` - 語彙問題取得
- `POST /api/session/:id/answer/:index` - 解答送信・採点

### コメント機能
- `GET /api/questions/:id/comments` - 問題コメント取得
- `POST /api/questions/:id/comments` - コメント投稿

## 🗂 システム構成

```
example/
├── server.js                    # メインサーバー (語彙問題対応)
├── workers-api-client.js       # R2 API クライアント (語彙特化)
├── public/
│   └── index.html              # 学習インターフェース
├── package.json                # Node.js依存関係
└── README.md                  # このファイル
```

## 📊 学習データ仕様

### R2語彙問題フォーマット
```json
{
  "id": "vocab_lev1_1",
  "question": "bookの意味として最も適切なものを選びなさい",
  "word": "book",
  "choices": ["本", "机", "椅子", "鉛筆"],
  "correctAnswer": 0,
  "explanation": "bookは「本、書物」という意味です",
  "level": 1,
  "type": "vocabulary"
}
```

### 内蔵フォールバックデータ
- **Level 1**: book, apple, school など基本単語
- **Level 2**: important, difficult など中級単語
- **拡張性**: R2に新問題をアップロードして自動反映

## 🚀 開発・デプロイ

### ローカル開発
```bash
npm install
npm start
# http://localhost:3000 でアクセス
```

### 本番環境
- **PORT**: 3000
- **NODE_ENV**: production
- **R2統合**: questa-r2-api Workers連携済み
- **認証**: questa-admin-2024 token

## 🌟 english/vocabulary/pra との統一

このシステムは `english/vocabulary/pra` と同じアーキテクチャを採用：

1. **語彙問題特化**: 4択選択肢による語彙学習
2. **R2優先取得**: まずR2から最新データ、失敗時はフォールバック
3. **レベル別管理**: lev1-lev4の段階的学習システム
4. **統一Workers API**: 同じエンドポイント・認証トークン使用

## 🔮 今後の拡張

- **音声機能**: 発音問題・リスニング対応
- **詳細分析**: 弱点分析・学習推奨機能
- **R2完全統合**: ユーザーデータ・コメントのR2永続化
- **認証強化**: 必要に応じてセキュリティ強化

---

**専用システム**: このシステムは英語語彙学習に特化して最適化されています。