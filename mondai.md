# セキュリティ脆弱性対応リスト

## 概要
Data Manager学習問題共有システムにおけるセキュリティ脆弱性の修正要件と対策をまとめています。
AIアシスタントがこのドキュメントを参照して修正作業を行う際の指針として使用してください。

## 重要度について
- **🔴 緊急 (Critical)**: システム全体の安全性に関わる。24時間以内に修正が必要
- **🟠 高 (High)**: データ漏洩や不正アクセスのリスク。1週間以内に修正
- **🟡 中 (Medium)**: セキュリティ強化のため。1ヶ月以内に修正

---

## 🔴 緊急対応項目（24時間以内）

### 1. ハードコードされた認証情報の除去
**影響**: システム全体の乗っ取りが可能
**対象ファイル**:
- `questa-d1-client.js` (8-10行目)
- `auth-d1-client.js` (11行目)
- `wrangler.toml` (4, 19, 35-36行目)

#### 修正要件:
- [ ] `questa-d1-client.js`のハードコードされたAPI認証情報を環境変数に移行
- [ ] `auth-d1-client.js`の固定管理者トークン`questa-admin-2024`を削除
- [ ] `wrangler.toml`のアカウントIDとトークンを環境変数に変更
- [ ] 既存のトークンを無効化し、新しいトークンを生成
- [ ] `.env.example`ファイルを作成して環境変数テンプレートを提供

#### 実装方針:
```javascript
// 修正前（危険）
this.apiToken = config.apiToken || '979qaSPTwReNQMzibGKohQiHPELJBbQVLNJerYBy';

// 修正後（安全）
this.apiToken = config.apiToken || process.env.CLOUDFLARE_API_TOKEN;
if (!this.apiToken) {
    throw new Error('CLOUDFLARE_API_TOKEN environment variable is required');
}
```

### 2. WebAuthn認証バイパスの修正
**影響**: 任意のユーザーとして認証可能
**対象ファイル**: `cloudflare-auth-worker.js` (46-67行目)

#### 修正要件:
- [ ] `verifyRegistrationResponse`メソッドで常にtrueを返すロジックを削除
- [ ] 適切なCBORデコーディングを実装
- [ ] 署名検証ロジックを実装
- [ ] チャレンジ検証を実装
- [ ] オリジン検証を実装

#### 実装方針:
```javascript
// WebAuthn仕様に準拠した実装が必要
// 署名検証、チャレンジ検証、オリジン検証を含む
```

### 3. SQLインジェクション脆弱性の修正
**影響**: データベース全体の読み取り・操作が可能
**対象ファイル**:
- `cloudflare-auth-worker.js` (823-824行目)
- `questa-d1-client.js` (252-253行目)

#### 修正要件:
- [ ] 動的SQL構築でのパラメータ化不備を修正
- [ ] ソート条件の直接文字列挿入を修正
- [ ] 全てのクエリでプリペアドステートメントを使用
- [ ] ホワイトリスト方式での入力値検証を実装

#### 実装方針:
```javascript
// 修正前（危険）
sql += ` ORDER BY q.${sortColumn} ${sortOrder}`;

// 修正後（安全）
const allowedSortColumns = ['created_at', 'updated_at', 'title', 'difficulty'];
const allowedSortOrders = ['ASC', 'DESC'];
if (!allowedSortColumns.includes(sortColumn) || !allowedSortOrders.includes(sortOrder)) {
    throw new Error('Invalid sort parameters');
}
sql += ` ORDER BY q.${sortColumn} ${sortOrder}`;
```

### 4. CORS設定の制限
**影響**: クロスオリジン攻撃による認証情報盗取
**対象ファイル**: `cloudflare-auth-worker.js` (94-95行目)

#### 修正要件:
- [ ] `Access-Control-Allow-Origin: *`を削除
- [ ] 許可するオリジンのホワイトリストを作成
- [ ] 環境別のオリジン設定を実装
- [ ] プリフライトリクエストの適切な処理

#### 実装方針:
```javascript
// 本番環境でのみ特定のドメインを許可
const allowedOrigins = [
    'https://data.allfrom0.top',
    'https://your-domain.com'
];
```

---

## 🟠 高優先度項目（1週間以内）

### 5. XSS脆弱性の修正
**影響**: セッションハイジャック、データ盗取
**対象ファイル**:
- `media-manager-ui.js`
- `assets/js/search-manager.js`
- `index.html`

#### 修正要件:
- [ ] 全ての`innerHTML`使用箇所でHTMLエスケープを実装
- [ ] ユーザー入力の適切なサニタイゼーション
- [ ] Content Security Policy (CSP) ヘッダーの追加
- [ ] DOM操作の安全な方法への変更

#### 実装方針:
```javascript
// HTMLエスケープ関数の実装と使用
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

### 6. セッション管理の改善
**影響**: セッションハイジャック、永続的な不正アクセス
**対象ファイル**: `auth-d1-client.js`

#### 修正要件:
- [ ] localStorageからHTTP-onlyクッキーへの移行
- [ ] サーバーサイドでのセッション検証実装
- [ ] セッションの適切な有効期限設定
- [ ] セッション無効化機能の実装

### 7. 入力値検証の強化
**影響**: データ破損、インジェクション攻撃
**対象ファイル**: `cloudflare-auth-worker.js` (364-369行目)

#### 修正要件:
- [ ] 全ての入力パラメータに対する型検証
- [ ] 文字列長制限の実装
- [ ] 特殊文字のエスケープ処理
- [ ] スキーマベースの検証システム導入

### 8. APIレート制限の実装
**影響**: ブルートフォース攻撃、リソース枯渇
**対象ファイル**: 全APIエンドポイント

#### 修正要件:
- [ ] エンドポイント別のレート制限設定
- [ ] IPアドレス単位での制限
- [ ] 認証試行回数の制限
- [ ] DDoS対策の実装

---

## 🟡 中優先度項目（1ヶ月以内）

### 9. ファイルアップロードセキュリティの強化
**対象ファイル**: `cloudflare-auth-worker.js` (884-895行目)

#### 修正要件:
- [ ] ファイル内容の検証（MIMEタイプスプーフィング対策）
- [ ] ファイルサイズ制限の調整
- [ ] マルウェアスキャンの実装
- [ ] アップロードファイルの隔離

### 10. セキュリティヘッダーの追加
**対象ファイル**: 全HTMLファイル

#### 修正要件:
- [ ] Content Security Policy (CSP)
- [ ] X-Frame-Options
- [ ] X-Content-Type-Options
- [ ] Strict-Transport-Security (HSTS)
- [ ] Referrer-Policy

### 11. ログ・監視システムの実装
#### 修正要件:
- [ ] セキュリティイベントのログ記録
- [ ] 異常なアクセスパターンの検知
- [ ] 管理者への通知システム
- [ ] 監査ログの実装

### 12. 依存関係の脆弱性チェック
#### 修正要件:
- [ ] npm auditの実行と修正
- [ ] 定期的な依存関係更新
- [ ] 脆弱性スキャンの自動化

---

## 実装ガイドライン

### AIアシスタント向けの注意事項:
1. **段階的実装**: 緊急度の高いものから順番に修正すること
2. **テスト**: 修正後は必ず動作確認を行うこと
3. **バックアップ**: 修正前に既存コードをバックアップすること
4. **コメント**: 修正箇所にはセキュリティ対応である旨をコメントで記載すること

### 修正作業時の必須チェック項目:
- [ ] 修正により新たな脆弱性が生まれていないか
- [ ] 既存機能に影響がないか
- [ ] 適切なエラーハンドリングが実装されているか
- [ ] ログに機密情報が出力されていないか

---

## 進捗管理

### 緊急対応 (24時間以内)
- [ ] 認証情報の環境変数化
- [ ] WebAuthn実装の修正
- [ ] SQLインジェクション対策
- [ ] CORS設定の制限

### 高優先度 (1週間以内)
- [ ] XSS対策の実装
- [ ] セッション管理の改善
- [ ] 入力値検証の強化
- [ ] レート制限の実装

### 中優先度 (1ヶ月以内)
- [ ] ファイルアップロード強化
- [ ] セキュリティヘッダー追加
- [ ] ログ・監視システム
- [ ] 依存関係チェック

---

## 最終確認項目

修正完了後に必ず実施すること:
- [ ] セキュリティテストの実行
- [ ] ペネトレーションテストの実施
- [ ] コードレビューの完了
- [ ] 本番環境への反映計画の策定

---

**最終更新**: 2025-09-19
**担当**: AIアシスタント
**ステータス**: 修正待ち