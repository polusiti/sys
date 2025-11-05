# データベースマイグレーションガイド

## 概要

このドキュメントでは、polusiti/sys プロジェクトのデータベースマイグレーション手順について詳細に説明します。

## 背景

### 問題点
- 元の `users` テーブルの `email` カラムに NOT NULL 制約が設定されていた
- D1 では既存テーブルの NOT NULL 制約を直接変更できない
- 外部キー制約によりスキーマ変更が困難だった

### 解決策
- 新しい `users_v2` テーブルを作成し、email カラムを NULL 許容に変更
- 既存データをマイグレーション
- アプリケーション側で新しいテーブルを使用するように変更

---

## 1. マイグレーションファイル詳細

### 1.1 simple-workaround.sql
**場所**: `/home/higuc/sys/sql/simple-workaround.sql`

```sql
-- Simple workaround migration without complex statements
CREATE TABLE users_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT DEFAULT NULL,
    password_hash TEXT,
    display_name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    last_login TEXT,
    login_count INTEGER DEFAULT 0,
    inquiry_number TEXT DEFAULT NULL,
    passkey_credential_id TEXT,
    passkey_public_key TEXT,
    passkey_sign_count INTEGER DEFAULT 0,
    email_verified INTEGER DEFAULT 0,
    verification_code TEXT,
    verification_expires TEXT,
    avatar_type TEXT DEFAULT 'color',
    avatar_value TEXT DEFAULT '#3498db',
    bio TEXT,
    goal TEXT,
    study_streak INTEGER DEFAULT 0,
    total_study_time INTEGER DEFAULT 0,
    secret_question TEXT DEFAULT 'あなたの好きなアニメキャラは？',
    secret_answer_hash TEXT
);

-- Migrate existing data
INSERT INTO users_v2 (id, username, email, password_hash, display_name, created_at, last_login, login_count, inquiry_number, passkey_credential_id, passkey_public_key, passkey_sign_count, email_verified, verification_code, verification_expires, avatar_type, avatar_value, bio, goal, study_streak, total_study_time, secret_question, secret_answer_hash)
SELECT id, username, email, password_hash, display_name, created_at, last_login, login_count, inquiry_number, passkey_credential_id, passkey_public_key, passkey_sign_count, email_verified, verification_code, verification_expires, avatar_type, avatar_value, bio, goal, study_streak, total_study_time, secret_question, secret_answer_hash
FROM users;

-- Test the migration
SELECT COUNT(*) as migrated_rows FROM users_v2;

SELECT 'Migration completed' as status;
```

### 1.2 実行コマンド
```bash
CLOUDFLARE_API_TOKEN="p7OizGdMaD4ptEDCSdGzV-nRSxjLUiS4G7QkdWRX" npx wrangler d1 execute testapp-database --file=sql/simple-workaround.sql --remote
```

---

## 2. スキーマ変更点

### 2.1 主な変更

#### 変更前 (users テーブル)
```sql
email TEXT NOT NULL  -- NOT NULL 制約あり
```

#### 変更後 (users_v2 テーブル)
```sql
email TEXT DEFAULT NULL  -- NULL 許容に変更
```

### 2.2 新しいインデックス
```sql
CREATE INDEX IF NOT EXISTS idx_users_v2_username ON users_v2(username);
CREATE INDEX IF NOT EXISTS idx_users_v2_email ON users_v2(email);
CREATE INDEX IF NOT EXISTS idx_users_v2_display_name ON users_v2(display_name);
```

---

## 3. 実行手順

### 3.1 事前準備
1. データベースバックアップの作成
2. メンテナンスモードへの移行（必要に応じて）

### 3.2 マイグレーション実行
1. マイグレーションファイルの実行
2. データ移行の確認
3. アプリケーションの更新

### 3.3 事後確認
1. データ整合性の確認
2. アプリケーション動作のテスト
3. パフォーマンスの確認

---

## 4. 検証クエリ

### 4.1 マイグレーション結果確認
```sql
-- マイグレーションされたデータ件数の確認
SELECT COUNT(*) as users_v2_count FROM users_v2;
SELECT COUNT(*) as users_count FROM users;

-- データ内容の比較
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'users_v2' as table_name, COUNT(*) as count FROM users_v2;

-- email NULL 値の確認
SELECT COUNT(*) as null_email_count FROM users_v2 WHERE email IS NULL;
SELECT COUNT(*) as not_null_email_count FROM users_v2 WHERE email IS NOT NULL;
```

### 4.2 スキーマ確認
```sql
-- users_v2 テーブルの構造確認
SELECT sql FROM sqlite_master WHERE type='table' AND name='users_v2';

-- email カラムの制約確認
PRAGMA table_info(users_v2) WHERE name='email';
```

---

## 5. ロールバック計画

### 5.1 ロールバック手順
1. アプリケーションを元の users テーブルを使用するように戻す
2. users_v2 テーブルを削除（必要な場合）

### 5.2 ロールバックコマンド
```sql
-- users_v2 テーブルの削除（注意：データが失われます）
DROP TABLE IF EXISTS users_v2;
```

---

## 6. パフォーマンス考慮事項

### 6.1 インデックスの最適化
- ユーザー名検索用のインデックス
- Email検索用のインデックス
- 表示名検索用のインデックス

### 6.2 クエリの最適化
- 重複チェッククエリの改善
- バルクインサートの検討

---

## 7. 監視

### 7.1 監視項目
- テーブルサイズの増加
- クエリ実行時間
- エラー発生頻度

### 7.2 監視クエリ
```sql
-- テーブルサイズ確認
SELECT
  name,
  sql,
  COUNT(*) as row_count
FROM sqlite_master
WHERE type='table' AND name IN ('users', 'users_v2')
GROUP BY name, sql;

-- 最近作成されたユーザーの確認
SELECT * FROM users_v2
ORDER BY created_at DESC
LIMIT 10;
```

---

## 8. セキュリティ考慮事項

### 8.1 データ保護
- パスワードハッシュの保持
- 個人情報の暗号化検討
- アクセス制御の実装

### 8.2 バックアップ
- 定期的なバックアップの実施
- バックアップデータの暗号化
- 復旧テストの実施

---

## 9. トラブルシューティング

### 9.1 よくある問題

#### 問題1: マイグレーションが失敗する
**原因**: 外部キー制約
**解決**: 依存関係を確認し、順序を調整

#### 問題2: データが移行されない
**原因**: SQL構文エラー
**解決**: クエリを個別に実行して確認

#### 問題3: パフォーマンスが低下する
**原因**: インデックス不足
**解決**: 適切なインデックスを作成

### 9.2 デバッグ手順
1. エラーメッセージの確認
2. 実行ログの確認
3. クエリの個別テスト

---

## 10. ベストプラクティス

### 10.1 マイグレーションのベストプラクティス
- 事前の十分なテスト
- 段階的な実行
- ロールバール計画の準備

### 10.2 運用のベストプラクティス
- 定期的なバックアップ
- 監視体制の構築
- ドキュメントの維持

---

## 11. 今後の改善点

### 11.1 マイグレーション自動化
- CI/CD パイプラインへの組み込み
- 自動テストの実装

### 11.2 データベース管理
- スキーマ管理ツールの導入
- バージョン管理の強化

---

**作成日**: 2025-11-05
**バージョン**: 1.0
**担当**: Claude Code Assistant