# Cloudflare Workers API 要件

## 現在のフロントエンドで使用しているAPIエンドポイント

### 既存のエンドポイント

1. **GET /api/note/questions**
   - パラメータ: `subject`, `limit`
   - 用途: 科目別の問題取得
   - 必須フィールド: id, question_text, choices, correct_answer, explanation, media_urls

2. **GET /api/note/passages**
   - パラメータ: `subject`, `limit` または `passageId`
   - 用途: パッセージ一覧取得、パッセージ詳細取得
   - 必須フィールド: passage_id, title, questions配列

3. **POST /api/note/progress**
   - ボディ: `{ subject, total_questions, correct_answers }`
   - 用途: ユーザーの学習進捗保存
   - 認証: Bearer Token必須

4. **POST /api/note/session/start**
   - ボディ: `{ subject }`
   - 用途: 学習セッション開始記録
   - 認証: Bearer Token必須

5. **POST /api/note/session/end**
   - ボディ: `{ subject, duration, questions_answered }`
   - 用途: 学習セッション終了記録
   - 送信方法: sendBeacon

6. **GET /api/auth/me**
   - 用途: 現在のユーザー情報取得
   - 認証: Bearer Token必須

7. **POST /api/auth/register**
   - ボディ: `{ username, email, password }`
   - 用途: ユーザー登録

8. **POST /api/auth/passkey/register/begin**
   - 用途: Passkeyチャレンジ開始

9. **POST /api/auth/passkey/register/complete**
   - 用途: Passkey登録完了

10. **POST /api/auth/passkey/login/begin**
    - 用途: Passkeyログインチャレンジ

11. **POST /api/auth/passkey/login/complete**
    - 用途: Passkeyログイン完了

---

## 新規追加が必要なエンドポイント（統計機能）

### 1. GET /api/note/question-stats
**用途**: 各問題の統計情報を取得（正答率、選択肢分布）

**リクエスト**:
```
GET /api/note/question-stats?ids=1,2,3,4,5
```

**レスポンス**:
```json
{
  "success": true,
  "stats": [
    {
      "question_id": 1,
      "total_attempts": 150,
      "correct_count": 90,
      "choice_distribution": {
        "0": 20,
        "1": 90,
        "2": 25,
        "3": 15
      }
    },
    {
      "question_id": 2,
      "total_attempts": 120,
      "correct_count": 72,
      "choice_distribution": {
        "0": 72,
        "1": 30,
        "2": 10,
        "3": 8
      }
    }
  ]
}
```

**データ構造**:
- `total_attempts`: その問題に挑戦した総人数
- `correct_count`: 正解した人数
- `choice_distribution`: 各選択肢を選んだ人数（キー: 選択肢インデックス 0-4、値: 人数）

---

### 2. POST /api/note/question-attempts
**用途**: ユーザーの解答結果を記録（統計データ蓄積用）

**リクエスト**:
```json
{
  "attempts": [
    {
      "question_id": 1,
      "selected_choice": 1,
      "is_correct": true
    },
    {
      "question_id": 2,
      "selected_choice": 0,
      "is_correct": true
    },
    {
      "question_id": 3,
      "selected_choice": 2,
      "is_correct": false
    }
  ]
}
```

**レスポンス**:
```json
{
  "success": true,
  "message": "Attempts recorded successfully"
}
```

**データ構造**:
- `question_id`: 問題ID
- `selected_choice`: 選択した選択肢のインデックス（0-4、未回答の場合はnull）
- `is_correct`: 正解かどうか

**必要なD1テーブル**:
```sql
CREATE TABLE IF NOT EXISTS question_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    user_id TEXT,
    selected_choice INTEGER,
    is_correct INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE INDEX idx_question_attempts_question_id ON question_attempts(question_id);
CREATE INDEX idx_question_attempts_created_at ON question_attempts(created_at);
```

---

## 必要な実装手順

### ステップ1: D1データベースにテーブル作成
```bash
wrangler d1 execute questa-r2-api --remote --command "
CREATE TABLE IF NOT EXISTS question_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    user_id TEXT,
    selected_choice INTEGER,
    is_correct INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE INDEX idx_question_attempts_question_id ON question_attempts(question_id);
CREATE INDEX idx_question_attempts_created_at ON question_attempts(created_at);
"
```

### ステップ2: Cloudflare Workerに新規エンドポイント実装

**GET /api/note/question-stats** の実装例:
```javascript
// 問題統計を取得
if (url.pathname === '/api/note/question-stats' && request.method === 'GET') {
    const ids = url.searchParams.get('ids');

    if (!ids) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Question IDs are required'
        }), {
            status: 400,
            headers: corsHeaders
        });
    }

    const questionIds = ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));

    if (questionIds.length === 0) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Valid question IDs are required'
        }), {
            status: 400,
            headers: corsHeaders
        });
    }

    const placeholders = questionIds.map(() => '?').join(',');

    const { results } = await env.DB.prepare(`
        SELECT
            question_id,
            COUNT(*) as total_attempts,
            SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
            selected_choice,
            COUNT(selected_choice) as choice_count
        FROM question_attempts
        WHERE question_id IN (${placeholders})
        GROUP BY question_id, selected_choice
    `).bind(...questionIds).all();

    // 統計データを整形
    const statsMap = {};

    results.forEach(row => {
        if (!statsMap[row.question_id]) {
            statsMap[row.question_id] = {
                question_id: row.question_id,
                total_attempts: 0,
                correct_count: row.correct_count || 0,
                choice_distribution: {}
            };
        }

        statsMap[row.question_id].total_attempts += row.choice_count;

        if (row.selected_choice !== null) {
            statsMap[row.question_id].choice_distribution[row.selected_choice] = row.choice_count;
        }
    });

    const stats = Object.values(statsMap);

    return new Response(JSON.stringify({
        success: true,
        stats: stats
    }), {
        headers: corsHeaders
    });
}
```

**POST /api/note/question-attempts** の実装例:
```javascript
// 解答結果を記録
if (url.pathname === '/api/note/question-attempts' && request.method === 'POST') {
    const authHeader = request.headers.get('Authorization');
    let userId = null;

    // 認証トークンがあればユーザーIDを取得（オプション）
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        // トークンからユーザーID取得処理（既存の認証ロジックを使用）
        // userId = await verifyToken(token, env);
    }

    const body = await request.json();
    const { attempts } = body;

    if (!attempts || !Array.isArray(attempts) || attempts.length === 0) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Attempts array is required'
        }), {
            status: 400,
            headers: corsHeaders
        });
    }

    const timestamp = new Date().toISOString();

    // バッチインサート
    const insertPromises = attempts.map(attempt => {
        return env.DB.prepare(`
            INSERT INTO question_attempts
            (question_id, user_id, selected_choice, is_correct, created_at)
            VALUES (?, ?, ?, ?, ?)
        `).bind(
            attempt.question_id,
            userId,
            attempt.selected_choice,
            attempt.is_correct ? 1 : 0,
            timestamp
        ).run();
    });

    await Promise.all(insertPromises);

    return new Response(JSON.stringify({
        success: true,
        message: 'Attempts recorded successfully'
    }), {
        headers: corsHeaders
    });
}
```

---

## パッセージ問題のデータ構造要件

パッセージ問題取得時に、各問題に以下のフィールドが必要:

```json
{
  "id": 123,
  "question_text": "問題文",
  "choices": ["a) 選択肢1", "b) 選択肢2", "c) 選択肢3", "d) 選択肢4"],
  "correct_answer": "B",
  "explanation": "解説文",
  "passage_script": "音声スクリプト全文（パッセージ共通）",
  "passage_explanation": "パッセージ全体の解説（パッセージ共通）"
}
```

- `passage_script`: パッセージ音声の全文テキスト（全問題で同じ値）
- `passage_explanation`: パッセージ全体に関する解説（全問題で同じ値）

---

## テスト方法

### 1. 統計データの投入テスト
```bash
curl -X POST https://questa-r2-api.t88596565.workers.dev/api/note/question-attempts \
  -H "Content-Type: application/json" \
  -d '{
    "attempts": [
      {"question_id": 1, "selected_choice": 1, "is_correct": true},
      {"question_id": 2, "selected_choice": 0, "is_correct": true}
    ]
  }'
```

### 2. 統計データの取得テスト
```bash
curl "https://questa-r2-api.t88596565.workers.dev/api/note/question-stats?ids=1,2,3"
```

---

## 優先度

### 高優先度（現在の機能で必須）
1. ✅ GET /api/note/questions
2. ✅ GET /api/note/passages
3. ✅ POST /api/note/progress
4. ⚠️ **GET /api/note/question-stats** ← 今回追加必須
5. ⚠️ **POST /api/note/question-attempts** ← 今回追加必須

### 中優先度（ユーザー体験向上）
6. POST /api/note/session/start
7. POST /api/note/session/end

### 低優先度（認証関連）
8. GET /api/auth/me
9. POST /api/auth/register
10. Passkey関連エンドポイント

---

## 現在の状況まとめ

**実装済み**:
- フロントエンド側で統計データの表示機能を実装済み
- 解答データの送信機能を実装済み

**未実装（Cloudflare Workers側で必要）**:
- [ ] `question_attempts` テーブルの作成
- [ ] GET /api/note/question-stats エンドポイント
- [ ] POST /api/note/question-attempts エンドポイント
- [ ] パッセージ問題データに `passage_script` と `passage_explanation` フィールド追加

**次のステップ**:
1. Cloudflare Workersのコードを確認・更新
2. D1データベースに新しいテーブルを作成
3. 2つの新規エンドポイントを実装
4. デプロイして動作確認
