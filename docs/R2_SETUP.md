# 🚀 Questa R2 統合システム

## 📋 概要

allfrom0.topサイトのquesta R2バケット完全統合システム。問題作成から配信まで全てR2で管理。

## 🏗️ アーキテクチャ

```
【問題作成フロー】
管理画面 → R2サーバー → questa バケット → 自動バックアップ

【問題配信フロー】  
問題ページ → R2 API → CDNキャッシュ → ユーザー
```

## ⚙️ システム構成

### 1. **R2サーバー** (`manager/r2-upload-server.js`)
- 問題JSON保存/取得
- 音声ファイル管理 
- 自動ファイルクリーンアップ
- 簡単認証（管理者専用）

### 2. **管理画面** (`manager/english/`)
- R2連携問題作成
- 音声アップロード
- リアルタイム保存
- データ移行機能

### 3. **配信システム** (`assets/js/questa-question-loader.js`)
- R2優先読み込み
- 静的ファイルフォールバック
- 自動キャッシング

## 🔧 セットアップ

### **必要な環境変数** (`.env`ファイル)
```env
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-key-here
R2_SECRET_ACCESS_KEY=your-secret-here  
R2_PUBLIC_URL=https://pub-your-domain.r2.dev
ADMIN_TOKEN=your-secure-token
```

### **起動方法**
```bash
# 1. 環境設定
cp manager/.env.example manager/.env
# → .envを編集

# 2. デプロイ実行
./deploy-r2.sh

# 3. 手動起動の場合
cd manager && npm start
```

## 📱 使用方法

### **管理者向け**

#### 1. **問題作成**
1. https://allfrom0.top/manager/english/ にアクセス
2. 管理者トークン入力 
3. 問題作成・編集
4. 「R2に保存」ボタンでアップロード

#### 2. **音声追加**
1. リスニング問題作成時
2. 音声ファイル選択（MP3/WAV）
3. 自動でR2アップロード・URL生成

#### 3. **データ移行**
```javascript
// localStorageからR2への一括移行
await questaManager.migrateFromLocalStorage('english');
```

### **ユーザー向け**
- 既存のページ（english.html等）がそのまま動作
- R2から自動取得、フォールバック付き
- 音声再生もR2対応

## 💰 コスト最適化

### **R2料金構造**
- ストレージ: $0.015/GB/月
- Class A操作: $4.50/100万リクエスト  
- Class B操作: $0.36/100万リクエスト
- 帯域: 無料（CloudFlare経由）

### **最適化設定**
- **自動クリーンアップ**: 古い問題ファイル削除（10世代保持）
- **CDNキャッシュ**: CloudFlareで配信高速化
- **圧縮**: JSON minify、音声最適化
- **バッチ処理**: 複数問題まとめて保存

## 🔒 セキュリティ

- **管理者認証**: シンプルトークン方式
- **CORS設定**: allfrom0.topドメイン限定
- **ファイル制限**: 音声100MB、適切な形式のみ
- **レート制限**: 今後追加予定

## 🛠️ API仕様

### **問題管理**
```javascript
// 保存
POST /api/questions/:subject
Authorization: Bearer {token}
Body: { questions: [...] }

// 取得  
GET /api/questions/:subject
Response: { questions: [...], metadata: {...} }
```

### **音声管理**
```javascript
// アップロード
POST /api/upload/audio
Authorization: Bearer {token}
FormData: audio file

// 応答
{ url: "https://pub-xxx.r2.dev/audio/...", filename: "..." }
```

## 📊 管理・監視

### **ログ確認**
```bash
# サーバーログ
cd manager && npm run logs

# R2使用量
cloudflare r2 bucket stats questa
```

### **トラブルシューティング**
1. **接続エラー**: `.env`設定確認
2. **認証エラー**: ADMIN_TOKEN確認  
3. **アップロード失敗**: ファイルサイズ・形式確認

## 🚀 今後の拡張

- [ ] 画像ファイル対応
- [ ] 問題統計・分析
- [ ] 自動バックアップ
- [ ] API レート制限
- [ ] 管理者ダッシュボード

---

**✅ 完全にR2統合されたコストパフォーマンス最適システム**