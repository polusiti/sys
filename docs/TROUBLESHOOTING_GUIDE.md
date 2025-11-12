# トラブルシューティングガイド

## 概要

このドキュメントでは、polusiti/sys プロジェクトで発生しうる一般的な問題とその解決方法について説明します。

---

## 1. データベース関連問題

### 1.1 NOT NULL制約エラー

#### 問現象
```
NOT NULL constraint failed: users.email
```

#### 原因
- `users` テーブルの email カラムに NOT NULL 制約がある
- NULL 値を挿入しようとしている

#### 解決策
**方法1: users_v2 テーブルを使用**
```sql
-- users_v2 テーブルに切り替え
INSERT INTO users_v2 (username, email, display_name)
VALUES ('testuser', NULL, 'Test User');
```

**方法2: デフォルト値を設定**
```sql
-- デフォルトEmailを設定
INSERT INTO users (username, email, display_name)
VALUES ('testuser', 'testuser@secure.learning-notebook.local', 'Test User');
```

#### 予防策
- アプリケーション側で email 自動生成ロジックを実装
- フォームバリデーションを強化

### 1.2 外部キー制約エラー

#### 問現象
```
FOREIGN KEY constraint failed
```

#### 原因
- 関連テーブルが参照するレコードが存在しない
- テーブル削除の順序が不正

#### 解決策
**方法1: 依存関係を確認**
```sql
-- 外部キー制約を確認
PRAGMA foreign_key_list(users);
```

**方法2: 新しいテーブルを作成**
```sql
-- 既存テーブルを残したまま新しいテーブルを作成
CREATE TABLE users_v2 AS SELECT * FROM users;
-- スキーマを変更してデータを移行
```

#### 予防策
- マイグレーション計画を事前に作成
- 依存関係のマッピングを作成

### 1.3 D1_TYPE_ERROR

#### 問現象
```
D1_TYPE_ERROR: Type 'undefined' not supported for value 'undefined'
```

#### 原因
- JavaScript の undefined 値がデータベースに渡されている
- パラメータバインディングの問題

#### 解決策
**方法1: undefined 値を明示的に処理**
```javascript
// 安全なデフォルト値を設定
const safeValue = value || '';
const safeNumber = number || 0;

// または null を使用
const safeValue = value ?? null;
```

**方法2: パラメータの型チェック**
```javascript
// 型チェックを実装
if (typeof value === 'undefined') {
  throw new Error('Required parameter is undefined');
}
```

#### 予防策
- すべての入力パラメータを検証
- TypeScript を使用して型安全を確保

---

## 2. API関連問題

### 2.1 認証エラー

#### 問現象
```
401 Unauthorized
```

#### 原因
- Adminトークンが正しくない
- トークンが期限切れ
- ヘッダー形式が不正

#### 解決策
**方法1: トークンを確認**
```bash
# 正しいトークンでテスト
curl -H "Authorization: Bearer questa-admin-2024" \
  https://worker-url/api/auth/register
```

**方法2: トークンを再生成**
```bash
# 新しいトークンを環境変数に設定
export ADMIN_TOKEN="new-token-here"
```

#### 予防策
- トークンを環境変数から読み込む
- 定期的なトークン更新

### 2.2 デプロイが反映されない

#### 問現象
- コード変更が反映されない
- 古いバージョンが実行されている

#### 原因
- 環境の指定ミス
- キャッシュの問題
- 複数環境の存在

#### 解決策
**方法1: 環境を明示的に指定**
```bash
# 正しい環境でデプロイ
npx wrangler deploy --config config/wrangler.toml --env=""
```

**方法2: キャッシュをクリア**
```bash
# Workerのキャッシュをクリア
npx wrangler deploy --compatibility-date=2024-09-01
```

**方法3: 新しいWorkerを作成**
```bash
# 新しい名前でデプロイ
npx wrangler deploy --name new-worker-name
```

#### 予防策
- デプロイ時にバージョン情報を表示
- ヘルスチェックエンドポイントを実装

### 2.3 CORSエラー

#### 問現象
```
Access to fetch at '...' has been blocked by CORS policy
```

#### 原因
- CORSヘッダーが正しく設定されていない
- オリジンが許可されていない

#### 解決策
**方法1: CORSヘッダーを設定**
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONSリクエストを処理
if (request.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

**方法2: 特定のオリジンを許可**
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com',
};
```

#### 予防策
- 開発環境と本番環境でCORS設定を分ける
- 定期的なCORS設定の見直し

---

## 3. デプロイ関連問題

### 3.1 Wranglerエラー

#### 問現象
```
Couldn't find a D1 DB with the name or binding 'learning-notebook-db'
```

#### 原因
- wrangler.toml の設定ミス
- データベース名の不一致
- ファイルの場所が不正

#### 解決策
**方法1: 設定ファイルを確認**
```toml
[[d1_databases]]
binding = "LEARNING_DB"
database_name = "learning-notebook-db"
database_id = "ae1bafef-5bf9-4a9d-9773-14c2b017d2be"
```

**方法2: パスを指定**
```bash
# 正しいパスでデプロイ
npx wrangler deploy --config /path/to/wrangler.toml
```

#### 予防策
- 設定ファイルのバリデーションを実施
- 環境変数を使用して設定を管理

### 3.2 パーミッションエラー

#### 問現象
```
Permission denied
```

#### 原因
- APIトークンの権限不足
- アカウントの設定問題

#### 解決策
**方法1: トークン権限を確認**
```bash
# トークン権限をテスト
npx wrangler whoami
```

**方法2: 新しいトークンを生成**
1. Cloudflare Dashboard にアクセス
2. API Tokens で新しいトークンを生成
3. 適切な権限を設定

#### 予防策
- 最小権限の原則を適用
- 定期的なトークンの更新

---

## 4. パフォーマンス問題

### 4.1 レスポンスタイムが遅い

#### 問現象
- APIレスポンスが遅い
- タイムアウトが発生する

#### 原因
- データベースクエリの非効率化
- Workerのcold start
- 外部API呼び出しの遅延

#### 解決策
**方法1: クエリを最適化**
```sql
-- インデックスを作成
CREATE INDEX idx_users_v2_username ON users_v2(username);
CREATE INDEX idx_users_v2_email ON users_v2(email);

-- クエリを最適化
SELECT id FROM users_v2 WHERE username = ? LIMIT 1;
```

**方法2: キャッシュを実装**
```javascript
// 簡単なキャッシュ実装
const cache = caches.default;
const cacheKey = new Request(request.url);

const cached = await cache.match(cacheKey);
if (cached) {
  return cached;
}
```

#### 予防策
- 定期的なパフォーマンス監視
- クエリ実行計画の確認

### 4.2 メモリ使用量が多い

#### 問現象
- Workerがメモリ不足で落ちる
- パフォーマンスが低下する

#### 原因
- 大量のデータを一度に処理
- メモリリーク

#### 解決策
**方法1: データを分割処理**
```javascript
// ページネーションを実装
const limit = 100;
const offset = page * limit;

const results = await env.DB.prepare(`
  SELECT * FROM users_v2 LIMIT ? OFFSET ?
`).bind(limit, offset).all();
```

**方法2: メモリ使用量を監視**
```javascript
// メモリ使用量をログに出力
console.log('Memory usage:', process.memoryUsage());
```

#### 予防策
- 定期的なメモリ監視
- 効率的なデータ構造を使用

---

## 5. デバッグ方法

### 5.1 ログの確認

#### 方法1: リアルタイムログ
```bash
# Workerログをリアルタイムで確認
npx wrangler tail
```

#### 方法2: 過去のログ
```
1. Cloudflare Dashboard にアクセス
2. Workers & Pages → 該当Worker
3. Logs タブを確認
```

#### 方法3: カスタムログ
```javascript
console.log('Debug info:', {
  userId,
  timestamp: new Date().toISOString(),
  action: 'user_registration'
});
```

### 5.2 ヘルスチェック

#### APIヘルスチェック
```bash
curl https://your-worker-url/api/health | jq
```

#### データベース接続チェック
```bash
npx wrangler d1 execute learning-notebook-db --command="SELECT 1 as test;" --remote
```

### 5.3 エンドポイントテスト

#### 登録APIテスト
```bash
# 正常ケース
curl -X POST https://worker-url/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"userId": "test", "displayName": "Test"}' | jq

# エラーケース
curl -X POST https://worker-url/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{}' | jq
```

---

## 6. 緊急対応手順

### 6.1 サービス停止時

#### 手順1: 状況確認
```bash
# サービス状態を確認
curl https://worker-url/api/health

# ログを確認
npx wrangler tail --format=json
```

#### 手順2: 影響範囲の特定
- エラーレートの確認
- 影響を受けている機能の特定
- ユーザーへの影響評価

#### 手順3: 応急処置
```bash
# 以前のバージョンにロールバック
npx wrangler rollback --version previous-version-id

# またはメンテナンスモードを有効化
# メンテナンスページを表示するWorkerをデプロイ
```

### 6.2 データ破損時

#### 手順1: 直ちにサービス停止
```bash
# Workerを無効化
npx wrangler secret delete ENABLE_SERVICE
```

#### 手順2: バックアップから復元
```bash
# バックアップから復元
npx wrangler d1 execute learning-notebook-db --file=backup.sql --remote
```

#### 手順3: データ整合性を確認
```sql
-- データ整合性をチェック
SELECT COUNT(*) FROM users_v2;
SELECT * FROM users_v2 WHERE email IS NULL LIMIT 10;
```

---

## 7. 予防策

### 7.1 監視体制

#### 主要監視項目
- APIレスポンスタイム
- エラーレート
- データベース接続状態
- Worker実行時間

#### 監視設定
```javascript
// ヘルスチェックエンドポイント
if (url.pathname === '/api/health') {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }));
}
```

### 7.2 バックアップ戦略

#### 定期バックアップ
```bash
# 毎日バックアップを実行
npx wrangler d1 export learning-notebook-db --output=backup-$(date +%Y%m%d).sql
```

#### バックアップ検証
- 定期的なリストアテスト
- バックアップデータの整合性確認

### 7.3 テスト戦略

#### 自動テスト
- 単体テストの実装
- 統合テストの実施
- E2Eテストの定期実行

#### 手動テスト
- デプロイ前の機能テスト
- 負荷テストの実施
- セキュリティテストの実施

---

## 8. 連絡先

### 8.1 緊急連絡先
- 開発チーム: [連絡先情報]
- インフラチーム: [連絡先情報]
- 上司: [連絡先情報]

### 8.2 文書
- 技術ドキュメント: `/docs/`
- 運用手順: `/docs/operations/`
- インシデント対応: `/docs/incident-response/`

---

**作成日**: 2025-11-05
**バージョン**: 1.0
**担当**: Claude Code Assistant
**最終更新**: 2025-11-05