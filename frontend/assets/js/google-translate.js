// google-translate.js
export default {
    init() {
        this.loadGoogleTranslate();
        this.setupLanguageSelector();
        this.saveLanguagePreference();
    },
    
    loadGoogleTranslate() {
        // Load Google Translate script
        if (!document.getElementById('google-translate-script')) {
            const script = document.createElement('script');
            script.id = 'google-translate-script';
            script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateInit';
            document.head.appendChild(script);
        }
        
        window.googleTranslateInit = () => {
            new google.translate.TranslateElement({
                pageLanguage: 'en',
                includedLanguages: 'en,es,fr,de,it,pt,ru,zh-CN,ja,ar',
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
            }, 'google-translate-element');
        };
    },
    
    setupLanguageSelector() {
        // Custom language selector
        document.querySelectorAll('.language-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const lang = e.target.dataset.lang;
                this.changeLanguage(lang);
            });
        });
    },
    
    changeLanguage(lang) {
        const frame = document.querySelector('.goog-te-menu-frame');
        if (frame) {
            const select = frame.contentDocument.querySelector('.goog-te-menu2 select');
            if (select) {
                select.value = lang;
                select.dispatchEvent(new Event('change'));
            }
        }
    },
    
    saveLanguagePreference() {
        // Save to localStorage
        const savedLang = localStorage.getItem('preferred-language');
        if (savedLang) {
            this.changeLanguage(savedLang);
        }
        
        // Listen for language changes
        const observer = new MutationObserver(() => {
            const currentLang = this.getCurrentLanguage();
            if (currentLang) {
                localStorage.setItem('preferred-language', currentLang);
            }
        });
        
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });
    },
    
    getCurrentLanguage() {
        const classes = document.body.className.split(' ');
        const langClass = classes.find(c => c.startsWith('translated-'));
        return langClass ? langClass.replace('translated-', '') : null;
    }
};
