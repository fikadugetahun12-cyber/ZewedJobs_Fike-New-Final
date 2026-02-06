// helpers.js - Common utility functions

// ==================== DOM Manipulation ====================
export function $(selector, parent = document) {
    return parent.querySelector(selector);
}

export function $$(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
}

export function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
        if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.substring(2).toLowerCase(), value);
        } else if (key === 'className') {
            element.className = value;
        } else if (key === 'html') {
            element.innerHTML = value;
        } else if (value !== null && value !== undefined) {
            element.setAttribute(key, value);
        }
    });
    
    // Append children
    if (Array.isArray(children)) {
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
    } else if (typeof children === 'string') {
        element.textContent = children;
    }
    
    return element;
}

export function toggleClass(element, className, force) {
    if (Array.isArray(className)) {
        className.forEach(cls => element.classList.toggle(cls, force));
    } else {
        element.classList.toggle(className, force);
    }
}

export function hasClass(element, className) {
    return element.classList.contains(className);
}

export function addClass(element, className) {
    element.classList.add(className);
}

export function removeClass(element, className) {
    element.classList.remove(className);
}

// ==================== Event Handling ====================
export function on(event, selector, handler, options = {}) {
    document.addEventListener(event, (e) => {
        if (e.target.matches(selector)) {
            handler.call(e.target, e);
        }
    }, options);
}

export function once(event, element, handler) {
    element.addEventListener(event, handler, { once: true });
}

export function off(event, element, handler) {
    element.removeEventListener(event, handler);
}

export function trigger(element, eventName, detail = {}) {
    const event = new CustomEvent(eventName, { 
        bubbles: true, 
        cancelable: true, 
        detail 
    });
    element.dispatchEvent(event);
}

// ==================== Form Handling ====================
export function serializeForm(form) {
    const data = new FormData(form);
    const object = {};
    
    for (const [key, value] of data.entries()) {
        if (object[key]) {
            if (Array.isArray(object[key])) {
                object[key].push(value);
            } else {
                object[key] = [object[key], value];
            }
        } else {
            object[key] = value;
        }
    }
    
    return object;
}

export function validateForm(form, rules = {}) {
    const errors = {};
    const elements = form.elements;
    
    for (const element of elements) {
        if (element.name && rules[element.name]) {
            const value = element.value.trim();
            const validation = rules[element.name];
            
            if (validation.required && !value) {
                errors[element.name] = validation.requiredMessage || 'This field is required';
            } else if (validation.pattern && !validation.pattern.test(value)) {
                errors[element.name] = validation.patternMessage || 'Invalid format';
            } else if (validation.minLength && value.length < validation.minLength) {
                errors[element.name] = validation.minLengthMessage || `Minimum ${validation.minLength} characters`;
            } else if (validation.maxLength && value.length > validation.maxLength) {
                errors[element.name] = validation.maxLengthMessage || `Maximum ${validation.maxLength} characters`;
            } else if (validation.custom && !validation.custom(value)) {
                errors[element.name] = validation.customMessage || 'Invalid value';
            }
        }
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

export function showFormErrors(form, errors) {
    // Clear previous errors
    form.querySelectorAll('.error-message').forEach(el => el.remove());
    form.querySelectorAll('.has-error').forEach(el => removeClass(el, 'has-error'));
    
    // Show new errors
    Object.entries(errors).forEach(([field, message]) => {
        const input = form.querySelector(`[name="${field}"]`);
        if (input) {
            addClass(input, 'has-error');
            const errorDiv = createElement('div', {
                className: 'error-message',
                textContent: message
            });
            input.parentNode.insertBefore(errorDiv, input.nextSibling);
        }
    });
}

// ==================== Storage ====================
export function setLocal(key, value, ttl = null) {
    try {
        const item = {
            value,
            timestamp: Date.now(),
            ttl
        };
        localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
        console.warn('LocalStorage set failed:', error);
        // Fallback to sessionStorage or cookies
        setSession(key, value);
    }
}

export function getLocal(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        if (!item) return defaultValue;
        
        const { value, timestamp, ttl } = JSON.parse(item);
        
        // Check if expired
        if (ttl && Date.now() - timestamp > ttl) {
            localStorage.removeItem(key);
            return defaultValue;
        }
        
        return value;
    } catch (error) {
        return defaultValue;
    }
}

export function removeLocal(key) {
    localStorage.removeItem(key);
}

export function setSession(key, value) {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn('SessionStorage set failed:', error);
        setCookie(key, JSON.stringify(value));
    }
}

export function getSession(key, defaultValue = null) {
    try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        return defaultValue;
    }
}

export function setCookie(name, value, days = 7, path = '/') {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=${path}; SameSite=Lax`;
}

export function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === name) {
            return decodeURIComponent(value);
        }
    }
    return null;
}

export function removeCookie(name, path = '/') {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
}

// ==================== String Manipulation ====================
export function truncate(str, length, suffix = '...') {
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
}

export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function titleCase(str) {
    return str.replace(/\w\S*/g, txt => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

export function slugify(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==================== Date & Time ====================
export function formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

export function timeAgo(date) {
    const now = new Date();
    const past = new Date(date);
    const diff = now - past;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}

export function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

// ==================== Number Formatting ====================
export function formatNumber(num, decimals = 0) {
    return new Intl.NumberFormat().format(Number(num).toFixed(decimals));
}

export function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency
    }).format(amount);
}

export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatPercentage(value, decimals = 1) {
    return `${Number(value * 100).toFixed(decimals)}%`;
}

// ==================== Validation ====================
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

export function isValidPhone(phone) {
    const re = /^[\+]?[1-9][\d]{0,15}$/;
    return re.test(phone.replace(/[\s\-\(\)]/g, ''));
}

export function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

export function isValidPassword(password) {
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /\d/.test(password) &&
           /[!@#$%^&*]/.test(password);
}

export function isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}

// ==================== Debounce & Throttle ====================
export function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const context = this;
        const later = () => {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ==================== Random Generation ====================
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

export function randomChoice(array) {
    return array[randomInt(0, array.length - 1)];
}

export function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== Encryption & Hashing ====================
export function hashString(str) {
    // Simple hash function for non-cryptographic purposes
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

export function base64Encode(str) {
    return btoa(encodeURIComponent(str));
}

export function base64Decode(str) {
    return decodeURIComponent(atob(str));
}

export function encrypt(text, key = 'default-key') {
    // Simple encryption for non-sensitive data
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
    }
    return base64Encode(result);
}

export function decrypt(text, key = 'default-key') {
    // Simple decryption
    const decoded = base64Decode(text);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
    }
    return result;
}

// ==================== Network & Performance ====================
export function getNetworkSpeed() {
    return navigator.connection?.effectiveType || 'unknown';
}

export function isOnline() {
    return navigator.onLine;
}

export function getDeviceInfo() {
    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screen: {
            width: window.screen.width,
            height: window.screen.height,
            availWidth: window.screen.availWidth,
            availHeight: window.screen.availHeight
        },
        window: {
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            outerWidth: window.outerWidth,
            outerHeight: window.outerHeight
        },
        devicePixelRatio: window.devicePixelRatio,
        touch: 'ontouchstart' in window,
        online: navigator.onLine
    };
}

// ==================== UI Helpers ====================
export function showToast(message, type = 'info', duration = 3000) {
    const toast = createElement('div', {
        className: `toast toast-${type}`,
        textContent: message
    });
    
    document.body.appendChild(toast);
    
    // Add show class after a frame
    setTimeout(() => addClass(toast, 'show'), 10);
    
    // Remove after duration
    setTimeout(() => {
        removeClass(toast, 'show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

export function showModal(content, options = {}) {
    const modal = createElement('div', { className: 'modal' });
    const modalContent = createElement('div', { className: 'modal-content' });
    
    if (options.title) {
        modalContent.appendChild(createElement('h2', { textContent: options.title }));
    }
    
    if (typeof content === 'string') {
        modalContent.innerHTML = content;
    } else if (content instanceof Node) {
        modalContent.appendChild(content);
    }
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
    
    // Close on Escape key
    const closeOnEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal(modal);
            document.removeEventListener('keydown', closeOnEscape);
        }
    };
    document.addEventListener('keydown', closeOnEscape);
    
    return modal;
}

export function closeModal(modal) {
    removeClass(modal, 'show');
    setTimeout(() => modal.remove(), 300);
}

export function showLoading(container = document.body) {
    const loader = createElement('div', { className: 'loading-overlay' });
    loader.innerHTML = '<div class="spinner"></div>';
    container.appendChild(loader);
    return loader;
}

export function hideLoading(loader) {
    if (loader && loader.parentNode) {
        loader.parentNode.removeChild(loader);
    }
}

// ==================== Object & Array Helpers ====================
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

export function mergeObjects(target, ...sources) {
    sources.forEach(source => {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key] || typeof target[key] !== 'object') {
                    target[key] = {};
                }
                mergeObjects(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    });
    return target;
}

export function pick(obj, keys) {
    return keys.reduce((acc, key) => {
        if (obj.hasOwnProperty(key)) {
            acc[key] = obj[key];
        }
        return acc;
    }, {});
}

export function omit(obj, keys) {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
}

export function groupBy(array, key) {
    return array.reduce((groups, item) => {
        const groupKey = item[key];
        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(item);
        return groups;
    }, {});
}

export function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

// ==================== Utility Functions ====================
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function retry(fn, retries = 3, delay = 1000) {
    return new Promise((resolve, reject) => {
        const attempt = (n) => {
            fn()
                .then(resolve)
                .catch((error) => {
                    if (n <= retries) {
                        setTimeout(() => attempt(n + 1), delay);
                    } else {
                        reject(error);
                    }
                });
        };
        attempt(1);
    });
}

export function memoize(fn) {
    const cache = new Map();
    return (...args) => {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn(...args);
        cache.set(key, result);
        return result;
    };
}

export function pipe(...fns) {
    return (x) => fns.reduce((v, f) => f(v), x);
}

export function compose(...fns) {
    return (x) => fns.reduceRight((v, f) => f(v), x);
}

// ==================== Environment ====================
export function isDev() {
    return process.env.NODE_ENV === 'development';
}

export function isProd() {
    return process.env.NODE_ENV === 'production';
}

export function isTest() {
    return process.env.NODE_ENV === 'test';
}

export function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content || 
           getCookie('csrf_token');
}

// ==================== Export All ====================
export default {
    // DOM
    $, $$, createElement, toggleClass, hasClass, addClass, removeClass,
    
    // Events
    on, once, off, trigger,
    
    // Forms
    serializeForm, validateForm, showFormErrors,
    
    // Storage
    setLocal, getLocal, removeLocal, setSession, getSession,
    setCookie, getCookie, removeCookie,
    
    // Strings
    truncate, capitalize, titleCase, slugify, escapeHtml,
    
    // Dates
    formatDate, timeAgo, formatDuration,
    
    // Numbers
    formatNumber, formatCurrency, formatBytes, formatPercentage,
    
    // Validation
    isValidEmail, isValidPhone, isValidURL, isValidPassword, isNumeric,
    
    // Performance
    debounce, throttle,
    
    // Random
    randomInt, randomFloat, randomChoice, shuffleArray, generateUUID, generateId,
    
    // Encryption
    hashString, base64Encode, base64Decode, encrypt, decrypt,
    
    // Network
    getNetworkSpeed, isOnline, getDeviceInfo,
    
    // UI
    showToast, showModal, closeModal, showLoading, hideLoading,
    
    // Objects & Arrays
    deepClone, mergeObjects, pick, omit, groupBy, chunkArray,
    
    // Utilities
    sleep, retry, memoize, pipe, compose,
    
    // Environment
    isDev, isProd, isTest, getCSRFToken
};
