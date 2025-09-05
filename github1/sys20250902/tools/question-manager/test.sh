#!/bin/bash

# Question Manager System Test Script
# This script helps verify all functionality is working

echo "🧪 Question Manager システムテスト"
echo "================================"

# Check if all required files exist
echo "1. ファイル存在チェック..."
required_files=(
    "index.html"
    "dashboard.html"
    "login.html"
    "mobile-creator.html"
    "mobile-creator-standalone.html"
    "advanced-editor.html"
    "bulk-import.html"
    "test-auth.html"
    "auth-fixed.js"
    "database-fixed.js"
    "common.css"
    "manifest.json"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -eq 0 ]; then
    echo "✅ すべての必須ファイルが存在します"
else
    echo "❌ 以下のファイルが見つかりません:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
fi

# Check file sizes
echo -e "\n2. ファイルサイズチェック..."
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        size=$(du -h "$file" | cut -f1)
        echo "   $file: $size"
    fi
done

# Check JavaScript syntax
echo -e "\n3. JavaScript構文チェック..."
js_files=(
    "auth-fixed.js"
    "database-fixed.js"
    "question-manager.js"
    "mobile-creator.js"
    "advanced-editor.js"
    "bulk-import.js"
    "dashboard.js"
)

for js_file in "${js_files[@]}"; do
    if [ -f "$js_file" ]; then
        if command -v node &> /dev/null; then
            if node -c "$js_file" 2>/dev/null; then
                echo "✅ $js_file: 構文OK"
            else
                echo "❌ $js_file: 構文エラー"
            fi
        else
            echo "⚠️  Node.jsがインストールされていないためスキップ"
        fi
    fi
done

# Check HTML syntax
echo -e "\n4. HTML構文チェック..."
for file in *.html; do
    if [ -f "$file" ]; then
        # Simple check for well-formedness
        if grep -q "<html" "$file" && grep -q "</html>" "$file"; then
            echo "✅ $file: 基本構造OK"
        else
            echo "❌ $file: HTML構造が不完全"
        fi
    fi
done

echo -e "\n5. 手動テスト項目..."
echo "以下の項目を手動でテストしてください："
echo ""
echo "🔐 認証システム:"
echo "   - login.html でログインできるか（ユーザー名: sys）"
echo "   - dashboard.html にアクセスできるか"
echo "   - 各ページへのリダイレクトは正しいか"
echo ""
echo "📱 モバイル機能:"
echo "   - mobile-creator.html で問題が作成できるか"
echo "   - mobile-creator-standalone.html は認証なしで動くか"
echo "   - タッチ操作はスムーズか"
echo ""
echo "💾 データベース:"
echo "   - 問題の保存・取得・検索ができるか"
echo "   - IndexedDBとlocalStorageのフォールバックは動くか"
echo ""
echo "📨 一括インポート:"
echo "   - CSV/JSONファイルをアップロードできるか"
echo "   - データの検証は動作するか"
echo ""
echo "🎨 LaTeX表示:"
echo "   - 数式が正しく表示されるか"
echo "   - MathJaxは読み込まれるか"
echo ""
echo "🧪 テストページ:"
echo "   - test-auth.html で認証状態を確認"
echo "   - 各機能がエラーなく動作するか"

echo -e "\n================================"
echo "テスト完了！上記の項目を確認してください。"
echo ""
echo "🚀 ローカルで実行するには:"
echo "   python -m http.server 8000"
echo "   http://localhost:8000"
echo ""
echo "💡 スタンドアロン版から始めるのがおすすめ:"
echo "   mobile-creator-standalone.html"