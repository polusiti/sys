# Data Manager - 実用的問題制作管理システム

🌐 **Live Site:** https://data.allfrom0.top/

**重要**: このシステムは問題制作者・教育者のための実用的な管理ツールです。AI風問題共有サイトやPororocca風学習プラットフォームではありません。

## 🎯 システム目的

教育現場の問題制作者が効率的に問題を作成・管理するための専用ツール

### 設計思想
- **実用性重視** - 教育現場での実際の使用を想定
- **スマホファースト** - 問題制作をスマートフォンで完結
- **シンプル管理** - 複雑な機能は排除し、必要な機能に集約
- **クラウド連携** - D1/R2による堅実なデータ管理

## 🚀 機能

### 📱 スマート問題制作Manager
- **英語Manager** - 語彙・文法・読解・リスニング・ライティング問題の制作
- **数学Manager** - LaTeX対応数式問題制作（A-D難易度分類）
- **モバイル最適化版** - スマートフォン向け問題制作インターフェース

### ✨ 実用機能
- 🎨 実用重視の軽量UI/UX
- 📱 スマートフォン完全最適化
- ☁️ Cloudflare D1データベース連携
- 📁 Cloudflare R2メディアストレージ
- 🔍 **高度な検索システム** - キーワード・フィルター・検索履歴
- 📊 統計・分析ダッシュボード
- ⚡ 高速問題制作ワークフロー

### 🔍 検索機能 (NEW!)
- **キーワード検索** - 問題タイトル・内容・タグを横断検索
- **高度なフィルター** - 科目・難易度・問題形式による絞り込み
- **検索履歴** - 最近の検索を保存・再利用
- **レスポンシブデザイン** - モバイル・デスクトップ完全対応
- **オフライン対応** - ローカルストレージフォールバック
- **リアルタイム検索** - 入力中の動的結果表示

## 🛠️ 技術スタック

### フロントエンド
- **HTML5 + CSS3 + JavaScript** - フレームワークレス設計
- **レスポンシブデザイン** - Mobile-First CSS Grid/Flexbox
- **MathJax 3.0** - 数式レンダリング

### バックエンド・インフラ
- **Cloudflare Pages** - 静的サイトホスティング
- **Cloudflare D1** - SQLiteデータベース
- **Cloudflare R2** - オブジェクトストレージ（音声・画像）
- **Domain:** data.allfrom0.top

## 📁 プロジェクト構造

```
/
├── index.html              # メインシステムダッシュボード
├── search.html             # 🔍 検索システム (NEW!)
├── auth.html               # 認証システム
├── profile.html            # ユーザープロフィール
├── _headers               # Cloudflare Pages設定
├── assets/
│   ├── css/
│   │   ├── global.css      # グローバルスタイル
│   │   └── search.css      # 検索ページ専用スタイル
│   └── js/
│       ├── search-manager.js      # 🔍 検索機能管理
│       ├── search-integration.js  # 検索統合スクリプト
│       └── questa-d1-client.js    # D1データベースクライアント
├── english/
│   └── index.html         # 英語問題管理システム
├── math/
│   └── index.html         # 数学問題管理システム
├── sci/                   # 理科システム
│   ├── index.html
│   ├── biology/index.html
│   ├── chemistry/index.html
│   ├── earth/index.html
│   └── physics/index.html
├── cloudflare-auth-worker.js      # 認証・検索API Worker
├── auth-d1-client.js             # 認証クライアント
├── questa-r2-client.js           # R2ストレージクライアント
└── README.md
```

## 🎨 デザインシステム

### カラーパレット（実用重視）
- **Primary:** `#2563eb` (信頼感のある青)
- **Secondary:** `#1e40af` (深い青)  
- **Accent:** `#10b981` (成功の緑)
- **Background:** `#f8fafc` (清潔感のあるグレー)

### タイポグラフィ
- システムフォント優先（-apple-system, BlinkMacSystemFont, Segoe UI）
- 可読性重視のサイズ・間隔設定

## 🔧 使用方法

### 1. 問題制作
1. `english/` または `math/` にアクセス
2. 各モジュールで問題を作成
3. D1データベースに自動保存

### 2. スマホ版制作
1. `mobile-creator.html` でスマートフォン最適化インターフェース
2. タッチ操作に最適化された制作フロー
3. 音声・画像アップロード対応

### 3. データ管理
- **統計**: `statistics.html` で使用状況確認
- **同期**: D1/R2クラウド連携による自動同期
- **エクスポート**: CSV/JSON形式データ出力

## ⚠️ 重要な注意事項

### このシステムは以下のものではありません
- ❌ 問題共有コミュニティサイト
- ❌ 学習者向けプラットフォーム  
- ❌ AI自動生成問題システム
- ❌ SNS風学習サービス

### このシステムの正しい用途
- ✅ 教育者・制作者の問題管理ツール
- ✅ 効率的な問題制作ワークフロー
- ✅ スマートフォンでの問題制作
- ✅ 教育現場での実用的データ管理

## 🛡️ クラウド連携

### D1データベース統合
- 問題データの永続化
- SQL操作サポート
- リアルタイム同期

### R2ストレージ統合  
- 音声・画像ファイル管理
- CDN配信最適化
- メディア統合管理

## 🚀 デプロイメント

- **Source:** GitHub repository `polusiti/data`
- **Platform:** Cloudflare Pages (Static)
- **Domain:** https://data.allfrom0.top/
- **SSL/HTTPS:** 自動配信

## 📊 開発履歴

### 2025年1月 - Manager System Phase
- 実用性重視設計への転換
- スマートフォン最適化実装
- D1/R2クラウド連携強化
- AI風要素完全除去

### 既存システム参考
- https://github.com/polusiti/sys/tree/main/manager の設計思想を継承
- 単一HTMLアーキテクチャからモジュール化へ発展
- LocalStorageからクラウドDBへ進化

### 2025年1月 - 検索システム追加 🔍
- 高度な検索機能の実装
- キーワード・フィルター・検索履歴対応
- 既存認証システムとの完全統合
- モバイルファーストUI/UXの継承

## 🔗 API仕様 (検索機能)

### 検索エンドポイント

#### 問題検索
```
GET /api/search/questions
```
**パラメータ:**
- `q`: 検索クエリ
- `subjects`: 科目フィルター (カンマ区切り: math,english,chemistry,physics)
- `difficulties`: 難易度フィルター (カンマ区切り: 1,2,3,4,5)
- `types`: 問題形式フィルター (カンマ区切り: mc,open,rootfrac)
- `sort`: ソート順 (created_desc, difficulty_asc, relevance)
- `limit`: 取得件数 (デフォルト: 20, 最大: 100)
- `offset`: オフセット

#### 検索候補
```
GET /api/search/suggestions?q=キーワード&limit=10
```

#### 問題取得
```
GET /api/questions?subject=math&limit=50
GET /api/questions/{questionId}
```

### 認証
既存のWebAuthn/Passkey認証システムを使用:
```
POST /api/auth/passkey/login/begin
POST /api/auth/passkey/login/complete
```

---

**🎯 効率的な問題制作で、教育現場をサポート** 📚⚡