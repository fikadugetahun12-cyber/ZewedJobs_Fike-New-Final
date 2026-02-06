// i18n/language-switcher.js - Language selector component
import { i18n } from '../utils/i18n.js';
import { languages } from './index.js';

class LanguageSwitcher {
  constructor() {
    this.currentLang = i18n.currentLang;
    this.switcher = null;
    this.init();
  }

  init() {
    this.createSwitcher();
    this.setupEventListeners();
    this.setupKeyboardNavigation();
  }

  createSwitcher() {
    this.switcher = document.createElement('div');
    this.switcher.className = 'language-switcher';
    this.switcher.innerHTML = `
      <button class="current-language" aria-label="Change language">
        <span class="flag">${languages[this.currentLang]?.flag || '🌐'}</span>
        <span class="code">${this.currentLang.toUpperCase()}</span>
        <span class="arrow">▼</span>
      </button>
      <div class="language-dropdown">
        ${Object.values(languages).map(lang => `
          <button 
            class="language-option ${lang.code === this.currentLang ? 'active' : ''}" 
            data-lang="${lang.code}"
            aria-label="Switch to ${lang.name}"
          >
            <span class="flag">${lang.flag}</span>
            <span class="name">${lang.nativeName}</span>
            <span class="english-name">(${lang.name})</span>
          </button>
        `).join('')}
      </div>
    `;

    // Add to DOM if not already present
    if (!document.querySelector('.language-switcher')) {
      const container = document.querySelector('[data-language-switcher]') || 
                       document.querySelector('header') || 
                       document.body;
      container.appendChild(this.switcher);
    }
  }

  setupEventListeners() {
    // Toggle dropdown
    this.switcher.querySelector('.current-language').addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Language selection
    this.switcher.querySelectorAll('.language-option').forEach(option => {
      option.addEventListener('click', (e) => {
        const lang = e.currentTarget.dataset.lang;
        this.changeLanguage(lang);
        this.closeDropdown();
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      this.closeDropdown();
    });
  }

  setupKeyboardNavigation() {
    this.switcher.addEventListener('keydown', (e) => {
      const options = Array.from(this.switcher.querySelectorAll('.language-option'));
      const currentIndex = options.findIndex(opt => opt.classList.contains('active'));
      
      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % options.length;
          this.highlightOption(options[nextIndex]);
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          const prevIndex = (currentIndex - 1 + options.length) % options.length;
          this.highlightOption(options[prevIndex]);
          break;
          
        case 'Enter':
          e.preventDefault();
          if (this.switcher.querySelector('.language-dropdown').classList.contains('show')) {
            const activeOption = this.switcher.querySelector('.language-option.highlighted, .language-option.active');
            if (activeOption) {
              this.changeLanguage(activeOption.dataset.lang);
              this.closeDropdown();
            }
          } else {
            this.toggleDropdown();
          }
          break;
          
        case 'Escape':
          this.closeDropdown();
          break;
      }
    });
  }

  highlightOption(option) {
    this.switcher.querySelectorAll('.language-option').forEach(opt => {
      opt.classList.remove('highlighted');
    });
    option.classList.add('highlighted');
    option.focus();
  }

  toggleDropdown() {
    const dropdown = this.switcher.querySelector('.language-dropdown');
    dropdown.classList.toggle('show');
    
    if (dropdown.classList.contains('show')) {
      // Focus first option
      const firstOption = dropdown.querySelector('.language-option');
      if (firstOption) {
        this.highlightOption(firstOption);
      }
    }
  }

  closeDropdown() {
    this.switcher.querySelector('.language-dropdown').classList.remove('show');
  }

  async changeLanguage(lang) {
    if (lang === this.currentLang) return;
    
    try {
      // Show loading indicator
      this.switcher.classList.add('changing');
      
      // Change language
      const success = await i18n.changeLanguage(lang);
      
      if (success) {
        this.currentLang = lang;
        this.updateSwitcher();
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('languageChanged', { 
          detail: { 
            language: lang,
            direction: i18n.isRTL() ? 'rtl' : 'ltr'
          }
        }));
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      this.switcher.classList.remove('changing');
    }
  }

  updateSwitcher() {
    const currentLangButton = this.switcher.querySelector('.current-language');
    const flagSpan = currentLangButton.querySelector('.flag');
    const codeSpan = currentLangButton.querySelector('.code');
    
    flagSpan.textContent = languages[this.currentLang]?.flag || '🌐';
    codeSpan.textContent = this.currentLang.toUpperCase();
    
    // Update active option
    this.switcher.querySelectorAll('.language-option').forEach(option => {
      option.classList.toggle('active', option.dataset.lang === this.currentLang);
    });
  }

  // Static method for easy use
  static init(selector = '[data-language-switcher]') {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      new LanguageSwitcher(element);
    });
  }
}

// CSS for language switcher
export const languageSwitcherStyles = `
  .language-switcher {
    position: relative;
    display: inline-block;
  }
  
  .current-language {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .current-language:hover {
    background: #e9ecef;
    border-color: #adb5bd;
  }
  
  .current-language:focus {
    outline: 2px solid #007bff;
    outline-offset: 2px;
  }
  
  .flag {
    font-size: 1.2em;
  }
  
  .code {
    font-weight: 600;
    font-size: 14px;
  }
  
  .arrow {
    font-size: 10px;
    transition: transform 0.2s ease;
  }
  
  .language-switcher.show .arrow {
    transform: rotate(180deg);
  }
  
  .language-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.2s ease;
    z-index: 1000;
    min-width: 200px;
  }
  
  .language-dropdown.show {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
  
  .language-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  
  .language-option:hover,
  .language-option.highlighted {
    background: #f8f9fa;
  }
  
  .language-option.active {
    background: #007bff;
    color: white;
  }
  
  .language-option .name {
    flex: 1;
    font-weight: 500;
  }
  
  .language-option .english-name {
    font-size: 12px;
    opacity: 0.7;
  }
  
  /* RTL support */
  [dir="rtl"] .language-dropdown {
    left: auto;
    right: 0;
  }
  
  /* Mobile styles */
  @media (max-width: 768px) {
    .language-switcher {
      width: 100%;
    }
    
    .current-language {
      width: 100%;
      justify-content: center;
    }
    
    .language-dropdown {
      width: 100%;
      min-width: unset;
    }
  }
  
  /* Changing state */
  .language-switcher.changing .current-language {
    opacity: 0.7;
    cursor: wait;
  }
  
  .language-switcher.changing .current-language::after {
    content: '';
    width: 16px;
    height: 16px;
    border: 2px solid #007bff;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default LanguageSwitcher;
