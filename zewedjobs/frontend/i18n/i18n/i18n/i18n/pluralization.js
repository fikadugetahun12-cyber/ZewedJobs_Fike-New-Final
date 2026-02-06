// i18n/pluralization.js - Pluralization rules for each language
const pluralRules = {
  en: (n) => {
    // English: 1 item, 2 items
    return n === 1 ? 'one' : 'other';
  },
  
  am: (n) => {
    // Amharic: 1 ነገር, 2 ነገሮች
    return n === 1 ? 'one' : 'other';
  },
  
  or: (n) => {
    // Oromo: 1 tokko, 2-10 lama, 11+?
    if (n === 1) return 'one';
    if (n >= 2 && n <= 10) return 'few';
    return 'other';
  },
  
  ti: (n) => {
    // Tigrinya: 1 ንጥል, 2 ንጥላት
    return n === 1 ? 'one' : 'other';
  },
  
  ar: (n) => {
    // Arabic (if added later): complex plural forms
    if (n === 0) return 'zero';
    if (n === 1) return 'one';
    if (n === 2) return 'two';
    if (n % 100 >= 3 && n % 100 <= 10) return 'few';
    if (n % 100 >= 11) return 'many';
    return 'other';
  }
};

class Pluralization {
  constructor() {
    this.rules = pluralRules;
  }

  getRule(lang) {
    return this.rules[lang] || this.rules.en;
  }

  getForm(count, lang) {
    const rule = this.getRule(lang);
    return rule(Math.abs(count));
  }

  format(key, count, params = {}, lang) {
    const form = this.getForm(count, lang);
    const formattedKey = `${key}_${form}`;
    
    // Get translation
    let translation = i18n.translate(formattedKey, { count, ...params });
    
    // Fallback to 'other' form if specific form not found
    if (translation === formattedKey && form !== 'other') {
      translation = i18n.translate(`${key}_other`, { count, ...params });
    }
    
    return translation;
  }

  // Common plural phrases
  formatItems(count, lang) {
    const forms = {
      en: { one: 'item', other: 'items' },
      am: { one: 'ነገር', other: 'ነገሮች' },
      or: { one: 'tokko', few: 'laman', other: 'laman' },
      ti: { one: 'ንጥል', other: 'ንጥላት' }
    };
    
    const langForms = forms[lang] || forms.en;
    const form = this.getForm(count, lang);
    const word = langForms[form] || langForms.other;
    
    return `${count} ${word}`;
  }

  formatTime(seconds, lang) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return this.format('seconds', remainingSeconds, { count: remainingSeconds }, lang);
    }
    
    if (remainingSeconds === 0) {
      return this.format('minutes', minutes, { count: minutes }, lang);
    }
    
    const minutesText = this.format('minutes', minutes, { count: minutes }, lang);
    const secondsText = this.format('seconds', remainingSeconds, { count: remainingSeconds }, lang);
    
    return `${minutesText} ${secondsText}`;
  }
}

export const pluralization = new Pluralization();
