// Advanced Data Export/Import System
class DataExchange {
    constructor() {
        this.supportedFormats = ['json', 'csv', 'excel', 'xml', 'qti'];
        this.init();
    }

    init() {
        this.setupExportUI();
        this.setupImportUI();
    }

    setupExportUI() {
        // エクスポートUIのセットアップ
        const exportContainer = document.getElementById('exportSection');
        if (exportContainer) {
            exportContainer.innerHTML = `
                <div class="export-options">
                    <h3>データエクスポート</h3>
                    <div class="export-format-selection">
                        <label>エクスポート形式:</label>
                        <select id="exportFormat" class="form-select">
                            <option value="json">JSON</option>
                            <option value="csv">CSV</option>
                            <option value="excel">Excel (.xlsx)</option>
                            <option value="xml">XML</option>
                            <option value="qti">QTI 2.1</option>
                            <option value="moodle">Moodle XML</option>
                        </select>
                    </div>
                    
                    <div class="export-filters">
                        <h4>フィルター</h4>
                        <div class="filter-group">
                            <label>科目:</label>
                            <select id="exportSubject" class="form-select">
                                <option value="">すべて</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>難易度:</label>
                            <select id="exportDifficulty" class="form-select">
                                <option value="">すべて</option>
                                <option value="1">レベル1</option>
                                <option value="2">レベル2</option>
                                <option value="3">レベル3</option>
                                <option value="4">レベル4</option>
                                <option value="5">レベル5</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>問題形式:</label>
                            <select id="exportFormatType" class="form-select">
                                <option value="">すべて</option>
                                <option value="A1">4択</option>
                                <option value="A2">6択</option>
                                <option value="A3">9択</option>
                                <option value="F1">分数</option>
                                <option value="F2">記述式</option>
                                <option value="B1">画像選択</option>
                                <option value="C1">穴埋め</option>
                                <option value="D1">組み合わせ</option>
                                <option value="E1">並べ替え</option>
                                <option value="F3">音声</option>
                                <option value="G1">複数選択</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>作成日:</label>
                            <input type="date" id="exportFromDate" class="form-input">
                            <span>〜</span>
                            <input type="date" id="exportToDate" class="form-input">
                        </div>
                    </div>
                    
                    <div class="export-options-advanced">
                        <label>
                            <input type="checkbox" id="includeMetadata"> メタデータを含める
                        </label>
                        <label>
                            <input type="checkbox" id="includeImages"> 画像を含める
                        </label>
                        <label>
                            <input type="checkbox" id="includeStats"> 統計データを含める
                        </label>
                    </div>
                    
                    <div class="export-actions">
                        <button onclick="dataExchange.exportData()" class="btn-primary">エクスポート</button>
                        <button onclick="dataExchange.previewExport()" class="btn-secondary">プレビュー</button>
                    </div>
                </div>
            `;
            
            // 科目リストを動的に設定
            this.populateSubjectSelect('exportSubject');
        }
    }

    setupImportUI() {
        // インポートUIのセットアップ
        const importContainer = document.getElementById('importSection');
        if (importContainer) {
            importContainer.innerHTML = `
                <div class="import-options">
                    <h3>データインポート</h3>
                    <div class="import-file-selection">
                        <label>ファイルを選択:</label>
                        <input type="file" id="importFile" accept=".json,.csv,.xlsx,.xml,.zip" class="form-input">
                        <div class="file-formats">
                            <p>対応形式: JSON, CSV, Excel (.xlsx), XML, QTI, Moodle XML, ZIP</p>
                        </div>
                    </div>
                    
                    <div class="import-options-advanced">
                        <h4>インポートオプション</h4>
                        <label>
                            <input type="checkbox" id="overwriteExisting"> 既存データを上書き
                        </label>
                        <label>
                            <input type="checkbox" id="validateData"> データ検証を実行
                        </label>
                        <label>
                            <input type="checkbox" id="createBackup"> インポート前にバックアップを作成
                        </label>
                    </div>
                    
                    <div class="import-mapping" id="importMapping" style="display: none;">
                        <h4>フィールドマッピング</h4>
                        <div id="mappingFields"></div>
                    </div>
                    
                    <div class="import-preview" id="importPreview" style="display: none;">
                        <h4>インポートプレビュー</h4>
                        <div id="previewContent"></div>
                    </div>
                    
                    <div class="import-actions">
                        <button onclick="dataExchange.importData()" class="btn-primary">インポート</button>
                        <button onclick="dataExchange.analyzeFile()" class="btn-secondary">ファイル分析</button>
                    </div>
                </div>
            `;
        }
    }

    async exportData() {
        try {
            const format = document.getElementById('exportFormat').value;
            const filters = this.getExportFilters();
            const options = this.getExportOptions();
            
            // データベースからデータを取得
            const db = window.Database;
            if (!db) {
                throw new Error('データベースが利用できません');
            }
            
            let questions = await db.getAllQuestions();
            
            // フィルターを適用
            questions = this.applyFilters(questions, filters);
            
            // 形式に応じてエクスポート
            let exportedData;
            let filename;
            let mimeType;
            
            switch(format) {
                case 'json':
                    exportedData = this.exportToJSON(questions, options);
                    filename = `questions_${new Date().toISOString().split('T')[0]}.json`;
                    mimeType = 'application/json';
                    break;
                    
                case 'csv':
                    exportedData = this.exportToCSV(questions, options);
                    filename = `questions_${new Date().toISOString().split('T')[0]}.csv`;
                    mimeType = 'text/csv';
                    break;
                    
                case 'excel':
                    exportedData = await this.exportToExcel(questions, options);
                    filename = `questions_${new Date().toISOString().split('T')[0]}.xlsx`;
                    mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                    break;
                    
                case 'xml':
                    exportedData = this.exportToXML(questions, options);
                    filename = `questions_${new Date().toISOString().split('T')[0]}.xml`;
                    mimeType = 'application/xml';
                    break;
                    
                case 'qti':
                    exportedData = this.exportToQTI(questions, options);
                    filename = `questions_${new Date().toISOString().split('T')[0]}.xml`;
                    mimeType = 'application/xml';
                    break;
                    
                case 'moodle':
                    exportedData = this.exportToMoodleXML(questions, options);
                    filename = `moodle_questions_${new Date().toISOString().split('T')[0]}.xml`;
                    mimeType = 'application/xml';
                    break;
            }
            
            // ファイルをダウンロード
            this.downloadFile(exportedData, filename, mimeType);
            
            // 成功メッセージ
            this.showNotification('エクスポートが完了しました', 'success');
            
        } catch (error) {
            console.error('Export failed:', error);
            this.showNotification('エクスポートに失敗しました: ' + error.message, 'error');
        }
    }

    exportToJSON(questions, options) {
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                version: '2.0',
                totalQuestions: questions.length,
                generator: 'Question Manager Enhanced'
            },
            questions: questions
        };
        
        if (options.includeStats) {
            exportData.statistics = this.getStatisticsData();
        }
        
        return JSON.stringify(exportData, null, 2);
    }

    exportToCSV(questions, options) {
        const headers = [
            'ID', '科目', 'トピック', '問題形式', '難易度', 
            '問題文', '選択肢', '正解', '解説', 'タグ', '作成日'
        ];
        
        const rows = questions.map(q => [
            q.id,
            q.subject,
            q.topic,
            q.answerFormat,
            q.difficulty || '',
            this.escapeCSV(q.questionContent.text),
            this.getChoicesAsCSV(q),
            this.getCorrectAnswersAsCSV(q),
            this.escapeCSV(q.explanation?.text || ''),
            q.tags ? q.tags.join(';') : '',
            q.createdAt || ''
        ]);
        
        return this.arrayToCSV([headers, ...rows]);
    }

    async exportToExcel(questions, options) {
        // Excel形式のエクスポート（SheetJSを使用）
        // 実際の実装ではSheetJSライブラリをロードする必要があります
        const workbook = {
            SheetNames: ['Questions'],
            Sheets: {
                'Questions': this.questionsToExcelSheet(questions, options)
            }
        };
        
        // ダミー実装 - 実際にはSheetJSのXLSX.write()を使用
        return JSON.stringify(workbook);
    }

    exportToXML(questions, options) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<questionbank>\n';
        
        if (options.includeMetadata) {
            xml += '  <metadata>\n';
            xml += `    <exportDate>${new Date().toISOString()}</exportDate>\n`;
            xml += `    <version>2.0</version>\n`;
            xml += `    <totalQuestions>${questions.length}</totalQuestions>\n`;
            xml += '  </metadata>\n';
        }
        
        questions.forEach(q => {
            xml += '  <question>\n';
            xml += `    <id>${this.escapeXML(q.id)}</id>\n`;
            xml += `    <subject>${this.escapeXML(q.subject)}</subject>\n`;
            xml += `    <topic>${this.escapeXML(q.topic)}</topic>\n`;
            xml += `    <answerFormat>${q.answerFormat}</answerFormat>\n`;
            xml += `    <difficulty>${q.difficulty || 3}</difficulty>\n`;
            xml += `    <questionText>${this.escapeXML(q.questionContent.text)}</questionText>\n`;
            
            if (q.questionContent.latex) {
                xml += `    <latex>true</latex>\n`;
            }
            
            if (q.answerData.choices) {
                xml += '    <choices>\n';
                q.answerData.choices.forEach((choice, i) => {
                    xml += `      <choice index="${i}">${this.escapeXML(choice)}</choice>\n`;
                });
                xml += '    </choices>\n';
            }
            
            xml += `    <correctAnswers>${q.answerData.correctAnswers.join(',')}</correctAnswers>\n`;
            
            if (q.explanation && q.explanation.text) {
                xml += `    <explanation>${this.escapeXML(q.explanation.text)}</explanation>\n`;
            }
            
            if (q.tags && q.tags.length > 0) {
                xml += '    <tags>\n';
                q.tags.forEach(tag => {
                    xml += `      <tag>${this.escapeXML(tag)}</tag>\n`;
                });
                xml += '    </tags>\n';
            }
            
            xml += '  </question>\n';
        });
        
        xml += '</questionbank>';
        return xml;
    }

    exportToQTI(questions, options) {
        // QTI 2.1形式でのエクスポート
        let qti = '<?xml version="1.0" encoding="UTF-8"?>\n';
        qti += '<questestinterop xmlns="http://www.imsglobal.org/xsd/ims_qtiasiv1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/ims_qtiasiv1p2 http://www.imsglobal.org/xsd/ims_qtiasiv1p2p1.xsd">\n';
        qti += '  <assessment ident="QM_EXPORT" title="Question Manager Export">\n';
        
        questions.forEach((q, index) => {
            qti += `    <section ident="S${index}">\n`;
            qti += `      <item ident="${q.id}" title="${this.escapeXML(q.subject)} - ${this.escapeXML(q.topic)}">\n`;
            
            // 問題文
            qti += '        <material>\n';
            qti += `          <mattext texttype="text/plain">${this.escapeXML(q.questionContent.text)}</mattext>\n`;
            qti += '        </material>\n';
            
            // 選択肢
            if (q.answerData.choices) {
                qti += '        <response_lid ident="response" rcardinality="Single">\n';
                qti += '          <render_choice>\n';
                
                q.answerData.choices.forEach((choice, i) => {
                    const isCorrect = q.answerData.correctAnswers.includes(i);
                    qti += `            <response_label ident="${i}">\n`;
                    qti += `              <material>\n`;
                    qti += `                <mattext texttype="text/plain">${this.escapeXML(choice)}</mattext>\n`;
                    qti += `              </material>\n`;
                    qti += '            </response_label>\n';
                });
                
                qti += '          </render_choice>\n';
                qti += '          <respcondition>\n';
                
                qti += '            <conditionvar>\n';
                qti += '              <varequal respident="response">';
                qti += q.answerData.correctAnswers.map(i => `${i}`).join(' or ');
                qti += '</varequal>\n';
                qti += '            </conditionvar>\n';
                qti += '            <setvar action="Set">100</setvar>\n';
                qti += '          </respcondition>\n';
                qti += '        </response_lid>\n';
            }
            
            qti += '      </item>\n';
            qti += '    </section>\n';
        });
        
        qti += '  </assessment>\n';
        qti += '</questestinterop>';
        
        return qti;
    }

    exportToMoodleXML(questions, options) {
        // Moodle XML形式でのエクスポート
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<quiz>\n';
        
        questions.forEach(q => {
            xml += '  <question type="multichoice">\n';
            xml += `    <name>\n`;
            xml += `      <text>${this.escapeXML(q.id)}</text>\n`;
            xml += `    </name>\n`;
            xml += `    <questiontext format="html">\n`;
            xml += `      <text><![CDATA[${q.questionContent.text}]]></text>\n`;
            xml += `    </questiontext>\n`;
            
            if (q.answerData.choices) {
                q.answerData.choices.forEach((choice, i) => {
                    const isCorrect = q.answerData.correctAnswers.includes(i);
                    xml += `    <answer fraction="${isCorrect ? '100' : '0'}" format="html">\n`;
                    xml += `      <text><![CDATA[${choice}]]></text>\n`;
                    xml += `      <feedback><text></text></feedback>\n`;
                    xml += `    </answer>\n`;
                });
            }
            
            xml += '    <generalfeedback>\n';
            xml += '      <text></text>\n';
            xml += '    </generalfeedback>\n';
            
            if (q.tags && q.tags.length > 0) {
                xml += '    <tags>\n';
                q.tags.forEach(tag => {
                    xml += `      <tag>\n`;
                    xml += `        <text>${this.escapeXML(tag)}</text>\n`;
                    xml += `      </tag>\n`;
                });
                xml += '    </tags>\n';
            }
            
            xml += '  </question>\n';
        });
        
        xml += '</quiz>';
        return xml;
    }

    async importData() {
        try {
            const fileInput = document.getElementById('importFile');
            if (!fileInput.files || fileInput.files.length === 0) {
                throw new Error('ファイルを選択してください');
            }
            
            const file = fileInput.files[0];
            const options = this.getImportOptions();
            
            // バックアップを作成
            if (options.createBackup) {
                await this.createBackup();
            }
            
            // ファイルを読み込み
            const content = await this.readFileContent(file);
            
            // 形式を検出
            const format = this.detectFileFormat(file, content);
            
            // パース
            let questions;
            switch(format) {
                case 'json':
                    questions = this.parseJSON(content);
                    break;
                case 'csv':
                    questions = this.parseCSV(content);
                    break;
                case 'excel':
                    questions = await this.parseExcel(content);
                    break;
                case 'xml':
                    questions = this.parseXML(content);
                    break;
                default:
                    throw new Error('未対応のファイル形式です');
            }
            
            // 検証
            if (options.validateData) {
                const validation = this.validateQuestions(questions);
                if (!validation.valid) {
                    throw new Error(`データ検証エラー: ${validation.errors.join(', ')}`);
                }
            }
            
            // データベースに保存
            const db = window.Database;
            if (!db) {
                throw new Error('データベースが利用できません');
            }
            
            let imported = 0;
            let updated = 0;
            
            for (const question of questions) {
                const existing = await db.getQuestion(question.id);
                if (existing && options.overwriteExisting) {
                    await db.saveQuestion(question);
                    updated++;
                } else if (!existing) {
                    await db.saveQuestion(question);
                    imported++;
                }
            }
            
            this.showNotification(
                `インポート完了: ${imported}件新規追加, ${updated}件更新`, 
                'success'
            );
            
        } catch (error) {
            console.error('Import failed:', error);
            this.showNotification('インポートに失敗しました: ' + error.message, 'error');
        }
    }

    // ユーティリティメソッド
    escapeCSV(text) {
        if (typeof text !== 'string') return '';
        if (text.includes(',') || text.includes('"') || text.includes('\n')) {
            return `"${text.replace(/"/g, '""')}"`;
        }
        return text;
    }

    escapeXML(text) {
        if (typeof text !== 'string') return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    arrayToCSV(data) {
        return data.map(row => 
            row.map(cell => this.escapeCSV(cell)).join(',')
        ).join('\n');
    }

    getExportFilters() {
        return {
            subject: document.getElementById('exportSubject').value,
            difficulty: document.getElementById('exportDifficulty').value,
            format: document.getElementById('exportFormatType').value,
            fromDate: document.getElementById('exportFromDate').value,
            toDate: document.getElementById('exportToDate').value
        };
    }

    getExportOptions() {
        return {
            includeMetadata: document.getElementById('includeMetadata').checked,
            includeImages: document.getElementById('includeImages').checked,
            includeStats: document.getElementById('includeStats').checked
        };
    }

    getImportOptions() {
        return {
            overwriteExisting: document.getElementById('overwriteExisting').checked,
            validateData: document.getElementById('validateData').checked,
            createBackup: document.getElementById('createBackup').checked
        };
    }

    applyFilters(questions, filters) {
        return questions.filter(q => {
            if (filters.subject && q.subject !== filters.subject) return false;
            if (filters.difficulty && q.difficulty !== parseInt(filters.difficulty)) return false;
            if (filters.format && q.answerFormat !== filters.format) return false;
            if (filters.fromDate && q.createdAt < filters.fromDate) return false;
            if (filters.toDate && q.createdAt > filters.toDate) return false;
            return true;
        });
    }

    getChoicesAsCSV(question) {
        if (!question.answerData.choices) return '';
        return question.answerData.choices.join('; ');
    }

    getCorrectAnswersAsCSV(question) {
        if (!question.answerData.correctAnswers) return '';
        return question.answerData.correctAnswers.map(i => 
            question.answerData.choices[i]
        ).join('; ');
    }

    questionsToExcelSheet(questions, options) {
        // Excelワークシートデータの作成
        const data = [];
        
        // ヘッダー
        data.push([
            'ID', '科目', 'トピック', '問題形式', '難易度', 
            '問題文', '選択肢', '正解', '解説', 'タグ', '作成日'
        ]);
        
        // データ
        questions.forEach(q => {
            data.push([
                q.id,
                q.subject,
                q.topic,
                q.answerFormat,
                q.difficulty || '',
                q.questionContent.text,
                this.getChoicesAsCSV(q),
                this.getCorrectAnswersAsCSV(q),
                q.explanation?.text || '',
                q.tags ? q.tags.join(';') : '',
                q.createdAt || ''
            ]);
        });
        
        return { data: data };
    }

    detectFileFormat(file, content) {
        const extension = file.name.split('.').pop().toLowerCase();
        switch(extension) {
            case 'json': return 'json';
            case 'csv': return 'csv';
            case 'xlsx': return 'excel';
            case 'xml': return 'xml';
            default:
                // 内容から判定
                try {
                    JSON.parse(content);
                    return 'json';
                } catch {
                    if (content.includes('<?xml')) return 'xml';
                    if (content.includes(',')) return 'csv';
                }
                throw new Error('ファイル形式を特定できません');
        }
    }

    parseJSON(content) {
        const data = JSON.parse(content);
        return data.questions || data;
    }

    parseCSV(content) {
        const lines = content.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const questions = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                const question = {};
                
                headers.forEach((header, index) => {
                    question[header] = values[index];
                });
                
                questions.push(question);
            }
        }
        
        return questions;
    }

    async parseExcel(content) {
        // Excelファイルのパース（SheetJSを使用）
        // 実際の実装ではSheetJSライブラリが必要
        throw new Error('Excelインポートは準備中です');
    }

    parseXML(content) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'application/xml');
        const questions = [];
        
        const questionNodes = doc.querySelectorAll('question');
        questionNodes.forEach(node => {
            const question = {
                id: node.querySelector('id')?.textContent,
                subject: node.querySelector('subject')?.textContent,
                topic: node.querySelector('topic')?.textContent,
                answerFormat: node.querySelector('answerFormat')?.textContent,
                difficulty: parseInt(node.querySelector('difficulty')?.textContent) || 3,
                questionContent: {
                    text: node.querySelector('questionText')?.textContent
                }
            };
            questions.push(question);
        });
        
        return questions;
    }

    validateQuestions(questions) {
        const errors = [];
        
        questions.forEach((q, index) => {
            if (!q.id) errors.push(`問題${index + 1}: IDがありません`);
            if (!q.subject) errors.push(`問題${index + 1}: 科目がありません`);
            if (!q.answerFormat) errors.push(`問題${index + 1}: 回答形式がありません`);
            if (!q.questionContent || !q.questionContent.text) {
                errors.push(`問題${index + 1}: 問題文がありません`);
            }
        });
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    async createBackup() {
        const db = window.Database;
        if (!db) return;
        
        const questions = await db.getAllQuestions();
        const backup = {
            timestamp: new Date().toISOString(),
            questions: questions
        };
        
        const backupData = JSON.stringify(backup, null, 2);
        this.downloadFile(backupData, `backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(e.target.error);
            reader.readAsText(file);
        });
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 8px;
            color: white;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        switch(type) {
            case 'success':
                notification.style.backgroundColor = '#10b981';
                break;
            case 'error':
                notification.style.backgroundColor = '#ef4444';
                break;
            default:
                notification.style.backgroundColor = '#3b82f6';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    populateSubjectSelect(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        // データベースから科目リストを取得
        window.Database?.getAllQuestions?.().then(questions => {
            if (questions) {
                const subjects = [...new Set(questions.map(q => q.subject))];
                subjects.forEach(subject => {
                    const option = document.createElement('option');
                    option.value = subject;
                    option.textContent = subject;
                    select.appendChild(option);
                });
            }
        });
    }

    getStatisticsData() {
        // 統計データを取得
        return {
            totalQuestions: this.basicStats?.totalQuestions || 0,
            subjectDistribution: this.subjectStats || {},
            difficultyDistribution: this.difficultyDistribution || [0, 0, 0, 0, 0]
        };
    }
}

// グローバルに公開
window.DataExchange = DataExchange;