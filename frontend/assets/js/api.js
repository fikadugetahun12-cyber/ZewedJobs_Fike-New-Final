// api.js - Centralized API service
import { showToast, getCSRFToken } from './helpers.js';

const API_BASE_URL = process.env.API_URL || 'https://api.yoursite.com';

class ApiService {
    constructor() {
        this.cache = new Map();
        this.pendingRequests = new Map();
        this.requestQueue = [];
        this.maxRetries = 3;
    }

    async request(endpoint, options = {}) {
        const {
            method = 'GET',
            data = null,
            headers = {},
            cache = false,
            retry = true,
            timeout = 30000,
            ...restOptions
        } = options;

        const cacheKey = `${method}:${endpoint}:${JSON.stringify(data)}`;
        
        // Check cache for GET requests
        if (method === 'GET' && cache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < (cache.ttl || 60000)) {
                return cached.data;
            }
        }

        // Prevent duplicate requests
        if (this.pendingRequests.has(cacheKey)) {
            return this.pendingRequests.get(cacheKey);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const requestHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-Token': getCSRFToken(),
            ...headers
        };

        // Add auth token if available
        const token = this.getAuthToken();
        if (token) {
            requestHeaders['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers: requestHeaders,
            signal: controller.signal,
            ...restOptions
        };

        if (data && method !== 'GET' && method !== 'HEAD') {
            config.body = JSON.stringify(data);
        }

        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

        // Create promise for request
        const requestPromise = this.makeRequest(url, config, cacheKey, retry)
            .finally(() => {
                clearTimeout(timeoutId);
                this.pendingRequests.delete(cacheKey);
            });

        this.pendingRequests.set(cacheKey, requestPromise);
        return requestPromise;
    }

    async makeRequest(url, config, cacheKey, retry, attempt = 1) {
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new HttpError(response.status, await response.text());
            }

            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            // Cache successful GET responses
            if (config.method === 'GET' && cacheKey) {
                this.cache.set(cacheKey, {
                    data,
                    timestamp: Date.now()
                });
            }

            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }

            // Retry logic for specific errors
            if (retry && attempt < this.maxRetries && this.shouldRetry(error)) {
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                await this.sleep(delay);
                return this.makeRequest(url, config, cacheKey, retry, attempt + 1);
            }

            this.handleError(error);
            throw error;
        }
    }

    shouldRetry(error) {
        const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
        const retryableMessages = ['timeout', 'network error', 'failed to fetch'];
        
        if (error.status && retryableStatusCodes.includes(error.status)) {
            return true;
        }
        
        const message = error.message.toLowerCase();
        return retryableMessages.some(msg => message.includes(msg));
    }

    handleError(error) {
        console.error('API Error:', error);
        
        let userMessage = 'An error occurred';
        let type = 'error';
        
        if (error.status === 401) {
            userMessage = 'Please log in again';
            type = 'warning';
            this.triggerAuthEvent();
        } else if (error.status === 403) {
            userMessage = 'You do not have permission';
        } else if (error.status === 404) {
            userMessage = 'Resource not found';
        } else if (error.status === 429) {
            userMessage = 'Too many requests. Please try again later';
        } else if (error.status >= 500) {
            userMessage = 'Server error. Please try again';
        } else if (error.message.includes('timeout')) {
            userMessage = 'Request timeout. Please check your connection';
        } else if (error.message.includes('network')) {
            userMessage = 'Network error. Please check your connection';
        }
        
        showToast(userMessage, type);
    }

    // Convenience methods
    get(endpoint, options = {}) {
        return this.request(endpoint, { method: 'GET', ...options });
    }

    post(endpoint, data, options = {}) {
        return this.request(endpoint, { method: 'POST', data, ...options });
    }

    put(endpoint, data, options = {}) {
        return this.request(endpoint, { method: 'PUT', data, ...options });
    }

    patch(endpoint, data, options = {}) {
        return this.request(endpoint, { method: 'PATCH', data, ...options });
    }

    delete(endpoint, options = {}) {
        return this.request(endpoint, { method: 'DELETE', ...options });
    }

    // Upload file with progress
    upload(endpoint, file, onProgress) {
        const formData = new FormData();
        formData.append('file', file);

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percent = (e.loaded / e.total) * 100;
                    onProgress?.(percent);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new HttpError(xhr.status, xhr.responseText));
                }
            });

            xhr.addEventListener('error', () => reject(new Error('Upload failed')));
            xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

            const token = this.getAuthToken();
            xhr.open('POST', `${API_BASE_URL}${endpoint}`);
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
            xhr.send(formData);
        });
    }

    // WebSocket connection
    connectWebSocket(endpoint, onMessage, onOpen, onClose) {
        const token = this.getAuthToken();
        const wsUrl = `${API_BASE_URL.replace('http', 'ws')}${endpoint}?token=${token}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = onOpen;
        ws.onmessage = (event) => onMessage(JSON.parse(event.data));
        ws.onclose = onClose;
        ws.onerror = (error) => console.error('WebSocket error:', error);

        return ws;
    }

    // Helper methods
    getAuthToken() {
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }

    triggerAuthEvent() {
        window.dispatchEvent(new CustomEvent('auth-required'));
    }

    clearCache(pattern = null) {
        if (pattern) {
            for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
    }
}

// Singleton instance
export const api = new ApiService();

// Export for individual use
export { HttpError };
