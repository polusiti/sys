# 数学問題テンプレート

## 二次方程式 (A1)
```json
{
  "id": "math-quad-001",
  "subject": "math",
  "topic": "algebra/quadratic",
  "difficulty": 2,
  "answerFormat": "A1",
  "question": "次の二次方程式を解け。$$x^2 - 5x + 6 = 0$$",
  "choices": [
    "x=2,3",
    "x=1,6",
    "x=-2,-3",
    "x=0,5"
  ],
  "correctAnswer": 0,
  "explanation": "因数分解すると $(x-2)(x-3)=0$ となるため、$x=2,3$"
}
```

## 分数計算 (F1)
```json
{
  "id": "math-frac-001",
  "subject": "math",
  "topic": "arithmetic/fractions",
  "difficulty": 1,
  "answerFormat": "F1",
  "question": "次の計算をせよ。$$\\f{2}{3} + \\f{1}{4}$$",
  "expectedAnswer": {"a": 11, "b": 4},
  "explanation": "通分すると $\\f{8}{12} + \\f{3}{12} = \\f{11}{12}$"
}
```

# 英語問題テンプレート

## 文法問題 (A2)
```json
{
  "id": "eng-grammar-001",
  "subject": "english",
  "topic": "grammar/tenses",
  "difficulty": 2,
  "answerFormat": "A2",
  "question": "次の文の( )に適切な語句を入れよ。\nI ( ) to Tokyo yesterday.",
  "choices": [
    "go",
    "went",
    "gone",
    "going",
    "goes",
    "has gone"
  ],
  "correctAnswer": 1,
  "explanation": "過去の出来事なので過去形の 'went' を使う"
}
```

## 語彙問題 (F2)
```json
{
  "id": "eng-vocab-001",
  "subject": "english",
  "topic": "vocabulary/adjectives",
  "difficulty": 1,
  "answerFormat": "F2",
  "question": "「美しい」の意味として最も適切な英単語は？",
  "expectedAnswer": ["beautiful", "pretty", "lovely"],
  "validation": {
    "caseSensitive": false,
    "normalizeWhitespace": true
  },
  "explanation": "beautiful（美しい）は外見の美しさを表す基本的な形容詞"
}
```