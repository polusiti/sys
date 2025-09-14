/**
 * Questa R2 Client Library
 * Cloudflare R2 Storage Integration for Media Files
 * Handles image and audio file storage/retrieval
 */

class QuestaR2Client {
    constructor(config = {}) {
        this.endpoint = config.endpoint || '';
        this.accessKeyId = config.accessKeyId || '';
        this.secretAccessKey = config.secretAccessKey || '';
        this.bucketName = config.bucketName || 'questa-media';
        this.region = config.region || 'auto';
        this.baseUrl = `https://${this.bucketName}.${config.accountId || 'auto'}.r2.cloudflarestorage.com`;
    }

    /**
     * Upload media file to R2
     * @param {File} file - File object to upload
     * @param {string} path - Storage path (e.g., 'english/audio/listening_01.mp3')
     * @param {Object} metadata - Optional metadata
     * @returns {Promise<Object>} Upload result with URL
     */
    async uploadMedia(file, path, metadata = {}) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', path);
            formData.append('metadata', JSON.stringify(metadata));

            // For demo purposes, store locally and return mock URL
            const localUrl = await this.storeLocalMedia(file, path);
            
            return {
                success: true,
                url: localUrl,
                path: path,
                size: file.size,
                type: file.type,
                uploadedAt: new Date().toISOString(),
                metadata: metadata
            };
        } catch (error) {
            console.error('R2 Upload Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get media file URL from R2
     * @param {string} path - File path in storage
     * @returns {Promise<string>} Public URL
     */
    async getMediaUrl(path) {
        try {
            // Check local storage first
            const localMedia = this.getLocalMedia(path);
            if (localMedia) {
                return localMedia;
            }

            // In production, this would fetch from R2
            const url = `${this.baseUrl}/${path}`;
            return url;
        } catch (error) {
            console.error('R2 Get URL Error:', error);
            return null;
        }
    }

    /**
     * Delete media file from R2
     * @param {string} path - File path to delete
     * @returns {Promise<boolean>} Success status
     */
    async deleteMedia(path) {
        try {
            // Remove from local storage
            this.removeLocalMedia(path);
            
            return true;
        } catch (error) {
            console.error('R2 Delete Error:', error);
            return false;
        }
    }

    /**
     * List media files in a directory
     * @param {string} prefix - Directory prefix (e.g., 'english/audio/')
     * @returns {Promise<Array>} List of media files
     */
    async listMedia(prefix = '') {
        try {
            const localFiles = this.getLocalMediaList(prefix);
            return localFiles;
        } catch (error) {
            console.error('R2 List Error:', error);
            return [];
        }
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

// Global instance
window.questaR2 = new QuestaR2Client();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestaR2Client;
}