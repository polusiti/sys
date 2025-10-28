# 🏷️ バージョン参照ガイド - polusiti/sys

## 🔑 正規のバージョン

### 🏆 安定版 (使用推奨)
- **タグ**: `v1.0.0-stable-a053faf`
- **コミット**: `a053faf`
- **特徴**: 
  - ✅ 英作文添削システム (eisakujikken)
  - ✅ 学習PWA機能
  - ✅ Passkey認証
  - ✅ DeepSeek API統合完了

### 🧪 実験版 (参考用)
- **タグ**: `v0.9.0-experimental-ce59719`
- **コミット**: `ce59719`
- **用途**: 参考用（使用禁止）

---

## 🚨 重要ルール

### 1. 常に使用するバージョン
```bash
git checkout v1.0.0-stable-a053faf
```

### 2. 決して参照しないバージョン
- origin/main (分岐している)
- 実験版タグ (バグあり)

### 3. 新機能追加時
- 安定版からブランチ作成
- 機能完了後、タグ作成してマージ

---

## 📁 プロジェクトの正しい構造

```
/home/higuc/sys (v1.0.0-stable-a053faf)
├── pages/
│   ├── eisakujikken.html      ✅ 英作文添削
│   └── essay-correction.html    ✅ 英作文添削
├── js/
│   └── eisakujikken.js         ✅ 英文添削JS
├── english/                   ✅ 英語学習
├── math/                      ✅ 数学学習
├── sci/                       ✅ 理科学習
└── auth.html                  ✅ 認証システム
```

---

## 🔒 参照エラー防止

### 絶対ダメなこと:
- ❌ origin/main を使用
- ❌ 実験版を本番で使用
- ❌ 他のディレクトリを参照

### 必ず守ること:
- ✅ タグでバージョン管理
- ✅ 安定版タグを使用
- ✅ /home/higuc/sys のみ作業

---

**作成日**: 2025-10-27  
**最終更新**: 2025-10-27  
**適用**: polusiti/sys リポジトリ
