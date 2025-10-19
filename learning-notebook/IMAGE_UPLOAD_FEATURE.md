# 画像アップロード機能 - 実装完了レポート

## 実装完了日
2025年10月19日

## 概要
物理・化学の問題作成時に画像をアップロードできる機能を実装しました。図やグラフ、実験装置などの視覚的な問題を作成できるようになりました。

## 実装内容

### 1. 対応科目

- ✅ 物理 (`/mana/physics/index.html`)
- ✅ 化学 (`/mana/chemistry/index.html`)

### 2. 機能詳細

#### 画像アップロード
- ファイル形式: 画像ファイル全般 (JPEG, PNG, GIF, WebP など)
- アップロード方法: ファイル選択ダイアログ
- 保存形式: Base64エンコード
- プレビュー機能: アップロード前に画像を確認可能

#### UI/UX
1. **アップロード画面**
   - 問題作成フォーム内に「画像（オプション）」フィールドを追加
   - ファイル選択後、即座にプレビュー表示
   - プレビュー画像サイズ: 最大200px

2. **問題一覧画面**
   - 画像が添付されている問題には画像を表示
   - 表示画像サイズ: 最大300px
   - ノートらしい手描き風のボーダー付き

3. **編集画面**
   - 既存の画像がある場合、編集時に表示
   - 新しい画像に差し替え可能

### 3. 技術実装

#### フロントエンド実装

**HTML構造**:
```html
<div class="form-group">
    <label>画像（オプション）</label>
    <input type="file" id="inputImage" accept="image/*">
    <div id="imagePreview" style="margin-top: 10px;"></div>
</div>
```

**JavaScript処理** (共通):
```javascript
// 画像選択時のプレビュー
document.getElementById('inputImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('imagePreview');

    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            preview.innerHTML = `<img src="${event.target.result}" style="max-width: 100%; max-height: 200px; border: 2px solid var(--button-border); border-radius: 4px;">`;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
});

// 問題保存時
const imageFile = document.getElementById('inputImage').files[0];
let imageUrl = null;

if (imageFile) {
    imageUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
    });
}

// dataオブジェクトに追加
const data = {
    subject: SUBJECT,
    title: document.getElementById('inputTitle').value,
    question_text: document.getElementById('inputQuestion').value,
    correct_answer: document.getElementById('inputAnswer').value,
    difficulty_level: document.getElementById('inputDifficulty').value,
    explanation: document.getElementById('inputExplanation').value,
    mode: 'katex',
    image_url: imageUrl  // 画像のBase64データ
};
```

#### d1-client.js の更新

```javascript
// createQuestion関数に image_url フィールドを追加
body: JSON.stringify({
    id: question.id || generateId(),
    subject: question.subject,
    title: question.title,
    question_text: question.question_text,
    correct_answer: question.correct_answer,
    source: 'learning-notebook',
    word: question.word || null,
    is_listening: question.is_listening || false,
    difficulty_level: question.difficulty_level || 'medium',
    mode: question.mode || null,
    choices: question.choices || null,
    media_urls: question.media_urls || null,
    explanation: question.explanation || null,
    tags: question.tags || null,
    image_url: question.image_url || null,  // 追加
    created_at: new Date().toISOString()
})
```

#### 問題表示の更新

```javascript
listEl.innerHTML = questions.map(q => `
    <div class="question-item">
        <div class="question-header">
            <span class="question-title">${escapeHtml(q.title)}</span>
            <div class="question-actions">
                <button class="btn-small" onclick="editQuestion('${q.id}')">編集</button>
                <button class="btn-small btn-danger" onclick="deleteQuestionConfirm('${q.id}')">削除</button>
            </div>
        </div>
        <div style="margin: 10px 0; color: var(--text-secondary); font-size: 14px;">
            難易度: ${q.difficulty_level || 'medium'}
        </div>
        <div style="margin: 10px 0;">${escapeHtml(q.question_text)}</div>
        ${q.image_url ? `<div style="margin: 10px 0;"><img src="${q.image_url}" style="max-width: 100%; max-height: 300px; border: 2px solid var(--button-border); border-radius: 4px;"></div>` : ''}
        <div style="margin: 10px 0; color: var(--text-accent);">正解: ${escapeHtml(q.correct_answer)}</div>
    </div>
`).join('');
```

### 4. データベーススキーマ

Cloudflare Workers API側で `image_url` フィールドを TEXT型で保存:

```sql
-- questions テーブル (既存)
-- image_url カラムが追加可能
ALTER TABLE questions ADD COLUMN image_url TEXT;
```

注: Base64形式で保存されるため、データサイズは元の画像の約1.33倍になります。

### 5. 使用例

#### 物理の問題例
```
タイトル: 力学的エネルギー保存則
問題文: 下図の斜面を滑る物体の運動について、点Aでの速度を求めよ。
[画像: 斜面と物体の図]
正解: $v = \sqrt{2gh}$
```

#### 化学の問題例
```
タイトル: 反応熱の計算
問題文: 下の熱化学方程式から、生成熱を求めよ。
[画像: 熱化学方程式の図]
正解: $\Delta H = -394 kJ/mol$
```

### 6. 制限事項と注意点

#### ファイルサイズ
- **推奨**: 1MB以下
- **最大**: Cloudflare Workers の制限に依存（通常25MB）
- Base64エンコードにより約33%増加

#### ブラウザ互換性
- FileReader API対応ブラウザ（Chrome, Firefox, Safari, Edge）
- IE11以下は非対応

#### パフォーマンス
- 大きな画像は読み込みに時間がかかる可能性
- 画像を多用する場合、ページ表示が遅くなる可能性

### 7. 今後の改善案

- [ ] 画像の自動リサイズ機能
- [ ] R2バケットへの直接アップロード（Base64回避）
- [ ] 画像の圧縮機能
- [ ] 複数画像のアップロード
- [ ] 画像のドラッグ&ドロップ対応
- [ ] 画像編集機能（トリミング、回転）
- [ ] LaTeX数式の画像化機能

### 8. トラブルシューティング

#### 画像が表示されない
1. **ブラウザのコンソールを確認**
   ```javascript
   // DevToolsで確認
   console.log(question.image_url);
   ```

2. **Base64データの確認**
   - `data:image/jpeg;base64,` で始まっているか確認
   - データが途中で切れていないか確認

3. **ファイルサイズの確認**
   ```javascript
   // ファイルサイズが大きすぎないか確認
   console.log('File size:', imageFile.size, 'bytes');
   ```

#### アップロードが失敗する
1. **ファイル形式の確認**
   - `accept="image/*"` で許可される形式か確認

2. **ネットワークエラー**
   ```javascript
   // Network タブで確認
   // Payload が正しく送信されているか
   ```

### 9. コミット情報

**コミットハッシュ**: `0c88106`

**変更ファイル**:
- `/home/higuc/sys/learning-notebook/mana/physics/index.html`
- `/home/higuc/sys/learning-notebook/mana/chemistry/index.html`
- `/home/higuc/sys/learning-notebook/mana/d1-client.js`

**コミットメッセージ**:
```
✨ Add image upload functionality for physics and chemistry questions

- Added image upload input field with preview in question forms
- Support Base64 encoded images stored in image_url field
- Display uploaded images in question list
- Preview images when editing existing questions
- Updated d1-client.js to handle image_url field
- Both physics and chemistry subjects now support image attachments
```

### 10. テスト手順

#### 手動テスト
1. **物理問題作成**
   ```
   1. http://localhost/mana/physics/index.html にアクセス
   2. 「新規作成」ボタンをクリック
   3. タイトル、問題文、正解を入力
   4. 「画像（オプション）」から画像を選択
   5. プレビューが表示されることを確認
   6. 「保存」ボタンをクリック
   7. 問題一覧に画像付きで表示されることを確認
   ```

2. **化学問題作成**
   ```
   (同様の手順)
   ```

3. **編集テスト**
   ```
   1. 既存の問題の「編集」ボタンをクリック
   2. 既存の画像が表示されることを確認
   3. 新しい画像を選択
   4. 「保存」ボタンをクリック
   5. 画像が更新されることを確認
   ```

### 11. API連携

#### POST /api/note/questions
```javascript
{
  "id": "1234567890_q1",
  "subject": "physics",
  "title": "力学問題",
  "question_text": "図の斜面を滑る物体の速度を求めよ",
  "correct_answer": "$v = \\sqrt{2gh}$",
  "difficulty_level": "medium",
  "explanation": "力学的エネルギー保存則より...",
  "image_url": "data:image/jpeg;base64,/9j/4AAQSkZJRg..." // Base64データ
}
```

#### レスポンス
```javascript
{
  "success": true,
  "question": {
    "id": "1234567890_q1",
    "subject": "physics",
    "title": "力学問題",
    "question_text": "図の斜面を滑る物体の速度を求めよ",
    "correct_answer": "$v = \\sqrt{2gh}$",
    "image_url": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "created_at": "2025-10-19T12:00:00.000Z"
  }
}
```

## まとめ

**実装者**: Claude Code
**プロジェクト**: 学習ノートアプリ - 画像アップロード機能
**対応科目**: 物理・化学
**ステータス**: ✅ 完了

物理・化学の問題作成時に画像をアップロードできる機能が実装され、視覚的な問題の作成が可能になりました。Base64エンコードを使用することで、シンプルかつ即座に利用可能な実装を実現しています。

今後、R2バケットへの直接アップロードや画像圧縮などの最適化を実施することで、さらにパフォーマンスを向上させることができます。
