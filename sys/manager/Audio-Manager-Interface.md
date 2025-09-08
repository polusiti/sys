# 音声ファイル管理インターフェース

## 概要

このインターフェースは、R2にアップロードされた音声ファイルを管理するための管理画面です。ファイルのアップロード状況、メタデータ、アクセス統計などを確認できます。

## 機能一覧

### 1. ファイル一覧表示
- アップロードされたすべての音声ファイルの一覧
- ファイル名、サイズ、アップロード日時の表示
- プレビュー機能
- ダウンロード機能

### 2. ファイル検索・フィルター
- カテゴリー別フィルター（英語、数学、日本語）
- 日付範囲での検索
- ファイル名での検索
- ファイルサイズでのフィルター

### 3. ファイル詳細表示
- メタ情報の確認
- R2パスとURLの表示
- 関連する問題へのリンク
- アクセス統計の表示

### 4. ファイル管理操作
- ファイルの削除
- メタデータの編集
- URLの再生成
- バックアップの作成

## インターフェースの実装例

### HTML構造
```html
<div class="audio-manager">
    <div class="manager-header">
        <h2>音声ファイル管理</h2>
        <div class="manager-actions">
            <button class="button" onclick="refreshFileList()">更新</button>
            <button class="button" onclick="showUploadModal()">アップロード</button>
        </div>
    </div>
    
    <div class="filters">
        <input type="text" id="searchInput" placeholder="ファイル名で検索...">
        <select id="categoryFilter">
            <option value="">すべてのカテゴリー</option>
            <option value="english">英語</option>
            <option value="math">数学</option>
            <option value="japanese">日本語</option>
        </select>
        <input type="date" id="dateFrom">
        <input type="date" id="dateTo">
    </div>
    
    <div class="file-list">
        <table class="file-table">
            <thead>
                <tr>
                    <th>ファイル名</th>
                    <th>カテゴリー</th>
                    <th>サイズ</th>
                    <th>長さ</th>
                    <th>アップロード日時</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody id="fileTableBody">
                <!-- 動的に生成 -->
            </tbody>
        </table>
    </div>
</div>
```

### JavaScript機能
```javascript
class AudioManager {
    constructor() {
        this.files = [];
        this.currentFilter = {};
        this.init();
    }
    
    async init() {
        await this.loadFiles();
        this.setupEventListeners();
        this.renderFileList();
    }
    
    async loadFiles() {
        try {
            const response = await fetch('/api/audio-list');
            const data = await response.json();
            this.files = data.files;
        } catch (error) {
            console.error('Failed to load files:', error);
        }
    }
    
    setupEventListeners() {
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.currentFilter.search = e.target.value;
            this.renderFileList();
        });
        
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.currentFilter.category = e.target.value;
            this.renderFileList();
        });
    }
    
    renderFileList() {
        const tbody = document.getElementById('fileTableBody');
        const filteredFiles = this.filterFiles();
        
        tbody.innerHTML = filteredFiles.map(file => `
            <tr>
                <td>${file.filename}</td>
                <td>${file.category}</td>
                <td>${this.formatFileSize(file.size)}</td>
                <td>${file.duration}</td>
                <td>${this.formatDate(file.uploadedAt)}</td>
                <td>
                    <button onclick="audioManager.previewFile('${file.r2Path}')" class="button-small">プレビュー</button>
                    <button onclick="audioManager.downloadFile('${file.r2Path}')" class="button-small">ダウンロード</button>
                    <button onclick="audioManager.deleteFile('${file.r2Path}')" class="button-small danger">削除</button>
                </td>
            </tr>
        `).join('');
    }
    
    filterFiles() {
        return this.files.filter(file => {
            if (this.currentFilter.search && !file.filename.toLowerCase().includes(this.currentFilter.search.toLowerCase())) {
                return false;
            }
            if (this.currentFilter.category && file.category !== this.currentFilter.category) {
                return false;
            }
            return true;
        });
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    formatDate(dateString) {
        return new Date(dateString).toLocaleString('ja-JP');
    }
    
    async previewFile(r2Path) {
        try {
            const response = await fetch(`/api/audio/${r2Path}`);
            const data = await response.json();
            
            // モーダルでプレビュー
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>音声プレビュー</h3>
                        <button class="close-button" onclick="this.closest('.modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <audio controls style="width: 100%;">
                            <source src="${data.url}" type="audio/mpeg">
                        </audio>
                        <div style="margin-top: 15px;">
                            <p><strong>ファイル名:</strong> ${r2Path}</p>
                            <p><strong>URL:</strong> <a href="${data.url}" target="_blank">${data.url}</a></p>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } catch (error) {
            console.error('Preview failed:', error);
        }
    }
    
    async deleteFile(r2Path) {
        if (!confirm('このファイルを削除してもよろしいですか？')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/audio/${r2Path}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                await this.loadFiles();
                this.renderFileList();
                this.showNotification('ファイルを削除しました');
            }
        } catch (error) {
            console.error('Delete failed:', error);
            this.showNotification('削除に失敗しました', 'error');
        }
    }
    
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}
```

## APIエンドポイント

### GET /api/audio-list
ファイル一覧を取得します。

**レスポンス:**
```json
{
  "success": true,
  "files": [
    {
      "filename": "conversation.mp3",
      "r2Path": "audio/conversation_1725364800000_1a2b3c.mp3",
      "size": 2048000,
      "duration": "02:15",
      "category": "english",
      "uploadedAt": "2025-09-03T15:30:00Z"
    }
  ]
}
```

### DELETE /api/audio/:r2Path
ファイルを削除します。

### GET /api/audio-stats
統計情報を取得します。

**レスポンス:**
```json
{
  "success": true,
  "stats": {
    "totalFiles": 25,
    "totalSize": 51200000,
    "totalDuration": "45:30",
    "categoryStats": {
      "english": { "count": 15, "size": 30720000 },
      "math": { "count": 5, "size": 10240000 },
      "japanese": { "count": 5, "size": 10240000 }
    }
  }
}
```

## セキュリティ考慮事項

### アクセス制御
- 管理者のみがアクセス可能
- APIキー認証の実装
- 操作ログの記録

### データ保護
- ファイル削除の確認ダイアログ
- 操作の取り消し機能
- 定期的なバックアップ

## 拡張機能

### 1. バッチ処理
- 複数ファイルの一括削除
- カテゴリーの一括変更
- メタデータの一括更新

### 2. 分析機能
- ファイル使用頻度の分析
- ストレージ使用量の推移
- ユーザーアクセスログ

### 3. 自動化
- 古いファイルの自動削除
- 未使用ファイルの検出
- ストレージ最適化の提案

この管理インターフェースにより、R2に保存された音声ファイルを効率的に管理できます。