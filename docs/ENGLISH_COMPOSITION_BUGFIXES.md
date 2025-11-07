# 英作文添削システム バグ修正ドキュメント

## 概要

英作文添削システムにおいて、APIレスポンスのデータ形式不整合による表示問題を修正した。

## 問題点

### 1. 新規履歴の表示崩れ
**原因**: APIレスポンス形式の不一致
- **POST /api/english/compose**: camelCase形式でレスポンス (`originalText`, `sgifCategory` 等)
- **履歴表示**: snake_case形式を想定 (`original_text`, `sgif_category` 等)

**影響**:
- 最新の添削結果が履歴に正しく表示されない
- カテゴリ情報が欠落
- テキスト内容が空欄になる

### 2. 履歴詳細の再表示が機能しない
**原因**: APIとフロントエンドのデータ形式不一致
- **GET /api/english/compose/{id}**: DB列名（snake_case）で返却
- **showResult()メソッド**: camelCase形式のみ参照

**影響**:
- 履歴から詳細を開いても信頼度が表示されない
- テキスト比較が機能しない
- SGIFカテゴリが表示されない

## 修正内容

### 1. APIレスポンス形式の統一

#### POST /api/english/compose レスポンス修正
```javascript
// 修正前 (camelCaseのみ)
{
  "data": {
    "originalText": "...",
    "sgifCategory": "S1",
    "confidenceScore": 0.85
  }
}

// 修正後 (snake_case + camelCase 両方含む)
{
  "data": {
    "original_text": "...",
    "sgif_category": "S1",
    "confidence_score": 0.85,
    // 互換性のためcamelCaseも含める
    "originalText": "...",
    "sgifCategory": "S1",
    "confidenceScore": 0.85
  }
}
```

#### GET /api/english/compose/{id} レスポンス修正
```javascript
// 修正後: snake_case + camelCase の両方を返却
const responseData = {
    ...composition,
    // camelCaseフィールドを追加
    originalText: composition.original_text,
    correctedText: composition.corrected_text,
    errorAnalysis: composition.error_analysis,
    suggestions: composition.suggestions,
    sgifCategory: composition.sgif_category,
    confidenceScore: composition.confidence_score,
    processingTime: composition.processing_time
};
```

### 2. フロントエンドの互換性向上

#### addToHistory() メソッド修正
```javascript
addToHistory(composition) {
    // データ形式の互換性を確保（snake_caseとcamelCaseの両方に対応）
    const normalizedComposition = {
        ...composition,
        // snake_caseフィールドが存在しない場合はcamelCaseからコピー
        original_text: composition.original_text || composition.originalText || '',
        corrected_text: composition.corrected_text || composition.correctedText || '',
        sgif_category: composition.sgif_category || composition.sgifCategory || '',
        confidence_score: composition.confidence_score || composition.confidenceScore || 0,
        processing_time: composition.processing_time || composition.processingTime || 0
    };

    this.history.unshift(normalizedComposition);
    // ...
}
```

#### showResult() メソッド修正
```javascript
showResult() {
    // データ形式の互換性を確保（snake_caseとcamelCaseの両方に対応）
    const result = {
        confidenceScore: this.correctionResult.confidenceScore || this.correctionResult.confidence_score || 0,
        processingTime: this.correctionResult.processingTime || this.correctionResult.processing_time || 0,
        sgifCategory: this.correctionResult.sgifCategory || this.correctionResult.sgif_category || '',
        originalText: this.correctionResult.originalText || this.correctionResult.original_text || '',
        correctedText: this.correctionResult.correctedText || this.correctionResult.corrected_text || '',
        errorAnalysis: this.correctionResult.errorAnalysis || this.correctionResult.error_analysis || [],
        suggestions: this.correctionResult.suggestions || this.correctionResult.suggestions || []
    };

    // 以下、resultオブジェクトを使用してUIを更新
}
```

## 修正ファイル一覧

### バックエンド
- `sys/unified-api-worker.js`
  - `handleEnglishComposition()` (1240-1261行): POSTレスポンス形式修正
  - `handleGetComposition()` (1387-1405行): GETレスポンス形式修正

### フロントエンド
- `sys/js/english-composition.js`
  - `addToHistory()` (642-659行): 履歴追加時のデータ形式正規化
  - `showResult()` (393-431行): 結果表示時のデータ形式互換性対応

## 修正効果

### ✅ 修正完了した問題
1. **新規履歴表示崩れ**: 最新の添削結果が正しく履歴に表示される
2. **履歴詳細再表示**: 履歴から詳細を開いた際にすべての情報が正しく表示される
3. **データ形式互換性**: snake_caseとcamelCaseの両方に対応

### 🔄 技術的改善点
1. **後方互換性**: 既存のcamelCase形式も維持
2. **堅牢性**: 欠落フィールドがあってもデフォルト値で補完
3. **保守性**: データ形式の不一致によるバグを防止

## テスト項目

### 基本機能テスト
- [ ] 英作文を新規投稿し、結果が正しく表示される
- [ ] 投稿した結果が履歴に正しく表示される
- [ ] 履歴から詳細を開いた際にすべての情報が表示される
- [ ] 信頼度スコアが正しく表示される
- [ ] SGIFカテゴリが正しく表示される

### データ形式テスト
- [ ] camelCaseレスポンスに対応できる
- [ ] snake_caseレスポンスに対応できる
- [ ] 欠落フィールドがあってもデフォルト値で表示される

### エラーハンドリングテスト
- [ ] APIエラー時に適切なエラーメッセージが表示される
- [ ] ネットワークエラー時にリトライが機能する

## 関連ファイル

- **データベース**: `sys/sql/ai_tables.sql`
- **API仕様**: `sys/unified-api-worker.js` (1192-1652行)
- **フロントエンド**: `sys/js/english-composition.js` (40-675行)
- **スタイル**: `sys/css/english-composition.css` (1-916行)
- **ページ**: `sys/pages/english-composition.html`

## 更新履歴

- **2025-11-07**: 初版作成
  - データ形式不整合問題の修正
  - 互換性の向上
  - 表示バグの解決

---

**作成者**: Claude AI Assistant
**最終更新**: 2025-11-07
**バージョン**: 1.0