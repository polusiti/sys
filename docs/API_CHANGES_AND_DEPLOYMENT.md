# API変更とデプロイドキュメント

## 概要

このドキュメントでは、polusiti/sys プロジェクトのAPI変更点とデプロイメント手順について詳細に説明します。

---

## 1. API変更点

### 1.1 主要な変更

#### 登録エンドポイントの変更
- **エンドポイント**: `POST /api/auth/register`
- **変更内容**: `users` テーブルから `users_v2` テーブルへの参照変更
- **Email処理**: NULL許容 + 自動生成機能の追加

#### 新機能
- Emailが提供されない場合の自動生成
- 不明瞭値の適切な処理
- 簡素化されたエラーハンドリング

### 1.2 リクエスト/レスポンス形式

#### リクエスト
```json
{
  "userId": "string (required)",
  "displayName": "string (required)",
  "email": "string (optional)",
  "inquiryNumber": "string (optional)"
}
```

#### 成功レスポンス (200)
```json
{
  "success": true,
  "message": "ユーザー登録が完了しました",
  "userId": 46,
  "username": "testuser",
  "displayName": "テストユーザー",
  "email": "testuser@secure.learning-notebook.local",
  "inquiryNumber": null
}
```

#### エラーレスポンス (400)
```json
{
  "error": "Missing required fields: userId, displayName"
}
```

#### 重複エラーレスポンス (409)
```json
{
  "error": "このユーザーIDまたは表示名は既に使用されています"
}
```

#### サーバーエラーレスポンス (500)
```json
{
  "error": "ユーザー登録に失敗しました",
  "details": "具体的なエラーメッセージ"
}
```

---

## 2. 実装詳細

### 2.1 登録関数の変更点

#### 変更前
```javascript
// users テーブルを使用
const existingUser = await env.TESTAPP_DB.prepare(`
    SELECT id FROM users WHERE username = ? OR display_name = ? OR id = ?
`).bind(userId, displayName, inquiryNumber).first();

// email が NULL の場合エラー
const result = await env.TESTAPP_DB.prepare(`
    INSERT INTO users (username, email, password_hash, display_name, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
`).bind(userId, finalEmail, 'passkey-user', displayName).run();
```

#### 変更後
```javascript
// users_v2 テーブルを使用
const existingUser = await env.TESTAPP_DB.prepare(`
    SELECT id FROM users_v2 WHERE username = ? OR display_name = ?
`).bind(userId, displayName).first();

// email 自動生成 + NULL許容
const finalEmail = email || `${userId}@secure.learning-notebook.local`;
const result = await env.TESTAPP_DB.prepare(`
    INSERT INTO users_v2 (username, email, display_name)
    VALUES (?, ?, ?)
`).bind(userId, finalEmail, displayName).run();
```

### 2.2 Email自動生成ロジック
```javascript
// Emailが提供されない場合に自動生成
const finalEmail = email || `${userId}@secure.learning-notebook.local`;
```

### 2.3 不明瞭値処理
```javascript
// undefined 値の適切な処理
if (inquiryNumber && inquiryNumber.trim() !== '') {
    await env.TESTAPP_DB.prepare(`
        UPDATE users_v2 SET inquiry_number = ? WHERE id = ?
    `).bind(inquiryNumber, userId_db).run();
}
```

---

## 3. デプロイ設定

### 3.1 Wrangler設定

#### config/wrangler.toml
```toml
name = "testapp-d1-api"
main = "unified-api-worker.js"
compatibility_date = "2024-09-01"

# D1データベース設定
[[d1_databases]]
binding = "TESTAPP_DB"
database_name = "testapp-database"
database_id = "ae1bafef-5bf9-4a9d-9773-14c2b017d2be"

# 環境変数
[vars]
ADMIN_TOKEN = "questa-admin-2024"
JWT_SECRET = "your-jwt-secret-here"

# 本番環境
[env.production]
name = "unified-api-production"

# 本番環境用D1設定
[[env.production.d1_databases]]
binding = "TESTAPP_DB"
database_name = "testapp-database"
database_id = "ae1bafef-5bf9-4a9d-9773-14c2b017d2be"

# 本番環境用変数
[env.production.vars]
ADMIN_TOKEN = "questa-admin-2024"
JWT_SECRET = "your-jwt-secret-here"

# カスタムドメイン設定
routes = [
  { pattern = "api.allfrom0.top/*", zone_name = "allfrom0.top" },
  { pattern = "allfrom0.top/api/*", zone_name = "allfrom0.top" }
]
```

### 3.2 デプロイコマンド

#### 開発環境
```bash
CLOUDFLARE_API_TOKEN="p7OizGdMaD4ptEDCSdGzV-nRSxjLUiS4G7QkdWRX" npx wrangler deploy --config config/wrangler.toml --env=""
```

#### 本番環境
```bash
CLOUDFLARE_API_TOKEN="p7OizGdMaD4ptEDCSdGzV-nRSxjLUiS4G7QkdWRX" npx wrangler deploy --config config/wrangler.toml --env production
```

#### テスト用Worker（別途作成）
```bash
CLOUDFLARE_API_TOKEN="p7OizGdMaD4ptEDCSdGzV-nRSxjLUiS4G7QkdWRX" npx wrangler deploy --config test-wrangler.toml
```

---

## 4. 環境設定

### 4.1 必要な環境変数

| 変数名 | 説明 | 値 |
|--------|------|----|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API トークン | `p7OizGdMaD4ptEDCSdGzV-nRSxjLUiS4G7QkdWRX` |
| `ADMIN_TOKEN` | 管理者トークン | `questa-admin-2024` |
| `JWT_SECRET` | JWT シークレット | `your-jwt-secret-here` |

### 4.2 データベース設定

| 設定項目 | 値 |
|----------|----|
| データベース名 | `testapp-database` |
| データベースID | `ae1bafef-5bf9-4a9d-9773-14c2b017d2be` |
| バインディング名 | `TESTAPP_DB` |

---

## 5. デプロイ手順

### 5.1 事前準備
1. コードのテスト完了
2. 環境変数の設定確認
3. データベースマイグレーションの実行

### 5.2 デプロイ実行
```bash
# 1. デプロイ実行
npx wrangler deploy --config config/wrangler.toml --env=""

# 2. デプロイ確認
curl https://testapp-d1-api.t88596565.workers.dev/api/health

# 3. 機能テスト
curl -X POST https://testapp-d1-api.t88596565.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"userId": "testuser", "displayName": "テストユーザー"}'
```

### 5.3 本番環境デプロイ
```bash
# 本番環境にデプロイ
npx wrangler deploy --config config/wrangler.toml --env production

# 本番環境でテスト
curl -X POST https://api.allfrom0.top/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"userId": "produser", "displayName": "本番ユーザー"}'
```

---

## 6. トリブルシューティング

### 6.1 よくあるデプロイ問題

#### 問題1: デプロイが反映されない
**現象**: 変更がデプロイされない
**原因**: 環境の指定ミス
**解決**: `--env=""` を明示的に指定

```bash
# 正しいデプロイコマンド
npx wrangler deploy --config config/wrangler.toml --env=""
```

#### 問題2: 環境変数が読み込まれない
**現象**: `undefined` エラー
**原因**: 環境変数の設定ミス
**解決**: wrangler.toml の設定を確認

#### 問題3: データベース接続エラー
**現象**: データベース関連エラー
**原因**: データベースIDの不一致
**解決**: データベース設定を確認

### 6.2 デバッグ方法

#### ログ確認
```bash
# リアルタイムログ監視
npx wrangler tail

# 過去のログ確認
# Cloudflare Dashboard → Workers → 該当Worker → Logs
```

#### ヘルスチェック
```bash
curl https://testapp-d1-api.t88596565.workers.dev/api/health | jq
```

#### データベース状態確認
```bash
npx wrangler d1 execute testapp-database --command="SELECT COUNT(*) FROM users_v2;" --remote
```

---

## 7. パフォーマンス監視

### 7.1 監視項目
- レスポンスタイム
- エラーレート
- データベースクエリ実行時間
- Worker実行時間

### 7.2 監視ツール
- Cloudflare Analytics
- Workerログ
- カスタム監視（実装予定）

### 7.3 パフォーマンス最適化
- クエリの最適化
- キャッシュ戦略の実装
- レートリミットの導入

---

## 8. セキュリティ考慮事項

### 8.1 認証・認可
- Adminトークンの実装（一時的に無効化）
- JWT認証の実装予定
- APIキー管理

### 8.2 データ保護
- 個人情報の暗号化
- 通信の暗号化（HTTPS）
- ログデータの保護

### 8.3 アクセス制御
- IP制限
- レートリミット
- CORS設定

---

## 9. テスト戦略

### 9.1 単体テスト
- 各関数のテスト
- エラーハンドリングのテスト
- 境界値テスト

### 9.2 統合テスト
- APIエンドポイントのテスト
- データベース連携テスト
- 外部サービス連携テスト

### 9.3 負荷テスト
- 同時アクセスのテスト
- 大量データ処理のテスト
- メモリ使用量の監視

---

## 10. CI/CD統合

### 10.1 自動デプロイ
- GitHub Actionsとの連携
- テスト実行後の自動デプロイ
- ロールバック機能

### 10.2 コード品質
- ESLintによる静的解析
- テストカバレッジの計測
- セキュリティスキャン

### 10.3 デプロイパイプライン
```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npx wrangler deploy --config config/wrangler.toml --env=""
```

---

## 11. バージョン管理

### 11.1 バージョン番号
- SemVerに準拠
- メジャー: 後方互換性のない変更
- マイナー: 機能追加
- パッチ: バグ修正

### 11.2 リリースプロセス
1. 機能開発完了
2. テスト実施
3. コードレビュー
4. デプロイ
5. リリースノート作成

### 11.3 リリースノート
- 変更点の記載
- 既知の問題
- マイグレーション手順

---

## 12. 今後の改善点

### 12.1 機能拡張
- バリデーション強化
- エラーメッセージの多言語化
- APIドキュメントの自動生成

### 12.2 運用改善
- 監視体制の強化
- アラート設定
- 予防保守

### 12.3 技術的負債
- コードのリファクタリング
- テストカバレッジの向上
- ドキュメントの整備

---

**作成日**: 2025-11-05
**バージョン**: 1.0
**担当**: Claude Code Assistant
**最終更新**: 2025-11-05