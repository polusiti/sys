# 学習システム - Learning System

allfrom0.topで稼働する統合学習プラットフォーム。Mana問題管理からAI学習まで。

## 🚀 主な機能

- 📚 **Mana管理画面** - 全6科目の問題作成・管理システム
- 🎓 **学習システム** - 作成した問題で学習
- 🤖 **AI英作文添削** - AutoRAG + DeepSeek連携
- 🔐 **パスキー認証** - 生体認証で安全なログイン
- 📊 **進捗管理** - 学習履歴とトラッキング

## 📁 プロジェクト構成

```
sys/
├── pages/                     # アプリケーション
│   ├── login.html            # ログイン
│   ├── study.html            # 学習画面
│   ├── subject-select.html   # 科目選択
│   └── mana/                 # 管理画面
│       ├── index.html        # Manaトップ
│       ├── english-vocabulary/
│       ├── english-grammar/
│       ├── english-listening/
│       ├── math/
│       ├── physics/
│       └── chemistry/
├── js/                        # JavaScript
├── css/                       # スタイル
├── docs/                      # ドキュメント
│   ├── SYSTEM_GUIDE.md       # 完全統合ガイド ⭐
│   ├── R2_SETUP.md           # R2設定ガイド
│   └── MANA_INTEGRATION.md   # Mana統合レポート
└── _redirects, _headers       # Cloudflare設定
```

## 🎯 Mana管理システム

### 対応科目
- **英語**: 単語、文法、リスニング (passage形式対応)
- **数学**: KaTeX数式サポート、ライブプレビュー
- **物理**: 科学数式対応
- **化学**: 化学式・反応式対応

### 機能
- ✅ CRUD操作 (作成・読取・更新・削除)
- ✅ リアルタイムプレビュー
- ✅ API連携 (D1 SQLite)
- ⚠️ 編集機能 (3科目実装済)
- ❌ フィルタリング (未実装)

## 🤖 AI学習機能

### 英作文添削
- **AutoRAG**: 文法ルールベースの検索
- **DeepSeek API**: 高度な添削処理
- **マーカー表示**: 修正箇所の視覚化

### 学習システム
- 全科目対応
- 音声再生 (R2連携)
- passageモード (リスニング)

## 📖 詳細ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [SYSTEM_GUIDE.md](docs/SYSTEM_GUIDE.md) | 📋 **必読**: 完全統合ガイド |
| [R2_SETUP.md](docs/R2_SETUP.md) | 🚀 R2システム設定 |
| [MANA_INTEGRATION.md](docs/MANA_INTEGRATION.md) | 📊 Mana統合状況 |

## 🚀 デプロイ

```bash
# 1. デプロイ
git add -A
git commit -m "更新"
git push origin main

# 2. Cloudflare Pagesで自動デプロイ
# 3. WorkersでAPIデプロイ
```

## 🔗 関連リンク

- **本番サイト**: https://allfrom0.top
- **API**: https://questa-r2-api.t88596565.workers.dev
- **GitHub**: https://github.com/polusiti/sys

---

**最終更新**: 2025-10-31
**バージョン**: v3.0 (統合整理版)