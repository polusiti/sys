# R2 Audio Upload Server

このサーバーは、Question ManagerシステムでアップロードされたMP3ファイルをCloudflare R2に保存するためのバックエンドAPIです。

## 環境変数の設定

以下の環境変数を設定する必要があります：

```bash
# R2接続情報
export R2_ENDPOINT="https://your-account.r2.cloudflarestorage.com"
export R2_ACCESS_KEY_ID="your-access-key"
export R2_SECRET_ACCESS_KEY="your-secret-key"
export R2_BUCKET_NAME="questa"
export R2_PUBLIC_URL="https://pub-xxxx.r2.dev"

# サーバー設定
export PORT=3001
```

## インストール方法

1. 依存関係をインストール：
```bash
npm install
```

2. 環境変数を設定：
```bash
# .envファイルを作成
cp .env.example .env
# .envファイルを編集
```

3. サーバーを起動：
```bash
npm start
```

## APIエンドポイント

### POST /api/upload-audio
音声ファイルをR2にアップロードします。

**リクエスト:**
- Content-Type: multipart/form-data
- Body:
  - file: MP3/WAVファイル
  - questionId: 問題ID
  - category: カテゴリー（例: english）
  - type: タイプ（例: listening）

**レスポンス:**
```json
{
  "success": true,
  "r2Path": "audio/questionId_timestamp_random.mp3",
  "r2Url": "https://signed-url...",
  "publicUrl": "https://pub-xxxx.r2.dev/audio/questionId_timestamp_random.mp3",
  "size": 1024000,
  "originalName": "original_filename.mp3",
  "mimeType": "audio/mp3",
  "uploadedAt": "2025-09-03T15:30:00Z"
}
```

### GET /api/audio/:fileName
指定されたファイルの署名付きURLを取得します。

### GET /api/audio-list
アップロードされたファイルの一覧を取得します。

### GET /health
サーバーのヘルスチェックを行います。

## ファイル構成

```
tools/manager/
├── r2-upload-server.js      # メインサーバーファイル
├── package.json            # 依存関係設定
├── .env.example           # 環境変数テンプレート
└── README.md             # このファイル
```

## セキュリティ設定

- ファイルサイズ制限: 50MB
- 許可ファイルタイプ: MP3, WAV
- 署名付きURLの有効期限: 1年
- CORS設定: 開発環境では全許可

## エラーハンドリング

- 400: ファイルが選択されていない、または不正なファイル形式
- 500: R2アップロードエラー、サーバーエラー

## デプロイ方法

1. Cloudflare WorkersまたはVPSにデプロイ
2. 環境変数を設定
3. サーバーを起動
4. ファイアウォールでポート3001を開放

## トラブルシューティング

### アップロードが失敗する場合
- R2の認証情報を確認
- バケット名を確認
- ファイルサイズが50MBを超えていないか確認

### 署名付きURLが無効な場合
- R2の公開URL設定を確認
- アクセスキーの権限を確認

### ファイルが見つからない場合
- ファイル名のエンコーディングを確認
- R2バケット内のファイルパスを確認