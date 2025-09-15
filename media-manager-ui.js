/**
 * Comprehensive Media Management UI Components
 * Reusable components for authenticated media management
 * Integrates with AuthenticatedMediaClient and QuestaR2Client
 */

class MediaManagerUI {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            showUpload: true,
            showLibrary: true,
            showQuota: true,
            allowedTypes: ['image', 'audio'],
            subject: 'general',
            category: 'general',
            ...options
        };
        
        this.mediaClient = null;
        this.r2Client = null;
        this.authClient = null;
        this.selectedFiles = [];
        this.mediaLibrary = [];
        
        this.init();
    }

    async init() {
        this.setupClients();
        this.render();
        this.attachEventListeners();
        
        // Load initial data if authenticated
        if (this.isAuthenticated()) {
            await this.refreshMediaLibrary();
            await this.updateQuotaDisplay();
        }
    }

    setupClients() {
        this.authClient = window.authClient;
        this.r2Client = window.questaR2;
        
        if (window.mediaClient) {
            this.mediaClient = window.mediaClient;
        } else if (this.authClient && window.AuthenticatedMediaClient) {
            this.mediaClient = new window.AuthenticatedMediaClient(this.authClient);
            window.mediaClient = this.mediaClient;
        }
    }

    isAuthenticated() {
        return this.authClient && this.authClient.isLoggedIn();
    }

    render() {
        this.container.innerHTML = `
            <div class="media-manager">
                ${this.renderAuthWarning()}
                ${this.options.showQuota ? this.renderQuotaSection() : ''}
                ${this.options.showUpload ? this.renderUploadSection() : ''}
                ${this.options.showLibrary ? this.renderLibrarySection() : ''}
                ${this.renderLogSection()}
            </div>
        `;
        
        this.addStyles();
    }

    renderAuthWarning() {
        if (this.isAuthenticated()) {
            return '';
        }
        
        return `
            <div class="auth-warning">
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>認証が必要です</strong>
                    <p>メディアファイルの管理には<a href="auth.html">ログイン</a>が必要です。ローカルストレージのフォールバック機能のみ利用可能です。</p>
                </div>
            </div>
        `;
    }

    renderQuotaSection() {
        return `
            <div class="quota-section">
                <h4><i class="fas fa-chart-pie"></i> ストレージ使用量</h4>
                <div class="quota-display">
                    <div class="quota-bar">
                        <div class="quota-used" style="width: 0%"></div>
                    </div>
                    <div class="quota-text">
                        <span class="quota-used-text">0 MB</span> / 
                        <span class="quota-total-text">100 MB</span>
                        (<span class="quota-percentage">0%</span>)
                    </div>
                </div>
            </div>
        `;
    }

    renderUploadSection() {
        return `
            <div class="upload-section">
                <h4><i class="fas fa-cloud-upload-alt"></i> ファイルアップロード</h4>
                
                <div class="upload-controls">
                    <input type="file" id="media-file-input" 
                           accept="${this.getAcceptTypes()}" 
                           multiple style="display: none;">
                    
                    <button class="btn btn-primary" id="select-files-btn">
                        <i class="fas fa-folder-open"></i>
                        ファイル選択
                    </button>
                    
                    <select class="form-select" id="upload-category">
                        <option value="general">一般</option>
                        <option value="image">画像</option>
                        <option value="audio">音声</option>
                        <option value="practice">練習問題</option>
                        <option value="test">テスト</option>
                    </select>
                    
                    <button class="btn btn-secondary" id="clear-selection-btn">
                        <i class="fas fa-times"></i>
                        選択解除
                    </button>
                </div>

                <div class="upload-description">
                    <label for="upload-desc">説明（任意）:</label>
                    <input type="text" class="form-control" id="upload-desc" 
                           placeholder="ファイルの説明を入力">
                </div>

                <div class="upload-options">
                    <label class="form-check">
                        <input type="checkbox" class="form-check-input" id="upload-public">
                        <span class="form-check-label">公開ファイルとして設定</span>
                    </label>
                </div>

                <div class="upload-preview" id="upload-preview" style="display: none;">
                    <h5>アップロード予定ファイル:</h5>
                    <div class="file-list" id="upload-file-list"></div>
                    
                    <button class="btn btn-success" id="upload-files-btn">
                        <i class="fas fa-upload"></i>
                        アップロード開始
                    </button>
                </div>
            </div>
        `;
    }

    renderLibrarySection() {
        return `
            <div class="library-section">
                <h4><i class="fas fa-photo-video"></i> メディアライブラリ</h4>
                
                <div class="library-controls">
                    <button class="btn btn-secondary" id="refresh-library-btn">
                        <i class="fas fa-sync-alt"></i>
                        更新
                    </button>
                    
                    <select class="form-select" id="filter-type">
                        <option value="">全てのファイル</option>
                        <option value="image">画像のみ</option>
                        <option value="audio">音声のみ</option>
                    </select>
                    
                    <input type="search" class="form-control" id="search-files" 
                           placeholder="ファイル検索...">
                </div>
                
                <div class="media-grid" id="media-grid">
                    <div class="loading-placeholder">
                        <i class="fas fa-spinner fa-spin"></i>
                        メディアライブラリを読み込み中...
                    </div>
                </div>
            </div>
        `;
    }

    renderLogSection() {
        return `
            <div class="log-section">
                <h5><i class="fas fa-list"></i> アクティビティログ</h5>
                <div class="media-log" id="media-log">
                    <div class="log-entry log-info">
                        [${new Date().toLocaleTimeString()}] メディア管理システムを初期化しました
                    </div>
                </div>
            </div>
        `;
    }

    getAcceptTypes() {
        const typeMap = {
            image: 'image/*',
            audio: 'audio/*'
        };
        
        return this.options.allowedTypes
            .map(type => typeMap[type])
            .filter(Boolean)
            .join(',');
    }

    attachEventListeners() {
        // File selection
        const fileInput = this.container.querySelector('#media-file-input');
        const selectBtn = this.container.querySelector('#select-files-btn');
        
        if (selectBtn && fileInput) {
            selectBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.handleFileSelection(e));
        }

        // Upload controls
        const clearBtn = this.container.querySelector('#clear-selection-btn');
        const uploadBtn = this.container.querySelector('#upload-files-btn');
        
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearSelection());
        if (uploadBtn) uploadBtn.addEventListener('click', () => this.uploadFiles());

        // Library controls
        const refreshBtn = this.container.querySelector('#refresh-library-btn');
        const filterSelect = this.container.querySelector('#filter-type');
        const searchInput = this.container.querySelector('#search-files');
        
        if (refreshBtn) refreshBtn.addEventListener('click', () => this.refreshMediaLibrary());
        if (filterSelect) filterSelect.addEventListener('change', () => this.filterLibrary());
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => this.searchLibrary(), 300));
        }
    }

    handleFileSelection(event) {
        this.selectedFiles = Array.from(event.target.files);
        this.displayUploadPreview();
    }

    displayUploadPreview() {
        const preview = this.container.querySelector('#upload-preview');
        const fileList = this.container.querySelector('#upload-file-list');
        
        if (this.selectedFiles.length === 0) {
            preview.style.display = 'none';
            return;
        }

        preview.style.display = 'block';
        fileList.innerHTML = '';

        this.selectedFiles.forEach((file, index) => {
            const validation = this.validateFile(file);
            const fileItem = document.createElement('div');
            fileItem.className = `file-item ${validation.valid ? 'valid' : 'invalid'}`;
            
            const fileIcon = validation.type === 'image' ? '🖼️' : 
                            validation.type === 'audio' ? '🎵' : '📄';
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <span class="file-icon">${fileIcon}</span>
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${this.formatFileSize(file.size)}</div>
                        ${!validation.valid ? `<div class="file-error">${validation.error}</div>` : ''}
                    </div>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="this.removeFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            fileList.appendChild(fileItem);
        });
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.displayUploadPreview();
    }

    clearSelection() {
        this.selectedFiles = [];
        this.container.querySelector('#media-file-input').value = '';
        this.container.querySelector('#upload-preview').style.display = 'none';
    }

    async uploadFiles() {
        if (this.selectedFiles.length === 0) {
            this.addLog('アップロードするファイルが選択されていません', 'error');
            return;
        }

        if (!this.isAuthenticated()) {
            this.addLog('ファイルアップロードには認証が必要です', 'error');
            return;
        }

        const uploadBtn = this.container.querySelector('#upload-files-btn');
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> アップロード中...';

        const category = this.container.querySelector('#upload-category').value;
        const description = this.container.querySelector('#upload-desc').value;
        const isPublic = this.container.querySelector('#upload-public').checked;

        let successCount = 0;
        let errorCount = 0;

        for (const file of this.selectedFiles) {
            try {
                this.addLog(`${file.name} をアップロード中...`, 'info');
                
                const result = await this.r2Client.uploadMedia(file, null, {
                    subject: this.options.subject,
                    category: category,
                    description: description,
                    isPublic: isPublic
                });

                if (result.success) {
                    this.addLog(`✅ ${file.name} のアップロード完了`, 'success');
                    successCount++;
                } else {
                    this.addLog(`❌ ${file.name} のアップロード失敗: ${result.error}`, 'error');
                    errorCount++;
                }
            } catch (error) {
                this.addLog(`❌ ${file.name} のアップロードエラー: ${error.message}`, 'error');
                errorCount++;
            }
        }

        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fas fa-upload"></i> アップロード開始';

        this.addLog(`アップロード完了: 成功 ${successCount}件, 失敗 ${errorCount}件`, 
                   errorCount === 0 ? 'success' : 'info');

        // Clear selection and refresh
        this.clearSelection();
        await this.refreshMediaLibrary();
        await this.updateQuotaDisplay();
    }

    async refreshMediaLibrary() {
        const grid = this.container.querySelector('#media-grid');
        grid.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> 読み込み中...</div>';

        try {
            const files = await this.r2Client.listMedia(`${this.options.subject}/`);
            this.mediaLibrary = files;
            this.displayMediaLibrary(files);
            this.addLog(`${files.length}件のメディアファイルを読み込みました`, 'info');
        } catch (error) {
            grid.innerHTML = '<div class="error-placeholder">メディアライブラリの読み込みに失敗しました</div>';
            this.addLog(`メディア読み込みエラー: ${error.message}`, 'error');
        }
    }

    displayMediaLibrary(files) {
        const grid = this.container.querySelector('#media-grid');
        
        if (files.length === 0) {
            grid.innerHTML = '<div class="empty-placeholder">メディアファイルがありません</div>';
            return;
        }

        grid.innerHTML = '';
        
        files.forEach(file => {
            const mediaItem = this.createMediaItem(file);
            grid.appendChild(mediaItem);
        });
    }

    createMediaItem(file) {
        const item = document.createElement('div');
        item.className = 'media-item';
        
        const isImage = file.type.startsWith('image/');
        const isAudio = file.type.startsWith('audio/');
        
        let previewContent = '';
        if (isImage && file.url) {
            previewContent = `<img src="${file.url}" alt="${file.name}" loading="lazy">`;
        } else if (isAudio && file.url) {
            previewContent = `<audio controls src="${file.url}"></audio>`;
        } else {
            previewContent = `<div class="file-placeholder"><i class="fas fa-file"></i></div>`;
        }

        item.innerHTML = `
            <div class="media-preview">${previewContent}</div>
            <div class="media-info">
                <div class="media-name" title="${file.name}">${file.name}</div>
                <div class="media-size">${this.formatFileSize(file.size)}</div>
                <div class="media-date">${new Date(file.uploadedAt).toLocaleDateString()}</div>
                ${file.authenticated ? '<span class="auth-badge">🔒</span>' : ''}
            </div>
            <div class="media-actions">
                <button class="btn btn-sm btn-primary" onclick="this.copyMediaUrl('${file.path || file.mediaId}')">
                    <i class="fas fa-link"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="this.deleteMediaFile('${file.path || file.mediaId}', '${file.name}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return item;
    }

    async copyMediaUrl(path) {
        try {
            const url = await this.r2Client.getMediaUrl(path);
            await navigator.clipboard.writeText(url);
            this.addLog(`URL をクリップボードにコピーしました`, 'success');
        } catch (error) {
            this.addLog(`URL コピーエラー: ${error.message}`, 'error');
        }
    }

    async deleteMediaFile(path, filename) {
        if (!confirm(`「${filename}」を削除してもよろしいですか？`)) {
            return;
        }

        try {
            const success = await this.r2Client.deleteMedia(path);
            if (success) {
                this.addLog(`メディアファイルを削除しました: ${filename}`, 'success');
                await this.refreshMediaLibrary();
                await this.updateQuotaDisplay();
            } else {
                this.addLog(`メディアファイルの削除に失敗しました: ${filename}`, 'error');
            }
        } catch (error) {
            this.addLog(`削除エラー: ${error.message}`, 'error');
        }
    }

    filterLibrary() {
        const filterType = this.container.querySelector('#filter-type').value;
        let filteredFiles = this.mediaLibrary;

        if (filterType) {
            filteredFiles = this.mediaLibrary.filter(file => 
                file.type.startsWith(filterType + '/'));
        }

        this.displayMediaLibrary(filteredFiles);
    }

    async searchLibrary() {
        const query = this.container.querySelector('#search-files').value.trim();
        
        if (!query) {
            this.displayMediaLibrary(this.mediaLibrary);
            return;
        }

        try {
            const results = await this.r2Client.searchMedia(query, {
                subject: this.options.subject
            });
            this.displayMediaLibrary(results);
        } catch (error) {
            this.addLog(`検索エラー: ${error.message}`, 'error');
        }
    }

    async updateQuotaDisplay() {
        if (!this.options.showQuota) return;

        try {
            const quotaInfo = await this.r2Client.getStorageInfo();
            if (!quotaInfo) return;

            const usedMB = Math.round(quotaInfo.used / (1024 * 1024) * 100) / 100;
            const totalMB = Math.round(quotaInfo.quota / (1024 * 1024));
            const percentage = Math.round(quotaInfo.percentage);

            const quotaBar = this.container.querySelector('.quota-used');
            const usedText = this.container.querySelector('.quota-used-text');
            const totalText = this.container.querySelector('.quota-total-text');
            const percentageText = this.container.querySelector('.quota-percentage');

            if (quotaBar) quotaBar.style.width = `${percentage}%`;
            if (usedText) usedText.textContent = `${usedMB} MB`;
            if (totalText) totalText.textContent = `${totalMB} MB`;
            if (percentageText) percentageText.textContent = `${percentage}%`;

            // Color coding for quota usage
            if (quotaBar) {
                quotaBar.className = 'quota-used';
                if (percentage > 90) quotaBar.classList.add('quota-critical');
                else if (percentage > 75) quotaBar.classList.add('quota-warning');
                else quotaBar.classList.add('quota-normal');
            }
        } catch (error) {
            console.error('Quota update error:', error);
        }
    }

    validateFile(file) {
        const allowedTypes = {
            image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4']
        };

        const maxSize = 50 * 1024 * 1024; // 50MB

        if (file.size > maxSize) {
            return {
                valid: false,
                error: 'ファイルサイズが大きすぎます（最大50MB）'
            };
        }

        const isImage = allowedTypes.image.includes(file.type);
        const isAudio = allowedTypes.audio.includes(file.type);

        if (!isImage && !isAudio) {
            return {
                valid: false,
                error: '対応していないファイル形式です'
            };
        }

        return {
            valid: true,
            type: isImage ? 'image' : 'audio'
        };
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    addLog(message, type = 'info') {
        const log = this.container.querySelector('#media-log');
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.textContent = `[${timestamp}] ${message}`;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    addStyles() {
        if (document.getElementById('media-manager-styles')) return;

        const style = document.createElement('style');
        style.id = 'media-manager-styles';
        style.textContent = `
            .media-manager {
                max-width: 1200px;
                margin: 0 auto;
            }

            .auth-warning .alert {
                background: #fff3cd;
                border: 1px solid #ffecb5;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 20px;
            }

            .quota-section {
                background: white;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .quota-bar {
                background: #e9ecef;
                border-radius: 10px;
                height: 10px;
                overflow: hidden;
                margin: 10px 0;
            }

            .quota-used {
                height: 100%;
                transition: width 0.3s ease;
            }

            .quota-normal { background: #28a745; }
            .quota-warning { background: #ffc107; }
            .quota-critical { background: #dc3545; }

            .upload-section, .library-section {
                background: white;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .upload-controls, .library-controls {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
                flex-wrap: wrap;
            }

            .upload-description, .upload-options {
                margin: 15px 0;
            }

            .file-list {
                margin: 15px 0;
            }

            .file-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px;
                border: 1px solid #dee2e6;
                border-radius: 6px;
                margin-bottom: 10px;
                background: white;
            }

            .file-item.invalid {
                border-color: #dc3545;
                background: #f8d7da;
            }

            .file-info {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 1;
            }

            .file-icon {
                font-size: 1.5rem;
            }

            .file-details {
                display: flex;
                flex-direction: column;
            }

            .file-error {
                color: #dc3545;
                font-size: 0.8rem;
            }

            .media-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 20px;
            }

            .media-item {
                background: white;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                padding: 10px;
                transition: all 0.3s ease;
            }

            .media-item:hover {
                border-color: #007bff;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }

            .media-preview {
                width: 100%;
                height: 120px;
                background: #f8f9fa;
                border-radius: 6px;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }

            .media-preview img {
                max-width: 100%;
                max-height: 100%;
                object-fit: cover;
            }

            .media-preview audio {
                width: 100%;
            }

            .file-placeholder {
                font-size: 2rem;
                color: #6c757d;
            }

            .media-info {
                margin-bottom: 10px;
            }

            .media-name {
                font-weight: 500;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .media-size, .media-date {
                font-size: 0.8rem;
                color: #6c757d;
            }

            .auth-badge {
                position: absolute;
                top: 5px;
                right: 5px;
                font-size: 0.8rem;
            }

            .media-actions {
                display: flex;
                gap: 5px;
                justify-content: center;
            }

            .log-section {
                background: white;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .media-log {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 6px;
                padding: 15px;
                height: 200px;
                overflow-y: auto;
                font-family: monospace;
                font-size: 0.9rem;
            }

            .log-entry {
                margin-bottom: 5px;
                padding: 2px 0;
            }

            .log-info { color: #17a2b8; }
            .log-success { color: #28a745; }
            .log-error { color: #dc3545; }

            .loading-placeholder, .empty-placeholder, .error-placeholder {
                text-align: center;
                padding: 40px;
                color: #6c757d;
            }

            @media (max-width: 768px) {
                .upload-controls, .library-controls {
                    flex-direction: column;
                }
                
                .media-grid {
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    // Public API methods
    setSubject(subject) {
        this.options.subject = subject;
    }

    setCategory(category) {
        this.options.category = category;
    }

    async refresh() {
        await this.refreshMediaLibrary();
        await this.updateQuotaDisplay();
    }

    destroy() {
        this.container.innerHTML = '';
        const styles = document.getElementById('media-manager-styles');
        if (styles) styles.remove();
    }
}

// Global export
window.MediaManagerUI = MediaManagerUI;

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
    const containers = document.querySelectorAll('[data-media-manager]');
    containers.forEach(container => {
        const options = container.dataset.mediaManagerOptions ? 
            JSON.parse(container.dataset.mediaManagerOptions) : {};
        new MediaManagerUI(container, options);
    });
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaManagerUI;
}