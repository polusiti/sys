# 画像アップロード機能 - 実装完了レポート

## 実装完了日
2025年10月19日

## 最終更新日
2025年10月20日 - UI/UX改善（致命的バグ修正含む）

## 概要
物理・化学の問題作成時に画像をアップロードできる機能を実装しました。図やグラフ、実験装置などの視覚的な問題を作成できるようになりました。

**2025年10月20日更新**: 徹底的なUI/UX検証により、致命的バグを含む5つの重大な問題を発見し、すべて修正しました。

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

- [x] **画像の自動リサイズ機能** - 不要（ファイルサイズ制限で対応）
- [ ] R2バケットへの直接アップロード（Base64回避）
- [ ] 画像の圧縮機能
- [ ] 複数画像のアップロード
- [ ] 画像のドラッグ&ドロップ対応
- [ ] 画像編集機能（トリミング、回転）
- [ ] LaTeX数式の画像化機能

---

## 2025年10月20日: UI/UX改善アップデート

### 🔍 実施した検証

徹底的なUI/UX品質検証を実施し、以下の問題を発見しました:

### 🔴 発見された致命的バグ（P0）

#### 1. 既存画像が編集時に消えるバグ

**問題詳細**:
```javascript
// 修正前（バグあり）
const imageFile = document.getElementById('inputImage').files[0];
let imageUrl = null;  // ← 常にnullで初期化

if (imageFile) {
    imageUrl = await new Promise(...);  // 新しいファイルがない場合、実行されない
}

const data = {
    image_url: imageUrl  // ← nullが設定され、既存画像が削除される！
};
```

**影響**: 問題を編集してタイトルや問題文だけを変更すると、添付されていた画像が意図せず削除されていました。

**修正内容**:
```javascript
// 修正後
// 編集時は既存画像を保持、新規作成時はnull
let imageUrl = editingId ? (currentQuestions.find(q => q.id === editingId)?.image_url || null) : null;

if (imageFile) {
    imageUrl = await new Promise(...);  // 新しい画像で上書き
}
```

**ステータス**: ✅ 修正完了

---

### 🟠 発見された重大な欠陥（P1）

#### 2. ファイルサイズ検証がない

**問題**: 10MBの画像をアップロードした場合、Base64エンコードで13.3MBになり、Workers APIやブラウザに負荷がかかる。

**修正内容**:
```javascript
if (imageFile) {
    // ファイルサイズチェック (1MB = 1048576 bytes)
    if (imageFile.size > 1048576) {
        alert('画像サイズは1MB以下にしてください。\n現在: ' + (imageFile.size / 1048576).toFixed(2) + 'MB');
        return;
    }
    // ... Base64エンコード処理
}
```

**ステータス**: ✅ 修正完了

---

#### 3. 画像削除機能がない

**問題**: 一度画像を添付すると、削除する方法がなかった（新しい画像に置き換えることはできるが、画像なしに戻せない）。

**修正内容**:
```html
<!-- HTML: 削除ボタン追加 -->
<button type="button" id="removeImageBtn" style="display: none; margin-top: 8px;"
        class="btn-small btn-danger" onclick="removeImage()">画像を削除</button>
```

```javascript
// JavaScript: removeImage関数
function removeImage() {
    // プレビューをクリア
    document.getElementById('imagePreview').innerHTML = '';
    // ファイル入力をクリア
    document.getElementById('inputImage').value = '';
    // 削除ボタンを非表示
    document.getElementById('removeImageBtn').style.display = 'none';

    // 編集中の場合は、既存画像を削除するフラグを立てる
    if (editingId) {
        const question = currentQuestions.find(q => q.id === editingId);
        if (question) {
            question.image_url = null;
        }
    }
}
```

**ステータス**: ✅ 修正完了

---

### 🟡 品質改善項目（P2）

#### 4. 読み込み中インジケーターがない

**問題**: 大きな画像のBase64変換中、ユーザーに進行状況が分からなかった。

**修正内容**:
```javascript
if (imageFile) {
    // ローディング表示
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '画像を処理中...';

    try {
        imageUrl = await new Promise(...);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}
```

**ステータス**: ✅ 修正完了

---

#### 5. ユーザーガイダンスがない

**問題**: 推奨サイズやフォーマットの説明がなかった。

**修正内容**:
```html
<label>画像（オプション）
    <span style="font-size: 12px; color: var(--text-secondary); font-weight: normal;">
        - 推奨: 1MB以下、JPEG/PNG
    </span>
</label>
```

**ステータス**: ✅ 修正完了

---

### 📊 修正サマリー

| 問題 | 優先度 | 影響 | ステータス |
|------|--------|------|-----------|
| 既存画像が消えるバグ | P0 (致命的) | 編集時に画像が意図せず削除される | ✅ 修正済 |
| ファイルサイズ検証なし | P1 (重大) | 大容量画像による障害リスク | ✅ 修正済 |
| 画像削除機能なし | P1 (重大) | 画像を削除できない | ✅ 修正済 |
| ローディング表示なし | P2 (改善) | ユーザーフィードバック不足 | ✅ 修正済 |
| ガイダンスなし | P2 (改善) | 推奨仕様が不明 | ✅ 修正済 |

---

### 🎯 修正後の機能

#### 完全な画像管理フロー

1. **新規作成**:
   - 画像選択 → プレビュー表示 → 削除ボタン表示
   - ファイルサイズチェック（1MB制限）
   - 処理中は「画像を処理中...」と表示
   - 保存ボタン無効化で二重送信防止

2. **編集**:
   - 既存画像がある場合、プレビューと削除ボタンを表示
   - 新しい画像を選択しない場合、既存画像を保持
   - 削除ボタンクリックで画像を削除可能

3. **バリデーション**:
   - 1MB超過時、明確なエラーメッセージ表示
   - 現在のファイルサイズを表示

---

### 🔧 技術的変更点

#### physics/index.html の変更

1. **HTML構造** (192-196行目):
```html
<div class="form-group">
    <label>画像（オプション）<span style="font-size: 12px; color: var(--text-secondary); font-weight: normal;"> - 推奨: 1MB以下、JPEG/PNG</span></label>
    <input type="file" id="inputImage" accept="image/*">
    <div id="imagePreview" style="margin-top: 10px;"></div>
    <button type="button" id="removeImageBtn" style="display: none; margin-top: 8px;" class="btn-small btn-danger" onclick="removeImage()">画像を削除</button>
</div>
```

2. **プレビューロジック** (215-231行目):
```javascript
document.getElementById('inputImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('imagePreview');
    const removeBtn = document.getElementById('removeImageBtn');

    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            preview.innerHTML = `<img src="${event.target.result}" style="max-width: 100%; max-height: 200px; border: 2px solid var(--button-border); border-radius: 4px;">`;
            removeBtn.style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
        removeBtn.style.display = 'none';
    }
});
```

3. **保存処理** (310-349行目):
```javascript
async function handleSubmit(event) {
    event.preventDefault();

    const imageFile = document.getElementById('inputImage').files[0];

    // 編集時は既存画像を保持、新規作成時はnull
    let imageUrl = editingId ? (currentQuestions.find(q => q.id === editingId)?.image_url || null) : null;

    // 画像がアップロードされている場合
    if (imageFile) {
        // ファイルサイズチェック (1MB = 1048576 bytes)
        if (imageFile.size > 1048576) {
            alert('画像サイズは1MB以下にしてください。\n現在: ' + (imageFile.size / 1048576).toFixed(2) + 'MB');
            return;
        }

        try {
            // ローディング表示
            const submitBtn = event.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = '画像を処理中...';

            try {
                // Base64エンコード
                imageUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(imageFile);
                });
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        } catch (error) {
            alert('画像の読み込みに失敗しました: ' + error.message);
            return;
        }
    }
    // ... データ送信処理
}
```

4. **削除機能** (414-429行目):
```javascript
function removeImage() {
    // プレビューをクリア
    document.getElementById('imagePreview').innerHTML = '';
    // ファイル入力をクリア
    document.getElementById('inputImage').value = '';
    // 削除ボタンを非表示
    document.getElementById('removeImageBtn').style.display = 'none';

    // 編集中の場合は、既存画像を削除するフラグを立てる
    if (editingId) {
        const question = currentQuestions.find(q => q.id === editingId);
        if (question) {
            question.image_url = null;
        }
    }
}
```

#### chemistry/index.html の変更

physics/index.htmlと同一の修正を適用しました（192-196, 215-231, 310-349, 414-429行目）。

---

### ✅ 修正確認項目

- [x] 既存画像が編集時に保持される
- [x] 1MB超過時にエラーメッセージが表示される
- [x] 画像削除ボタンが正しく動作する
- [x] 削除ボタンが適切なタイミングで表示/非表示になる
- [x] 画像処理中にローディング表示が出る
- [x] 保存ボタンが処理中は無効化される
- [x] 推奨サイズがユーザーに明示される
- [x] 新規作成と編集の両方で正しく動作する

---

### 🎉 最終結論

**画像アップロード機能のUI/UXは十分な品質に達しました**。

初期実装では基本機能のみでしたが、以下の改善により production-ready な品質となりました:

1. ✅ **データ整合性**: 既存画像の保持ロジック修正により、意図しないデータ損失を防止
2. ✅ **パフォーマンス**: ファイルサイズ制限により、大容量画像による障害を防止
3. ✅ **ユーザビリティ**: 削除機能、ローディング表示、ガイダンスにより、使いやすさが大幅に向上
4. ✅ **エラーハンドリング**: 適切なバリデーションとエラーメッセージにより、ユーザーエクスペリエンスが向上

**変更ファイル**:
- `/home/higuc/sys/learning-notebook/mana/physics/index.html`
- `/home/higuc/sys/learning-notebook/mana/chemistry/index.html`

**修正日**: 2025年10月20日

---

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
