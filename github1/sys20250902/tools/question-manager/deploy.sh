#!/bin/bash

# Enhanced Question Manager Deployment Script

set -e

echo "🚀 Enhanced Question Manager デプロイを開始します..."

# Check if we're in the right directory
if [ ! -f "mobile-creator-enhanced.js" ]; then
    echo "❌ question-manager ディレクトリに移動してください"
    exit 1
fi

# Check dependencies
echo "📦 依存関係を確認中..."
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wranglerがインストールされていません"
    echo "インストール: npm install -g wrangler"
    exit 1
fi

# Login to Cloudflare (if needed)
echo "🔐 Cloudflareにログイン中..."
wrangler whoami || wrangler login

# Deploy Worker
echo "☁️  Workerをデプロイ中..."
wrangler deploy

# Create R2 bucket if it doesn't exist
echo "🪣 R2バケットを確認中..."
wrangler r2 bucket describe questa 2>/dev/null || wrangler r2 bucket create questa

# Update mobile-creator.html to use enhanced version
echo "📱 モバイルクリエイターを更新中..."
if [ -f "mobile-creator.html" ]; then
    # Backup original
    cp mobile-creator.html mobile-creator-backup.html
    
    # Update script reference
    sed -i 's/mobile-creator.js/mobile-creator-enhanced.js/g' mobile-creator.html
    
    # Add R2 storage script
    if ! grep -q "r2-storage.js" mobile-creator.html; then
        sed -i '/mobile-creator-enhanced.js/i\    <script src="r2-storage.js" type="module"></script>' mobile-creator.html
    fi
fi

# Create icons if needed
echo "🎨 アイコンを確認中..."
if [ ! -f "icons/icon-192.png" ]; then
    mkdir -p icons
    echo "ℹ️  icons/ディレクトリにアイコンを配置してください"
fi

# Create deployment info
cat > deployment-info.txt << EOF
Enhanced Question Manager デプロイ情報
========================================

デプロイ日時: $(date)
Worker URL: $(wrangler whoami | grep 'Account Name' | cut -d' ' -f3-).workers.dev
R2 Bucket: questa

Features:
- Cloudflare R2 integration
- Offline sync
- Mobile-optimized UI
- LaTeX support
- Auto-save
- Image upload

Next steps:
1. Update config.json with your R2 endpoint
2. Test the mobile creator
3. Sync existing questions to R2
EOF

echo "✅ デプロイが完了しました！"
echo ""
echo "📱 モバイルクリエイター: mobile-creator.html"
echo "📊 ダッシュボード: dashboard.html"
echo "🔧 設定ファイル: config.json"
echo ""
echo "⚠️  注意事項:"
echo "1. config.json を実際のR2エンドポイントに更新してください"
echo "2. wrangler.toml の ALLOWED_ORIGIN を確認してください"
echo "3. R2バケットのパブリックアクセスを設定してください"
echo ""
echo "📋 詳細は deployment-info.txt を確認してください"