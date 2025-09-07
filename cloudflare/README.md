# TestApp認証システム - デプロイ手順

## 1. Cloudflare D1データベース作成

```bash
# Cloudflare CLIのインストール（未インストールの場合）
npm install -g wrangler

# Cloudflareにログイン
wrangler login

# D1データベース作成
wrangler d1 create testapp-db

# 作成されたdatabase_idを wrangler.toml に設定
```

## 2. KVネームスペース作成

```bash
# KVネームスペース作成（セッション保存用）
wrangler kv:namespace create "SESSIONS"
wrangler kv:namespace create "SESSIONS" --preview

# 作成されたIDを wrangler.toml に設定
```

## 3. データベーススキーマ適用

```bash
# ローカルDB作成（開発用）
wrangler d1 create testapp-db --local

# スキーマ適用
wrangler d1 execute testapp-db --file=./schema.sql
wrangler d1 execute testapp-db --file=./schema.sql --local
```

## 4. Cloudflare Workers デプロイ

```bash
# Workers デプロイ
wrangler deploy

# 本番データベーススキーマ適用
wrangler d1 execute testapp-db --file=./schema.sql --remote
```

## 5. 設定ファイル更新

### wrangler.toml の設定例:
```toml
name = "testapp-auth"
main = "workers/auth.js"
compatibility_date = "2024-12-01"

[[d1_databases]]
binding = "DB"
database_name = "testapp-db"
database_id = "あなたのD1データベースID"

[[kv_namespaces]]
binding = "SESSIONS"
id = "あなたのKVネームスペースID"

[[routes]]
pattern = "yourdomain.com/api/*"
zone_name = "yourdomain.com"
```

## 6. テスト

### 登録テスト:
```bash
curl -X POST https://yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'
```

### ログインテスト:
```bash
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 7. フロントエンド統合

### メインサイト (index.html) への認証追加:
1. `auth.css` をCSSファイルに追加
2. `auth.js` をJSファイルに追加
3. ヘッダーに認証UIを追加
4. 認証モーダルをHTMLに追加

### 語彙アプリとの統合:
1. 語彙アプリに認証システムを注入
2. セッション開始時の認証チェック
3. 進捗データの同期

## 8. 本番運用

### モニタリング:
- Cloudflare Analyticsでリクエスト数監視
- D1のクエリ数監視
- KVの操作数監視

### スケーリング対応:
- 10万リクエスト/日を超えたら有料プラン（$5/月）に移行
- データベース最適化とインデックス追加
- キャッシュ戦略の実装

## 9. セキュリティ

### 本番環境での追加対策:
- Rate limiting の実装
- CSRF保護の追加
- SQLインジェクション対策の強化
- セッション管理の改善

これで完全無料の認証システムが構築できます！