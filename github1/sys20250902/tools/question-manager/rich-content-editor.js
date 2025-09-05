// Rich Content Editor for Enhanced Explanations
class RichContentEditor {
    constructor() {
        this.toolbarOptions = {
            formatting: [
                { name: 'bold', icon: 'B', title: '太字' },
                { name: 'italic', icon: 'I', title: '斜体' },
                { name: 'underline', icon: 'U', title: '下線' }
            ],
            structure: [
                { name: 'heading', icon: 'H', title: '見出し' },
                { name: 'paragraph', icon: '¶', title: '段落' },
                { name: 'bulletList', icon: '•', title: '箇条書き' },
                { name: 'numberedList', icon: '1.', title: '番号付きリスト' }
            ],
            inserts: [
                { name: 'formula', icon: '∑', title: '数式挿入' },
                { name: 'image', icon: '🖼️', title: '画像挿入' },
                { name: 'link', icon: '🔗', title: 'リンク挿入' },
                { name: 'table', icon: '⊞', title: '表挿入' }
            ],
            special: [
                { name: 'step', icon: '123', title: 'ステップ説明' },
                { name: 'hint', icon: '💡', title: 'ヒント' },
                { name: 'warning', icon: '⚠️', title: '注意点' },
                { name: 'example', icon: '📝', title: '例題' }
            ]
        };
        
        this.latexCommands = {
            basic: [
                { command: '\\frac{}{}', description: '分数' },
                { command: '\\sqrt{}', description: '平方根' },
                { command: 'x^2', description: 'べき乗' },
                { command: 'x_{n}', description: '添字' },
                { command: '\\infty', description: '無限大' },
                { command: '\\pi', description: '円周率' },
                { command: '\\sum', description: '総和' },
                { command: '\\int', description: '積分' },
                { command: '\\lim', description: '極限' },
                { command: '\\alpha', description: 'アルファ' },
                { command: '\\beta', description: 'ベータ' },
                { command: '\\theta', description: 'シータ' }
            ],
            advanced: [
                { command: '\\begin{align} ... \\end{align}', description: '連立方程式' },
                { command: '\\begin{cases} ... \\end{cases}', description: '場合分け' },
                { command: '\\overrightarrow{AB}', description: 'ベクトル' },
                { command: '\\angle', description: '角度' },
                { command: '\\triangle', description: '三角形' },
                { command: '\\circ', description: '度' },
                { command: '\\perp', description: '垂直' },
                { command: '\\parallel', description: '平行' }
            ]
        };
        
        this.init();
    }

    init() {
        this.setupStyles();
        this.setupEventListeners();
        this.createEditor();
    }

    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .rich-editor {
                border: 2px solid #e2e8f0;
                border-radius: 12px;
                background: white;
                overflow: hidden;
            }
            
            .editor-toolbar {
                background: #f8fafc;
                border-bottom: 1px solid #e2e8f0;
                padding: 8px;
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
            }
            
            .toolbar-group {
                display: flex;
                gap: 4px;
                padding: 0 8px;
                border-right: 1px solid #e2e8f0;
            }
            
            .toolbar-group:last-child {
                border-right: none;
            }
            
            .toolbar-btn {
                width: 32px;
                height: 32px;
                border: 1px solid #e2e8f0;
                background: white;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                font-weight: 600;
                transition: all 0.2s ease;
            }
            
            .toolbar-btn:hover {
                background: #e2e8f0;
                border-color: #cbd5e1;
            }
            
            .toolbar-btn.active {
                background: #4f46e5;
                color: white;
                border-color: #4f46e5;
            }
            
            .editor-content {
                min-height: 200px;
                padding: 16px;
                line-height: 1.6;
                outline: none;
            }
            
            .editor-content:focus {
                background: #fafafa;
            }
            
            /* 特殊ブロックのスタイル */
            .step-block {
                background: #f0f9ff;
                border-left: 4px solid #0ea5e9;
                padding: 12px 16px;
                margin: 12px 0;
                border-radius: 0 8px 8px 0;
            }
            
            .step-block .step-title {
                font-weight: 600;
                color: #0369a1;
                margin-bottom: 8px;
            }
            
            .step-block .step-content {
                color: #0c4a6e;
            }
            
            .hint-block {
                background: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 12px 16px;
                margin: 12px 0;
                border-radius: 0 8px 8px 0;
            }
            
            .hint-block .hint-title {
                font-weight: 600;
                color: #92400e;
                margin-bottom: 8px;
            }
            
            .warning-block {
                background: #fee2e2;
                border-left: 4px solid #ef4444;
                padding: 12px 16px;
                margin: 12px 0;
                border-radius: 0 8px 8px 0;
            }
            
            .warning-block .warning-title {
                font-weight: 600;
                color: #991b1b;
                margin-bottom: 8px;
            }
            
            .example-block {
                background: #f3f4f6;
                border-left: 4px solid #6b7280;
                padding: 12px 16px;
                margin: 12px 0;
                border-radius: 0 8px 8px 0;
            }
            
            .example-block .example-title {
                font-weight: 600;
                color: #374151;
                margin-bottom: 8px;
            }
            
            /* LaTeXプレビュー */
            .latex-preview {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                padding: 8px;
                margin: 8px 0;
                font-family: 'Times New Roman', serif;
                font-size: 16px;
            }
            
            /* 数式パレット */
            .latex-palette {
                position: absolute;
                top: 100%;
                left: 0;
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                padding: 12px;
                display: none;
                z-index: 1000;
                min-width: 300px;
            }
            
            .latex-palette.show {
                display: block;
            }
            
            .latex-section {
                margin-bottom: 12px;
            }
            
            .latex-section h4 {
                font-size: 12px;
                color: #64748b;
                margin-bottom: 8px;
            }
            
            .latex-commands {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 4px;
            }
            
            .latex-cmd {
                padding: 6px 8px;
                background: #f1f5f9;
                border: 1px solid #e2e8f0;
                border-radius: 4px;
                font-family: monospace;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .latex-cmd:hover {
                background: #e2e8f0;
            }
            
            /* 画像アップロード */
            .image-upload-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 2000;
            }
            
            .image-upload-content {
                background: white;
                border-radius: 12px;
                padding: 24px;
                max-width: 500px;
                width: 90%;
            }
            
            .upload-area {
                border: 2px dashed #cbd5e1;
                border-radius: 8px;
                padding: 40px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .upload-area:hover {
                border-color: #4f46e5;
                background: #f8fafc;
            }
            
            .upload-area.dragover {
                border-color: #4f46e5;
                background: #eff6ff;
            }
            
            /* テーブルエディタ */
            .table-editor {
                background: white;
                border-radius: 8px;
                padding: 16px;
            }
            
            .table-size-selector {
                display: grid;
                grid-template-columns: repeat(6, 40px);
                gap: 4px;
                margin-bottom: 16px;
            }
            
            .table-cell {
                width: 40px;
                height: 40px;
                border: 1px solid #e2e8f0;
                cursor: pointer;
                background: #f8fafc;
            }
            
            .table-cell:hover {
                background: #e2e8f0;
            }
            
            .table-cell.selected {
                background: #4f46e5;
                border-color: #4f46e5;
            }
            
            /* リンクエディタ */
            .link-editor {
                background: white;
                border-radius: 8px;
                padding: 16px;
            }
            
            .link-editor input {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                margin-bottom: 8px;
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            // エディタ外クリックでパレットを閉じる
            if (!e.target.closest('.toolbar-btn') && !e.target.closest('.latex-palette')) {
                this.closeAllPalettes();
            }
        });
    }

    createEditor(containerId = null) {
        const container = containerId ? document.getElementById(containerId) : document.querySelector('.rich-editor-container');
        
        if (!container) {
            console.error('Editor container not found');
            return;
        }
        
        const editor = document.createElement('div');
        editor.className = 'rich-editor';
        editor.innerHTML = `
            <div class="editor-toolbar" id="toolbar-${this.generateId()}">
                ${this.createToolbar()}
            </div>
            <div class="editor-content" contenteditable="true" id="editor-${this.generateId()}">
                ここに解説を入力してください...
            </div>
        `;
        
        container.innerHTML = '';
        container.appendChild(editor);
        
        // ツールバーのイベントを設定
        this.setupToolbarEvents(editor);
        
        return editor;
    }

    createToolbar() {
        let toolbar = '';
        
        Object.entries(this.toolbarOptions).forEach(([group, buttons]) => {
            toolbar += `<div class="toolbar-group">`;
            buttons.forEach(btn => {
                toolbar += `<button class="toolbar-btn" data-command="${btn.name}" title="${btn.title}">${btn.icon}</button>`;
            });
            toolbar += `</div>`;
        });
        
        return toolbar;
    }

    setupToolbarEvents(editor) {
        const toolbar = editor.querySelector('.editor-toolbar');
        const content = editor.querySelector('.editor-content');
        
        toolbar.addEventListener('click', (e) => {
            if (e.target.classList.contains('toolbar-btn')) {
                e.preventDefault();
                const command = e.target.dataset.command;
                this.executeCommand(command, content, e.target);
            }
        });
        
        // コンテキストメニュー
        content.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e.pageX, e.pageY);
        });
    }

    executeCommand(command, content, button) {
        switch(command) {
            case 'bold':
            case 'italic':
            case 'underline':
                document.execCommand(command, false, null);
                this.toggleButtonState(button);
                break;
                
            case 'heading':
                this.insertHeading(content);
                break;
                
            case 'bulletList':
            case 'numberedList':
                document.execCommand(command === 'bulletList' ? 'insertUnorderedList' : 'insertOrderedList', false, null);
                break;
                
            case 'formula':
                this.showLatexPalette(button);
                break;
                
            case 'image':
                this.showImageUploader();
                break;
                
            case 'link':
                this.showLinkEditor(content);
                break;
                
            case 'table':
                this.showTableEditor(content);
                break;
                
            case 'step':
                this.insertBlock(content, 'step', '解答手順');
                break;
                
            case 'hint':
                this.insertBlock(content, 'hint', 'ヒント');
                break;
                
            case 'warning':
                this.insertBlock(content, 'warning', '注意点');
                break;
                
            case 'example':
                this.insertBlock(content, 'example', '例題');
                break;
        }
        
        content.focus();
    }

    insertHeading(content) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const heading = document.createElement('h3');
            heading.textContent = '見出し';
            range.deleteContents();
            range.insertNode(heading);
            
            // カーソルを移動
            range.setStartAfter(heading);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    insertBlock(content, type, title) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            
            const block = document.createElement('div');
            block.className = `${type}-block`;
            block.innerHTML = `
                <div class="${type}-title">${title}</div>
                <div class="${type}-content">ここに入力...</div>
            `;
            
            range.deleteContents();
            range.insertNode(block);
            
            // カーソルをコンテンツ部分に移動
            const contentDiv = block.querySelector(`.${type}-content`);
            range.setStart(contentDiv, 0);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    showLatexPalette(button) {
        // 既存のパレットを閉じる
        this.closeAllPalettes();
        
        const palette = document.createElement('div');
        palette.className = 'latex-palette show';
        palette.innerHTML = `
            <div class="latex-section">
                <h4>基本コマンド</h4>
                <div class="latex-commands">
                    ${this.latexCommands.basic.map(cmd => `
                        <div class="latex-cmd" onclick="editor.insertLatex('${cmd.command}')">${cmd.command}</div>
                    `).join('')}
                </div>
            </div>
            <div class="latex-section">
                <h4>高度なコマンド</h4>
                <div class="latex-commands">
                    ${this.latexCommands.advanced.map(cmd => `
                        <div class="latex-cmd" onclick="editor.insertLatex('${cmd.command}')">${cmd.command}</div>
                    `).join('')}
                </div>
            </div>
        `;
        
        button.appendChild(palette);
        
        // 位置調整
        const rect = button.getBoundingClientRect();
        palette.style.top = '100%';
        palette.style.left = '0';
    }

    insertLatex(latex) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            
            // LaTeXブロックを挿入
            const latexBlock = document.createElement('div');
            latexBlock.className = 'latex-block';
            latexBlock.innerHTML = `\\(${latex}\\)`;
            
            range.deleteContents();
            range.insertNode(latexBlock);
            
            // パレットを閉じる
            this.closeAllPalettes();
        }
    }

    showImageUploader() {
        const modal = document.createElement('div');
        modal.className = 'image-upload-modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="image-upload-content">
                <h3>画像を挿入</h3>
                <div class="upload-area" id="uploadArea">
                    <div class="upload-icon">📷</div>
                    <p>ここに画像をドラッグするか、クリックして選択</p>
                    <input type="file" id="imageInput" accept="image/*" style="display: none;">
                </div>
                <div style="margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end;">
                    <button class="btn-secondary" onclick="this.closest('.image-upload-modal').remove()">キャンセル</button>
                    <button class="btn-primary" onclick="editor.insertImage()">挿入</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // アップロードエリアのイベント
        const uploadArea = modal.querySelector('#uploadArea');
        const imageInput = modal.querySelector('#imageInput');
        
        uploadArea.addEventListener('click', () => imageInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                this.selectedImage = files[0];
                this.previewImage(files[0], uploadArea);
            }
        });
        
        imageInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.selectedImage = e.target.files[0];
                this.previewImage(e.target.files[0], uploadArea);
            }
        });
    }

    previewImage(file, container) {
        const reader = new FileReader();
        reader.onload = (e) => {
            container.innerHTML = `
                <img src="${e.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
                <p style="margin-top: 8px; color: #64748b;">${file.name}</p>
            `;
        };
        reader.readAsDataURL(file);
    }

    insertImage() {
        if (this.selectedImage) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                    img.style.borderRadius = '8px';
                    
                    range.deleteContents();
                    range.insertNode(img);
                }
                
                // モーダルを閉じる
                document.querySelector('.image-upload-modal').remove();
            };
            reader.readAsDataURL(this.selectedImage);
        }
    }

    showLinkEditor(content) {
        const selection = window.getSelection();
        const selectedText = selection.toString();
        
        const modal = document.createElement('div');
        modal.className = 'image-upload-modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="image-upload-content link-editor">
                <h3>リンクを挿入</h3>
                <input type="text" id="linkText" placeholder="リンクテキスト" value="${selectedText}">
                <input type="url" id="linkUrl" placeholder="URL">
                <div style="margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end;">
                    <button class="btn-secondary" onclick="this.closest('.image-upload-modal').remove()">キャンセル</button>
                    <button class="btn-primary" onclick="editor.insertLink()">挿入</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // フォーカス
        modal.querySelector('#linkUrl').focus();
    }

    insertLink() {
        const modal = document.querySelector('.image-upload-modal');
        const text = modal.querySelector('#linkText').value;
        const url = modal.querySelector('#linkUrl').value;
        
        if (text && url) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const link = document.createElement('a');
                link.href = url;
                link.textContent = text;
                link.target = '_blank';
                link.style.color = '#4f46e5';
                link.style.textDecoration = 'underline';
                
                range.deleteContents();
                range.insertNode(link);
            }
            
            modal.remove();
        }
    }

    showTableEditor(content) {
        const modal = document.createElement('div');
        modal.className = 'image-upload-modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="image-upload-content table-editor">
                <h3>表を挿入</h3>
                <p>表のサイズを選択してください</p>
                <div class="table-size-selector" id="tableSize">
                    ${Array.from({length: 60}, (_, i) => '<div class="table-cell"></div>').join('')}
                </div>
                <div style="margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end;">
                    <button class="btn-secondary" onclick="this.closest('.image-upload-modal').remove()">キャンセル</button>
                    <button class="btn-primary" onclick="editor.insertTable()">挿入</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // テーブルサイズ選択
        let selectedCols = 0;
        let selectedRows = 0;
        
        const cells = modal.querySelectorAll('.table-cell');
        cells.forEach((cell, index) => {
            const row = Math.floor(index / 6) + 1;
            const col = (index % 6) + 1;
            
            cell.addEventListener('mouseenter', () => {
                // ホバーしているセルまでをハイライト
                cells.forEach((c, i) => {
                    const r = Math.floor(i / 6) + 1;
                    const co = (i % 6) + 1;
                    if (r <= row && co <= col) {
                        c.classList.add('selected');
                    } else {
                        c.classList.remove('selected');
                    }
                });
            });
            
            cell.addEventListener('click', () => {
                selectedCols = col;
                selectedRows = row;
            });
        });
        
        // 選択したサイズを保存
        modal.tableSize = { cols: selectedCols, rows: selectedRows };
    }

    insertTable() {
        const modal = document.querySelector('.image-upload-modal');
        const size = modal.tableSize || { cols: 3, rows: 3 };
        
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            
            const table = document.createElement('table');
            table.style.borderCollapse = 'collapse';
            table.style.width = '100%';
            table.style.margin = '12px 0';
            
            for (let i = 0; i < size.rows; i++) {
                const row = table.insertRow();
                for (let j = 0; j < size.cols; j++) {
                    const cell = row.insertCell();
                    cell.style.border = '1px solid #e2e8f0';
                    cell.style.padding = '8px';
                    cell.contentEditable = true;
                    cell.textContent = 'セル';
                }
            }
            
            range.deleteContents();
            range.insertNode(table);
        }
        
        modal.remove();
    }

    toggleButtonState(button) {
        button.classList.toggle('active');
    }

    closeAllPalettes() {
        document.querySelectorAll('.latex-palette').forEach(palette => {
            palette.remove();
        });
    }

    showContextMenu(x, y) {
        // コンテキストメニューの実装
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            padding: 8px 0;
            z-index: 2000;
        `;
        
        menu.innerHTML = `
            <div class="menu-item" onclick="editor.executeCommand('cut')">切り取り</div>
            <div class="menu-item" onclick="editor.executeCommand('copy')">コピー</div>
            <div class="menu-item" onclick="editor.executeCommand('paste')">貼り付け</div>
            <hr>
            <div class="menu-item" onclick="editor.insertBlock('step', '手順')">手順を挿入</div>
            <div class="menu-item" onclick="editor.insertBlock('hint', 'ヒント')">ヒントを挿入</div>
        `;
        
        document.body.appendChild(menu);
        
        // メニュー外クリックで閉じる
        setTimeout(() => {
            document.addEventListener('click', function closeMenu() {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            });
        }, 100);
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // ユーティリティメソッド
    getContent(editor) {
        return editor.querySelector('.editor-content').innerHTML;
    }

    setContent(editor, content) {
        editor.querySelector('.editor-content').innerHTML = content;
    }

    clearContent(editor) {
        editor.querySelector('.editor-content').innerHTML = '';
    }
}

// グローバルに公開
window.RichContentEditor = RichContentEditor;