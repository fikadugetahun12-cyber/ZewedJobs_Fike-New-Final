// i18n/build.js - Build and validate translation files
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class I18nBuilder {
  constructor() {
    this.sourceDir = path.join(__dirname);
    this.languages = ['en', 'am', 'or', 'ti'];
    this.masterLang = 'en';
  }

  async validateTranslations() {
    console.log('🔍 Validating translation files...');
    
    // Load master language
    const masterPath = path.join(this.sourceDir, `${this.masterLang}.json`);
    const master = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
    
    const errors = [];
    
    // Validate each language
    for (const lang of this.languages) {
      if (lang === this.masterLang) continue;
      
      const langPath = path.join(this.sourceDir, `${lang}.json`);
      
      if (!fs.existsSync(langPath)) {
        errors.push(`❌ Missing translation file: ${lang}.json`);
        continue;
      }
      
      try {
        const translations = JSON.parse(fs.readFileSync(langPath, 'utf8'));
        const missingKeys = this.findMissingKeys(master, translations);
        const extraKeys = this.findExtraKeys(master, translations);
        
        if (missingKeys.length > 0) {
          errors.push(`\n❌ Missing keys in ${lang}:`);
          missingKeys.forEach(key => errors.push(`   - ${key}`));
        }
        
        if (extraKeys.length > 0) {
          console.warn(`⚠️ Extra keys in ${lang}:`, extraKeys);
        }
        
        // Validate placeholders
        const placeholderErrors = this.validatePlaceholders(master, translations, lang);
        if (placeholderErrors.length > 0) {
          errors.push(`\n❌ Placeholder errors in ${lang}:`);
          placeholderErrors.forEach(error => errors.push(`   - ${error}`));
        }
        
      } catch (error) {
        errors.push(`❌ Invalid JSON in ${lang}.json: ${error.message}`);
      }
    }
    
    if (errors.length > 0) {
      console.error('\nValidation failed:');
      errors.forEach(error => console.error(error));
      process.exit(1);
    }
    
    console.log('✅ All translation files are valid!');
  }

  findMissingKeys(master, translations, prefix = '') {
    const missing = [];
    
    for (const [key, value] of Object.entries(master)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (!(key in translations)) {
        missing.push(fullKey);
      } else if (typeof value === 'object' && value !== null) {
        missing.push(...this.findMissingKeys(value, translations[key], fullKey));
      }
    }
    
    return missing;
  }

  findExtraKeys(master, translations, prefix = '') {
    const extra = [];
    
    for (const [key, value] of Object.entries(translations)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (!(key in master)) {
        extra.push(fullKey);
      } else if (typeof value === 'object' && value !== null) {
        extra.push(...this.findExtraKeys(master[key], value, fullKey));
      }
    }
    
    return extra;
  }

  validatePlaceholders(master, translations, lang) {
    const errors = [];
    
    const extractPlaceholders = (text) => {
      return (text.match(/\{(\w+)\}/g) || []).map(p => p.slice(1, -1));
    };
    
    const checkObject = (masterObj, transObj, path = '') => {
      for (const [key, masterValue] of Object.entries(masterObj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof masterValue === 'string') {
          const masterPlaceholders = extractPlaceholders(masterValue);
          const transValue = this.getValueByPath(transObj, key);
          
          if (typeof transValue === 'string') {
            const transPlaceholders = extractPlaceholders(transValue);
            
            // Check for missing placeholders
            for (const placeholder of masterPlaceholders) {
              if (!transPlaceholders.includes(placeholder)) {
                errors.push(`${currentPath}: Missing placeholder {${placeholder}}`);
              }
            }
            
            // Check for extra placeholders
            for (const placeholder of transPlaceholders) {
              if (!masterPlaceholders.includes(placeholder)) {
                errors.push(`${currentPath}: Extra placeholder {${placeholder}}`);
              }
            }
          }
        } else if (typeof masterValue === 'object' && masterValue !== null) {
          checkObject(masterValue, transObj[key] || {}, currentPath);
        }
      }
    };
    
    checkObject(master, translations);
    return errors;
  }

  getValueByPath(obj, path) {
    return path.split('.').reduce((o, p) => o?.[p], obj);
  }

  async generateTranslationReport() {
    console.log('📊 Generating translation report...');
    
    const masterPath = path.join(this.sourceDir, `${this.masterLang}.json`);
    const master = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
    const totalKeys = this.countKeys(master);
    
    const report = {
      languages: {},
      summary: {
        totalKeys,
        languages: this.languages.length,
        completeness: {}
      }
    };
    
    for (const lang of this.languages) {
      const langPath = path.join(this.sourceDir, `${lang}.json`);
      const translations = JSON.parse(fs.readFileSync(langPath, 'utf8'));
      
      const missingKeys = this.findMissingKeys(master, translations);
      const translatedKeys = totalKeys - missingKeys.length;
      const completeness = Math.round((translatedKeys / totalKeys) * 100);
      
      report.languages[lang] = {
        totalKeys,
        translatedKeys,
        missingKeys: missingKeys.length,
        completeness: `${completeness}%`,
        missing: missingKeys.slice(0, 10) // Show first 10 missing keys
      };
      
      report.summary.completeness[lang] = completeness;
    }
    
    // Save report
    const reportPath = path.join(__dirname, 'translation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('✅ Translation report generated:', reportPath);
    
    // Display summary
    console.log('\n📈 Translation Completeness:');
    for (const [lang, stats] of Object.entries(report.languages)) {
      console.log(`  ${lang.toUpperCase()}: ${stats.completeness}`);
    }
  }

  countKeys(obj) {
    let count = 0;
    
    for (const value of Object.values(obj)) {
      if (typeof value === 'object' && value !== null) {
        count += this.countKeys(value);
      } else {
        count++;
      }
    }
    
    return count;
  }

  async build() {
    await this.validateTranslations();
    await this.generateTranslationReport();
    
    // Create optimized production files
    console.log('🚀 Building optimized translation files...');
    
    for (const lang of this.languages) {
      const langPath = path.join(this.sourceDir, `${lang}.json`);
      const translations = JSON.parse(fs.readFileSync(langPath, 'utf8'));
      
      // Create flat version for faster lookups
      const flat = this.flattenObject(translations);
      
      const buildDir = path.join(__dirname, 'dist');
      if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir, { recursive: true });
      }
      
      // Save minified version
      const minifiedPath = path.join(buildDir, `${lang}.min.json`);
      fs.writeFileSync(minifiedPath, JSON.stringify(translations));
      
      // Save flat version
      const flatPath = path.join(buildDir, `${lang}.flat.json`);
      fs.writeFileSync(flatPath, JSON.stringify(flat));
      
      console.log(`  ✅ Built: ${lang}.min.json (${JSON.stringify(translations).length} bytes)`);
    }
    
    console.log('🎉 Build completed successfully!');
  }

  flattenObject(obj, prefix = '') {
    return Object.keys(obj).reduce((acc, k) => {
      const pre = prefix.length ? `${prefix}.` : '';
      
      if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
        Object.assign(acc, this.flattenObject(obj[k], pre + k));
      } else {
        acc[pre + k] = obj[k];
      }
      
      return acc;
    }, {});
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const builder = new I18nBuilder();
  
  const command = process.argv[2];
  switch (command) {
    case 'validate':
      builder.validateTranslations();
      break;
    case 'report':
      builder.generateTranslationReport();
      break;
    case 'build':
    default:
      builder.build();
      break;
  }
}

export default I18nBuilder;
