# 問題作成ツール (Question Creator)

スマホ対応の問題作成ツール。Cloudflare Pages + R2 + Workersで超低コスト運用。

## 🌟 特徴

- **スマホ最適化**: タッチ操作に最適化されたUI
- **オフライン対応**: PWAでオフラインでも問題作成可能
- **LaTeXサポート**: 数式を簡単に入力
- **リアルタイムプレビュー**: 作成しながら確認
- **自動保存**: 下書きを自動保存
- **検索機能**: 問題を簡単に検索
- **統計表示**: 作成状況を可視化
- **超低コスト**: 月額$0.50から運用可能

## 💰 コスト

| サービス | 料金 |
|---------|------|
| Cloudflare Pages | 無料 |
| Cloudflare R2 | $0.50/月（10GBまで） |
| Cloudflare Workers | 無料（100,000リクエスト/日） |
| **合計** | **約70円/月** |

## 🚀 セットアップ

### 1. リポジトリをクローン
```bash
git clone <your-repo-url>
cd question-creator
```

### 2. 依存関係をインストール
```bash
npm install
```

### 3. Cloudflareの設定

#### R2バケットの作成
```bash
wrangler r2 bucket create questa
```

#### 環境変数の設定
```bash
wrangler secret put ALLOWED_ORIGIN
# 値: https://your-domain.pages.dev
```

### 4. デプロイ
```bash
./deploy.sh
```

## 📱 使い方

### 1. 問題を作成
1. 作成画面で教科・トピックを選択
2. 解答形式を選択（A1/A2/A3/F1/F2）
3. 問題文を入力（LaTeX対応）
4. 選択肢や正解を設定
5. 画像が必要ならアップロード
6. プレビューを確認して保存

### 2. LaTeXの使い方
- インライン数式: `$x^2 + y^2 = z^2$`
- ブロック数式: `$$x = \f{-b \pm \s{b^2 - 4ac}}{2a}$$`
- よく使うコマンド:
  - 分数: `\f{分子}{分母}`
  - ルート: `\s{式}`
  - ベクトル: `\v{v}`
  - 組合せ: `\c{n}{k}`

### 3. 検索機能
- キーワードで問題を検索
- 教科でフィルタリング
- オフラインでも検索可能

## 🏗️ アーキテクチャ

```
[スマホ] ←→ [Cloudflare Pages] ←→ [Cloudflare Workers] ←→ [R2 Storage]
    PWA          静的サイト           APIプロキシ          問題データ
```

## 📁 ディレクトリ構成

```
question-creator/
├── public/              # 静的ファイル
│   ├── index.html       # メインHTML
│   ├── manifest.json    # PWAマニフェスト
│   └── sw.js           # Service Worker
├── src/
│   ├── js/             # JavaScriptソース
│   └── css/            # CSSソース
├── wrangler/           # Workersコード
├── templates/          # テンプレート
└── deploy.sh          # デプロイスクリプト
```

## 🔧 開発

### ローカル開発
```bash
# 開発サーバー起動
npm run dev

# アセットのビルド
npm run build

# ファイルの監視
npm run watch
```

### カスタマイズ
- `tailwind.config.js` でデザインをカスタマイズ
- `src/js/app.js` で機能を追加
- `wrangler/index.js` でAPIを拡張

## 📊 機能拡張アイデア

1. **問題のエクスポート**
   - PDF出力
   - 画像生成
   - 共有機能

2. **AI支援**
   - 問題の自動生成
   - 難易度自動判定
   - 類題検索

3. **協業機能**
   - 複数ユーザー対応
   - レビューシステム
   - コメント機能

4. **学習支援**
   - 進捗管理
   - 復習スケジュール
   - 成績分析

## 🤝 貢献

1. Forkする
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

## 📄 ライセンス

MIT License - [LICENSE](LICENSE) を参照

## 🙏 謝辞

- [Tailwind CSS](https://tailwindcss.com/)
- [KaTeX](https://katex.org/)
- [Cloudflare](https://www.cloudflare.com/)