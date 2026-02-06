// font-loader.js - Font loading with fallbacks
class FontLoader {
  constructor() {
    this.loadedFonts = new Set();
    this.fontObservers = new Map();
    this.fontDisplay = 'swap'; // swap, block, fallback, optional
    this.init();
  }

  init() {
    this.setupFontDetection();
    this.preloadCriticalFonts();
    this.setupFontLoadingObserver();
  }

  async loadFont(fontFamily, fontConfig) {
    // Check if already loaded
    if (this.loadedFonts.has(fontFamily)) {
      return Promise.resolve();
    }

    // Create font face
    const fontFace = new FontFace(
      fontFamily,
      `url('${fontConfig.url}') format('${fontConfig.format || 'woff2'}')`,
      {
        style: fontConfig.style || 'normal',
        weight: fontConfig.weight || '400',
        display: this.fontDisplay
      }
    );

    try {
      // Load font
      const loadedFont = await fontFace.load();
      document.fonts.add(loadedFont);
      
      // Mark as loaded
      this.loadedFonts.add(fontFamily);
      
      // Dispatch event
      document.dispatchEvent(new CustomEvent('font:loaded', {
        detail: { fontFamily }
      }));
      
      console.log(`Font loaded: ${fontFamily}`);
      return loadedFont;
    } catch (error) {
      console.error(`Failed to load font ${fontFamily}:`, error);
      
      // Try fallback
      if (fontConfig.fallbackUrl) {
        return this.loadFallbackFont(fontFamily, fontConfig);
      }
      
      throw error;
    }
  }

  async loadFallbackFont(fontFamily, fontConfig) {
    console.log(`Trying fallback for ${fontFamily}`);
    
    const fontFace = new FontFace(
      fontFamily,
      `url('${fontConfig.fallbackUrl}') format('${fontConfig.fallbackFormat || 'woff'}')`,
      {
        style: fontConfig.style || 'normal',
        weight: fontConfig.weight || '400',
        display: this.fontDisplay
      }
    );

    try {
      const loadedFont = await fontFace.load();
      document.fonts.add(loadedFont);
      this.loadedFonts.add(fontFamily);
      return loadedFont;
    } catch (error) {
      console.error(`Fallback also failed for ${fontFamily}:`, error);
      throw error;
    }
  }

  loadFonts(fonts) {
    const promises = fonts.map(font => 
      this.loadFont(font.family, font.config).catch(() => {
        // Font failed to load, use system fallback
        this.setFallbackFont(font.family, font.config.fallback || 'sans-serif');
      })
    );
    
    return Promise.allSettled(promises);
  }

  setFallbackFont(fontFamily, fallback) {
    // Update CSS to use fallback
    const style = document.createElement('style');
    style.textContent = `
      .font-${fontFamily.replace(/\s+/g, '-').toLowerCase()} {
        font-family: ${fallback}, sans-serif !important;
      }
    `;
    document.head.appendChild(style);
  }

  setupFontDetection() {
    // Check if font is available
    this.checkFont = (fontFamily) => {
      return document.fonts.check(`12px "${fontFamily}"`);
    };
  }

  preloadCriticalFonts() {
    const criticalFonts = [
      {
        family: 'Inter',
        config: {
          url: '/fonts/Inter-Regular.woff2',
          format: 'woff2',
          weight: '400',
          fallback: '-apple-system, BlinkMacSystemFont, sans-serif'
        }
      },
      {
        family: 'Inter',
        config: {
          url: '/fonts/Inter-Bold.woff2',
          format: 'woff2',
          weight: '700',
          fallback: '-apple-system, BlinkMacSystemFont, sans-serif'
        }
      }
    ];

    // Create preload links
    criticalFonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.href = font.config.url;
      link.type = `font/${font.config.format || 'woff2'}`;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Load critical fonts
    this.loadFonts(criticalFonts);
  }

  setupFontLoadingObserver() {
    // Observe elements with custom fonts
    this.fontObservers.set('font-display', new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            this.applyFontsToElement(node);
          }
        });
      });
    }));

    // Start observing
    this.fontObservers.get('font-display').observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  applyFontsToElement(element) {
    const fontFamily = element.dataset.fontFamily;
    if (fontFamily && !this.checkFont(fontFamily)) {
      // Font not loaded yet, add loading class
      element.classList.add('font-loading');
      
      // Load font if not already loading
      if (!this.loadedFonts.has(fontFamily)) {
        this.loadFont(fontFamily, {
          url: `/fonts/${fontFamily.replace(/\s+/g, '-')}.woff2`
        }).then(() => {
          element.classList.remove('font-loading');
          element.classList.add('font-loaded');
        }).catch(() => {
          element.classList.remove('font-loading');
          element.classList.add('font-fallback');
        });
      }
    }
  }

  // Font optimization
  subsetFont(fontFamily, characters) {
    // Create font subset for specific characters
    // This would typically be done server-side
    const subsetUrl = `/fonts/${fontFamily}/subset.woff2?chars=${encodeURIComponent(characters)}`;
    return subsetUrl;
  }

  // Variable fonts
  loadVariableFont(fontFamily, config) {
    const variableConfig = {
      ...config,
      url: config.variableUrl || config.url,
      format: config.variableFormat || 'woff2-variations'
    };
    
    return this.loadFont(`${fontFamily} Variable`, variableConfig);
  }

  // Font loading strategies
  setFontLoadingStrategy(strategy = 'swap') {
    this.fontDisplay = strategy;
    
    // Update existing @font-face rules
    document.querySelectorAll('style[data-font-display]').forEach(style => {
      style.textContent = style.textContent.replace(
        /font-display:\s*\w+/g,
        `font-display: ${strategy}`
      );
    });
  }

  // Font analytics
  trackFontPerformance() {
    const fontLoadTimes = {};
    
    document.fonts.forEach(font => {
      if (font.family && font.status === 'loaded') {
        fontLoadTimes[font.family] = performance.now();
      }
    });
    
    // Send to analytics
    if (Object.keys(fontLoadTimes).length > 0) {
      this.sendFontAnalytics(fontLoadTimes);
    }
  }

  sendFontAnalytics(times) {
    const data = {
      event: 'font_performance',
      times,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    };
    
    // Use your analytics endpoint
    fetch('/api/font-analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => {});
  }

  // Utility methods
  createFontCSS(fonts) {
    const styles = fonts.map(font => {
      const { family, config } = font;
      const fontFaceRules = [];
      
      // Regular weight
      fontFaceRules.push(`
        @font-face {
          font-family: '${family}';
          src: url('${config.url}') format('${config.format || 'woff2'}');
          font-weight: ${config.weight || '400'};
          font-style: ${config.style || 'normal'};
          font-display: ${this.fontDisplay};
        }
      `);
      
      // Bold weight if different
      if (config.boldUrl) {
        fontFaceRules.push(`
          @font-face {
            font-family: '${family}';
            src: url('${config.boldUrl}') format('${config.boldFormat || 'woff2'}');
            font-weight: 700;
            font-style: ${config.style || 'normal'};
            font-display: ${this.fontDisplay};
          }
        `);
      }
      
      // Italic weight if available
      if (config.italicUrl) {
        fontFaceRules.push(`
          @font-face {
            font-family: '${family}';
            src: url('${config.italicUrl}') format('${config.italicFormat || 'woff2'}');
            font-weight: ${config.weight || '400'};
            font-style: italic;
            font-display: ${this.fontDisplay};
          }
        `);
      }
      
      return fontFaceRules.join('\n');
    }).join('\n');
    
    return styles;
  }

  injectFontCSS(fonts) {
    const style = document.createElement('style');
    style.id = 'custom-fonts';
    style.textContent = this.createFontCSS(fonts);
    document.head.appendChild(style);
  }

  // Font pairing suggestions
  getFontPairings(baseFont) {
    const pairings = {
      'Inter': ['Roboto', 'Open Sans', 'Montserrat'],
      'Roboto': ['Lora', 'Merriweather', 'Playfair Display'],
      'Open Sans': ['Poppins', 'Raleway', 'Source Sans Pro'],
      'Montserrat': ['Lato', 'Oswald', 'PT Sans']
    };
    
    return pairings[baseFont] || ['sans-serif', 'serif'];
  }

  // Generate font stack
  generateFontStack(fonts, fallback = 'sans-serif') {
    return fonts.map(font => `"${font}"`).join(', ') + `, ${fallback}`;
  }
}

export const fontLoader = new FontLoader();

// CSS for font loading states
export const fontStyles = `
  .font-loading {
    visibility: hidden;
    opacity: 0;
  }
  
  .font-loaded {
    visibility: visible;
    opacity: 1;
    transition: opacity 0.3s ease;
  }
  
  .font-fallback {
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  
  /* Font loading animation */
  @keyframes font-loading-pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
  
  .font-loading::before {
    content: 'Loading...';
    animation: font-loading-pulse 1.5s infinite;
    display: inline-block;
  }
  
  /* System font stack classes */
  .system-sans {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .system-serif {
    font-family: Georgia, 'Times New Roman', Times, serif;
  }
  
  .system-mono {
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  }
`;
