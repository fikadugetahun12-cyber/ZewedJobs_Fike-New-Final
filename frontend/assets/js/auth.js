// auth.js - Authentication management
import { api } from './api.js';
import { encrypt, decrypt, generateUUID } from './helpers.js';

class AuthService {
    constructor() {
        this.user = null;
        this.listeners = new Set();
        this.sessionTimeout = 60 * 60 * 1000; // 1 hour
        this.init();
    }

    init() {
        this.loadUserFromStorage();
        this.setupAutoRefresh();
        this.setupIdleDetection();
    }

    async login(credentials, remember = false) {
        try {
            const { email, password, twoFactorCode } = credentials;
            
            // Prepare login data
            const loginData = {
                email,
                password: encrypt(password), // Encrypt before sending
                ...(twoFactorCode && { twoFactorCode })
            };

            // Make login request
            const response = await api.post('/auth/login', loginData);
            
            // Store tokens
            this.setTokens(response.tokens, remember);
            
            // Load user data
            await this.loadUser();
            
            // Notify listeners
            this.notifyListeners();
            
            // Log login event
            this.logEvent('login_success', { email });
            
            return { success: true, user: this.user };
        } catch (error) {
            this.logEvent('login_failed', { 
                email: credentials.email,
                error: error.message 
            });
            
            throw this.handleLoginError(error);
        }
    }

    async register(userData) {
        try {
            // Validate password strength
            this.validatePassword(userData.password);
            
            // Encrypt sensitive data
            const encryptedData = {
                ...userData,
                password: encrypt(userData.password)
            };

            const response = await api.post('/auth/register', encryptedData);
            
            // Auto-login after registration if configured
            if (response.autoLogin) {
                await this.login({
                    email: userData.email,
                    password: userData.password
                });
            }
            
            this.logEvent('registration_success', { email: userData.email });
            return { success: true, message: response.message };
        } catch (error) {
            this.logEvent('registration_failed', {
                email: userData.email,
                error: error.message
            });
            throw error;
        }
    }

    async logout(global = false) {
        try {
            // Notify server if online
            if (navigator.onLine) {
                await api.post('/auth/logout', { global });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local data
            this.clearAuthData();
            
            // Notify listeners
            this.user = null;
            this.notifyListeners();
            
            // Log event
            this.logEvent('logout', { global });
            
            // Redirect to login page
            if (window.location.pathname !== '/login') {
                window.location.href = '/login?logout=success';
            }
        }
    }

    async loadUser() {
        try {
            const userData = await api.get('/auth/me');
            this.user = this.processUserData(userData);
            this.saveUserToStorage();
            return this.user;
        } catch (error) {
            console.error('Failed to load user:', error);
            this.user = null;
            throw error;
        }
    }

    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) throw new Error('No refresh token');
            
            const response = await api.post('/auth/refresh', {
                refreshToken
            });
            
            this.setTokens(response.tokens, true);
            return response.accessToken;
        } catch (error) {
            // Refresh failed, logout user
            await this.logout();
            throw error;
        }
    }

    // Token management
    setTokens(tokens, remember = false) {
        const storage = remember ? localStorage : sessionStorage;
        
        storage.setItem('access_token', tokens.accessToken);
        storage.setItem('refresh_token', tokens.refreshToken);
        
        // Set expiry time
        const expiry = Date.now() + (tokens.expiresIn * 1000);
        storage.setItem('token_expiry', expiry.toString());
        
        // Setup auto-refresh
        this.scheduleTokenRefresh(tokens.expiresIn - 300); // Refresh 5 minutes before expiry
    }

    getAccessToken() {
        const token = localStorage.getItem('access_token') || 
                     sessionStorage.getItem('access_token');
        
        if (!token) return null;
        
        // Check if token is expired
        const expiry = parseInt(localStorage.getItem('token_expiry') || 
                               sessionStorage.getItem('token_expiry') || '0');
        
        if (Date.now() > expiry) {
            // Token expired, try to refresh
            this.refreshToken().catch(() => this.logout());
            return null;
        }
        
        return token;
    }

    clearAuthData() {
        // Clear all auth-related storage
        ['access_token', 'refresh_token', 'token_expiry', 'user_data'].forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
        
        // Clear cookies
        document.cookie.split(';').forEach(cookie => {
            const name = cookie.split('=')[0].trim();
            if (name.includes('auth') || name.includes('session')) {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            }
        });
    }

    // Permission management
    hasPermission(permission) {
        if (!this.user || !this.user.permissions) return false;
        
        if (Array.isArray(permission)) {
            return permission.some(p => this.user.permissions.includes(p));
        }
        
        return this.user.permissions.includes(permission) || 
               this.user.permissions.includes('*'); // Wildcard for admin
    }

    hasRole(role) {
        if (!this.user || !this.user.roles) return false;
        
        if (Array.isArray(role)) {
            return role.some(r => this.user.roles.includes(r));
        }
        
        return this.user.roles.includes(role);
    }

    // Two-factor authentication
    async setupTwoFactor() {
        const response = await api.post('/auth/2fa/setup');
        
        // Show QR code
        this.showQRCode(response.qrCodeUrl);
        
        return {
            secret: response.secret,
            backupCodes: response.backupCodes
        };
    }

    async verifyTwoFactor(code) {
        const response = await api.post('/auth/2fa/verify', { code });
        
        if (response.success) {
            this.user.twoFactorEnabled = true;
            this.saveUserToStorage();
        }
        
        return response;
    }

    // Session management
    setupIdleDetection() {
        let idleTime = 0;
        
        const resetIdleTime = () => {
            idleTime = 0;
        };
        
        const incrementIdleTime = () => {
            idleTime++;
            if (idleTime > 29) { // 30 minutes idle
                this.showIdleWarning();
            }
            if (idleTime > 59) { // 60 minutes idle
                this.logout();
            }
        };
        
        // Events that reset idle time
        ['mousemove', 'keypress', 'click', 'scroll'].forEach(event => {
            document.addEventListener(event, resetIdleTime, { passive: true });
        });
        
        // Check idle time every minute
        setInterval(incrementIdleTime, 60000);
    }

    showIdleWarning() {
        // Show warning modal or notification
        const warning = document.createElement('div');
        warning.className = 'idle-warning';
        warning.innerHTML = `
            <div class="warning-content">
                <p>You will be logged out due to inactivity in 1 minute.</p>
                <button onclick="authService.resetIdleTimer()">Stay Logged In</button>
            </div>
        `;
        document.body.appendChild(warning);
        
        setTimeout(() => warning.remove(), 60000);
    }

    resetIdleTimer() {
        // Reset idle detection
        this.setupIdleDetection();
    }

    // Event system
    addListener(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notifyListeners() {
        this.listeners.forEach(listener => listener(this.user));
    }

    // Helper methods
    loadUserFromStorage() {
        try {
            const userData = localStorage.getItem('user_data') || 
                            sessionStorage.getItem('user_data');
            if (userData) {
                this.user = JSON.parse(decrypt(userData));
            }
        } catch (error) {
            console.error('Failed to load user from storage:', error);
            this.clearAuthData();
        }
    }

    saveUserToStorage() {
        if (!this.user) return;
        
        const encryptedData = encrypt(JSON.stringify(this.user));
        const storage = localStorage.getItem('access_token') ? localStorage : sessionStorage;
        storage.setItem('user_data', encryptedData);
    }

    processUserData(userData) {
        // Sanitize and process user data
        return {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            avatar: userData.avatar,
            roles: userData.roles || [],
            permissions: userData.permissions || [],
            settings: userData.settings || {},
            twoFactorEnabled: userData.twoFactorEnabled || false,
            createdAt: userData.createdAt,
            lastLogin: userData.lastLogin || new Date().toISOString()
        };
    }

    validatePassword(password) {
        const requirements = [
            { test: password.length >= 8, message: 'At least 8 characters' },
            { test: /[A-Z]/.test(password), message: 'At least one uppercase letter' },
            { test: /[a-z]/.test(password), message: 'At least one lowercase letter' },
            { test: /\d/.test(password), message: 'At least one number' },
            { test: /[!@#$%^&*]/.test(password), message: 'At least one special character' }
        ];

        const failed = requirements.filter(req => !req.test);
        if (failed.length > 0) {
            throw new Error(`Password requirements: ${failed.map(f => f.message).join(', ')}`);
        }
    }

    handleLoginError(error) {
        switch (error.status) {
            case 401:
                return new Error('Invalid email or password');
            case 423:
                return new Error('Account locked. Please try again later');
            case 429:
                return new Error('Too many attempts. Please wait');
            case 403:
                return new Error('Two-factor authentication required');
            default:
                return new Error('Login failed. Please try again');
        }
    }

    logEvent(event, data) {
        const eventData = {
            event,
            userId: this.user?.id,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ...data
        };

        // Store locally
        const events = JSON.parse(localStorage.getItem('auth_events') || '[]');
        events.push(eventData);
        localStorage.setItem('auth_events', JSON.stringify(events.slice(-100))); // Keep last 100 events

        // Send to server if online
        if (navigator.onLine) {
            api.post('/auth/events', eventData).catch(() => {});
        }
    }

    scheduleTokenRefresh(expiresIn) {
        if (this.refreshTimeout) clearTimeout(this.refreshTimeout);
        
        this.refreshTimeout = setTimeout(() => {
            this.refreshToken().catch(() => {});
        }, expiresIn * 1000);
    }

    setupAutoRefresh() {
        // Refresh token periodically
        setInterval(() => {
            if (this.getAccessToken()) {
                this.refreshToken().catch(() => {});
            }
        }, 30 * 60 * 1000); // Every 30 minutes
    }

    showQRCode(qrCodeUrl) {
        // Implementation for showing QR code modal
        const modal = document.createElement('div');
        modal.className = 'modal two-factor-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Set up Two-Factor Authentication</h3>
                <p>Scan this QR code with your authenticator app:</p>
                <img src="${qrCodeUrl}" alt="QR Code">
                <p>Or enter this code manually: <code>${qrCodeUrl.split('secret=')[1]}</code></p>
                <button onclick="this.closest('.modal').remove()">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

// Singleton instance
export const auth = new AuthService();

// Export for individual use
export { AuthService };
