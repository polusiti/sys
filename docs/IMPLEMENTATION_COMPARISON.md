# 実装比較レポート：参考文献 vs 現在の実装

## 日時
2025-11-12

## 概要
参考文献（/home/higuc/参考文献/jisouy/）の仕様と現在の実装を徹底比較

---

## 1. データ構造の比較

### 参考文献の仕様（jsonplan.md）

#### 英語系の統一フォーマット
```json
{
  "id": "",
  "subject": "english_grammar | english_vocab | english_listening | english_reading | english_writing",
  "type": "multiple_choice | fill_in_blank | ordering | short_answer | translation | transcription | error_correction",
  "question": { "text": "", "translation": "" },
  "options": [],
  "answer": "",
  "explanation": { "pl": "", "sp": "" },
  "difficulty": 1,
  "tags": [],
  "source": "",
  "created_at": "YYYY-MM-DD",
  "media": { "audio": "", "image": "", "video": "" }
}
```

#### 数学の仕様
```json
{
  "id": "math_0001",
  "q": "問題文",
  "a": "答え（表示用）",
  "a_raw": "答え（入力用）",
  "e": "解説",
  "d": "難易度（1-5）",
  "tag": ["微分","極値","高校数学III"],
  "src": "出典"
}
```

#### 物理の仕様
```json
{
  "id": "phy_0001",
  "q": "問題文",
  "given": "与えられた条件",
  "a": "答え",
  "e": "解説",
  "tag": ["力学", "つり合い", "高校物理"],
  "src": "出典",
  "d": "難易度",
  "media": { "image": "" }
}
```

#### 化学の仕様
```json
{
  "id": "chem_2023",
  "q": "問題文",
  "a": "答え",
  "e": "解説",
  "tag": ["化学平衡", "気体の法則"],
  "src": "出典",
  "d": "難易度",
  "media": { "image": "" }
}
```

### 現在の実装（D1データベース）

#### questionsテーブル
```sql
CREATE TABLE questions (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    title TEXT NOT NULL,
    question_text TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    source TEXT DEFAULT 'learning-notebook',
    word TEXT,
    is_listening BOOLEAN DEFAULT 0,
    difficulty_level TEXT DEFAULT 'medium',
    mode TEXT,
    choices TEXT, -- JSON array
    media_urls TEXT, -- JSON array
    explanation TEXT,
    tags TEXT, -- JSON array
    active BOOLEAN DEFAULT 1,
    is_deleted BOOLEAN DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
)
```

### ❌ 問題点

1. **キー名の不一致**
   - 参考文献: `q`, `a`, `e`, `d`, `tag`, `src`
   - 現在の実装: `question_text`, `correct_answer`, `explanation`, `difficulty_level`, `tags`, `source`

2. **explanation構造の違い**
   - 参考文献: `{ "pl": "平易な解説", "sp": "詳しい解説" }`
   - 現在の実装: 単一のTEXT型

3. **question構造の違い**
   - 参考文献: `{ "text": "", "translation": "" }`
   - 現在の実装: 単一のTEXT型

4. **数学の特殊フィールド不足**
   - 参考文献: `a_raw`（入力用答え）が存在
   - 現在の実装: 存在しない

5. **物理の特殊フィールド不足**
   - 参考文献: `given`（与えられた条件）が存在
   - 現在の実装: 存在しない

---

## 2. 英作文添削システムの比較

### 参考文献の仕様（kousou.md + cloudflare.md）

#### AutoRAG構成
```
ユーザー入力
   ↓
[1] 添削・採点層（LLMによる評価）
   ↓
[2] RAG補助層（Vectorizeから類似構文・例文を取得）
   ↓
[3] 教育提示層（なぜ誤りなのか＋成長の方向を提示）
   ↓
出力（添削＋説明＋例文）
```

#### 採点基準（eisaku.md）
- S（100点）：一流コラムニストレベル（出さない）
- A（80点）：優秀な高校生レベル
- B（60点）：少し瑕疵あり
- C（40点）：論理が強引
- D（20点）：真っ赤になる
- E（0点）：採点不可

#### 減点方式
- 文法間違い: -2～-5点
- 表現や語彙: -1～-3点

#### AutoRAG設定
- AI Gateway: dee
- データソース: dee
- 埋め込みモデル: @cf/baai/bge-large-en-v1.5
- チャンクサイズ: 265トークン
- 重複: 10%
- クエリ書き換えモデル: @cf/meta/llama-3.1-8b-instruct-fast
- 再ランキングモデル: @cf/baai/bge-reranker-base
- 世代モデル: @cf/meta/llama-3.1-8b-instruct-fast

### 現在の実装

#### english_compositions テーブル
```sql
CREATE TABLE IF NOT EXISTS english_compositions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    original_text TEXT NOT NULL,
    corrected_text TEXT,
    error_analysis TEXT,
    suggestions TEXT,
    sgif_category TEXT,
    confidence_score REAL,
    processing_time INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### 実装されている機能
- SGIFフレームワーク（S1-S6）
- Cloudflare AI使用（@cf/meta/llama-3.1-8b-instruct-fp8）
- エラー分析
- 改善提案

### ❌ 問題点

1. **AutoRAG未実装**
   - Vectorizeとの連携なし
   - RAG補助層が存在しない
   - 類似構文・例文の取得機能なし

2. **採点システム未実装**
   - 100点満点の採点なし
   - S/A/B/C/D/E評価なし
   - 減点方式なし

3. **AI Gateway未使用**
   - 参考文献では "dee" という名前のGateway
   - 現在は直接AI呼び出し

4. **モデルの違い**
   - 参考文献: @cf/meta/llama-3.1-8b-instruct-fast
   - 現在の実装: @cf/meta/llama-3.1-8b-instruct-fp8

---

## 3. 管理画面の比較

### 参考文献の仕様（kousou.md）

```
/manaで問題管理（削除、正答率閲覧、追加）
管理者だけで、ID:P37600 ,pass:コードギアス
```

### 現在の実装

- `/pages/mana/index.html` - 科目選択画面
- `/pages/mana/math/index.html` - 数学問題管理
- `/pages/mana/english-vocabulary/index.html` - 英単語問題管理
- その他各科目の管理画面

#### 認証
- ADMIN_TOKEN: 'questa-admin-2024'
- localStorage保存

### ❌ 問題点

1. **認証情報の違い**
   - 参考文献: ID:P37600, pass:コードギアス
   - 現在の実装: ADMIN_TOKEN方式

2. **正答率閲覧機能なし**
   - 参考文献では明記されているが未実装

---

## 4. 数学問題の特殊仕様

### 参考文献の仕様（sugakuplan.md）

```
理解度の確認という観点から、四択は不適切で、
√3+log(1/3)+2/3
を3+1+3+2+3=12 と、登場した数字の合計の合計にするという変換で、12を答えさせるのがてきとうだろう。
外部ツールは使用禁止。
```

### 現在の実装

- KaTeX対応
- 四択形式なし（自由記述）
- 数字の合計変換なし

### ❌ 問題点

1. **数字の合計変換未実装**
   - 参考文献の特殊な採点方式が未実装

---

## 5. データ管理方針の比較

### 参考文献の仕様（kousou.md）

| 項目 | 推奨方式 | 理由 |
|------|----------|------|
| 構成単位 | 1問1JSON（ディレクトリ分割） | 編集・比較・D1登録・Git管理すべて最適 |
| 統合方法 | jq / Pythonスクリプトで結合 → JSONL or SQL生成 | 自動化容易 |
| バージョン管理 | Git（main/dev/ai_gen分岐） | 完全履歴保持＆差分追跡可 |
| ストレージ | D1：構造化データ、R2：メディア・バックアップ | Cloudflare一貫運用 |
| CI検証 | jq + JSON schema + wrangler d1 test | 構文・型・挿入チェック自動化 |

### 現在の実装

- D1データベースに直接保存
- R2はメディア用に設定済み
- Git管理あり
- CI/CD未設定

### ❌ 問題点

1. **1問1JSON方式未実装**
   - 現在はD1に直接保存
   - JSONファイルでの管理なし

2. **CI検証未実装**
   - JSON schema検証なし
   - wrangler d1 testなし

---

## 6. API層の比較

### 参考文献の仕様（jsonplan.md）

```
Q:「キーがバラバラで保守が大変では？」
A: API層で統一キーに正規化して返しています。上位は常に同じキーしか触りません。

Q:「将来の拡張で全データ書き換えが必要？」
A: 不要。アダプタのマッピング1行追加で吸収します。

Q:「検索は？ q と question.text の両方見に行くの？」
A: D1には**派生カラム（prompt_index）**を持たせるか、正規化後にVectorize/KVにキャッシュ。実装パスは1本化できます。
```

### 現在の実装

- unified-api-worker.js
- 統一キーへの正規化なし
- アダプタパターン未実装
- 派生カラムなし

### ❌ 問題点

1. **API層での正規化未実装**
   - 各教科のキー名がそのまま返される

2. **アダプタパターン未実装**
   - 教科ごとの差異を吸収する層がない

3. **派生カラム未実装**
   - prompt_indexなどの検索最適化カラムなし

---

## 7. セキュリティの比較

### 参考文献の仕様（kousou.md）

```
パスキーのみで新規登録とログインを実行し、強固なセキュリティ。
```

### 現在の実装

- パスキー認証実装済み
- users_v2テーブル
- webauthn_challenges_v2テーブル
- webauthn_sessionsテーブル

### ✅ 実装済み

パスキー認証は仕様通り実装されている

---

## 8. デザイン方針の比較

### 参考文献の仕様（kousou.md）

```
私の性格：ありきたりな陳腐さを好まない。AIっぽさを嫌う。絵文字は使わない。私は必要最小限を好む。私はグレーゾーンな人間だ。情報公開の必要最小限を好む。欧米型の左派が言うリベラルを嫌う。
```

### 現在の実装

- Material Icons使用
- 絵文字は一部使用（★♡♪☺✓→）
- ノート風デザイン

### ⚠️ 注意点

1. **絵文字使用**
   - 参考文献では「絵文字は使わない」
   - 現在は装飾的に使用

---

## 9. リスニング問題の比較

### 参考文献の仕様（kousou.md）

```
リスニング
共通テスト（四択で、短いダイアログ。）
東大（五択の問題で×５。つまり、講義のダイアログが流れ、what the speaker say?みたいな問題が５つある）
TTSで、AI生成（google ai studio）
ユーザーがダウンロードすることは許さない。
```

### 現在の実装

- audio_filesテーブルあり
- Cloudflare AI TTS使用（@cf/myshell-ai/melotts）
- R2に音声保存

### ❌ 問題点

1. **TTS生成元の違い**
   - 参考文献: Google AI Studio
   - 現在の実装: Cloudflare AI

2. **ダウンロード制限未実装**
   - 参考文献では「ユーザーがダウンロードすることは許さない」
   - 現在は制限なし

---

## 10. 収益化の比較

### 参考文献の仕様（kousou.md）

```
リワード広告で収益。
```

### 現在の実装

- 広告実装なし

### ❌ 問題点

1. **リワード広告未実装**

---

## 総合評価

### ✅ 実装済み
1. パスキー認証
2. 基本的な問題管理機能
3. 英作文添削（基本機能）
4. 評価・コメントシステム
5. 音声生成機能

### ❌ 未実装・不一致
1. **データ構造の統一**（最重要）
2. **AutoRAG統合**（英作文添削）
3. **採点システム**（100点満点方式）
4. **API層の正規化**
5. **1問1JSON方式**
6. **CI/CD検証**
7. **数字の合計変換**（数学）
8. **リワード広告**
9. **ダウンロード制限**
10. **管理画面認証**（ID:P37600）

---

## 推奨される対応順序

### Phase 1: データ構造の統一（最優先）
1. データベーススキーマの見直し
2. API層での正規化実装
3. アダプタパターンの導入

### Phase 2: AutoRAG統合
1. Vectorizeセットアップ
2. AI Gateway設定
3. RAG補助層の実装

### Phase 3: 採点システム
1. 100点満点採点の実装
2. S/A/B/C/D/E評価
3. 減点方式の実装

### Phase 4: その他機能
1. CI/CD検証
2. リワード広告
3. ダウンロード制限
4. 管理画面認証更新
