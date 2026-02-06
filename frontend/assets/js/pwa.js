// pwa.js
export default {
    init() {
        if ('serviceWorker' in navigator) {
            this.registerServiceWorker();
        }
        this.setupInstallPrompt();
        this.checkOfflineStatus();
    },
    
    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('ServiceWorker registered:', registration);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
                this.showUpdateNotification();
            });
        } catch (error) {
            console.error('ServiceWorker registration failed:', error);
        }
    },
    
    setupInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.showInstallButton();
        });
        
        document.getElementById('install-btn')?.addEventListener('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted install');
                    }
                    deferredPrompt = null;
                });
            }
        });
    },
    
    showInstallButton() {
        const installBtn = document.getElementById('install-btn');
        if (installBtn) {
            installBtn.style.display = 'block';
        }
    },
    
    checkOfflineStatus() {
        window.addEventListener('online', () => {
            this.showNotification('Back online', 'success');
            this.syncPendingData();
        });
        
        window.addEventListener('offline', () => {
            this.showNotification('You are offline', 'warning');
        });
    },
    
    showNotification(message, type) {
        // Show toast notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }
};
