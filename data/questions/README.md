# Quiz Questions Management

## ファイル構成

### 問題データファイル
- `data/questions/quiz-choice-questions.json` - A1-A3（選択式）問題
- `data/questions/quiz-f1-questions.json` - F1（分数）問題  
- `data/questions/quiz-f2-questions.json` - F2（自由入力）問題

### スキーマファイル
- `data/schema/quiz-question.schema.json` - 問題データのバリデーション用JSONスキーマ

## 問題形式

### A1-A3（選択式）
```json
{
  "id": "quiz-a1-001",
  "answerFormat": "A1",
  "subject": "math",
  "topic": "algebra/quadratic",
  "difficulty": 2,
  "choices": ["option1", "option2", "option3", "option4"],
  "correctAnswer": 0
}
```

### F1（分数）
```json
{
  "id": "quiz-f1-001", 
  "answerFormat": "F1",
  "expectedAnswer": {"a": 2, "b": 3, "c": 1},
  "limits": {
    "a": {"min": -10, "max": 10},
    "b": {"min": 0, "max": 20}, 
    "c": {"min": -10, "max": 10}
  },
  "defaults": {"a": 1, "b": 1, "c": 1}
}
```

### F2（自由入力）
```json
{
  "id": "quiz-f2-001",
  "answerFormat": "F2", 
  "expectedAnswer": ["4x", "4*x"],
  "validation": {
    "caseSensitive": false,
    "normalizeWhitespace": true,
    "pattern": "^4\\*?x$"
  }
}
```

## 管理のポイント

1. **一意なID**: `quiz-{format}-{number}` 形式
2. **解答形式**: `answerFormat` フィールドで明示
3. **段階的難易度**: `difficulty` 1-5で設定
4. **詳細な説明**: `explanation` フィールドで解説提供
5. **バリデーション**: JSONスキーマで構造検証

## 新しい問題の追加

1. 適切なファイル（A1-A3なら choice、F1なら f1、F2なら f2）を選択
2. スキーマに従った構造で問題を作成
3. 一意なIDと適切な解答形式を設定
4. テスト実行で動作確認