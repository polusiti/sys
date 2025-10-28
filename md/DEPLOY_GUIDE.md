# 🚀 AutoRAG + DeepSeek 英作文添削システム デプロイガイド

## 📋 概要

Cloudflare Workers 上で **AutoRAG + DeepSeek API** を連携させた高度な英作文添削システムを構築します。

## 🛠️ デプロイ手順

### 1. 準備

```bash
# 1. プロジェクトディレクトリ作成
mkdir autorag-deepseek-worker
cd autorag-deepseek-worker

# 2. 必要なファイルをコピー
cp /path/to/autorag-deepseek-worker.js .
cp /path/to/wrangler.toml.autorag-template wrangler.toml
```

### 2. Wrangler初期化

```bash
# Wrangler プロジェクト初期化
npx wrangler init . --yes

# 既存プロジェクトの場合はスキップ
```

### 3. シークレット設定

```bash
# DeepSeek API Key
wrangler secret put DEEPSEEK_API_KEY
# プロンプトが表示されたらAPIキーを入力

# Cloudflare API Token (AutoRAG用)
wrangler secret put CF_API_TOKEN
# AI Search Read権限を持つトークンを入力
```

### 4. KV/D1リソース作成 (任意)

```bash
# KVネームスペース作成
wrangler kv namespace create "GRAMMAR_CACHE"
# wrangler.toml の KV ID を更新

# D1データベース作成
wrangler d1 create "grammar-correction-db"
# wrangler.toml の D1 ID を更新
```

### 5. デプロイ

```bash
# 開発環境でテスト
npx wrangler dev

# 本番環境にデプロイ
wrangler deploy

# 本番環境にデプロイ (環境指定)
wrangler deploy --env production
```

## 🎯 使用方法

### GET リクエスト (シンプル)
```bash
curl "https://your-worker.your-subdomain.workers.dev/?q=I+has+a+pen"
```

### POST リクエスト (JSON)
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"q": "She dont like apples but she likes banana"}'
```

### JSON形式レスポンス
```bash
curl "https://your-worker.your-subdomain.workers.dev/?q=My+English+is+very+bad&format=json"
```

## 📊 レスポンス例

### プレーンテキスト (デフォルト)
```
I have a pen.
```

### JSON形式
```json
{
  "success": true,
  "original": "I has a pen",
  "corrected": "I have a pen",
  "rag_used": true,
  "rag_results_count": 3,
  "rag_context_provided": true,
  "response_time": 1234,
  "timestamp": "2025-10-28T06:55:00.000Z",
  "rag_sources": [
    {
      "filename": "subject_verb_agreement.pdf",
      "score": 0.95,
      "snippet": "Subject-verb agreement: I have, he has..."
    }
  ]
}
```

## ⚙️ 設定

### 環境変数
- `ACCOUNT_ID`: Cloudflare Account ID
- `RAG_ID`: AutoRAG インスタンスID (`rough-bread-ff9e11`)
- `VECTOR_DB_NAME`: Vector Database名 (`ai-search-rough-bread-ff9e11`)

### シークレット
- `DEEPSEEK_API_KEY`: DeepSeek APIキー
- `CF_API_TOKEN`: Cloudflare API Token (AI Search Read権限)

## 🔧 トラブルシューティング

### AutoRAGが動作しない場合
1. AI Searchサービスが有効か確認
2. API Tokenに `AI Search:Read` 権限があるか確認
3. Vector Database名が正しいか確認 (`ai-search-` プレフィックス)

### DeepSeek APIエラー
1. APIキーが正しいか確認
2. クレジット残高があるか確認
3. レート制限を超えていないか確認

### デプロイエラー
1. wrangler.tomlの構文を確認
2. リソースIDが正しいか確認
3. シークレットが正しく設定されているか確認

## 📈 モニタリング

```bash
# リアルタイムログ監視
wrangler tail

# 特定環境のログ
wrangler tail --env production

# 過去のログ分析
wrangler tail --since 1h
```

## 🚀 高度な設定

### カスタムドメイン
```toml
routes = [
  { pattern = "grammar.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

### レート制限 (コード内実装)
- KVストアでのリクエストカウント
- IPベースの制限
- 時間帯制限

### キャッシュ戦略
- 同じクエリの結果をKVにキャッシュ
- TTL設定で自動更新
- 手動キャッシュクリアAPI

## 💡 ヒント

1. **AutoRAGコンテンツ**: Vector Databaseに文法ルール、例文、よくある間違いを登録
2. **プロンプト最適化**: ユーザーのレベルに合わせて調整
3. **エラーハンドリング**: フォールバック戦略を実装
4. **パフォーマンス**: 並列処理とキャッシュで応答時間改善

## 📞 サポート

- Cloudflare Workersドキュメント
- DeepSeek APIドキュメント
- AutoRAGガイドライン

---

**🎉 おめでとうございます！これでAutoRAG + DeepSeek連携の英作文添削システムが完成しました！**