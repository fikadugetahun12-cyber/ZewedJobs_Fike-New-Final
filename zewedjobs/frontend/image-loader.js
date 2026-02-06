// image-loader.js - Advanced image handling with lazy loading
class ImageLoader {
  constructor() {
    this.observer = null;
    this.imageCache = new Map();
    this.fallbackCache = new Set();
    this.init();
  }

  init() {
    this.setupIntersectionObserver();
    this.setupErrorHandling();
    this.preloadCriticalImages();
  }

  setupIntersectionObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          this.loadImage(img);
          this.observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px',
      threshold: 0.1
    });
  }

  loadImage(img) {
    const src = img.dataset.src || img.src;
    const srcset = img.dataset.srcset;
    
    if (!src) return;
    
    // Check cache first
    if (this.imageCache.has(src)) {
      this.setImageFromCache(img, src);
      return;
    }
    
    // Load new image
    const image = new Image();
    
    image.onload = () => {
      this.handleImageLoad(img, image, src);
    };
    
    image.onerror = () => {
      this.handleImageError(img, src);
    };
    
    // Use WebP if supported, fallback to original
    const webpSrc = this.getWebPSource(src);
    image.src = this.supportsWebP() ? webpSrc : src;
    
    if (srcset) {
      image.srcset = srcset;
    }
  }

  supportsWebP() {
    return document.createElement('canvas')
      .toDataURL('image/webp')
      .indexOf('data:image/webp') === 0;
  }

  getWebPSource(originalSrc) {
    // Convert to WebP format
    if (originalSrc.includes('.jpg') || originalSrc.includes('.jpeg')) {
      return originalSrc.replace(/\.jpe?g$/, '.webp');
    }
    if (originalSrc.includes('.png')) {
      return originalSrc.replace(/\.png$/, '.webp');
    }
    return originalSrc;
  }

  handleImageLoad(img, image, src) {
    // Add to cache
    this.imageCache.set(src, {
      element: image,
      timestamp: Date.now()
    });
    
    // Apply loaded image
    img.src = image.src;
    if (image.srcset) {
      img.srcset = image.srcset;
    }
    
    img.classList.add('loaded');
    img.classList.remove('loading');
    
    // Dispatch load event
    img.dispatchEvent(new CustomEvent('image:loaded', {
      detail: { src }
    }));
  }

  handleImageError(img, src) {
    console.warn(`Failed to load image: ${src}`);
    
    // Mark as failed
    this.fallbackCache.add(src);
    
    // Try fallback
    const fallbackSrc = this.getFallbackSource(src);
    if (fallbackSrc && fallbackSrc !== src) {
      img.src = fallbackSrc;
      this.loadImage(img); // Retry with fallback
    } else {
      img.classList.add('error');
      img.classList.remove('loading');
      
      // Show placeholder
      this.showPlaceholder(img);
    }
    
    // Dispatch error event
    img.dispatchEvent(new CustomEvent('image:error', {
      detail: { src }
    }));
  }

  getFallbackSource(src) {
    // Fallback strategies
    if (src.includes('.webp')) {
      return src.replace('.webp', '.jpg');
    }
    
    // Check for size variants
    const sizeMatch = src.match(/-(\d+)x(\d+)\./);
    if (sizeMatch) {
      const smaller = Math.min(parseInt(sizeMatch[1]), parseInt(sizeMatch[2]));
      if (smaller > 300) {
        return src.replace(`-${sizeMatch[1]}x${sizeMatch[2]}`, '-300x300');
      }
    }
    
    return src;
  }

  showPlaceholder(img) {
    // Create SVG placeholder
    const width = img.dataset.width || '300';
    const height = img.dataset.height || '200';
    const color = img.dataset.placeholderColor || 'e0e0e0';
    
    const placeholderSVG = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <rect width="100%" height="100%" fill="#${color}"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#888" font-family="sans-serif">
          Image not available
        </text>
      </svg>
    `;
    
    const svgBlob = new Blob([placeholderSVG], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    
    img.src = url;
  }

  setImageFromCache(img, src) {
    const cached = this.imageCache.get(src);
    if (cached && cached.element.complete) {
      img.src = cached.element.src;
      if (cached.element.srcset) {
        img.srcset = cached.element.srcset;
      }
      img.classList.add('loaded');
      img.classList.remove('loading');
    }
  }

  preloadCriticalImages() {
    // Preload above-the-fold images
    const criticalImages = [
      '/images/logos/logo-main.svg',
      '/images/banners/homepage-main.jpg'
    ];
    
    criticalImages.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }

  setupErrorHandling() {
    // Global error handler for images
    document.addEventListener('error', (e) => {
      if (e.target.tagName === 'IMG') {
        this.handleImageError(e.target, e.target.src);
      }
    }, true);
  }

  lazyLoad(selector = 'img[data-src]') {
    const images = document.querySelectorAll(selector);
    images.forEach(img => {
      if (img.dataset.src) {
        // Add loading class
        img.classList.add('loading');
        
        // Observe for lazy loading
        this.observer.observe(img);
      }
    });
  }

  loadBackgroundImages() {
    // Handle CSS background images
    const elements = document.querySelectorAll('[data-bg-src]');
    elements.forEach(el => {
      const src = el.dataset.bgSrc;
      const img = new Image();
      
      img.onload = () => {
        el.style.backgroundImage = `url('${img.src}')`;
        el.classList.add('bg-loaded');
      };
      
      img.onerror = () => {
        const fallbackSrc = this.getFallbackSource(src);
        if (fallbackSrc) {
          img.src = fallbackSrc;
        }
      };
      
      img.src = this.supportsWebP() ? this.getWebPSource(src) : src;
    });
  }

  // Image optimization utilities
  generateResponsiveSrcset(src, sizes = [300, 600, 900, 1200]) {
    const baseName = src.replace(/\.[^/.]+$/, '');
    const extension = src.split('.').pop();
    
    return sizes.map(size => 
      `${baseName}-${size}w.${extension} ${size}w`
    ).join(', ');
  }

  generateSizes(breakpoints = {
    '768px': '50vw',
    '1024px': '33vw',
    'default': '100vw'
  }) {
    return Object.entries(breakpoints)
      .map(([breakpoint, size]) => 
        breakpoint === 'default' ? size : `(max-width: ${breakpoint}) ${size}`
      )
      .join(', ');
  }

  clearCache(olderThan = 24 * 60 * 60 * 1000) { // 24 hours
    const now = Date.now();
    for (const [src, data] of this.imageCache.entries()) {
      if (now - data.timestamp > olderThan) {
        this.imageCache.delete(src);
      }
    }
  }
}

// Singleton instance
export const imageLoader = new ImageLoader();

// CSS for image states
export const imageStyles = `
  img.loading {
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  img.loaded {
    opacity: 1;
  }
  
  img.error {
    opacity: 0.5;
    filter: grayscale(100%);
  }
  
  .bg-loaded {
    background-size: cover;
    background-position: center;
    transition: background-image 0.3s ease;
  }
  
  /* Blur-up technique */
  .blur-up {
    filter: blur(10px);
    transition: filter 0.3s ease;
  }
  
  .blur-up.lazyloaded {
    filter: blur(0);
  }
`;
