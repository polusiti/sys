# Data Manager - 教育問題管理システム

🌐 **Live Site:** https://data.allfrom0.top/

包括的な教育問題管理システム。英語、日本語、数学の学習コンテンツを統合管理するWebアプリケーションです。

## 🚀 機能

### 📚 学習分野
- **🇬🇧 英語学習管理** - 語彙、文法、リスニング、リーディング、ライティング
- **🇯🇵 日本語学習管理** - JLPT N5-N1対応、漢字、語彙、文法、読解
- **📐 数学問題管理** - 代数、幾何、微積分、統計、線形代数

### ✨ 主な特徴
- 🎨 モダンで直感的なUI/UX
- 📱 完全レスポンシブデザイン
- ⚡ 高速なCloudflare Pages配信
- 🔒 セキュアなHTTPS配信
- 🎯 段階的学習システム
- 📊 進捗追跡機能

## 🛠️ 技術スタック

- **Frontend:** Pure HTML5 + CSS3 + JavaScript
- **Hosting:** Cloudflare Pages
- **Domain:** Custom domain (data.allfrom0.top)
- **Design:** CSS Grid, Flexbox, Gradient Backgrounds
- **Icons:** Unicode Emojis

## 📁 プロジェクト構造

```
/
├── index.html          # メインランディングページ
├── _headers           # Cloudflare Pages設定
├── english/
│   └── index.html     # 英語学習管理
├── japanese/
│   └── index.html     # 日本語学習管理
├── math/
│   └── index.html     # 数学問題管理
└── README.md          # プロジェクト説明
```

## 🎨 デザインシステム

### カラーパレット
- **English:** `#FF6B6B` → `#FF8E53` (赤-オレンジ gradient)
- **Japanese:** `#4ECDC4` → `#44A08D` (青緑-緑 gradient)  
- **Math:** `#45B7D1` → `#96C93D` (青-緑 gradient)
- **Main:** `#667eea` → `#764ba2` (紫-青 gradient)

### フォント
- システムフォント優先
- Apple System, Segoe UI, Roboto fallback

## 🌟 今後の開発予定

### Phase 1 - 基盤構築 ✅
- [x] 基本UI/UX設計
- [x] ランディングページ
- [x] 各セクションページ
- [x] デプロイメント設定

### Phase 2 - 機能実装 🚧
- [ ] 問題データベース設計
- [ ] ユーザー認証システム
- [ ] 進捗追跡機能
- [ ] インタラクティブな問題解答システム

### Phase 3 - 高度機能 📋
- [ ] AI powered学習推奨
- [ ] リアルタイム分析ダッシュボード
- [ ] マルチプレイヤー学習機能
- [ ] 音声認識・合成

## 🚀 デプロイメント

このサイトはCloudflare Pagesで自動デプロイされています：
- **Source:** GitHub repository `polusiti/data`
- **Build:** Static site (no build process required)
- **Domain:** https://data.allfrom0.top/
- **SSL:** 自動HTTPS配信

## 📞 コンタクト

このプロジェクトは教育技術の向上を目指して開発されています。

---

*教育の未来を、データで支える。* 📊✨