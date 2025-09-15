/**
 * Authenticated Media Manager Client
 * Handles media upload, management, and access with authentication
 * Integrates with D1 database and R2 storage via Cloudflare Worker
 */

class AuthenticatedMediaClient {
    constructor(authClient) {
        this.authClient = authClient;
        this.baseUrl = 'https://data-manager-auth.t88596565.workers.dev'; // Production Worker URL
        // For local development: 'http://localhost:8787'
        this.mediaCache = new Map();
        this.uploadProgress = new Map();
    }

    /**
     * Upload media file with authentication
     */
    async uploadMedia(file, options = {}) {
        if (!this.authClient || !this.authClient.isLoggedIn()) {
            throw new Error('Authentication required for media upload');
        }

        const {
            subject = 'general',
            category = 'general', 
            description = '',
            isPublic = false,
            onProgress = null
        } = options;

        // Validate file
        this.validateFile(file);

        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('subject', subject);
        formData.append('category', category);
        formData.append('description', description);
        formData.append('isPublic', isPublic.toString());

        const uploadId = this.generateId();
        
        try {
            // Track upload progress
            if (onProgress) {
                this.uploadProgress.set(uploadId, { loaded: 0, total: file.size });
            }

            const response = await fetch(`${this.baseUrl}/api/media/upload`, {
                method: 'POST',
                headers: this.authClient.getAuthHeaders(),
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }

            const result = await response.json();
            
            // Cache the uploaded media
            this.mediaCache.set(result.mediaId, result);
            
            // Clean up progress tracking
            this.uploadProgress.delete(uploadId);

            return result;

        } catch (error) {
            console.error('Media upload error:', error);
            this.uploadProgress.delete(uploadId);
            throw error;
        }
    }

    /**
     * Upload multiple files with progress tracking
     */
    async uploadMultipleFiles(files, options = {}) {
        const results = [];
        const errors = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            try {
                const fileOptions = {
                    ...options,
                    onProgress: (progress) => {
                        if (options.onProgress) {
                            const overallProgress = {
                                current: i,
                                total: files.length,
                                currentFile: file.name,
                                fileProgress: progress
                            };
                            options.onProgress(overallProgress);
                        }
                    }
                };

                const result = await this.uploadMedia(file, fileOptions);
                results.push(result);

            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
                errors.push({ file: file.name, error: error.message });
            }
        }

        return { results, errors };
    }

    /**
     * List user's media files
     */
    async listMedia(filters = {}) {
        if (!this.authClient || !this.authClient.isLoggedIn()) {
            throw new Error('Authentication required');
        }

        const params = new URLSearchParams();
        
        if (filters.subject) params.append('subject', filters.subject);
        if (filters.category) params.append('category', filters.category);
        if (filters.fileType) params.append('fileType', filters.fileType);
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.offset) params.append('offset', filters.offset.toString());

        try {
            const response = await fetch(`${this.baseUrl}/api/media/list?${params}`, {
                headers: this.authClient.getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to list media');
            }

            const result = await response.json();
            
            // Cache media files
            result.files.forEach(media => {
                this.mediaCache.set(media.id, media);
            });

            return result;

        } catch (error) {
            console.error('List media error:', error);
            throw error;
        }
    }

    /**
     * Get media file with download URL
     */
    async getMedia(mediaId) {
        if (!this.authClient || !this.authClient.isLoggedIn()) {
            throw new Error('Authentication required');
        }

        // Check cache first
        if (this.mediaCache.has(mediaId)) {
            const cached = this.mediaCache.get(mediaId);
            // Return cached data if less than 5 minutes old
            if (Date.now() - new Date(cached.uploadDate).getTime() < 5 * 60 * 1000) {
                return cached;
            }
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/media/${mediaId}`, {
                headers: this.authClient.getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to get media');
            }

            const result = await response.json();
            
            // Cache the result
            this.mediaCache.set(mediaId, result);

            return result;

        } catch (error) {
            console.error('Get media error:', error);
            throw error;
        }
    }

    /**
     * Delete media file
     */
    async deleteMedia(mediaId) {
        if (!this.authClient || !this.authClient.isLoggedIn()) {
            throw new Error('Authentication required');
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/media/${mediaId}`, {
                method: 'DELETE',
                headers: this.authClient.getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete media');
            }

            const result = await response.json();
            
            // Remove from cache
            this.mediaCache.delete(mediaId);

            return result;

        } catch (error) {
            console.error('Delete media error:', error);
            throw error;
        }
    }

    /**
     * Update media metadata
     */
    async updateMedia(mediaId, updates) {
        if (!this.authClient || !this.authClient.isLoggedIn()) {
            throw new Error('Authentication required');
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/media/${mediaId}`, {
                method: 'PUT',
                headers: this.authClient.getAuthHeaders(),
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update media');
            }

            const result = await response.json();
            
            // Update cache
            this.mediaCache.set(mediaId, result.media);

            return result;

        } catch (error) {
            console.error('Update media error:', error);
            throw error;
        }
    }

    /**
     * Get public media (no authentication required)
     */
    async getPublicMedia(mediaId) {
        try {
            const response = await fetch(`${this.baseUrl}/api/public/media/${mediaId}`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to get public media');
            }

            return await response.json();

        } catch (error) {
            console.error('Get public media error:', error);
            throw error;
        }
    }

    /**
     * Get user storage information
     */
    async getStorageInfo() {
        if (!this.authClient || !this.authClient.isLoggedIn()) {
            throw new Error('Authentication required');
        }

        const user = this.authClient.getCurrentUser();
        if (!user) {
            throw new Error('User information not available');
        }

        // Get updated user info including storage usage
        try {
            const response = await fetch(`${this.baseUrl}/api/auth/me`, {
                headers: this.authClient.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to get storage information');
            }

            const userInfo = await response.json();
            
            return {
                quota: userInfo.storageQuota || 104857600, // 100MB default
                used: userInfo.storageUsed || 0,
                available: (userInfo.storageQuota || 104857600) - (userInfo.storageUsed || 0),
                percentage: ((userInfo.storageUsed || 0) / (userInfo.storageQuota || 104857600)) * 100
            };

        } catch (error) {
            console.error('Get storage info error:', error);
            throw error;
        }
    }

    /**
     * Validate file before upload
     */
    validateFile(file) {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'
        ];

        if (!allowedTypes.includes(file.type)) {
            throw new Error(`Unsupported file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`);
        }

        const maxFileSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxFileSize) {
            throw new Error(`File too large: ${this.formatFileSize(file.size)}. Maximum size: ${this.formatFileSize(maxFileSize)}`);
        }

        return true;
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }

    /**
     * Clear media cache
     */
    clearCache() {
        this.mediaCache.clear();
    }

    /**
     * Get cached media files
     */
    getCachedMedia() {
        return Array.from(this.mediaCache.values());
    }

    /**
     * Create image preview URL
     */
    createPreviewUrl(file) {
        if (file.type.startsWith('image/')) {
            return URL.createObjectURL(file);
        }
        return null;
    }

    /**
     * Cleanup preview URLs
     */
    cleanupPreviewUrl(url) {
        if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
    }

    /**
     * Get media by subject and category
     */
    async getMediaBySubject(subject, category = null) {
        const filters = { subject };
        if (category) filters.category = category;
        
        return await this.listMedia(filters);
    }

    /**
     * Search media files
     */
    async searchMedia(query, filters = {}) {
        const allMedia = await this.listMedia(filters);
        
        if (!query) return allMedia;

        const searchQuery = query.toLowerCase();
        const filteredFiles = allMedia.files.filter(media => 
            media.originalName.toLowerCase().includes(searchQuery) ||
            media.description.toLowerCase().includes(searchQuery) ||
            media.category.toLowerCase().includes(searchQuery)
        );

        return {
            ...allMedia,
            files: filteredFiles,
            count: filteredFiles.length
        };
    }

    /**
     * Export media library as JSON
     */
    async exportMediaLibrary() {
        const allMedia = await this.listMedia({ limit: 1000 });
        
        const exportData = {
            exportDate: new Date().toISOString(),
            user: this.authClient.getCurrentUser()?.userId,
            mediaFiles: allMedia.files.map(media => ({
                id: media.id,
                originalName: media.originalName,
                fileType: media.fileType,
                fileSize: media.fileSize,
                subject: media.subject,
                category: media.category,
                description: media.description,
                uploadDate: media.uploadDate,
                isPublic: media.isPublic
            }))
        };

        return exportData;
    }
}

// Global media client instance
if (typeof window !== 'undefined') {
    window.mediaClient = null; // Will be initialized after auth client
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthenticatedMediaClient;
}