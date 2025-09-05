# Question Manager - 問題管理システム

スマホ最適化された問題作成・管理システム。LaTeX対応、画像アップロード、詳細な解説機能付き。

## 🚀 主な機能

- 📱 **スマホ最適化UI** - タッチ操作に最適化されたインターフェース
- 🔐 **認証システム** - 柔軟な権限管理（デモモード対応）
- 📊 **複数形式対応** - A1(4択), A2(6択), A3(9択), F1(分数), F2(自由入力), 記述式
- 🎨 **LaTeXサポート** - 数式・化学式などの高度な表現が可能
- 📷 **画像アップロード** - 問題画像の挿入機能
- 💾 **オフライン対応** - IndexedDBによるローカル保存
- 📥 **一括インポート** - CSV/JSON/Excelからのデータ取り込み
- 🔍 **検索・フィルタ** - 科目、難易度、タグでの絞り込み
- 📈 **統計分析** - 問題の利用状況、正答率の分析

## 📋 現在の機能

### ✅ 完全実装済み
- **問題一覧表示**: IndexedDBから問題を読み込み表示
- **高度な検索**: 問題文、ID、タグでの全文検索
- **フィルタリング**: 科目、形式、難易度、タグでの絞り込み
- **ソート機能**: ID、科目、難易度、更新日順
- **ページネーション**: 大量データ対応（20件/ページ）
- **問題作成**: モバイル最適化の簡単作成画面
- **高度な編集**: LaTeX・画像対応の高度なエディター
- **一括インポート**: CSV/JSON/Excelからのデータ取り込み
- **認証システム**: ユーザー管理と権限制御
- **オフライン動作**: PWA機能によるオフライン対応
- **統計表示**: 総問題数、アクティブユーザー、最近の活動

### 🔧 技術的特徴
- **IndexedDB**: 大量データ対応の高速なローカルDB
- **localStorageフォールバック**: 旧ブラウザ対応
- **PWA対応**: ホーム画面への追加可能
- **レスポンシブ**: PC/スマホ/タブレット対応
- **MathJax統合**: LaTeX数式の美麗な表示

## 📂 ファイル構成

### 主要HTMLファイル
- `index.html` - 問題管理メイン画面
- `dashboard.html` - 管理者ダッシュボード
- `login.html` - ログイン画面
- `mobile-creator.html` - スマホ用問題作成画面
- `mobile-creator-standalone.html` - 認証不要のスタンドアロン版
- `advanced-editor.html` - 高度な問題編集画面
- `bulk-import.html` - 一括インポート画面
- `test-auth.html` - 認証テスト画面

### JavaScriptファイル
- `auth-fixed.js` - 認証システム（改善版）
- `database-fixed.js` - データベースシステム（改善版）
- `question-manager.js` - 問題管理機能
- `mobile-creator.js` - モバイル問題作成
- `advanced-editor.js` - 高度なエディター
- `bulk-import.js` - 一括インポート
- `dashboard.js` - ダッシュボード
- `pwa.js` - PWA機能
- `sw.js` - Service Worker
- `worker.js` - Cloudflare Worker

### CSSファイル
- `common.css` - 共通スタイル定義

## 🚀 使用方法

### クイックスタート（スタンドアロン版）
1. `mobile-creator-standalone.html` を開く
2. 認証なしで即座に問題作成が可能

### 通常モード
1. `login.html` にアクセス
2. ユーザー名: `sys` / パスワード: 任意（デモモード）
3. 各機能へアクセス可能

### デモモードの有効化
```javascript
// ブラウザコンソールで実行
window.auth.enableDemoMode();
```

## 📋 問題フォーマット

### 基本構造
```json
{
  "id": "math-algebra-001",
  "subject": "math",
  "topic": "二次方程式",
  "question": "次の方程式を解きなさい。$x^2 + 3x - 4 = 0$",
  "answerFormat": "A1",
  "choices": ["x=1", "x=-4", "x=1,-4", "解なし"],
  "correctAnswers": [2],
  "explanation": "因数分解すると $(x+4)(x-1)=0$ より...",
  "difficulty": 2,
  "estimatedTime": 3,
  "tags": ["方程式", "因数分解"]
}
```

### 解答形式一覧
- **A1**: 4択問題
- **A2**: 6択問題
- **A3**: 9択問題
- **F1**: 分数入力 (a+√b)/c 形式
- **F2**: 自由入力（複数パターン対応）
- **ESSAY**: 記述式（キーワード評価）

## 🔧 開発環境

### ローカルで実行
1. Webサーバーを起動（Python例）
```bash
cd sys20250902/tools/question-manager
python -m http.server 8000
```

2. ブラウザでアクセス
```
http://localhost:8000
```

### Cloudflare Pages + R2 デプロイ
1. R2バケットの作成
2. wranglerの設定
3. デプロイ実行

## 🐛 修正された問題

### 認証システム
- ✅ リダイレクトループの修正
- ✅ デモモードの追加
- ✅ 権限チェックの柔軟化
- ✅ 複数認証システムの共存

### データベース
- ✅ IndexedDB対応の強化
- ✅ エラーハンドリングの改善
- ✅ localStorageからの移行機能
- ✅ 非同期処理の最適化

### UI/UX
- ✅ スタイリングの統一
- ✅ レスポンシブデザインの改善
- ✅ モバイル最適化の強化
- ✅ 一貫性のあるカラーパレット

## 📱 PWA機能

- オフライン動作対応
- ホーム画面への追加可能
- プッシュ通知対応（将来的）
- バックグラウンド同期

## 🔧 システム要件

- **ブラウザ**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **ストレージ**: IndexedDB 1GB以上推奨
- **ネットワーク**: オフラインでも動作可能

## 🤝 貢献

1. このリポジトリをクローン
2. 機能ブランチを作成
3. 変更をコミット
4. プルリクエストを作成

## 📄 ライセンス

内部利用向け

## 🔗 関連リンク

- [Cloudflare Pages](https://pages.cloudflare.com/)
- [IndexedDB API](https://developer.mozilla.org/ja/docs/Web/API/IndexedDB_API)
- [MathJax](https://www.mathjax.org/)
- [PWAドキュメント](https://developers.google.com/web/progressive-web-apps)

---

最終更新: 2024/01/15