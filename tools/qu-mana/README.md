# 問題管理作成システム

モバイルファーストで設計された問題管理作成システムです。英語学習システムの全機能を統合し、バージョン管理、公開/非公開機能、統計機能を実装しています。

## 🚀 機能特徴

### ✅ 核心機能
- **問題作成**: 9種類の問題タイプに対応
- **問題管理**: 作成、編集、削除、公開/非公開
- **バージョン管理**: 変更履歴の自動記録
- **統計分析**: リアルタイムの利用統計
- **PWA対応**: オフライン動作、アプリとしてインストール可能

### ✅ 対応問題タイプ
1. **語彙・意味選択**: 単語の意味を選択
2. **語彙・空所補充**: 空所に適切な単語を補充
3. **文法・下線部選択**: 下線部の文法要素を選択
4. **文法・語順並べ替え**: 単語を正しい順番に並べ替え
5. **読解問題**: 長文読解と設問
6. **リスニング問題**: 音声を聞いて答える問題
7. **要約問題（短）**: 50字以内で要約
8. **要約問題（中）**: 100字以内で要約
9. **要約問題（長）**: 200字以内で要約

### ✅ 管理機能
- **ユーザー管理**: 簡易的なユーザー識別
- **タグ管理**: 問題の分類と検索
- **エクスポート機能**: JSON/CSV/TXT形式でエクスポート
- **自動保存**: 30秒間隔で自動保存
- **データ同期**: オンライン時に自動同期

## 📱 デモ

### スクリーンショット
- [モバイル画面](assets/screenshots/mobile.png)
- [タブレット画面](assets/screenshots/tablet.png)
- [デスクトップ画面](assets/screenshots/desktop.png)

### ライブデモ
- [問題管理システム](https://allfrom0.top/sys/tools/question-manager/)

## 🛠️ 技術スタック

### フロントエンド
- **HTML5**: セマンティックマークアップ
- **CSS3**: モバイルファーストレスポンシブデザイン
- **JavaScript (ES6+)**: モダンなJavaScript機能
- **PWA**: プログレッシブウェブアプリ

### データ管理
- **localStorage**: クライアントサイドデータ保存
- **IndexedDB**: 大規模データ対応（予定）
- **Cloudflare R2**: クラウドストレージ連携（予定）

### デザイン
- **モバイルファースト**: 320px以上の画面サイズに対応
- **ダークモード**: システムテーマに自動対応
- **アクセシビリティ**: WCAG 2.1準拠

## 📦 ファイル構成

```
sys/tools/question-manager/
├── index.html              # メインダッシュボード
├── create.html             # 問題作成画面
├── edit.html               # 問題編集画面
├── list.html               # 問題一覧画面
├── stats.html              # 統計画面
├── manifest.json           # PWAマニフェスト
├── sw.js                   # Service Worker
├── css/
│   └── style.css           # メインスタイルシート
├── js/
│   └── app.js              # メインアプリケーション
├── data/
│   ├── config.js           # 設定ファイル
│   ├── question-types.js   # 問題タイプ定義
│   └── sample-data.js      # サンプルデータ
└── assets/
    ├── icons/              # PWAアイコン
    └── images/             # 画像ファイル
```

## 🚀 インストール方法

### GitHubリポジトリから
1. リポジトリをクローン
   ```bash
   git clone https://github.com/polusiti/sys.git
   ```

2. ディレクトリに移動
   ```bash
   cd sys/tools/question-manager
   ```

3. ローカルサーバーを起動
   ```bash
   python -m http.server 8000
   ```

4. ブラウザでアクセス
   ```
   http://localhost:8000
   ```

### 直接利用
- [GitHub Pages](https://polusiti.github.io/sys/tools/question-manager/)
- [allfrom0.top](https://allfrom0.top/sys/tools/question-manager/)

## 📖 使い方

### 基本的な使い方
1. **問題作成**: 「作成」ボタンから問題タイプを選択
2. **問題編集**: 一覧画面から問題を選択して編集
3. **問題公開**: ステータスを「公開」に変更
4. **統計確認**: 「統計」タブで利用状況を確認

### 問題作成の手順
1. 問題タイプを選択
2. 必須項目を入力
3. 難易度とタグを設定
4. プレビューで確認
5. 保存して公開

## 🔧 設定

### 基本設定
```javascript
window.CONFIG = {
    APP_NAME: '問題管理作成システム',
    VERSION: '1.0.0',
    AUTO_SAVE: true,
    AUTO_SAVE_INTERVAL: 30000,
    ITEMS_PER_PAGE: 10
};
```

### カスタマイズ
- **テーマ**: CSS変数を変更
- **問題タイプ**: `question-types.js`に追加
- **サンプルデータ**: `sample-data.js`を編集

## 📊 統計機能

### 収集データ
- 総問題数
- 公開/非公開問題数
- 問題タイプ別内訳
- 難易度別分布
- 最近の活動ログ

### 表示機能
- リアルタイム更新
- グラフ表示（予定）
- エクスポート機能

## 🔄 データ同期

### オフライン対応
- Service Workerによるキャッシュ
- オフラインでの問題作成・編集
- オンライン時に自動同期

### バックアップ
- ローカルストレージに保存
- エクスポート機能でバックアップ
- クラウド同期（予定）

## 🤝 貢献方法

1. リポジトリをフォーク
2. ブランチを作成
   ```bash
   git checkout -b feature/your-feature
   ```
3. 変更をコミット
   ```bash
   git commit -am 'Add your feature'
   ```
4. ブランチをプッシュ
   ```bash
   git push origin feature/your-feature
   ```
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 🙏 謝辞

- デザインインスピレーション: [Tailwind CSS](https://tailwindcss.com/)
- PWAフレームワーク: [Workbox](https://developers.google.com/web/tools/workbox)
- アイコン: [Feather Icons](https://feathericons.com/)

## 📞 お問い合わせ

- **Issues**: [GitHub Issues](https://github.com/polusiti/sys/issues)
- **メール**: [allfrom0.top](https://allfrom0.top)
- **Twitter**: [@allfrom0](https://twitter.com/allfrom0)

---

**"Consistency beats intensity."** - 問題管理を習慣化しよう！