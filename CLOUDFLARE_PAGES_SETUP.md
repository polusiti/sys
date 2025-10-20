# Cloudflare Pages Deployment Guide

## ✅ 完了: learning-notebookをルートに移動しました

### 新しいファイル構造

```
sys/ (リポジトリルート)
├── index.html           # 学習ノートのエントリーポイント
├── pages/               # アプリケーションページ
│   ├── login.html
│   ├── subject-select.html
│   ├── english-menu.html
│   ├── category-detail.html
│   ├── study.html
│   └── profile.html
├── js/                  # JavaScript
│   ├── login.js
│   ├── study.js
│   ├── profile.js
│   ├── category-detail.js
│   └── theme.js
├── css/                 # スタイルシート
├── data/                # 問題データ
├── mana/                # 管理UI
├── style.css            # メインCSS
├── _redirects           # Cloudflare Pages リダイレクト
├── _headers             # セキュリティヘッダー
└── cloudflare-worker-learning-notebook-complete.js  # API Worker

tools/ (アーカイブ)
└── old-math-creator-index.html
```

## 🚀 デプロイ手順

### 1. GitHub にプッシュ

```bash
cd /home/higuc/sys
git add -A
git commit -m "🎯 Restructure: Move learning-notebook to root for allfrom0.top

- Move all learning-notebook contents to repository root
- Simplify _redirects and _headers configuration
- Remove learning-notebook directory
- Archive old files to tools/
- Direct access: allfrom0.top → learning notebook app"

git push origin main
```

### 2. Cloudflare Pages 設定

1. **Cloudflare Dashboard** → **Pages** → **Create a project**
2. GitHub リポジトリ接続: `polusiti/sys`
3. **Build settings**:
   ```
   Project name: allfrom0-learning-notebook
   Production branch: main
   Build command: (空欄)
   Build output directory: / (または . または空欄)
   Root directory: (空欄)
   ```

### 3. カスタムドメイン設定

1. Pages プロジェクト → **Custom domains**
2. **`allfrom0.top`** を追加
3. DNS が自動設定されます

### 4. 動作確認

```bash
# ルートアクセス → ログインページへリダイレクト
curl -L https://allfrom0.top/

# APIヘルスチェック
curl https://allfrom0.top/api/health

# ログインページ
curl https://allfrom0.top/pages/login.html
```

## ⚙️ 設定ファイル

### _redirects (シンプル化済み)
```
# API routes to Worker
/api/* https://questa-r2-api.t88596565.workers.dev/api/:splat 200

# Fallback to index for SPA routing
/* /index.html 200
```

### _headers
```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: no-referrer-when-downgrade
```

## ✨ メリット

1. **パスが明確**: すべて相対パスで動作
2. **設定がシンプル**: _redirectsが3行だけ
3. **開発と本番が同一**: パスの違いなし
4. **メンテナンス容易**: ディレクトリ階層がフラット

## 🧪 ローカルテスト

```bash
# シンプルなHTTPサーバーで確認
cd /home/higuc/sys
python3 -m http.server 8000

# ブラウザでアクセス
# http://localhost:8000/
# → pages/login.html にリダイレクト
```

## 📊 変更内容まとめ

- ✅ learning-notebookの内容をルートに移動
- ✅ _redirects/_headersをシンプル化
- ✅ パスの複雑さを完全に解消
- ✅ 既存ファイルをtools/に整理
- ✅ 開発・本番環境の統一

---

**Status**: ✅ Ready for deployment
**Date**: 2025-10-20
