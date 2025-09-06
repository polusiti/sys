# 問題解答システム

Workers APIを使用した問題解答システムです。managerで作成した問題をR2から取得し、ユーザーが解くことができます。

## 🌟 特長

- **Workers API対応**: 元のシステムと同じAPIを使用
- **教科別対応**: 英語・日本語・数学の問題に対応
- **音声再生**: 音声ファイル付き問題の再生機能
- **進捗管理**: 正解数・正答率のリアルタイム表示
- **レスポンシブデザイン**: スマートフォンでも使用可能

## 📋 必要なファイル

- `package.json` - 依存関係定義
- `server.js` - メインサーバーファイル
- `workers-api-client.js` - Workers APIクライアント
- `.env.example` - 環境変数テンプレート
- `public/index.html` - 解答インターフェース

## 🚀 セットアップ手順

1. **依存関係のインストール**
   ```bash
   npm install
   ```

2. **環境変数の設定**
   ```bash
   cp .env.example .env
   # .envファイルを編集（必要に応じてポート番号などを変更）
   ```

3. **サーバーの起動**
   ```bash
   npm start
   ```

4. **アクセス**
   ブラウザで `http://localhost:3000` にアクセス

## ⚙️ 設定

### 環境変数 (.env)
```
PORT=3000                    # サーバーポート
NODE_ENV=development         # 実行環境
```

### Workers API設定
- **Base URL**: `https://questa-r2-api.t88596565.workers.dev/api`
- **Token**: `questa-admin-2024`

## 📚 使用方法

1. **教科を選択**: 英語・日本語・数学から選択
2. **ユーザーIDを入力**: 学習進捗の管理用
3. **問題数を設定**: 5〜30問から選択
4. **難易度を選択**: 簡単・普通・難しい（任意）
5. **学習開始**: 問題を解いていく

## 🔧 APIエンドポイント

- `GET /api/subjects` - 教科一覧取得
- `POST /api/session/start` - セッション開始
- `GET /api/session/:sessionId/question/:index` - 問題取得
- `POST /api/session/:sessionId/answer/:index` - 解答送信
- `GET /api/session/:sessionId/stats` - 進捗取得
- `GET /api/question/random/:subject` - ランダム問題取得

## 🛠️ 技術スタック

- **Node.js**: サーバーサイド
- **Express.js**: ウェブフレームワーク
- **Workers API**: R2データアクセス
- **HTML/CSS/JavaScript**: フロントエンド

## 📝 注意事項

- Workers APIのトークンはハードコードされています
- インターネット接続が必要です（Workers APIにアクセスするため）
- 音声ファイルはWorkers API経由でストリーミング再生されます

## 🤝 連携

このシステムは以下のシステムと連携します：
- **managerシステム**: 問題作成・管理
- **Workers API**: R2ストレージアクセス
- **Cloudflare R2**: 問題データ保存

---

作成日: 2025-01-06
バージョン: 1.0.0