# Data Manager Authentication System

## 概要

Data Managerにパスキー認証システムを統合しました。このシステムは[sys repository](https://github.com/polusiti/sys)のパターンを参考に、WebAuthn API を使用した安全な認証を提供します。

## 🔑 主要機能

### 認証機能
- **パスキー認証**: WebAuthn API を使用したパスワードレス認証
- **ユーザー登録**: ID + パスキーによる新規アカウント作成
- **お問い合わせ番号**: 各ユーザーに一意の問い合わせ番号を発行
- **セッション管理**: 安全なトークンベースのセッション管理

### セキュリティ
- **パスワードレス**: パスキーのみの認証でパスワード不要
- **生体認証対応**: Touch ID、Face ID、Windows Hello対応
- **暗号化**: すべての認証データは暗号化
- **セッション保護**: 24時間のセッションタイムアウト

### ユーザー管理
- **プロフィール管理**: 表示名、メールアドレスの編集
- **アカウント設定**: セキュリティ設定の管理
- **お問い合わせ番号**: サポート用の一意識別子

## 📁 ファイル構成

```
/
├── auth.html                     # 認証UI（ログイン・登録）
├── auth-d1-client.js            # 認証クライアント
├── cloudflare-auth-worker.js     # Cloudflare Worker（バックエンド）
├── wrangler.toml                 # Cloudflare Worker設定
├── package.json                  # 依存関係
├── .env.example                  # 環境変数テンプレート
├── index.html                    # メインページ（認証状態表示）
└── browse.html                   # 問題ブラウザ（コメント認証連携）
```

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Cloudflare D1 データベースの作成

```bash
# D1データベースを作成
npx wrangler d1 create data-manager-auth-db

# データベースIDを wrangler.toml に設定
# database_id = "your-database-id-here" を実際のIDに置き換え
```

### 3. 環境変数の設定

```bash
# .env.example をコピー
cp .env.example .env

# 環境変数を編集
nano .env
```

必要な環境変数:
- `CLOUDFLARE_API_TOKEN`: Cloudflare API トークン
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare アカウント ID
- `ADMIN_TOKEN`: 管理者認証トークン
- `WEBAUTHN_RP_ID`: WebAuthn Relying Party ID（ドメイン名）
- `WEBAUTHN_ORIGIN`: WebAuthn Origin（https://your-domain.com）

### 4. データベースの初期化

```bash
# Cloudflare Worker をデプロイ
npx wrangler deploy

# データベーススキーマを初期化（管理者トークンが必要）
curl -X POST https://your-worker.your-subdomain.workers.dev/api/auth/init \
  -H "Authorization: Bearer your-admin-token"
```

### 5. フロントエンド設定

`auth-d1-client.js` の `baseUrl` を実際のWorker URLに変更:

```javascript
this.baseUrl = 'https://your-worker.your-subdomain.workers.dev';
```

## 🔐 認証フロー

### 新規登録
1. ユーザーがユーザーID、表示名、メールアドレスを入力
2. システムがお問い合わせ番号を自動生成（形式: `DM-YYYY-NNNNNN`）
3. WebAuthn でパスキーを登録
4. アカウント作成完了

### ログイン
1. ユーザーIDを入力
2. WebAuthn でパスキー認証
3. セッショントークンを発行
4. ログイン完了

### セッション管理
- セッショントークンは24時間有効
- localStorage に保存
- 自動的にAPIリクエストに含まれる

## 🛠️ API エンドポイント

### 認証API

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/auth/init` | POST | データベース初期化 |
| `/api/auth/register` | POST | ユーザー登録 |
| `/api/auth/passkey/register/begin` | POST | パスキー登録開始 |
| `/api/auth/passkey/register/complete` | POST | パスキー登録完了 |
| `/api/auth/passkey/login/begin` | POST | パスキーログイン開始 |
| `/api/auth/passkey/login/complete` | POST | パスキーログイン完了 |
| `/api/auth/me` | GET | 現在のユーザー情報取得 |
| `/api/auth/logout` | POST | ログアウト |
| `/api/auth/profile` | PUT | プロフィール更新 |
| `/api/auth/user/inquiry/{number}` | GET | お問い合わせ番号でユーザー検索 |

## 🎯 主な改善点

### 既存システムとの統合
- **コメントシステム**: ログインユーザーのみコメント投稿可能
- **ユーザー識別**: コメントに作成者情報を自動付与
- **セッション状態**: 全ページで認証状態を表示

### ユーザーエクスペリエンス
- **パスワードレス**: パスキーによる簡単ログイン
- **自動補完**: ログインユーザー情報の自動入力
- **リアルタイム更新**: 認証状態の即座反映

### セキュリティ強化
- **WebAuthn標準**: 業界標準の認証技術
- **生体認証**: デバイスの生体認証機能を活用
- **トークン管理**: 安全なセッション管理

## 📱 ブラウザ対応

| ブラウザ | パスキー対応 | 生体認証 |
|---------|-------------|---------|
| Chrome 67+ | ✅ | ✅ |
| Firefox 60+ | ✅ | ✅ |
| Safari 14+ | ✅ | ✅ |
| Edge 18+ | ✅ | ✅ |

## 🔧 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ステージング環境にデプロイ
npm run deploy:staging

# 本番環境にデプロイ
npm run deploy:production

# D1データベース操作
npm run d1:local
```

## 🚨 セキュリティ注意事項

1. **HTTPS必須**: WebAuthn はHTTPS環境でのみ動作
2. **ドメイン設定**: `WEBAUTHN_RP_ID` は実際のドメインと一致させる
3. **トークン管理**: 管理者トークンは安全に管理
4. **CORS設定**: 許可するオリジンを適切に設定

## 📞 サポート

お問い合わせ番号を使用してユーザーサポートが可能です：

```bash
# ユーザー検索API（管理者権限必要）
curl https://your-worker.your-subdomain.workers.dev/api/auth/user/inquiry/DM-2025-123456 \
  -H "Authorization: Bearer your-admin-token"
```

## 🔄 今後の予定

- [ ] パスキー複数登録対応
- [ ] 管理者ダッシュボード
- [ ] 監査ログ機能
- [ ] 二要素認証オプション
- [ ] パスキー管理UI

---

このシステムは[sys repository](https://github.com/polusiti/sys)のパターンを参考に、教育問題管理システムに特化した認証機能を提供します。