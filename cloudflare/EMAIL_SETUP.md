# メール認証システム デプロイガイド

## 1. SendGrid設定

### SendGridアカウント作成
1. [SendGrid](https://sendgrid.com/) にサインアップ
2. ダッシュボードから「Create & Send」を選択
3. 「API Keys」から新しいAPIキーを作成
   - Full AccessまたはRestricted Access（Mail Send権限）
4. 「Sender Authentication」でドメインを認証
   - Domain Authentication推奨
   - またはSingle Sender Verification

### 環境変数設定
```bash
# SendGrid APIキー設定
wrangler secret put SENDGRID_API_KEY

# 送信元メールアドレス設定
wrangler secret put FROM_EMAIL
```

## 2. データベース更新

### スキーマ更新
```bash
# データベースを最新のスキーマに更新
wrangler d1 execute testapp-database --file=./schema.sql
```

## 3. デプロイ

### 本番環境デプロイ
```bash
# Workerをデプロイ
wrangler deploy

# デプロイ状態確認
wrangler deployments list
```

### 開発環境デプロイ
```bash
# 開発環境にデプロイ
wrangler deploy --env development
```

## 4. テスト

### 機能テスト
1. **登録フロー**:
   - 新規ユーザー登録
   - 確認メール受信
   - 確認コード入力
   - ログイン確認

2. **再送信機能**:
   - 確認コード再送信リクエスト
   - 新しいコード受信
   - コード検証

3. **エラーケース**:
   - 不正なコード入力
   - 有効期限切れコード
   - 既存ユーザー登録

### セキュリティテスト
- パスワード強度チェック
- メール形式バリデーション
- 確認コードの有効期限
- ブルートフォース攻撃対策

## 5. 監視

### ログ確認
```bash
# Workerログ確認
wrangler tail

# 過去のログ確認
wrangler executions list
```

### エラーモニタリング
- SendGridダッシュボードでのメール配信状況
- Workerのエラーログ監視
- データベースエラーチェック

## 6. 代替メールサービス

### AWS SES
1. AWSアカウント作成
2. SES設定でサンドボックス解除（本番環境）
3. アクセスキー発行
4. 環境変数設定:
   ```bash
   wrangler secret put AWS_ACCESS_KEY_ID
   wrangler secret put AWS_SECRET_ACCESS_KEY
   wrangler secret put AWS_REGION
   ```

### Resend（推奨）
1. [Resend](https://resend.com/) にサインアップ
2. APIキー取得
3. ドメイン認証
4. 環境変数設定:
   ```bash
   wrangler secret put RESEND_API_KEY
   ```

## 7. コスト最適化

### SendGrid無料枠
- 100通/日（無料枠）
- 超過した場合は従量課金

### Resend無料枠
- 3,000通/月（無料枠）
- その後$0.002/通

### AWS SES無料枠
- 62,000通/月（送信元がAmazon SESホストの場合）
- $0.10/1,000通（それ以外）

## 8. トラブルシューティング

### メールが届かない場合
1. スパムフォルダ確認
2. SendGridダッシュボードで配信ステータス確認
3. 送信元ドメイン認証状態確認
4. 環境変数設定再確認

### 確認コードが無効な場合
1. コードの有効期限確認（24時間）
2. データベースのverification_codeフィールド確認
3. ユーザーのemail_verifiedフィールド確認

### Workerエラー
1. ログ確認: `wrangler tail`
2. 環境変数設定確認
3. データベース接続確認

## 9. 開発モード

APIキーが設定されていない場合、開発モードとして動作します：
- 確認コードがレスポンスに含まれる
- メール送信はスキップされる
- フロントエンドで開発モード表示

## 10. 本番環境移行

1. 本番用APIキー取得
2. 環境変数更新
3. データベース移行
4. 本番環境デプロイ
5. 動作テスト
6. DNS設定更新（必要に応じて）