#!/bin/bash
# R2連携デプロイスクリプト

echo "🚀 Questa R2システムデプロイ開始"

# 1. 依存関係インストール
echo "📦 依存関係をインストール中..."
cd manager
npm install

# 2. 環境変数確認
if [ ! -f .env ]; then
    echo "⚠️  .envファイルが見つかりません"
    echo "📝 .env.exampleを参考に設定してください:"
    echo "   - R2_ENDPOINT"
    echo "   - R2_ACCESS_KEY_ID" 
    echo "   - R2_SECRET_ACCESS_KEY"
    echo "   - R2_PUBLIC_URL"
    echo "   - ADMIN_TOKEN"
    exit 1
fi

echo "✅ 環境変数設定確認済み"

# 3. サーバー起動
echo "🌐 R2サーバーを起動中..."
npm start

echo "✅ デプロイ完了!"
echo "🔗 管理画面: https://allfrom0.top/manager/english/"
echo "🔧 API: http://localhost:3001/health"