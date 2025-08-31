// 一括インポート機能
class BulkImportManager {
    constructor() {
        this.supportedFormats = ['json', 'csv', 'xlsx', 'txt'];
        this.importHistory = [];
        this.init();
    }

    init() {
        this.setupFileHandlers();
        this.setupTemplateDownload();
    }

    // ファイルハンドラーのセットアップ
    setupFileHandlers() {
        const dropZone = document.getElementById('importDropZone');
        const fileInput = document.getElementById('importFileInput');
        
        if (dropZone && fileInput) {
            // ドラッグ&ドロップ
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });
            
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('drag-over');
            });
            
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                const files = Array.from(e.dataTransfer.files);
                this.processFiles(files);
            });
            
            // ファイル選択
            fileInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                this.processFiles(files);
            });
        }
    }

    // ファイル処理
    async processFiles(files) {
        const validFiles = files.filter(file => this.isValidFile(file));
        
        if (validFiles.length === 0) {
            this.showError('対応していないファイル形式です。JSON、CSV、Excel、またはテキストファイルをアップロードしてください。');
            return;
        }

        this.showProcessingStatus('ファイルを処理しています...');
        
        for (const file of validFiles) {
            try {
                await this.processFile(file);
            } catch (error) {
                console.error('File processing error:', error);
                this.showError(`${file.name} の処理中にエラーが発生しました: ${error.message}`);
            }
        }
        
        this.hideProcessingStatus();
    }

    // ファイル形式チェック
    isValidFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        return this.supportedFormats.includes(extension);
    }

    // ファイル処理の分岐
    async processFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        
        switch (extension) {
            case 'json':
                return await this.processJsonFile(file);
            case 'csv':
                return await this.processCsvFile(file);
            case 'xlsx':
                return await this.processExcelFile(file);
            case 'txt':
                return await this.processTextFile(file);
            default:
                throw new Error(`未対応のファイル形式: ${extension}`);
        }
    }

    // JSONファイル処理
    async processJsonFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    const questions = Array.isArray(data) ? data : [data];
                    
                    const validQuestions = this.validateQuestions(questions);
                    this.importQuestions(validQuestions, file.name);
                    resolve(validQuestions);
                } catch (error) {
                    reject(new Error('JSONファイルの形式が正しくありません'));
                }
            };
            reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
            reader.readAsText(file);
        });
    }

    // CSVファイル処理
    async processCsvFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const csvData = e.target.result;
                    const questions = this.parseCsv(csvData);
                    
                    const validQuestions = this.validateQuestions(questions);
                    this.importQuestions(validQuestions, file.name);
                    resolve(validQuestions);
                } catch (error) {
                    reject(new Error('CSVファイルの解析に失敗しました'));
                }
            };
            reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
            reader.readAsText(file);
        });
    }

    // CSV解析
    parseCsv(csvData) {
        const lines = csvData.split('\n').map(line => line.trim()).filter(line => line);
        if (lines.length < 2) throw new Error('CSVファイルにデータがありません');
        
        const headers = lines[0].split(',').map(h => h.trim());
        const questions = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCsvLine(lines[i]);
            if (values.length !== headers.length) continue;
            
            const question = {};
            headers.forEach((header, index) => {
                question[header] = values[index];
            });
            
            questions.push(this.convertCsvToQuestion(question));
        }
        
        return questions;
    }

    // CSV行の解析（クォート対応）
    parseCsvLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current.trim());
        return values;
    }

    // CSV形式から問題形式への変換
    convertCsvToQuestion(csvRow) {
        return {
            id: csvRow.id || '',
            answerFormat: csvRow.answerFormat || 'A1',
            subject: csvRow.subject || 'math',
            topic: csvRow.topic || '',
            difficulty: parseInt(csvRow.difficulty) || 2,
            tags: csvRow.tags ? csvRow.tags.split(';') : [],
            questionContent: {
                stem: csvRow.stem || '',
                text: csvRow.question || csvRow.text || '',
                latex: csvRow.latex === 'true' || csvRow.latex === '1',
                images: []
            },
            answerData: {
                type: csvRow.answerFormat?.startsWith('A') ? 'multiple-choice' : 'text',
                choices: csvRow.choices ? csvRow.choices.split('|') : [],
                correctAnswers: csvRow.correctAnswers ? csvRow.correctAnswers.split(',').map(i => parseInt(i)) : [],
                closeAnswers: csvRow.closeAnswers ? csvRow.closeAnswers.split(',').map(i => parseInt(i)) : []
            },
            explanation: {
                text: csvRow.explanation || '',
                latex: csvRow.explanationLatex === 'true' || csvRow.explanationLatex === '1',
                detailed: csvRow.detailedExplanation || '',
                steps: csvRow.steps ? csvRow.steps.split('|') : [],
                hints: csvRow.hints ? csvRow.hints.split('|') : []
            },
            metadata: {
                estimatedTime: parseInt(csvRow.estimatedTime) || 180,
                createdAt: new Date().toISOString()
            },
            active: csvRow.active !== 'false'
        };
    }

    // 問題データの検証
    validateQuestions(questions) {
        const validQuestions = [];
        const errors = [];
        
        questions.forEach((question, index) => {
            try {
                const validated = this.validateSingleQuestion(question, index + 1);
                validQuestions.push(validated);
            } catch (error) {
                errors.push(`問題 ${index + 1}: ${error.message}`);
            }
        });
        
        if (errors.length > 0) {
            this.showValidationErrors(errors);
        }
        
        return validQuestions;
    }

    // 単一問題の検証
    validateSingleQuestion(question, lineNumber) {
        const validated = {
            id: question.id || `IMPORT_${Date.now()}_${lineNumber}`,
            answerFormat: question.answerFormat || 'A1',
            subject: question.subject || 'math',
            topic: question.topic || '',
            difficulty: Math.max(1, Math.min(5, parseInt(question.difficulty) || 2)),
            tags: Array.isArray(question.tags) ? question.tags : [],
            questionContent: {
                stem: question.questionContent?.stem || question.stem || '',
                text: question.questionContent?.text || question.question || question.text || '',
                latex: Boolean(question.questionContent?.latex || question.latex),
                images: question.questionContent?.images || []
            },
            answerData: {
                type: question.answerData?.type || 'multiple-choice',
                choices: question.answerData?.choices || [],
                correctAnswers: question.answerData?.correctAnswers || [],
                closeAnswers: question.answerData?.closeAnswers || []
            },
            explanation: {
                text: question.explanation?.text || question.explanation || '',
                latex: Boolean(question.explanation?.latex),
                detailed: question.explanation?.detailed || '',
                steps: question.explanation?.steps || [],
                hints: question.explanation?.hints || []
            },
            metadata: {
                estimatedTime: parseInt(question.metadata?.estimatedTime || question.estimatedTime) || 180,
                createdAt: question.metadata?.createdAt || new Date().toISOString()
            },
            active: question.active !== false
        };
        
        // 必須項目チェック
        if (!validated.questionContent.text.trim()) {
            throw new Error('問題文が空です');
        }
        
        return validated;
    }

    // 問題のインポート
    importQuestions(questions, fileName) {
        if (questions.length === 0) {
            this.showError('インポート可能な問題が見つかりませんでした');
            return;
        }

        // 既存データの取得
        const existingQuestions = this.getExistingQuestions();
        
        // 重複チェック
        const { newQuestions, duplicates } = this.checkDuplicates(questions, existingQuestions);
        
        if (duplicates.length > 0) {
            this.showDuplicateDialog(newQuestions, duplicates, fileName);
        } else {
            this.saveImportedQuestions(newQuestions, fileName);
        }
    }

    // 既存問題データの取得
    getExistingQuestions() {
        // 既存の問題ファイルから読み込み
        const existingData = localStorage.getItem('imported_questions');
        return existingData ? JSON.parse(existingData) : [];
    }

    // 重複チェック
    checkDuplicates(newQuestions, existingQuestions) {
        const existingIds = new Set(existingQuestions.map(q => q.id));
        const newQuestions_ = [];
        const duplicates = [];
        
        newQuestions.forEach(question => {
            if (existingIds.has(question.id)) {
                duplicates.push(question);
            } else {
                newQuestions_.push(question);
            }
        });
        
        return { newQuestions: newQuestions_, duplicates };
    }

    // インポート実行
    saveImportedQuestions(questions, fileName) {
        const existingQuestions = this.getExistingQuestions();
        const allQuestions = [...existingQuestions, ...questions];
        
        localStorage.setItem('imported_questions', JSON.stringify(allQuestions));
        
        this.recordImportHistory(fileName, questions.length);
        this.showImportSuccess(questions.length, fileName);
    }

    // インポート履歴の記録
    recordImportHistory(fileName, count) {
        const history = {
            fileName,
            count,
            timestamp: new Date().toISOString(),
            user: AuthenticationSystem.getCurrentUser()?.displayName || 'Unknown'
        };
        
        this.importHistory.unshift(history);
        if (this.importHistory.length > 10) {
            this.importHistory = this.importHistory.slice(0, 10);
        }
        
        localStorage.setItem('import_history', JSON.stringify(this.importHistory));
    }

    // テンプレートダウンロードのセットアップ
    setupTemplateDownload() {
        // CSV テンプレート
        this.csvTemplate = `id,answerFormat,subject,topic,difficulty,tags,stem,question,latex,choices,correctAnswers,closeAnswers,explanation,explanationLatex,steps,hints,estimatedTime
M_A1_001,A1,math,計算,2,基本;四則演算,次の計算をしなさい。,2 + 3 = ?,false,1|2|5|6,2,,2と3を足すと5になります,false,,計算の基本を確認しましょう,180
E_A1_001,A1,english,語彙,2,基本;名詞,適切な単語を選びなさい。,I have a _____ dog.,false,big|small|red|happy,0;1,,形容詞で犬を説明します,false,,形容詞の使い方を学びましょう,180`;
        
        // JSON テンプレート
        this.jsonTemplate = [
            {
                "id": "SAMPLE_001",
                "answerFormat": "A1",
                "subject": "math",
                "topic": "計算",
                "difficulty": 2,
                "tags": ["基本", "四則演算"],
                "questionContent": {
                    "stem": "次の計算をしなさい。",
                    "text": "2 + 3 = ?",
                    "latex": false,
                    "images": []
                },
                "answerData": {
                    "type": "multiple-choice",
                    "choices": ["4", "5", "6", "7"],
                    "correctAnswers": [1],
                    "closeAnswers": []
                },
                "explanation": {
                    "text": "2と3を足すと5になります",
                    "latex": false,
                    "detailed": "",
                    "steps": [],
                    "hints": ["足し算の基本"]
                },
                "metadata": {
                    "estimatedTime": 180,
                    "createdAt": "2024-01-01T00:00:00.000Z"
                },
                "active": true
            }
        ];
    }

    // テンプレートダウンロード
    downloadTemplate(format) {
        let content, filename, mimeType;
        
        switch (format) {
            case 'csv':
                content = this.csvTemplate;
                filename = 'question_template.csv';
                mimeType = 'text/csv;charset=utf-8;';
                break;
            case 'json':
                content = JSON.stringify(this.jsonTemplate, null, 2);
                filename = 'question_template.json';
                mimeType = 'application/json;charset=utf-8;';
                break;
            default:
                this.showError('不明なテンプレート形式です');
                return;
        }
        
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    // UI表示メソッド
    showProcessingStatus(message) {
        // 処理中表示の実装
        console.log('Processing:', message);
    }

    hideProcessingStatus() {
        // 処理中表示の非表示
        console.log('Processing complete');
    }

    showImportSuccess(count, fileName) {
        if (window.pwaManager) {
            window.pwaManager.showLocalNotification('インポート完了', {
                body: `${count}問の問題をインポートしました (${fileName})`,
                tag: 'import-success'
            });
        }
        alert(`${count}問の問題を正常にインポートしました\nファイル: ${fileName}`);
    }

    showError(message) {
        console.error('Import error:', message);
        alert('エラー: ' + message);
    }

    showValidationErrors(errors) {
        const errorMessage = 'インポート時に以下のエラーが発生しました:\n\n' + errors.join('\n');
        alert(errorMessage);
    }

    showDuplicateDialog(newQuestions, duplicates, fileName) {
        const message = `重複する問題が${duplicates.length}問見つかりました。\n` +
                       `新規問題: ${newQuestions.length}問\n` +
                       `重複問題: ${duplicates.length}問\n\n` +
                       `新規問題のみをインポートしますか？`;
        
        if (confirm(message)) {
            this.saveImportedQuestions(newQuestions, fileName);
        }
    }
}

// グローバル関数
function openBulkImport() {
    window.open('bulk-import.html', '_blank', 'width=900,height=700');
}

window.BulkImportManager = BulkImportManager;