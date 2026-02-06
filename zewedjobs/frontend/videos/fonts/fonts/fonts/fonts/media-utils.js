// media-utils.js - Combined media management
import { imageLoader } from './image-loader.js';
import { responsiveImages } from './responsive-images.js';
import { videoManager } from './video-manager.js';
import { fontLoader } from './font-loader.js';

class MediaManager {
  constructor() {
    this.mediaCache = new Map();
    this.pendingRequests = new Map();
    this.init();
  }

  init() {
    this.setupMediaQueryListeners();
    this.setupPerformanceTracking();
    this.setupOfflineDetection();
  }

  // Image handling
  async loadImage(src, options = {}) {
    const cacheKey = `image:${src}`;
    
    // Check cache
    if (this.mediaCache.has(cacheKey)) {
      return this.mediaCache.get(cacheKey);
    }
    
    // Check if already loading
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }
    
    // Create promise for image loading
    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.mediaCache.set(cacheKey, img);
        this.pendingRequests.delete(cacheKey);
        resolve(img);
      };
      
      img.onerror = () => {
        this.pendingRequests.delete(cacheKey);
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
      
      // Apply options
      if (options.crossOrigin) {
        img.crossOrigin = options.crossOrigin;
      }
      
      if (options.decode) {
        img.decode().then(resolve).catch(reject);
      }
    });
    
    this.pendingRequests.set(cacheKey, promise);
    return promise;
  }

  async loadImages(sources, parallel = true) {
    if (parallel) {
      return Promise.allSettled(
        sources.map(src => this.loadImage(src))
      );
    } else {
      const results = [];
      for (const src of sources) {
        try {
          const img = await this.loadImage(src);
          results.push({ status: 'fulfilled', value: img });
        } catch (error) {
          results.push({ status: 'rejected', reason: error });
        }
      }
      return results;
    }
  }

  // Video handling
  async loadVideo(src, options = {}) {
    return videoManager.loadVideo(src, options);
  }

  // Font handling
  async loadFont(fontFamily, config) {
    return fontLoader.loadFont(fontFamily, config);
  }

  // Responsive utilities
  getOptimalImageSize(containerWidth, densities = [1, 2, 3]) {
    const pixelRatio = window.devicePixelRatio || 1;
    const baseWidth = containerWidth * pixelRatio;
    
    // Find closest density
    return densities.reduce((prev, curr) => {
      return Math.abs(curr - pixelRatio) < Math.abs(prev - pixelRatio) ? curr : prev;
    });
  }

  getImageFormatSupport() {
    const formats = {
      webp: false,
      avif: false,
      jpegxl: false
    };
    
    // Test WebP
    const canvas = document.createElement('canvas');
    if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
      formats.webp = true;
    }
    
    // Test AVIF (async)
    const avifTest = new Image();
    avifTest.onload = avifTest.onerror = () => {
      formats.avif = avifTest.height === 2;
    };
    avifTest.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    
    return formats;
  }

  // Performance tracking
  setupPerformanceTracking() {
    // Track LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      // Check if LCP is an image
      if (lastEntry.element?.tagName === 'IMG') {
        this.trackImagePerformance(lastEntry.element.src, lastEntry.startTime);
      }
    });
    
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    
    // Track CLS (Cumulative Layout Shift)
    const clsObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        if (entry.sources?.some(source => source.node?.tagName === 'IMG')) {
          this.trackLayoutShift('image', entry.value);
        }
      });
    });
    
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  }

  trackImagePerformance(src, loadTime) {
    const data = {
      type: 'image_performance',
      src,
      loadTime,
      timestamp: Date.now(),
      connection: navigator.connection?.effectiveType,
      deviceMemory: navigator.deviceMemory
    };
    
    this.sendPerformanceData(data);
  }

  sendPerformanceData(data) {
    // Send to analytics
    if (typeof navigator.sendBeacon !== 'undefined') {
      navigator.sendBeacon('/api/performance', JSON.stringify(data));
    } else {
      fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true
      }).catch(() => {});
    }
  }

  // Offline handling
  setupOfflineDetection() {
    window.addEventListener('online', () => {
      this.retryFailedLoads();
    });
    
    window.addEventListener('offline', () => {
      this.showOfflineWarning();
    });
  }

  retryFailedLoads() {
    // Retry failed image loads
    document.querySelectorAll('img[data-retry-src]').forEach(img => {
      const src = img.dataset.retrySrc;
      img.src = src;
      delete img.dataset.retrySrc;
    });
  }

  showOfflineWarning() {
    // Show offline warning for media
    const warning = document.createElement('div');
    warning.className = 'media-offline-warning';
    warning.textContent = 'You are offline. Some media may not load.';
    document.body.appendChild(warning);
    
    setTimeout(() => warning.remove(), 5000);
  }

  // Media query utilities
  setupMediaQueryListeners() {
    const queries = {
      '(prefers-reduced-motion: reduce)': this.handleReducedMotion.bind(this),
      '(prefers-color-scheme: dark)': this.handleDarkMode.bind(this),
      '(prefers-contrast: high)': this.handleHighContrast.bind(this)
    };
    
    Object.entries(queries).forEach(([query, handler]) => {
      const mediaQuery = window.matchMedia(query);
      handler(mediaQuery);
      mediaQuery.addEventListener('change', handler);
    });
  }

  handleReducedMotion(mediaQuery) {
    if (mediaQuery.matches) {
      document.documentElement.classList.add('reduced-motion');
      
      // Pause autoplaying videos
      document.querySelectorAll('video[autoplay]').forEach(video => {
        video.pause();
      });
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  }

  handleDarkMode(mediaQuery) {
    if (mediaQuery.matches) {
      document.documentElement.classList.add('dark-mode');
      
      // Switch to dark mode images if available
      document.querySelectorAll('img[data-dark-src]').forEach(img => {
        const darkSrc = img.dataset.darkSrc;
        img.src = darkSrc;
      });
    } else {
      document.documentElement.classList.remove('dark-mode');
      
      // Switch back to light images
      document.querySelectorAll('img[data-light-src]').forEach(img => {
        const lightSrc = img.dataset.lightSrc || img.dataset.originalSrc;
        if (lightSrc) {
          img.src = lightSrc;
        }
      });
    }
  }

  handleHighContrast(mediaQuery) {
    if (mediaQuery.matches) {
      document.documentElement.classList.add('high-contrast');
      
      // Increase image contrast
      document.querySelectorAll('img').forEach(img => {
        img.style.filter = 'contrast(1.2)';
      });
    } else {
      document.documentElement.classList.remove('high-contrast');
      
      // Reset image contrast
      document.querySelectorAll('img').forEach(img => {
        img.style.filter = '';
      });
    }
  }

  // Utility methods
  async compressImage(file, options = {}) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions
          let width = img.width;
          let height = img.height;
          
          if (options.maxWidth && width > options.maxWidth) {
            height = (options.maxWidth / width) * height;
            width = options.maxWidth;
          }
          
          if (options.maxHeight && height > options.maxHeight) {
            width = (options.maxHeight / height) * width;
            height = options.maxHeight;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(blob);
          }, options.format || 'image/jpeg', options.quality || 0.8);
        };
        
        img.onerror = reject;
      };
      
      reader.onerror = reject;
    });
  }

  getFileSize(url) {
    return fetch(url, { method: 'HEAD' })
      .then(response => {
        const size = response.headers.get('content-length');
        return size ? parseInt(size) : null;
      })
      .catch(() => null);
  }

  // Media gallery creator
  createMediaGallery(mediaItems, options = {}) {
    const gallery = document.createElement('div');
    gallery.className = 'media-gallery';
    
    mediaItems.forEach((item, index) => {
      let mediaElement;
      
      if (item.type === 'image') {
        mediaElement = responsiveImages.createPictureElement({
          src: item.src,
          alt: item.alt,
          sizes: item.sizes || [300, 600, 900]
        });
      } else if (item.type === 'video') {
        mediaElement = videoManager.createVideoElement({
          src: item.src,
          poster: item.poster,
          controls: true
        });
      }
      
      if (mediaElement) {
        const itemContainer = document.createElement('div');
        itemContainer.className = 'gallery-item';
        itemContainer.appendChild(mediaElement);
        gallery.appendChild(itemContainer);
      }
    });
    
    // Add lightbox functionality if requested
    if (options.lightbox) {
      this.addLightboxFunctionality(gallery);
    }
    
    return gallery;
  }

  addLightboxFunctionality(gallery) {
    gallery.querySelectorAll('.gallery-item').forEach((item, index) => {
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => {
        this.showLightbox(gallery, index);
      });
    });
  }

  showLightbox(gallery, startIndex) {
    const items = gallery.querySelectorAll('.gallery-item');
    const lightbox = document.createElement('div');
    lightbox.className = 'media-lightbox';
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <button class="close">&times;</button>
        <button class="prev">‹</button>
        <div class="lightbox-media"></div>
        <button class="next">›</button>
        <div class="caption"></div>
        <div class="thumbnails"></div>
      </div>
    `;
    
    let currentIndex = startIndex;
    
    const updateLightbox = () => {
      const item = items[currentIndex];
      const mediaContainer = lightbox.querySelector('.lightbox-media');
      mediaContainer.innerHTML = '';
      
      // Clone the media element
      const mediaElement = item.querySelector('picture, video').cloneNode(true);
      mediaContainer.appendChild(mediaElement);
      
      // Update caption
      const caption = item.dataset.caption || '';
      lightbox.querySelector('.caption').textContent = caption;
      
      // Update active thumbnail
      lightbox.querySelectorAll('.thumbnail').forEach((thumb, idx) => {
        thumb.classList.toggle('active', idx === currentIndex);
      });
    };
    
    // Navigation
    lightbox.querySelector('.prev').addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + items.length) % items.length;
      updateLightbox();
    });
    
    lightbox.querySelector('.next').addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % items.length;
      updateLightbox();
    });
    
    lightbox.querySelector('.close').addEventListener('click', () => {
      lightbox.remove();
    });
    
    // Keyboard navigation
    lightbox.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') lightbox.remove();
      if (e.key === 'ArrowLeft') lightbox.querySelector('.prev').click();
      if (e.key === 'ArrowRight') lightbox.querySelector('.next').click();
    });
    
    // Create thumbnails
    const thumbnailsContainer = lightbox.querySelector('.thumbnails');
    items.forEach((item, index) => {
      const thumbnail = document.createElement('button');
      thumbnail.className = `thumbnail ${index === currentIndex ? 'active' : ''}`;
      thumbnail.innerHTML = item.innerHTML;
      thumbnail.addEventListener('click', () => {
        currentIndex = index;
        updateLightbox();
      });
      thumbnailsContainer.appendChild(thumbnail);
    });
    
    // Add to document and focus
    document.body.appendChild(lightbox);
    lightbox.focus();
    
    // Initial update
    updateLightbox();
  }

  // Cleanup
  cleanup() {
    this.mediaCache.clear();
    this.pendingRequests.clear();
  }
}

export const mediaManager = new MediaManager();

// Export everything
export {
  imageLoader,
  responsiveImages,
  videoManager,
  fontLoader
};

// CSS for media components
export const mediaStyles = `
  .media-gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
    margin: 20px 0;
  }
  
  .gallery-item {
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.3s ease;
  }
  
  .gallery-item:hover {
    transform: scale(1.05);
  }
  
  .media-lightbox {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .lightbox-content {
    position: relative;
    max-width: 90%;
    max-height: 90%;
  }
  
  .lightbox-media {
    max-width: 100%;
    max-height: 70vh;
    overflow: hidden;
  }
  
  .lightbox-media img,
  .lightbox-media video {
    max-width: 100%;
    max-height: 70vh;
    object-fit: contain;
  }
  
  .lightbox-content button {
    position: absolute;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    padding: 10px 15px;
    cursor: pointer;
    font-size: 20px;
    border-radius: 50%;
  }
  
  .lightbox-content .close {
    top: 10px;
    right: 10px;
  }
  
  .lightbox-content .prev {
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
  }
  
  .lightbox-content .next {
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
  }
  
  .caption {
    color: white;
    text-align: center;
    padding: 10px;
    font-size: 14px;
  }
  
  .thumbnails {
    display: flex;
    justify-content: center;
    gap: 10px;
    padding: 20px;
    overflow-x: auto;
  }
  
  .thumbnail {
    width: 60px;
    height: 60px;
    border: 2px solid transparent;
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.3s ease, border-color 0.3s ease;
  }
  
  .thumbnail.active {
    opacity: 1;
    border-color: #007bff;
  }
  
  .thumbnail:hover {
    opacity: 0.8;
  }
  
  .thumbnail img,
  .thumbnail video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .media-offline-warning {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #ff6b6b;
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  /* Reduced motion */
  .reduced-motion * {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
  
  /* Dark mode adjustments */
  .dark-mode img {
    filter: brightness(0.9);
  }
  
  /* High contrast */
  .high-contrast img {
    filter: contrast(1.2);
  }
`;
