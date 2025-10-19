// Main application controller
import { AuthManager } from './auth.js';
import { UIManager } from './ui.js';
import { StatsManager } from './stats.js';

class App {
    constructor() {
        this.authManager = new AuthManager();
        this.uiManager = new UIManager();
        this.statsManager = new StatsManager();
    }

    initialize() {
        try {
            // Initialize UI components
            this.uiManager.initialize();
            
            // Initialize authentication
            this.authManager.initializeUserInterface();
            
            // Make managers globally available
            window.authManager = this.authManager;
            window.uiManager = this.uiManager;
            window.statsManager = this.statsManager;
            
            // Register service worker
            this.registerServiceWorker();
            
            console.log('アプリケーションが初期化されました');
        } catch (error) {
            console.error('アプリケーションの初期化に失敗しました:', error);
            // Fallback: show error message
            const toast = document.getElementById('toast');
            if (toast) {
                toast.textContent = 'アプリケーションの読み込みに失敗しました';
                toast.className = 'toast error show';
            }
        }
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered successfully:', registration);
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.initialize();
});

// Export for potential external use
export { App };