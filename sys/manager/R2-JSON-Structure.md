# R2音声ファイル管理 - JSONデータ構造

## 音声ファイル付きリスニング問題のJSON構造

MP3ファイルをR2で管理する場合のJSONデータ構造は以下のようになります：

### 基本構造

```json
{
  "id": "q_en_listening_1725364800000_abc123",
  "category": "listening",
  "format": "choice4",
  "title": "日常会話の聞き取り",
  "difficulty": 3,
  "estimatedTime": 5,
  "points": 20,
  "explanation": "二人の会話から場所や状況を理解する問題です。",
  "tags": ["日常会話", "場所", "状況判断"],
  "setTitle": "カフェでの会話",
  "setDescription": "カフェでの二人の会話を聞いて、内容に関する質問に答えます。",
  "audioFile": {
    "filename": "cafe_conversation.mp3",
    "r2Path": "audio/q_en_listening_1725364800000_abc123_1725364800000_1a2b3c.mp3",
    "r2Url": "https://pub-xxxx.r2.dev/audio/q_en_listening_1725364800000_abc123_1725364800000_1a2b3c.mp3",
    "publicUrl": "https://pub-xxxx.r2.dev/audio/q_en_listening_1725364800000_abc123_1725364800000_1a2b3c.mp3",
    "size": 2048000,
    "duration": "02:15",
    "mimeType": "audio/mp3",
    "uploadedAt": "2025-09-03T15:30:00Z",
    "metadata": {
      "questionId": "q_en_listening_1725364800000_abc123",
      "category": "english",
      "type": "listening",
      "originalName": "cafe_conversation.mp3",
      "uploadTime": "2025-09-03T15:30:00Z"
    }
  },
  "questions": [
    {
      "number": 1,
      "question": "二人はどこで会話をしていますか？",
      "choiceCount": 4,
      "choices": [
        "レストラン",
        "カフェ",
        "図書館",
        "公園"
      ],
      "correctAnswer": 1
    },
    {
      "number": 2,
      "question": "女性は何を注文しますか？",
      "choiceCount": 4,
      "choices": [
        "コーヒー",
        "紅茶",
        "ジュース",
        "水"
      ],
      "correctAnswer": 0
    },
    {
      "number": 3,
      "question": "二人はこれから何をしますか？",
      "choiceCount": 4,
      "choices": [
        "映画を見る",
        "買い物に行く",
        "勉強する",
        "散歩する"
      ],
      "correctAnswer": 1
    }
  ],
  "createdAt": "2025-09-03T15:30:00Z",
  "updatedAt": "2025-09-03T15:30:00Z"
}
```

## audioFileオブジェクトの詳細

### 必須フィールド
- `filename`: 元のファイル名
- `r2Path`: R2内のファイルパス
- `r2Url`: 署名付きURL（アクセス制御用）
- `publicUrl`: 公開URL（直接アクセス用）
- `size`: ファイルサイズ（バイト）
- `duration`: 音声の長さ（MM:SS形式）
- `uploadedAt`: アップロード日時

### メタデータフィールド
- `questionId`: 関連する問題のID
- `category`: カテゴリー（english, math, japanese）
- `type`: 問題タイプ（listening）
- `originalName`: アップロード時の元ファイル名
- `uploadTime`: アップロード時刻

## R2ファイルの命名規則

```
audio/{questionId}_{timestamp}_{random}.{extension}
```

例:
- `audio/q_en_listening_1725364800000_abc123_1725364800000_1a2b3c.mp3`
- `audio/q_math_word_problem_1725364800000_def456_1725364800000_2b3c4d.wav`

## データフロー

1. **ファイルアップロード**
   - ユーザーがMP3ファイルを選択
   - フロントエンドでファイル情報を表示
   - 自動的にR2にアップロード
   - アップロード完了後にR2情報を取得

2. **データ保存**
   - R2からのレスポンスをaudioFileオブジェクトに保存
   - 問題データと一緒にJSON形式で保存
   - ローカルストレージまたはデータベースに保存

3. **ファイルアクセス**
   - プレビュー時: r2Url（署名付き）を使用
   - 本番環境: publicUrl（公開URL）を使用
   - 管理画面: r2Url（アクセス制御）を使用

## セキュリティ考慮事項

### 署名付きURL
- 有効期限: 1年
- アクセス制御が必要な場合に使用
- ユーザーごとに異なるURLを生成可能

### 公開URL
- 常にアクセス可能
- キャッシュ対策のためURLにタイムスタンプを含む
- CDNを介した配信が可能

### ファイル検証
- MIMEタイプの検証（MP3, WAVのみ）
- ファイルサイズ制限（50MB）
- ウイルススキャン（追加実装が必要）

## バックアップと復元

### バックアップ戦略
- R2の自動バックアップ機能を利用
- 定期的なJSONデータのエクスポート
- ファイルメタデータの別途保存

### 復元手順
1. R2からファイルを復元
2. JSONデータを復元
3. メタデータの整合性を確認
4. 公開URLの再生成

## パフォーマンス最適化

### CDN配信
- R2の公開URLはCDNを介して配信
- キャッシュ制御ヘッダーの設定
- 圧縮転送の有効化

### ファイルサイズ
- 必要に応じて音質を調整
- ロスレス圧縮の検討
- ストリーミング配信の対応