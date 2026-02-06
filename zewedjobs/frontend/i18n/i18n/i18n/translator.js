// i18n/translator.js - Translation service with fallback
import { api } from '../utils/api.js';

class TranslationService {
  constructor() {
    this.cache = new Map();
    this.apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    this.endpoint = 'https://translation.googleapis.com/language/translate/v2';
  }

  async translate(text, targetLang, sourceLang = 'en') {
    if (sourceLang === targetLang) return text;
    
    const cacheKey = `${sourceLang}-${targetLang}-${text}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      // First try our own translation memory
      const localTranslation = await this.getLocalTranslation(text, targetLang);
      if (localTranslation) {
        this.cache.set(cacheKey, localTranslation);
        return localTranslation;
      }
      
      // Fallback to Google Translate API
      if (this.apiKey) {
        const translated = await this.translateWithGoogle(text, targetLang, sourceLang);
        if (translated) {
          this.cache.set(cacheKey, translated);
          this.saveToTranslationMemory(text, translated, sourceLang, targetLang);
          return translated;
        }
      }
      
      // Return original text if no translation available
      return text;
    } catch (error) {
      console.warn('Translation failed:', error);
      return text;
    }
  }

  async getLocalTranslation(text, targetLang) {
    try {
      // Check if text exists in our translation files
      const response = await fetch(`/api/translations/find?text=${encodeURIComponent(text)}&lang=${targetLang}`);
      if (response.ok) {
        const data = await response.json();
        return data.translation;
      }
    } catch (error) {
      // Silently fail, use fallback
    }
    return null;
  }

  async translateWithGoogle(text, targetLang, sourceLang) {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        q: text,
        target: targetLang,
        source: sourceLang,
        format: 'text'
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.data.translations[0].translatedText;
    }
    
    throw new Error('Google Translate API error');
  }

  async saveToTranslationMemory(original, translated, sourceLang, targetLang) {
    // Save to our database for future use
    try {
      await api.post('/api/translations/save', {
        original,
        translated,
        sourceLang,
        targetLang
      });
    } catch (error) {
      // Log but don't fail
      console.log('Failed to save translation:', error);
    }
  }

  async batchTranslate(texts, targetLang, sourceLang = 'en') {
    const results = {};
    
    for (const [key, text] of Object.entries(texts)) {
      results[key] = await this.translate(text, targetLang, sourceLang);
    }
    
    return results;
  }

  detectLanguage(text) {
    // Simple language detection
    const patterns = {
      am: /[\u1200-\u137F]/g,  // Amharic
      ti: /[\u1200-\u137F]/g,  // Tigrinya (same Unicode range as Amharic)
      ar: /[\u0600-\u06FF]/g,  // Arabic
      en: /[a-zA-Z]/g,
    };
    
    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }
    
    return 'en';
  }

  clearCache() {
    this.cache.clear();
  }
}

// Singleton instance
export const translator = new TranslationService();
