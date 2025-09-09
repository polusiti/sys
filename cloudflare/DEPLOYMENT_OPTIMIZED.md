# コスト最適化メールシステム デプロイガイド

## Step 1: 複数サービスアカウント作成

### 1. Resend（最優先）
```bash
# 1. https://resend.com にサインアップ
# 2. API KeysからAPIキー取得
# 3. Domainsからドメイン認証
```

### 2. AWS SES（バックアップ）
```bash
# 1. AWSコンソールからSESへ移動
# 2. Verified identitiesでメールアドレス認証
# 3. IAMでユーザー作成しSESフルアクセス権限付与
# 4. アクセスキー取得
```

### 3. SendGrid（フェイルオーバー）
```bash
# 1. https://sendgrid.com にサインアップ
# 2. Settings → API KeysでAPIキー作成
# 3. Settings → Sender Authenticationでドメイン認証
```

## Step 2: 環境変数設定

### 開発環境
```bash
# Resend設定
wrangler secret put --env development RESEND_API_KEY

# 共通設定
wrangler secret put --env development FROM_EMAIL
```

### 本番環境
```bash
# 全サービス設定
wrangler secret put RESEND_API_KEY
wrangler secret put SENDGRID_API_KEY
wrangler secret put AWS_ACCESS_KEY_ID
wrangler secret put AWS_SECRET_ACCESS_KEY
wrangler secret put AWS_REGION
wrangler secret put FROM_EMAIL

# KVネームスペース作成
wrangler kv:namespace create EMAIL_USAGE_KV
wrangler secret put EMAIL_USAGE_KV_ID
```

## Step 3: データベース更新

### 使用量トラッキングテーブル追加
```sql
-- メール使用量トラッキングテーブル
CREATE TABLE email_usage_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_name TEXT NOT NULL,
    month TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0,
    cost_estimate REAL DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- インデックス作成
CREATE INDEX idx_email_usage_month ON email_usage_stats(month, service_name);
```

## Step 4: Worker更新

### 既存のauth.jsを更新
```javascript
// email-router.jsをインポート
import EmailServiceRouter from './email-router.js';

// メール送信部分を置き換え
const emailRouter = new EmailServiceRouter(env);
const emailResult = await emailRouter.sendVerificationEmail(email, verificationCode);
```

## Step 5: モニタリング設定

### 使用量ダッシュボード
```javascript
// 管理者用使用量レポートエンドポイント
async function getEmailUsageReport(request, env) {
  const usage = await env.EMAIL_USAGE_KV.get('monthly_report');
  const data = usage ? JSON.parse(usage) : {};
  
  return new Response(JSON.stringify({
    current_month: new Date().toISOString().slice(0, 7),
    usage_by_service: data,
    total_emails: Object.values(data).reduce((sum, count) => sum + count, 0),
    estimated_cost: calculateEstimatedCost(data)
  }));
}
```

### アラート設定
```javascript
// 月間目標達成アラート
async function checkUsageAlerts(env) {
  const usage = await getMonthlyUsage(env);
  const total = Object.values(usage).reduce((sum, count) => sum + count, 0);
  
  // 警告レベルチェック
  if (total > 50000) {
    await sendAlert(`メール使用量が50,000通に達しました（残り無料枠: ${62000-total}通）`);
  }
  
  if (total > 60000) {
    await sendAlert(`メール使用量が60,000通を超えました。有料枠が適用されます。`);
  }
}
```

## Step 6: テスト計画

### 負荷テスト
```bash
# 各サービスのテスト
curl -X POST https://your-worker.your-subdomain.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"testpass123"}'

# 使用量確認
curl https://your-worker.your-subdomain.workers.dev/api/admin/email-usage
```

### フェイルオーバーテスト
```javascript
// 各サービスを順番に無効化してテスト
const testServices = ['resend', 'sendgrid', 'ses'];
for (const service of testServices) {
  console.log(`Testing ${service} failure...`);
  // 一時的にAPIキーを無効化
  // メール送信テスト
  // フェイルオーバー確認
}
```

## Step 7: 本番デプロイ

### デプロイ手順
```bash
# 1. データベース更新
wrangler d1 execute testapp-database --file=./schema.sql

# 2. Workerデプロイ
wrangler deploy

# 3. KVネームスペースバインド確認
wrangler kv:namespace list

# 4. 動作テスト
curl -f https://your-worker.your-subdomain.workers.dev/api/health
```

## Step 8: 運用計画

### 月次メンテナンス
```bash
# 毎月1日の使用量リセットスクリプト
#!/bin/bash
# reset-usage.sh

# 前月のデータをアーカイブ
wrangler kv:put email_usage_$(date -d 'last month' +'%Y-%m') "$(wrangler kv:get email_usage_current)"

# 現在月の使用量をリセット
wrangler kv:put email_usage_current '{"resend":0,"sendgrid":0,"ses":0}'
```

### コスト最適化レビュー
- 四半期ごとのサービス契約見直し
- 使用量トレンド分析
- 新しいメールサービスの評価

## トラブルシューティング

### 共通問題
1. **メールが届かない**
   - スパムフォルダ確認
   - 各サービスのダッシュボードで配信ステータス確認
   - ドメイン認証状態確認

2. **コストが予想より高い**
   - 使用量トラッキングデータ確認
   - サービス切り替えロジック確認
   - 無料枠計算ミスがないか確認

3. **サービス障害**
   - フェイルオーバーロジック確認
   - 各サービスのステータスページ確認
   - バックアッププラン発動

### 緊急対応
```bash
# 全サービスダウン時の緊急コマンド
# 開発モードに切り替え
wrangler secret put EMERGENCY_MODE true

# 使用量を一時的に別KVに保存
wrangler kv:put emergency_backup "$(wrangler kv:get email_usage_current)"
```