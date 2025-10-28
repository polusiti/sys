# 📋 Cloudflare Workers デプロイ手順

## 🚀 自動デプロイ手順（推奨）

### 1. Cloudflare Workers にデプロイ

```bash
# Wrangler CLI をインストール（未インストールの場合）
npm install -g wrangler

# Cloudflare にログイン
wrangler auth login

# Workers をデプロイ
wrangler deploy
```

### 2. R2バケットのバインディング確認

```bash
# この設定でquestaバケットが自動バインドされます
wrangler r2 bucket list
```

### 3. デプロイされるURL

デプロイ後、以下のような URL が提供されます：
- `https://questa-r2-api.<あなたのsubdomain>.workers.dev`

### 4. フロントエンドの API ベース URL を更新

デプロイされた Workers の URL を確認して、フロントエンドコードを更新します。

## 🔧 環境変数

Workers には以下の環境変数が設定されます：
- `ADMIN_TOKEN`: questa-admin-2024
- `QUESTA_BUCKET`: questaバケットへのバインディング

## 📝 API エンドポイント

デプロイ後、以下のエンドポイントが利用可能になります：

- `GET /api/health` - ヘルスチェック
- `POST /api/questions/{subject}` - 問題保存
- `GET /api/questions/{subject}` - 問題取得
- `POST /api/upload/audio` - 音声アップロード
- `GET /api/files/{type}` - ファイル一覧取得

## 🏆 完了後の確認事項

1. Workers のデプロイが成功した
2. R2 バケットに正しくアクセスできる
3. フロントエンドから API 呼び出しが成功する
4. 問題保存・取得が正常動作する

---

**🎯 あなたが実行すること:**
1. 上記のコマンドを順番に実行
2. デプロイされた Workers の URL をメモ
3. 完了したら URL を教えてください