# 検索機能実装ガイド - Data Manager System

このドキュメントは、Data Manager System の検索機能の実装について説明します。

## 📋 概要

このプロジェクトは、既存の Data Manager System に包括的な検索機能を追加します。モバイルファーストデザインに従い、既存のアーキテクチャパターンと一貫性を保ちながら実装されています。

### 主要機能

- **キーワード検索**: 問題のタイトル、内容、タグを横断検索
- **高度なフィルター**: 科目、難易度、問題形式による絞り込み
- **検索履歴**: 最近の検索を保存・再利用
- **レスポンシブデザイン**: モバイル・デスクトップ両対応
- **オフライン対応**: ローカルストレージフォールバック
- **リアルタイム検索**: 入力中の動的検索

## 🏗️ アーキテクチャ

### フロントエンド
- **HTML**: `search.html` - メイン検索インターフェース
- **CSS**: モバイルファーストのレスポンシブデザイン
- **JavaScript**: クラスベースのモジュラー設計

### バックエンド
- **Cloudflare Worker**: 検索API エンドポイント
- **D1 Database**: SQLiteベースのクエリ処理
- **R2 Storage**: メディアファイル（将来拡張用）

### データフロー
```
フロントエンド → QuestaD1Client → Cloudflare Worker → D1 Database
             ↓
      LocalStorage (フォールバック)
```

## 📁 ファイル構成

```
/home/higuc/
├── search.html                    # メイン検索ページ
├── assets/
│   ├── css/
│   │   ├── global.css             # グローバルスタイル
│   │   └── search.css             # 検索ページ専用スタイル
│   └── js/
│       ├── search-manager.js      # 検索機能管理クラス
│       ├── questa-d1-client.js    # D1データベースクライアント
│       └── search-integration.js  # 既存サイト統合スクリプト
├── cloudflare/
│   ├── search-worker.js           # Cloudflare Worker実装
│   └── wrangler.toml             # デプロイ設定
└── deploy-search.sh              # デプロイスクリプト
```

## 🚀 セットアップ手順

### 1. 前提条件

- Cloudflare アカウント
- Wrangler CLI (`npm install -g wrangler`)
- 既存の Data Manager System

### 2. デプロイ

```bash
# デプロイスクリプトを実行
./deploy-search.sh
```

このスクリプトは以下を自動実行します：
- D1データベースの作成
- データベーススキーマのセットアップ
- サンプルデータの投入
- Cloudflare Worker のデプロイ

### 3. 静的ファイルのアップロード

以下のファイルをウェブホスティングにアップロード：

```bash
# 必須ファイル
search.html
assets/css/global.css
assets/css/search.css
assets/js/search-manager.js
assets/js/questa-d1-client.js
assets/js/search-integration.js
```

### 4. 既存サイトとの統合

メインサイトの `<head>` セクションに追加：

```html
<script src="assets/js/search-integration.js"></script>
```

## 🎨 デザイン仕様

### カラーパレット
```css
--color-primary: #667eea      /* メインカラー */
--color-bg: #f5f7fb          /* 背景色 */
--color-text: #1f2937        /* テキスト色 */
--color-border: #e5e7eb      /* ボーダー色 */
```

### レスポンシブブレークポイント
- モバイル: `< 640px`
- タブレット: `640px - 1024px`
- デスクトップ: `> 1024px`

### コンポーネント
- **ガラスモーフィズム効果**: `backdrop-filter: blur(20px)`
- **カードデザイン**: 角丸、シャドウ、ホバーエフェクト
- **チップフィルター**: 選択可能なタグスタイル

## 🔧 API仕様

### エンドポイント

#### 検索
```
GET /api/search/questions
```

**パラメータ:**
- `q`: 検索クエリ
- `subjects`: 科目フィルター (カンマ区切り)
- `difficulties`: 難易度フィルター (カンマ区切り)
- `types`: 問題形式フィルター (カンマ区切り)
- `sort`: ソート順 (`created_desc`, `difficulty_asc`, etc.)
- `limit`: 取得件数 (デフォルト: 20)
- `offset`: オフセット

**レスポンス:**
```json
{
  "questions": [...],
  "query": "検索語",
  "filters": {...},
  "count": 25
}
```

#### 検索候補
```
GET /api/search/suggestions?q=検索語&limit=10
```

#### 個別問題取得
```
GET /api/questions/{questionId}
```

### データベーススキーマ

```sql
CREATE TABLE questions (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,           -- 科目 (math, english, etc.)
    topic TEXT,                      -- トピック
    difficulty INTEGER NOT NULL,     -- 難易度 (1-5)
    title TEXT,                      -- 問題タイトル
    question TEXT NOT NULL,          -- 問題文
    type TEXT NOT NULL,              -- 形式 (mc, open, rootfrac)
    choices TEXT,                    -- 選択肢 (JSON)
    answer INTEGER,                  -- 正解番号
    expected TEXT,                   -- 期待する解答
    explanation TEXT,                -- 解説
    tags TEXT,                      -- タグ (JSON配列)
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

## 🎯 使用方法

### 基本検索
1. `search.html` にアクセス
2. 検索ボックスにキーワードを入力
3. 結果が動的に表示される

### フィルター検索
1. フィルターアイコンをタップ
2. 科目・難易度・形式を選択
3. 「検索実行」をタップ

### キーボードショートカット
- `/` キー: 検索ページを開く
- `Enter`: 検索実行
- `Esc`: モーダルを閉じる

## 🔍 検索アルゴリズム

### テキスト検索
- 部分一致検索
- タイトル・問題文・タグを対象
- 複数キーワード対応（OR検索）

### 関連度スコア計算
```javascript
score = titleMatches * 10 + contentMatches * 5 + tagMatches * 3
```

### ソートオプション
- `created_desc`: 新しい順（デフォルト）
- `created_asc`: 古い順
- `difficulty_asc`: 難易度昇順
- `difficulty_desc`: 難易度降順
- `relevance`: 関連度順

## 🛠️ カスタマイズ

### 新しいフィルターを追加

1. **フロントエンド** (`search.html`):
```html
<label class="chip">
    <input type="checkbox" name="newFilter" value="value">
    <span>新しいフィルター</span>
</label>
```

2. **バックエンド** (`search-worker.js`):
```javascript
if (filters.newFilter && filters.newFilter.length > 0) {
    sql += ` AND q.new_column IN (${filters.newFilter.map(() => '?').join(',')})`;
    params.push(...filters.newFilter);
}
```

### スタイルのカスタマイズ

CSS カスタムプロパティを変更：
```css
:root {
    --color-primary: #your-color;
    --font-family: 'Your Font', sans-serif;
}
```

## 🔒 セキュリティ

### 実装済み対策
- SQLインジェクション防止（パラメータ化クエリ）
- XSS防止（HTMLエスケープ）
- CORS設定
- 認証ヘッダーサポート

### 推奨事項
- API レート制限の実装
- 検索ログの監視
- 機密データのフィルタリング

## 📱 モバイル最適化

### タッチ操作
- 44px以上のタッチターゲット
- スワイプジェスチャー対応（予定）
- フリック操作でのスクロール

### パフォーマンス
- 画像の遅延読み込み
- 検索結果の仮想スクロール（大量データ対応）
- プリフェッチ機能

## 🧪 テスト

### 手動テスト手順

1. **基本機能テスト**
   - [ ] 検索ボックスでの入力
   - [ ] 検索結果の表示
   - [ ] フィルターの動作

2. **レスポンシブテスト**
   - [ ] モバイルでの表示
   - [ ] タブレットでの表示
   - [ ] デスクトップでの表示

3. **パフォーマンステスト**
   - [ ] 大量データでの検索速度
   - [ ] ネットワーク遅延時の動作

### 自動テスト

```javascript
// 例: 検索機能のユニットテスト
describe('SearchManager', () => {
    test('should filter questions by subject', async () => {
        const searchManager = new SearchManager();
        const results = await searchManager.searchQuestions('', { subjects: ['math'] });
        expect(results.every(q => q.subject === 'math')).toBe(true);
    });
});
```

## 🚀 今後の改善予定

### 短期
- [ ] 検索候補の自動補完
- [ ] 検索結果のハイライト
- [ ] ページネーション改善

### 中期
- [ ] 全文検索エンジンの導入
- [ ] 音声検索機能
- [ ] 検索分析ダッシュボード

### 長期
- [ ] AI による関連問題推薦
- [ ] 多言語対応
- [ ] オフライン検索機能の拡充

## 🤝 貢献

### 開発環境セットアップ
```bash
git clone [repository]
cd data-manager-search
npm install
wrangler dev
```

### プルリクエストガイドライン
1. 機能ブランチを作成
2. テストを実行
3. ドキュメントを更新
4. プルリクエストを作成

## 📞 サポート

### よくある問題

**Q: 検索結果が表示されない**
A: ネットワーク接続とD1データベースの設定を確認してください。

**Q: モバイルでレイアウトが崩れる**
A: ビューポート設定とCSSメディアクエリを確認してください。

### 連絡先
- GitHub Issues: [プロジェクトURL]/issues
- Email: [サポートメール]

---

🎉 **Data Manager Search System** へようこそ！

この実装により、既存の Data Manager System に強力で使いやすい検索機能が追加されました。モバイルファーストの設計により、すべてのデバイスで優れたユーザーエクスペリエンスを提供します。