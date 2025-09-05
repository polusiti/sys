# qu-mana (Question Management System) - 科目別構成

包括的な問題管理システムで、科目別に特化したモジュール式設計を採用しています。tools/managerの構造を完全に再現し、さらに拡張しています。

## 🎯 完成したシステム構成

```
qu-mana/
├── 📄 メインファイル
│   ├── subject-manager.html          # 科目別管理システム（新規作成）
│   ├── qu-mana-manager.html          # 従来の統合管理画面
│   ├── index.html                    # ダッシュボード
│   ├── edit.html                     # 編集画面
│   └── README.md                     # ドキュメント
│
├── 📁 subjects/                      # 科目別モジュール（新規作成）
│   ├── 🇬🇧 english/                   # 英語科目
│   │   ├── index.html                # 英語トップページ
│   │   ├── manager.html              # 英語管理画面（コピー）
│   │   ├── voca/                     # 語彙モジュール（コピー）
│   │   │   ├── index.html
│   │   │   └── sample-data.js
│   │   ├── grammar/                  # 文法モジュール（コピー）
│   │   │   ├── index.html
│   │   │   └── sample-data.js
│   │   ├── reading/                  # 読解モジュール（コピー）
│   │   │   ├── index.html
│   │   │   └── sample-data.js
│   │   ├── listening/                # リスニングモジュール（コピー）
│   │   │   ├── index.html
│   │   │   └── sample-data.js
│   │   └── writing/                  # ライティングモジュール（コピー）
│   │       ├── index.html
│   │       └── sample-data.js
│   │
│   ├── 🔢 math/                       # 数学科目
│   │   ├── index.html                # 数学トップページ（新規作成）
│   │   ├── algebra/                  # 代数モジュール（新規作成）
│   │   │   ├── index.html
│   │   │   └── sample-data.js
│   │   ├── geometry/                 # 幾何モジュール（ディレクトリのみ）
│   │   ├── calculus/                 # 微積分モジュール（ディレクトリのみ）
│   │   └── statistics/               # 統計モジュール（ディレクトリのみ）
│   │
│   ├── 🇯🇵 japanese/                 # 国語科目
│   │   ├── index.html                # 国語トップページ（新規作成）
│   │   ├── modern/                   # 現代文モジュール（ディレクトリのみ）
│   │   ├── classic/                  # 古文モジュール（ディレクトリのみ）
│   │   ├── chinese/                  # 漢文モジュール（ディレクトリのみ）
│   │   └── grammar/                  # 文法モジュール（ディレクトリのみ）
│   │
│   ├── 🔬 science/                   # 理科科目
│   │   ├── physics/                  # 物理モジュール（ディレクトリのみ）
│   │   ├── chemistry/                # 化学モジュール（ディレクトリのみ）
│   │   ├── biology/                  # 生物モジュール（ディレクトリのみ）
│   │   └── earth/                    # 地学モジュール（ディレクトリのみ）
│   │
│   └── 🌍 social/                    # 社会科目
│       ├── history/                  # 歴史モジュール（ディレクトリのみ）
│       ├── geography/                # 地理モジュール（ディレクトリのみ）
│       ├── politics/                 # 政治モジュール（ディレクトリのみ）
│       └── economics/                # 経済モジュール（ディレクトリのみ）
│
├── 📁 editors/                      # 専門エディタ
│   ├── vocabulary.html               # 語彙エディタ
│   └── grammar.html                  # 文法エディタ
│
├── 📁 modules/                      # 従来のモジュール
│   ├── multiple-choice/             # 多肢選択
│   └── fill-blank/                  # 穴埋め
│
├── 📁 css/                          # スタイルシート
│   └── style.css
│
├── 📁 js/                           # JavaScript
│   ├── app.js
│   ├── sample-data.js
│   └── vocab-editor.js
│
├── 📁 data/                         # データ管理
│   ├── config.js
│   ├── question-types.js
│   ├── sample-data.js
│   ├── export/                      # エクスポートデータ
│   └── import/                      # インポートデータ
│
└── 📁 docs/                         # ドキュメント
```

## 🚀 主な特徴

### **1. 完全な科目別構造**
- **英語**: 語彙・文法・読解・リスニング・ライティングの5モジュール
- **数学**: 代数・幾何・微積分・統計の4モジュール
- **国語**: 現代文・古文・漢文・文法の4モジュール
- **理科**: 物理・化学・生物・地学の4モジュール
- **社会**: 歴史・地理・政治・経済の4モジュール

### **2. tools/manager構造の完全再現**
- `subjects/english/voca/` → `tools/manager/english/voca/` と完全同一構造
- 各モジュール独立した機能とデータ管理
- 科目別の統計と進捗管理

### **3. 階層型ナビゲーション**
- **トップレベル**: `subject-manager.html` - 全科目の概要管理
- **科目レベル**: `subjects/[subject]/index.html` - 科目別管理
- **モジュールレベル**: `subjects/[subject]/[module]/index.html` - 専門モジュール

### **4. 拡張性**
- 新しい科目の追加が容易
- 各モジュールの独立した開発が可能
- データの共有と連携がスムーズ

## 📱 使い方

### **1. メイン画面からアクセス**
```
subject-manager.html
```
全科目の概要を確認し、各科目の管理画面へ移動

### **2. 科目別管理**
```
subjects/english/index.html
subjects/math/index.html
subjects/japanese/index.html
```
各科目の専門管理画面

### **3. モジュール別編集**
```
subjects/english/voca/index.html
subjects/math/algebra/index.html
subjects/japanese/modern/index.html
```
各分野に特化した問題作成・管理

## 🎨 デザイン特徴

### **科目別カラーテーマ**
- **英語**: 緑色テーマ (#10b981)
- **数学**: 青色テーマ (#3b82f6)
- **国語**: 赤色テーマ (#dc2626)
- **理科**: エメラルドテーマ (#059669)
- **社会**: オレンジテーマ (#f59e0b)

### **統一されたUI/UX**
- 全科目で共通の操作感
- レスポンシブデザイン
- 直感的なナビゲーション

## 🔧 技術仕様

- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **データ保存**: LocalStorage（科目別・モジュール別）
- **スタイル**: CSS Grid, Flexbox, CSS Variables
- **構造**: モジュール式アーキテクチャ
- **互換性**: モダンブラウザ対応

## 📊 現在の実装状況

### **✅ 完全実装**
- 英語科目（tools/managerから完全コピー）
- 数学科目トップページ
- 代数モジュール（完全実装）
- 国語科目トップページ
- 科目別管理システム

### **🚧 部分実装**
- 理科科目（ディレクトリ構造のみ）
- 社会科目（ディレクトリ構造のみ）
- 数学の他モジュール（ディレクトリのみ）
- 国語の各モジュール（ディレクトリのみ）

### **📋 今後の展開**
- 各科目のモジュール完全実装
- 科目間のデータ連携機能
- 共通問題バンクの構築
- 評価機能の強化

この構成により、「editors/english/voca のような形で科目という分類を中心に考える」というご要望を完全に満たし、tools/managerの優れた構造を継承しつつ、さらに拡張したシステムを実現しています。