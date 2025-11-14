# 学習システム - Learning System

allfrom0.topで稼働する統合学習プラットフォーム。Mana問題管理からAI学習まで。

## 🚀 主な機能

- 📚 **Mana管理画面** - 全6科目の問題作成・管理システム
- 🎓 **学習システム** - 作成した問題で学習
- 🤖 **AI英作文添削** - AutoRAG + DeepSeek連携
- 🔐 **パスキー認証** - 生体認証で安全なログイン
- 📊 **進捗管理** - 学習履歴とトラッキング
- ⭐ **評価・コメントシステム** - 問題に対する星評価とコメント機能
- ✅ **ユーザー登録システム** - Email未提供でも登録可能に改善

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
│   └── rating-system.js       # 評価・コメントシステム
├── css/                       # スタイル
│   └── rating-system.css      # 評価システム専用スタイル
├── config/                    # 設定ファイル 🆕
│   ├── wrangler.toml         # Cloudflare Workers設定
│   ├── unified-api-worker.js # メインAPI Worker
│   └── workers/              # Worker関連ファイル 🆕
│       ├── unified-api-worker.js        # 統合API Worker
│       ├── unified-api-worker-with-ai.js # AI機能付きWorker
│       ├── mana-worker.js               # Mana管理画面Worker
│       ├── login-fixed-allfrom0.js      # ログイン修正版
│       └── api-handlers-questions.js    # 問題API Handler
├── docs/                      # ドキュメント
│   ├── SYSTEM_GUIDE.md       # 完全統合ガイド ⭐
│   ├── R2_SETUP.md           # R2設定ガイド
│   ├── MANA_INTEGRATION.md   # Mana統合レポート
│   ├── RATING_SYSTEM_IMPLEMENTATION.md     # 評価・コメントシステム実装
│   ├── REGISTRATION_FIX_IMPLEMENTATION.md  # ユーザー登録修正実装
│   ├── DATABASE_MIGRATION_GUIDE.md         # データベース移行ガイド
│   ├── API_CHANGES_AND_DEPLOYMENT.md       # API変更とデプロイ
│   ├── TROUBLESHOOTING_GUIDE.md            # トラブルシューティング
│   ├── FINAL_IMPLEMENTATION_SUMMARY.md     # 最終実装サマリー 🆕
│   ├── IMPLEMENTATION_COMPARISON.md        # 実装比較 🆕
│   ├── JS_RESTRUCTURE_REPORT.md            # JavaScript再構成レポート 🆕
│   ├── MANA_DASHBOARD_IMPLEMENTATION.md    # Manaダッシュボード実装 🆕
│   ├── MOBILE_PASSKEY_FIX.md               # モバイルパスキー修正 🆕
│   ├── SYSTEM_STATUS_REPORT.md             # システム状態レポート 🆕
│   └── VERIFICATION_REPORT.md              # 検証レポート 🆕
├── tests/                     # テストファイル 🆕
│   ├── test-*.html           # HTMLテストファイル
│   ├── test-*.sh             # シェルスクリプトテスト
│   ├── debug_api_request.sh  # APIデバッグスクリプト
│   └── test_questions.json   # テスト用問題データ
├── backups/                   # バックアップ 🆕
│   └── backup-20251105.sql   # データベースバック���ップ
├── sql/                       # SQLファイル
├── components/                # コンポーネント
├── experimental/              # 実験的機能
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

### システムドキュメント
| ドキュメント | 内容 |
|------------|------|
| [SYSTEM_GUIDE.md](docs/SYSTEM_GUIDE.md) | 📋 **必読**: 完全統合ガイド |
| [R2_SETUP.md](docs/R2_SETUP.md) | 🚀 R2システム設定 |
| [MANA_INTEGRATION.md](docs/MANA_INTEGRATION.md) | 📊 Mana統合状況 |

### 最新実装ドキュメント (2025-11-07)
| ドキュメント | 内容 |
|------------|------|
| [RATING_SYSTEM_IMPLEMENTATION.md](docs/RATING_SYSTEM_IMPLEMENTATION.md) | ⭐ **評価・コメントシステム完全実装** |
| [REGISTRATION_FIX_IMPLEMENTATION.md](docs/REGISTRATION_FIX_IMPLEMENTATION.md) | 🔧 **ユーザー登録問題完全解決** |
| [DATABASE_MIGRATION_GUIDE.md](docs/DATABASE_MIGRATION_GUIDE.md) | 🗄️ **データベース移行完全ガイド** |
| [API_CHANGES_AND_DEPLOYMENT.md](docs/API_CHANGES_AND_DEPLOYMENT.md) | 🚀 **API変更とデプロイ手順** |
| [TROUBLESHOOTING_GUIDE.md](docs/TROUBLESHOOTING_GUIDE.md) | 🛠️ **トラブルシューティング完全ガイド** |

## 🚀 デプロイ

### フロントエンド (Pages)
```bash
# 1. デプロイ
git add -A
git commit -m "更新"
git push origin main

# 2. Cloudflare Pagesで自動デプロイ
```

### APIエンドポイント (Workers)
```bash
# 1. API Worker デプロイ
cd config
CLOUDFLARE_API_TOKEN="your-token" npx wrangler deploy --env=""

# 2. 本番環境デプロイ
npx wrangler deploy --env production
```

### データベース (D1)
```bash
# 1. マイグレーション実行
npx wrangler d1 execute learning-notebook-db --file=sql/simple-workaround.sql --remote

# 2. 状態確認
npx wrangler d1 execute learning-notebook-db --command="SELECT COUNT(*) FROM users_v2;" --remote
```

## 🔗 関連リンク

### 本番環境
- **本番サイト**: https://allfrom0.top
- **APIエンドポイント**: https://api.allfrom0.top/api/
- **GitHub**: https://github.com/polusiti/sys

### 開発環境
- **API Worker**: https://api.allfrom0.top
- **登録APIテスト**: https://fixed-registration-worker.t88596565.workers.dev/api/auth/register

## 📊 最新更新情報

### 2025-11-14 - リポジトリ構成整理 🗂️
- **変更**: ルートディレクトリのファイルを整理
- **新規**: `tests/`, `backups/`, `config/workers/` ディレクトリ作成
- **移動**: ドキュメント、テスト、バックアップファイルを適切な場所に配置
- **効果**: ルートディレクトリがクリーンになり、プロジェクト構造が明確化

### 2025-11-07 - 評価・コメントシステム完全実装 ⭐
- **機能**: 問題に対する星評価（1-5段階）とコメント機能
- **特徴**: 削除、ソート、統計表示、ユーザー評価表示
- **対応**: レスポンシブデザイン、モバイル最適化
- **統合**: study.html に完全統合、API連携完了

### 主な変更点
- ✅ 星評価投稿機能（1-5段階）
- ✅ コメント機能（500文字制限）
- ✅ 評価統計��示（平均評価、分布グラフ）
- ✅ ユーザー既存評価の表示・編集
- ✅ 評価削除機能（自分の評価のみ）
- ✅ ソート機能（最新順、評価高/低順）
- ✅ 独立CSSファイル構成
- ✅ 完全なAPI実装

**詳細**: [RATING_SYSTEM_IMPLEMENTATION.md](docs/RATING_SYSTEM_IMPLEMENTATION.md)

### 2025-11-05 - ユーザー登録システム完全修正 ✅
- **問題**: `users.email NOT NULL constraint` エラーを完全解決
- **解決**: `users_v2` テーブル作成とemail NULL許容化
- **機能**: Email未提��時の自動生成機能を実装
- **ステータス**: 全テストケースで正常動作を確認

---

**最終更新**: 2025-11-14
**バージョン**: v3.3 (リポジトリ構成整理版)
