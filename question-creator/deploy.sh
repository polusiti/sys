#!/bin/bash

# Question Creator Deployment Script

set -e

echo "🚀 Question Creator デプロイを開始します..."

# Check dependencies
echo "📦 依存関係を確認中..."
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wranglerがインストールされていません"
    echo "インストール: npm install -g wrangler"
    exit 1
fi

# Install dependencies
echo "📥 依存関係をインストール中..."
npm install

# Build assets
echo "🔨 アセットをビルド中..."
npm run build

# Login to Cloudflare (if needed)
echo "🔐 Cloudflareにログイン中..."
wrangler whoami || wrangler login

# Deploy Workers
echo "☁️  Workersをデプロイ中..."
wrangler deploy

# Deploy to Pages
echo "📄 Pagesにデプロイ中..."
wrangler pages deploy public --project-name question-creator

# Create icons (if needed)
echo "🎨 アイコンを生成中..."
if [ ! -f "public/icon-192.png" ]; then
    # Generate simple icons using ImageMagick if available
    if command -v convert &> /dev/null; then
        convert -size 192x192 xc:#3b82f6 public/icon-192.png
        convert -size 512x512 xc:#3b82f6 public/icon-512.png
        echo "✅ アイコンを生成しました"
    else
        echo "⚠️  ImageMagickが見つかりません。手動でアイコンを配置してください"
    fi
fi

echo "✅ デプロイが完了しました！"
echo ""
echo "🌐 URL: https://question-creator.pages.dev"
echo ""
echo "📱 スマホでアクセスしてホーム画面に追加できます！"
echo "💡 初回起動時はオフライン対応のために一度読み込んでください"