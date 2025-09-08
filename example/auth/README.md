# 認証システム管理センター

Cloudflare Workers ベースの認証システムの統合管理・テスト環境です。

## 📁 ファイル構成

```
example/auth/
├── index.html           # 管理センターメイン画面
├── production-test.html # 本番API完全テスト
├── basic-test.html      # 基本認証テスト
├── advanced-test.html   # 高度なテスト
├── auth.js             # 認証JavaScript
├── auth.css            # 認証スタイル
└── README.md           # このファイル
```

## 🚀 使用方法

1. **管理センター**: `index.html` - すべての認証テストの統合管理画面
2. **本番APIテスト**: `production-test.html` - Cloudflare Workers本番環境での完全テスト
3. **基本テスト**: `basic-test.html` - シンプルな認証動作確認
4. **高度なテスト**: `advanced-test.html` - 開発者向け詳細テスト

## 🔧 機能一覧

### 本番APIテスト機能
- ✅ ユーザー登録・ログイン・ログアウト
- ✅ プロフィール取得・表示
- ✅ エラーハンドリング
- ✅ 自動テスト実行
- ✅ リアルタイム API 状況監視

### 開発・デバッグ機能
- 🔧 詳細なリクエスト/レスポンス表示
- 🔧 エラー詳細分析
- 🔧 パフォーマンス測定
- 🔧 カスタムエンドポイントテスト

## 🌐 API エンドポイント

**Base URL**: `https://testapp-auth.t88596565.workers.dev/api`

- `GET /health` - ヘルスチェック
- `POST /auth/register` - ユーザー登録
- `POST /auth/login` - ログイン
- `POST /auth/logout` - ログアウト
- `GET /auth/me` - ユーザープロフィール取得

## 📊 システム要件

- モダンブラウザ（Chrome, Firefox, Safari, Edge）
- JavaScript有効
- インターネット接続（Cloudflare Workers API用）

## 🔒 セキュリティ

- トークンベース認証
- HTTPS通信
- CORS設定
- 入力検証

## 📈 今後の拡張予定

- [ ] 多要素認証テスト
- [ ] セッション管理強化
- [ ] ログ分析機能
- [ ] 負荷テスト機能
- [ ] パフォーマンス分析
- [ ] 自動テストスイート

---

> **注意**: これらのファイルは開発・テスト用です。本番環境での使用時は適切なセキュリティ設定を行ってください。