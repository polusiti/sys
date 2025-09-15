/**
 * Admin Management Client for Data Manager
 * Handles admin operations and system management
 */

class AdminClient {
    constructor() {
        this.baseUrl = 'https://data-manager-auth.t88596565.workers.dev'; // Production Worker URL
        this.authClient = window.authClient;
    }

    /**
     * Check if current user has admin privileges
     */
    isAdmin() {
        const user = this.authClient.getCurrentUser();
        return user && user.role === 'admin';
    }

    /**
     * Get authentication headers for admin requests
     */
    getAdminHeaders() {
        if (!this.authClient.sessionToken) {
            throw new Error('Admin authentication required');
        }
        
        return {
            'Authorization': `Bearer ${this.authClient.sessionToken}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Get system statistics for admin dashboard
     */
    async getSystemStats() {
        try {
            const response = await fetch(`${this.baseUrl}/api/admin/stats`, {
                method: 'GET',
                headers: this.getAdminHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to get system stats');
            }

            return await response.json();
        } catch (error) {
            console.error('Get system stats error:', error);
            throw error;
        }
    }

    /**
     * Get all users for admin management
     */
    async getUsers(options = {}) {
        try {
            const params = new URLSearchParams();
            
            if (options.limit) params.append('limit', options.limit);
            if (options.offset) params.append('offset', options.offset);
            if (options.search) params.append('search', options.search);

            const response = await fetch(`${this.baseUrl}/api/admin/users?${params}`, {
                method: 'GET',
                headers: this.getAdminHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to get users');
            }

            return await response.json();
        } catch (error) {
            console.error('Get users error:', error);
            throw error;
        }
    }

    /**
     * Update user role (promote/demote admin)
     */
    async updateUserRole(userId, role) {
        try {
            const response = await fetch(`${this.baseUrl}/api/admin/promote`, {
                method: 'POST',
                headers: this.getAdminHeaders(),
                body: JSON.stringify({ userId, role })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update user role');
            }

            return await response.json();
        } catch (error) {
            console.error('Update user role error:', error);
            throw error;
        }
    }

    /**
     * Get user media files for admin review
     */
    async getUserMedia(userId, options = {}) {
        try {
            const params = new URLSearchParams({ userId });
            
            if (options.limit) params.append('limit', options.limit);
            if (options.offset) params.append('offset', options.offset);
            if (options.subject) params.append('subject', options.subject);
            if (options.category) params.append('category', options.category);

            const response = await fetch(`${this.baseUrl}/api/media/list?${params}`, {
                method: 'GET',
                headers: this.getAdminHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to get user media');
            }

            return await response.json();
        } catch (error) {
            console.error('Get user media error:', error);
            throw error;
        }
    }

    /**
     * Delete media file (admin action)
     */
    async deleteMedia(mediaId) {
        try {
            const response = await fetch(`${this.baseUrl}/api/media/${mediaId}`, {
                method: 'DELETE',
                headers: this.getAdminHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete media');
            }

            return await response.json();
        } catch (error) {
            console.error('Delete media error:', error);
            throw error;
        }
    }

    /**
     * Get system activity logs
     */
    async getActivityLogs(options = {}) {
        try {
            const params = new URLSearchParams();
            
            if (options.limit) params.append('limit', options.limit);
            if (options.offset) params.append('offset', options.offset);
            if (options.startDate) params.append('startDate', options.startDate);
            if (options.endDate) params.append('endDate', options.endDate);
            if (options.type) params.append('type', options.type);

            // Note: This endpoint would need to be implemented in the Worker
            const response = await fetch(`${this.baseUrl}/api/admin/logs?${params}`, {
                method: 'GET',
                headers: this.getAdminHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to get activity logs');
            }

            return await response.json();
        } catch (error) {
            console.error('Get activity logs error:', error);
            throw error;
        }
    }

    /**
     * Initialize admin database (for system setup)
     */
    async initializeSystem() {
        try {
            const response = await fetch(`${this.baseUrl}/api/auth/init`, {
                method: 'POST',
                headers: this.getAdminHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to initialize system');
            }

            return await response.json();
        } catch (error) {
            console.error('Initialize system error:', error);
            throw error;
        }
    }

    /**
     * Export user data (CSV format)
     */
    async exportUsers(format = 'csv') {
        try {
            const response = await fetch(`${this.baseUrl}/api/admin/users/export?format=${format}`, {
                method: 'GET',
                headers: this.getAdminHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to export users');
            }

            // Handle file download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `users_export_${new Date().toISOString().split('T')[0]}.${format}`;
            a.click();
            window.URL.revokeObjectURL(url);

            return { success: true, message: 'Users exported successfully' };
        } catch (error) {
            console.error('Export users error:', error);
            throw error;
        }
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Get relative time string
     */
    getRelativeTime(dateString) {
        if (!dateString) return '-';
        
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}秒前`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分前`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}時間前`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}日前`;
        if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}ヶ月前`;
        return `${Math.floor(diffInSeconds / 31536000)}年前`;
    }

    /**
     * Generate inquiry number
     */
    generateInquiryNumber() {
        const year = new Date().getFullYear();
        const sequence = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
        return `DM-${year}-${sequence}`;
    }
}

// Global admin client instance
if (typeof window !== 'undefined') {
    window.adminClient = new AdminClient();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminClient;
}