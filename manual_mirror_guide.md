# 手動ミラーリング手順

## 方法1: ブラウザ拡張機能の使用（推奨）

### SingleFile拡張機能
1. Chrome/Firefoxで「SingleFile」拡張機能をインストール
2. ログイン後、対象ページにアクセス
3. 拡張機能アイコンをクリックしてページを保存

### Web Scraper拡張機能
1. Chromeで「Web Scraper」拡張機能をインストール
2. サイトマップを作成して複数ページを取得

## 方法2: 開発者ツールでの手動保存

1. ブラウザでログイン
2. 対象ページにアクセス
3. Ctrl+S (Windows) または Cmd+S (Mac) でページを保存
4. 開発者ツールでNetworkタブを開く
5. ページをリロードして、必要なCSS/JSファイルを手動でダウンロード

## 方法3: curlでの個別ダウンロード

現在のクッキー情報をcookies.txtに保存して使用：

```bash
# メインページ
curl -b cookies.txt -L -o index.html https://pororocca.com/problem/math/create/

# 静的ファイルのダウンロード
curl -o bootstrap.css https://file.pororocca.com/static/bootstrap/scss/bootstrap.css
curl -o favicon.ico https://file.pororocca.com/static/favicon.ico
```

## 注意点
- セッションが有効な状態で実行する必要あり
- 動的コンテンツは完全に保存できない場合あり
- 定期的にクッキーを更新する必要あり