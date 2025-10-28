# TestApp D1 Migration Guide

## 概要
TestApp を R2 ファイルベースから D1 データベース + R2 ハイブリッド構成に移行するガイドです。

## 変更内容

### アーキテクチャ変更
- **Before**: 全データを R2 の JSON ファイルで管理
- **After**: 構造化データを D1、バイナリファイルを R2 で管理

### データ管理の変更
| データ種別 | Before (R2) | After (D1 + R2) |
|------------|-------------|------------------|
| ユーザー情報 | なし | D1 (users テーブル) |
| 問題データ | R2 JSON | D1 (questions テーブル) |
| 科目情報 | ハードコード | D1 (subjects テーブル) |
| 音声ファイル | R2 | R2 + D1 メタデータ |

## セットアップ手順

### 1. D1 データベース作成
```bash
# D1 データベースを作成
wrangler d1 create testapp-database

# 出力された database_id を wrangler-d1.toml に設定
```

### 2. マイグレーション実行
```bash
# ローカル環境でテスト
wrangler d1 migrations apply testapp-database --local

# 本番環境に適用
wrangler d1 migrations apply testapp-database --remote
```

### 3. 設定ファイル更新
```bash
# 新しい設定ファイルを使用
cp wrangler-d1.toml wrangler.toml
cp package-d1.json package.json
cp cloudflare-worker-d1.js cloudflare-worker.js
```

### 4. 環境変数設定
```bash
# JWT_SECRET を安全な値に変更
wrangler secret put JWT_SECRET
```

### 5. デプロイ
```bash
npm run deploy
```

## 新しい API エンドポイント

### 認証
- `POST /api/auth/login` - ユーザーログイン
- `POST /api/auth/register` - ユーザー登録
- `GET /api/user/profile` - プロフィール取得

### 科目・問題管理
- `GET /api/subjects` - 科目一覧取得
- `GET /api/questions/{subject}/sets` - 問題セット一覧
- `POST /api/questions/{subject}` - 問題セット作成
- `GET /api/questions/{subject}` - 最新問題セット取得

### ファイル管理
- `POST /api/upload/audio` - 音声ファイルアップロード
- `GET /api/audio/files` - 音声ファイル一覧

## データ移行

### 既存データの移行スクリプト
```javascript
// 既存の R2 データを D1 に移行する場合
// scripts/migrate-r2-to-d1.js を作成して実行
```

## 認証システム

### JWT トークン
- ログイン時に JWT トークンを発行
- 24時間の有効期限
- セッション情報を D1 で管理

### セキュリティ
- パスワードハッシュ化 (bcrypt)
- セッショントークン管理
- 管理者権限制御

## データベーススキーマ

### 主要テーブル
- `users` - ユーザー情報
- `subjects` - 科目情報
- `question_sets` - 問題セット
- `questions` - 個別問題
- `audio_files` - 音声ファイルメタデータ
- `user_sessions` - セッション管理

## 開発・デバッグ

### ローカル開発
```bash
# ローカル D1 でテスト
wrangler dev --local

# D1 コンソール
wrangler d1 execute testapp-database --local --command "SELECT * FROM users;"
```

### データベース操作
```bash
# マイグレーション作成
wrangler d1 migrations create testapp-database "migration_name"

# データベースクエリ実行
npm run db:console "SELECT * FROM subjects;"
```

## トラブルシューティング

### よくある問題
1. **database_id が設定されていない**
   - `wrangler d1 create` で出力された ID を設定

2. **JWT_SECRET が設定されていない**
   - `wrangler secret put JWT_SECRET` で設定

3. **マイグレーションエラー**
   - `--local` でテスト後、`--remote` で適用

### ロールバック手順
元の構成に戻す場合：
```bash
cp cloudflare-worker.js cloudflare-worker-backup.js
cp wrangler.toml wrangler-backup.toml
```

## パフォーマンス考慮

### D1 制限
- 1日あたり 100,000 読み取り/5,000 書き込み (無料プラン)
- クエリ実行時間 30秒以内
- データベースサイズ 500MB (無料プラン)

### 最適化
- インデックス活用
- 適切なクエリ設計
- R2 との役割分担

## Next Steps
1. フロントエンド (index.html) の認証対応
2. 既存データの移行
3. テストケース作成
4. 監視・ログ設定