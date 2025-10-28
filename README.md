# 学習ノート - Learning Notebook

教育用Webアプリケーション。AI英作文添削機能が中心。

## 🚀 主な機能

- ✅ **AI英作文添削** - Workers AIを使用した文法添削
- 🔐 **パスキー認証** - 生体認証で安全なログイン
- 📚 **学習管理** - 進捗トラッキングと学習履歴
- 🎨 **シンプルUI** - 直感的で美しいインターフェース

## 📁 ファイル構成

```
/
├── index.html                 # トップページ（リダイレクト）
├── pages/                     # HTMLページ
│   ├── login.html            # ログインページ
│   ├── subject-select.html   # 科目選択
│   ├── eisakujikken.html      # 英作文添削（メイン機能）
│   └── ...                   # その他学習ページ
├── js/                        # JavaScriptファイル
│   ├── eisakujikken.js       # 英作文添削メインロジック
│   ├── theme.js              # テーマ切り替え
│   └── login.js              # 認証処理
├── css/                       # スタイルシート
│   ├── style.css             # メインスタイル
│   └── theme-toggle.css      # テーマ切り替えUI
├── sql/                       # SQLファイル
│   ├── grammar-examples.sql  # 文法例文データ
│   └── migration-*.sql      # データベースマイグレーション
├── md/                        # ドキュメント
│   ├── README.md              # プロジェクト概要
│   ├── DEPLOY_GUIDE.md        # デプロイガイド
│   └── ...                   # その他技術ドキュメント
└── workers/                   # Cloudflare Workers
    └── (デプロイ用Workerファイル)
```

## 🤖 AI技術スタック

- **Cloudflare Workers AI** - Llama 3.1 8Bモデル
- **RAG機能** - D1データベースに文法例文を保存
- **マーカー表示** - 修正箇所を視覚的に明示
- **完全内包** - 外部APIなし、Cloudflare内完結

## 🚀 デプロイ

### Cloudflare Workers
```bash
wrangler deploy --config grammar-wrangler.toml
```

### Cloudflare Pages
```bash
# ファイルをルートディレクトリに配置
# 自動デプロイ有効化
```

## 📊 APIエンドポイント

- `https://grammar-worker.t88596565.workers.dev/api/v2/grammar` - 英作文添削API

## 🔧 開発環境

```bash
# ローカルテスト
python -m http.server 8000

# Workersテスト
wrangler dev

# D1データベース操作
wrangler d1 execute grammar-examples --file=sql/grammar-examples.sql
```

## 📝 使い方

1. **ログイン**: パスキーまたはゲストとしてアクセス
2. **科目選択**: 英作文添削を選択
3. **文章入力**: 添削したい英文を入力
4. **結果確認**: 修正箇所がマーカーで表示される

## 🤝 貢献

機能改善やバグ修正は歓迎します。プルリクエストを作成してください。

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)