// i18n.js - Internationalization service
import { getCookie, setCookie, debounce } from './helpers.js';

class I18nService {
    constructor() {
        this.currentLang = 'en';
        this.translations = {};
        this.fallbackLang = 'en';
        this.listeners = new Set();
        this.missingTranslations = new Set();
        this.init();
    }

    async init() {
        // Detect language
        this.currentLang = this.detectLanguage();
        
        // Load translations
        await this.loadTranslations(this.currentLang);
        
        // Apply translations to existing DOM
        this.translateDOM();
        
        // Watch for DOM changes
        this.setupDOMObserver();
        
        // Watch for language changes
        this.setupLanguageSwitcher();
    }

    detectLanguage() {
        // Priority: URL param > cookie > browser > default
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        
        if (urlLang && this.isSupported(urlLang)) {
            return urlLang;
        }
        
        const cookieLang = getCookie('language');
        if (cookieLang && this.isSupported(cookieLang)) {
            return cookieLang;
        }
        
        const browserLang = navigator.language.split('-')[0];
        if (this.isSupported(browserLang)) {
            return browserLang;
        }
        
        return this.fallbackLang;
    }

    async loadTranslations(lang) {
        try {
            // Try to load from multiple sources
            const sources = [
                `/locales/${lang}.json`,
                `/locales/${this.fallbackLang}.json`,
                `https://cdn.yoursite.com/locales/${lang}.min.json`
            ];
            
            let translations = {};
            
            for (const source of sources) {
                try {
                    const response = await fetch(source);
                    if (response.ok) {
                        const data = await response.json();
                        translations = { ...translations, ...data };
                    }
                } catch (error) {
                    console.warn(`Failed to load translations from ${source}:`, error);
                }
            }
            
            this.translations[lang] = translations;
            
            // Cache translations
            this.cacheTranslations(lang, translations);
            
            return translations;
        } catch (error) {
            console.error('Failed to load translations:', error);
            return {};
        }
    }

    async changeLanguage(lang) {
        if (!this.isSupported(lang)) {
            console.warn(`Language ${lang} is not supported`);
            return false;
        }
        
        // Load translations if not already loaded
        if (!this.translations[lang]) {
            await this.loadTranslations(lang);
        }
        
        // Update current language
        this.currentLang = lang;
        
        // Save preference
        setCookie('language', lang, 365);
        localStorage.setItem('preferred_language', lang);
        
        // Update HTML lang attribute
        document.documentElement.lang = lang;
        
        // Update meta tags
        this.updateMetaTags(lang);
        
        // Translate entire page
        this.translateDOM();
        
        // Notify listeners
        this.notifyListeners();
        
        // Update URL without reload
        const url = new URL(window.location);
        url.searchParams.set('lang', lang);
        window.history.replaceState({}, '', url);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
        
        return true;
    }

    translate(key, params = {}, fallback = null) {
        // Get translation
        let translation = this.getTranslation(key);
        
        // If not found, use fallback or key
        if (!translation) {
            // Log missing translation
            this.logMissingTranslation(key);
            
            translation = fallback || key;
            
            // Try to find in fallback language
            if (this.currentLang !== this.fallbackLang) {
                const fallbackTranslation = this.getTranslation(key, this.fallbackLang);
                if (fallbackTranslation) {
                    translation = fallbackTranslation;
                }
            }
        }
        
        // Replace parameters
        if (params && typeof translation === 'string') {
            translation = this.replaceParams(translation, params);
        }
        
        return translation;
    }

    t(key, params = {}) {
        return this.translate(key, params);
    }

    translateDOM(root = document) {
        // Find all elements with data-i18n attribute
        const elements = root.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const params = this.extractParams(element);
            
            const translation = this.translate(key, params);
            
            // Set appropriate property based on element type
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else if (element.tagName === 'IMG') {
                element.alt = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // Translate attributes
        const attrElements = root.querySelectorAll('[data-i18n-attr]');
        attrElements.forEach(element => {
            const attrSpec = element.getAttribute('data-i18n-attr');
            const [key, attr] = attrSpec.split(':');
            const translation = this.translate(key);
            
            if (translation) {
                element.setAttribute(attr, translation);
            }
        });
        
        // Translate titles and tooltips
        const titleElements = root.querySelectorAll('[data-i18n-title]');
        titleElements.forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.translate(key);
        });
    }

    // Pluralization
    pluralize(key, count, params = {}) {
        const pluralKey = this.getPluralKey(key, count);
        return this.translate(pluralKey, { count, ...params });
    }

    getPluralKey(baseKey, count) {
        // Support for different plural forms
        const rules = {
            en: (n) => n === 1 ? 'one' : 'other',
            ar: (n) => n === 0 ? 'zero' : n === 1 ? 'one' : n === 2 ? 'two' : n % 100 >= 3 && n % 100 <= 10 ? 'few' : n % 100 >= 11 ? 'many' : 'other',
            ru: (n) => n % 10 === 1 && n % 100 !== 11 ? 'one' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'few' : 'other'
        };
        
        const rule = rules[this.currentLang] || rules.en;
        const form = rule(count);
        
        return `${baseKey}_${form}`;
    }

    // Date and number formatting
    formatDate(date, options = {}) {
        const dateObj = date instanceof Date ? date : new Date(date);
        
        const defaultOptions = {
            dateStyle: 'medium',
            timeStyle: 'short'
        };
        
        const formatOptions = { ...defaultOptions, ...options };
        
        return new Intl.DateTimeFormat(this.currentLang, formatOptions).format(dateObj);
    }

    formatNumber(number, options = {}) {
        const defaultOptions = {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        };
        
        const formatOptions = { ...defaultOptions, ...options };
        
        return new Intl.NumberFormat(this.currentLang, formatOptions).format(number);
    }

    formatCurrency(amount, currency = 'USD', options = {}) {
        const defaultOptions = {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        };
        
        const formatOptions = { ...defaultOptions, ...options };
        
        return new Intl.NumberFormat(this.currentLang, formatOptions).format(amount);
    }

    // RTL (Right-to-Left) support
    isRTL() {
        const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
        return rtlLanguages.includes(this.currentLang);
    }

    applyRTLStyles() {
        if (this.isRTL()) {
            document.body.classList.add('rtl');
            document.body.dir = 'rtl';
        } else {
            document.body.classList.remove('rtl');
            document.body.dir = 'ltr';
        }
    }

    // Helper methods
    getTranslation(key, lang = this.currentLang) {
        const keys = key.split('.');
        let value = this.translations[lang];
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }
        
        return value;
    }

    replaceParams(text, params) {
        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    extractParams(element) {
        const params = {};
        const attributes = element.attributes;
        
        for (const attr of attributes) {
            if (attr.name.startsWith('data-i18n-param-')) {
                const paramName = attr.name.replace('data-i18n-param-', '');
                params[paramName] = attr.value;
            }
        }
        
        return params;
    }

    isSupported(lang) {
        const supportedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ar', 'ko'];
        return supportedLanguages.includes(lang);
    }

    logMissingTranslation(key) {
        if (!this.missingTranslations.has(key)) {
            this.missingTranslations.add(key);
            
            // Send to server for tracking
            if (navigator.onLine) {
                fetch('/api/i18n/missing', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        key,
                        lang: this.currentLang,
                        url: window.location.href
                    })
                }).catch(() => {});
            }
            
            console.warn(`Missing translation: ${key} for language ${this.currentLang}`);
        }
    }

    cacheTranslations(lang, translations) {
        try {
            const cacheKey = `translations_${lang}`;
            const cacheData = {
                data: translations,
                timestamp: Date.now(),
                version: '1.0'
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            // LocalStorage might be full
            console.warn('Failed to cache translations:', error);
        }
    }

    setupDOMObserver() {
        // Watch for new elements added to DOM
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            this.translateDOM(node);
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    setupLanguageSwitcher() {
        // Handle language switcher clicks
        document.addEventListener('click', (e) => {
            const langButton = e.target.closest('[data-lang]');
            if (langButton) {
                e.preventDefault();
                const lang = langButton.dataset.lang;
                this.changeLanguage(lang);
            }
        });
    }

    updateMetaTags(lang) {
        // Update meta description based on language
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            const translatedDesc = this.translate('meta.description');
            if (translatedDesc) {
                metaDesc.setAttribute('content', translatedDesc);
            }
        }
        
        // Update Open Graph tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
            const translatedTitle = this.translate('og.title');
            if (translatedTitle) {
                ogTitle.setAttribute('content', translatedTitle);
            }
        }
    }

    addListener(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notifyListeners() {
        this.listeners.forEach(listener => listener(this.currentLang));
    }

    // Static method for quick access
    static t(key, params = {}) {
        return i18n.translate(key, params);
    }
}

// Singleton instance
export const i18n = new I18nService();

// Export for individual use
export { I18nService };
