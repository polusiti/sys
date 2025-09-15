/**
 * Questa R2 Client Library - Authentication-Enhanced Version
 * Cloudflare R2 Storage Integration for Media Files with D1 Authentication
 * Handles image and audio file storage/retrieval with user authentication
 */

class QuestaR2Client {
    constructor(config = {}) {
        this.endpoint = config.endpoint || '';
        this.accessKeyId = config.accessKeyId || '';
        this.secretAccessKey = config.secretAccessKey || '';
        this.bucketName = config.bucketName || 'questa-media';
        this.region = config.region || 'auto';
        this.baseUrl = `https://${this.bucketName}.${config.accountId || 'auto'}.r2.cloudflarestorage.com`;
        
        // Authentication integration
        this.authClient = null;
        this.mediaClient = null;
        this.fallbackToLocal = config.fallbackToLocal !== false; // Default true for development
    }

    /**
     * Initialize with authentication client
     * @param {Object} authClient - Authentication client instance
     */
    initializeAuth(authClient) {
        this.authClient = authClient;
        
        // Initialize authenticated media client if available
        if (window.AuthenticatedMediaClient && authClient) {
            this.mediaClient = new window.AuthenticatedMediaClient(authClient);
        }
    }

    /**
     * Upload media file to R2 with authentication
     * @param {File} file - File object to upload
     * @param {string} path - Storage path (e.g., 'english/audio/listening_01.mp3')
     * @param {Object} metadata - Optional metadata
     * @returns {Promise<Object>} Upload result with URL
     */
    async uploadMedia(file, path, metadata = {}) {
        try {
            // Try authenticated upload first
            if (this.mediaClient && this.authClient && this.authClient.isLoggedIn()) {
                const uploadOptions = {
                    subject: metadata.subject || 'general',
                    category: metadata.category || 'general',
                    description: metadata.description || '',
                    isPublic: metadata.isPublic || false
                };

                const result = await this.mediaClient.uploadMedia(file, uploadOptions);
                
                if (result.success) {
                    return {
                        success: true,
                        url: result.publicUrl || await this.mediaClient.getMedia(result.mediaId).then(r => r.downloadUrl),
                        path: result.mediaId,
                        mediaId: result.mediaId,
                        size: result.fileSize,
                        type: result.fileType,
                        uploadedAt: result.uploadDate,
                        metadata: metadata,
                        authenticated: true
                    };
                }
            }

            // Fallback to local storage for development/demo
            if (this.fallbackToLocal) {
                const localUrl = await this.storeLocalMedia(file, path);
                
                return {
                    success: true,
                    url: localUrl,
                    path: path,
                    size: file.size,
                    type: file.type,
                    uploadedAt: new Date().toISOString(),
                    metadata: metadata,
                    authenticated: false
                };
            }

            throw new Error('No upload method available');
            
        } catch (error) {
            console.error('R2 Upload Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get media file URL from R2 with authentication
     * @param {string} path - File path in storage or media ID
     * @returns {Promise<string>} Public URL or signed URL
     */
    async getMediaUrl(path) {
        try {
            // Try authenticated access first
            if (this.mediaClient && this.authClient && this.authClient.isLoggedIn()) {
                try {
                    const media = await this.mediaClient.getMedia(path);
                    if (media && media.downloadUrl) {
                        return media.downloadUrl;
                    }
                } catch (authError) {
                    console.log('Authenticated access failed, trying fallback:', authError.message);
                }
            }

            // Check local storage fallback
            if (this.fallbackToLocal) {
                const localMedia = this.getLocalMedia(path);
                if (localMedia) {
                    return localMedia;
                }
            }

            // In production, this would fetch from R2 public URL
            const url = `${this.baseUrl}/${path}`;
            return url;
        } catch (error) {
            console.error('R2 Get URL Error:', error);
            return null;
        }
    }

    /**
     * Delete media file from R2 with authentication
     * @param {string} path - File path or media ID to delete
     * @returns {Promise<boolean>} Success status
     */
    async deleteMedia(path) {
        try {
            // Try authenticated deletion first
            if (this.mediaClient && this.authClient && this.authClient.isLoggedIn()) {
                try {
                    const result = await this.mediaClient.deleteMedia(path);
                    if (result.success) {
                        return true;
                    }
                } catch (authError) {
                    console.log('Authenticated deletion failed, trying fallback:', authError.message);
                }
            }

            // Fallback: Remove from local storage
            if (this.fallbackToLocal) {
                this.removeLocalMedia(path);
            }
            
            return true;
        } catch (error) {
            console.error('R2 Delete Error:', error);
            return false;
        }
    }

    /**
     * List media files in a directory with authentication
     * @param {string} prefix - Directory prefix (e.g., 'english/audio/')
     * @returns {Promise<Array>} List of media files
     */
    async listMedia(prefix = '') {
        try {
            // Try authenticated listing first
            if (this.mediaClient && this.authClient && this.authClient.isLoggedIn()) {
                try {
                    const filters = {};
                    
                    // Parse prefix to extract subject and category
                    if (prefix) {
                        const parts = prefix.split('/').filter(p => p);
                        if (parts.length > 0) filters.subject = parts[0];
                        if (parts.length > 1) filters.category = parts[1];
                    }

                    const result = await this.mediaClient.listMedia(filters);
                    if (result.success) {
                        return result.files.map(file => ({
                            path: file.id,
                            mediaId: file.id,
                            name: file.originalName,
                            type: file.fileType,
                            size: file.fileSize,
                            uploadedAt: file.uploadDate,
                            url: file.publicUrl,
                            subject: file.subject,
                            category: file.category,
                            authenticated: true
                        }));
                    }
                } catch (authError) {
                    console.log('Authenticated listing failed, trying fallback:', authError.message);
                }
            }

            // Fallback to local storage
            if (this.fallbackToLocal) {
                const localFiles = this.getLocalMediaList(prefix);
                return localFiles.map(file => ({
                    ...file,
                    authenticated: false
                }));
            }

            return [];
        } catch (error) {
            console.error('R2 List Error:', error);
            return [];
        }
    }

    /**
     * Get user storage information (quota, usage, etc.)
     * @returns {Promise<Object>} Storage information
     */
    async getStorageInfo() {
        try {
            if (this.mediaClient && this.authClient && this.authClient.isLoggedIn()) {
                return await this.mediaClient.getStorageInfo();
            }

            // Return local storage estimate for fallback
            return {
                quota: 100 * 1024 * 1024, // 100MB default
                used: this.getLocalStorageUsage(),
                available: (100 * 1024 * 1024) - this.getLocalStorageUsage(),
                percentage: (this.getLocalStorageUsage() / (100 * 1024 * 1024)) * 100,
                authenticated: false
            };
        } catch (error) {
            console.error('Storage info error:', error);
            return null;
        }
    }

    /**
     * Search media files
     * @param {string} query - Search query
     * @param {Object} filters - Additional filters
     * @returns {Promise<Array>} Search results
     */
    async searchMedia(query, filters = {}) {
        try {
            if (this.mediaClient && this.authClient && this.authClient.isLoggedIn()) {
                const result = await this.mediaClient.searchMedia(query, filters);
                return result.files.map(file => ({
                    path: file.id,
                    mediaId: file.id,
                    name: file.originalName,
                    type: file.fileType,
                    size: file.fileSize,
                    uploadedAt: file.uploadDate,
                    url: file.publicUrl,
                    subject: file.subject,
                    category: file.category,
                    authenticated: true
                }));
            }

            // Local search fallback
            const allFiles = this.getLocalMediaList();
            if (!query) return allFiles;

            const searchQuery = query.toLowerCase();
            return allFiles.filter(file => 
                file.name.toLowerCase().includes(searchQuery) ||
                file.path.toLowerCase().includes(searchQuery)
            );
        } catch (error) {
            console.error('Search media error:', error);
            return [];
        }
    }

    /**
     * Get local storage usage estimate
     * @returns {number} Bytes used
     */
    getLocalStorageUsage() {
        try {
            let totalSize = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('r2_media_')) {
                    const stored = localStorage.getItem(key);
                    if (stored) {
                        const mediaData = JSON.parse(stored);
                        totalSize += mediaData.size || 0;
                    }
                }
            }
            return totalSize;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        return this.authClient && this.authClient.isLoggedIn();
    }

    /**
     * Get current user information
     * @returns {Object|null} User info
     */
    getCurrentUser() {
        if (this.authClient && this.authClient.isLoggedIn()) {
            return this.authClient.getCurrentUser();
        }
        return null;
    }

    /**
     * Local storage fallback for development
     */
    async storeLocalMedia(file, path) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const mediaData = {
                        data: e.target.result,
                        type: file.type,
                        name: file.name,
                        size: file.size,
                        path: path,
                        uploadedAt: new Date().toISOString()
                    };

                    const storageKey = `r2_media_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
                    localStorage.setItem(storageKey, JSON.stringify(mediaData));
                    
                    // Return data URL for immediate use
                    resolve(e.target.result);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    getLocalMedia(path) {
        try {
            const storageKey = `r2_media_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const mediaData = JSON.parse(stored);
                return mediaData.data;
            }
            return null;
        } catch (error) {
            console.error('Local media retrieval error:', error);
            return null;
        }
    }

    removeLocalMedia(path) {
        try {
            const storageKey = `r2_media_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
            localStorage.removeItem(storageKey);
        } catch (error) {
            console.error('Local media removal error:', error);
        }
    }

    getLocalMediaList(prefix = '') {
        try {
            const files = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('r2_media_')) {
                    try {
                        const stored = localStorage.getItem(key);
                        const mediaData = JSON.parse(stored);
                        
                        if (!prefix || mediaData.path.startsWith(prefix)) {
                            files.push({
                                path: mediaData.path,
                                name: mediaData.name,
                                type: mediaData.type,
                                size: mediaData.size,
                                uploadedAt: mediaData.uploadedAt,
                                url: mediaData.data
                            });
                        }
                    } catch (e) {
                        continue;
                    }
                }
            }
            return files;
        } catch (error) {
            console.error('Local media list error:', error);
            return [];
        }
    }

    /**
     * Create audio player element
     * @param {string} audioUrl - URL of audio file
     * @param {Object} options - Player options
     * @returns {HTMLElement} Audio player element
     */
    createAudioPlayer(audioUrl, options = {}) {
        const audio = document.createElement('audio');
        audio.src = audioUrl;
        audio.controls = options.controls !== false;
        audio.preload = options.preload || 'metadata';
        
        if (options.className) {
            audio.className = options.className;
        }

        return audio;
    }

    /**
     * Create image display element
     * @param {string} imageUrl - URL of image file
     * @param {Object} options - Image options
     * @returns {HTMLElement} Image element
     */
    createImageDisplay(imageUrl, options = {}) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = options.alt || 'Media image';
        
        if (options.className) {
            img.className = options.className;
        }

        if (options.maxWidth) {
            img.style.maxWidth = options.maxWidth;
        }

        if (options.maxHeight) {
            img.style.maxHeight = options.maxHeight;
        }

        return img;
    }

    /**
     * Validate media file type
     * @param {File} file - File to validate
     * @returns {Object} Validation result
     */
    validateMediaFile(file) {
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

    /**
     * Generate storage path for media file
     * @param {string} subject - Subject (english, math, japanese, etc.)
     * @param {string} type - Media type (image, audio)
     * @param {string} filename - Original filename
     * @returns {string} Storage path
     */
    generateStoragePath(subject, type, filename) {
        const timestamp = Date.now();
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        return `${subject}/${type}/${timestamp}_${sanitizedFilename}`;
    }
}

// Global instance with authentication integration
window.questaR2 = new QuestaR2Client();

// Auto-initialize with auth client when available
document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth client to be available
    const initializeWithAuth = () => {
        if (window.authClient) {
            window.questaR2.initializeAuth(window.authClient);
            console.log('QuestaR2Client initialized with authentication');
        } else {
            setTimeout(initializeWithAuth, 100);
        }
    };
    
    initializeWithAuth();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestaR2Client;
}