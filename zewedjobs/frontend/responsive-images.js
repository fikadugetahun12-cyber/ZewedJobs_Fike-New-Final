// responsive-images.js - Generate responsive image markup
import { imageLoader } from './image-loader.js';

class ResponsiveImages {
  constructor() {
    this.breakpoints = {
      xs: 320,
      sm: 576,
      md: 768,
      lg: 992,
      xl: 1200,
      xxl: 1400
    };
  }

  createPictureElement(imageConfig) {
    const {
      src,
      alt = '',
      width,
      height,
      sizes = [],
      formats = ['webp', 'jpg'],
      lazy = true,
      className = '',
      id = ''
    } = imageConfig;

    const picture = document.createElement('picture');
    if (id) picture.id = id;
    if (className) picture.className = className;

    // Generate source elements for each format
    formats.forEach(format => {
      const source = document.createElement('source');
      
      if (format === 'webp' && imageLoader.supportsWebP()) {
        source.type = 'image/webp';
        source.srcset = this.generateSrcset(src, format, sizes);
      } else if (format !== 'webp') {
        source.type = `image/${format}`;
        source.srcset = this.generateSrcset(src, format, sizes);
      }

      if (source.srcset) {
        source.sizes = this.generateSizes(sizes);
        picture.appendChild(source);
      }
    });

    // Create img element
    const img = document.createElement('img');
    img.alt = alt;
    
    if (width) img.width = width;
    if (height) img.height = height;
    
    // Set fallback src
    const fallbackFormat = formats.find(f => f !== 'webp') || 'jpg';
    const fallbackSize = sizes[sizes.length - 1] || 1200;
    img.src = this.generateSrc(src, fallbackFormat, fallbackSize);
    
    if (lazy) {
      img.loading = 'lazy';
      img.decoding = 'async';
    }

    picture.appendChild(img);
    return picture;
  }

  generateSrcset(baseSrc, format, sizes) {
    const baseName = baseSrc.replace(/\.[^/.]+$/, '');
    const extension = format;
    
    return sizes.map(size => 
      `${baseName}-${size}w.${extension} ${size}w`
    ).join(', ');
  }

  generateSrc(baseSrc, format, size) {
    const baseName = baseSrc.replace(/\.[^/.]+$/, '');
    return `${baseName}-${size}w.${format}`;
  }

  generateSizes(sizes) {
    if (!sizes || sizes.length === 0) {
      return '100vw';
    }

    const breakpoints = Object.entries(this.breakpoints)
      .sort((a, b) => a[1] - b[1]);

    const sizeRules = [];
    
    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i];
      const breakpoint = breakpoints[i]?.[1];
      
      if (breakpoint) {
        sizeRules.push(`(max-width: ${breakpoint}px) ${size}`);
      }
    }
    
    // Add default size
    const defaultSize = sizes[sizes.length - 1] || '100vw';
    sizeRules.push(defaultSize);
    
    return sizeRules.join(', ');
  }

  createImageGrid(images, config = {}) {
    const {
      columns = 3,
      gap = '20px',
      aspectRatio = '16/9',
      className = ''
    } = config;

    const container = document.createElement('div');
    container.className = `image-grid ${className}`;
    container.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${columns}, 1fr);
      gap: ${gap};
    `;

    images.forEach(image => {
      const item = document.createElement('div');
      item.className = 'grid-item';
      item.style.aspectRatio = aspectRatio;
      item.style.overflow = 'hidden';
      item.style.position = 'relative';

      const picture = this.createPictureElement({
        ...image,
        sizes: [300, 600, 900],
        lazy: true
      });

      item.appendChild(picture);
      container.appendChild(item);
    });

    return container;
  }

  createImageSlider(images, config = {}) {
    const {
      autoplay = true,
      interval = 5000,
      showThumbnails = true,
      className = ''
    } = config;

    const slider = document.createElement('div');
    slider.className = `image-slider ${className}`;
    slider.innerHTML = `
      <div class="slider-container">
        <div class="slides"></div>
        <button class="prev">‹</button>
        <button class="next">›</button>
        ${showThumbnails ? '<div class="thumbnails"></div>' : ''}
      </div>
    `;

    const slidesContainer = slider.querySelector('.slides');
    const thumbnailsContainer = slider.querySelector('.thumbnails');

    images.forEach((image, index) => {
      // Create slide
      const slide = document.createElement('div');
      slide.className = `slide ${index === 0 ? 'active' : ''}`;
      slide.dataset.index = index;

      const picture = this.createPictureElement({
        ...image,
        sizes: [800, 1200, 1600],
        lazy: index === 0 // Lazy load only first image initially
      });

      slide.appendChild(picture);
      slidesContainer.appendChild(slide);

      // Create thumbnail if enabled
      if (showThumbnails && thumbnailsContainer) {
        const thumbnail = document.createElement('button');
        thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
        thumbnail.dataset.index = index;
        thumbnail.innerHTML = `
          <img src="${image.src.replace('.jpg', '-thumb.jpg')}" 
               alt="${image.alt}" 
               loading="lazy">
        `;
        thumbnailsContainer.appendChild(thumbnail);
      }
    });

    // Add slider functionality
    this.setupSliderFunctionality(slider, images.length, autoplay, interval);

    return slider;
  }

  setupSliderFunctionality(slider, totalSlides, autoplay, interval) {
    let currentSlide = 0;
    let autoplayInterval;

    const showSlide = (index) => {
      const slides = slider.querySelectorAll('.slide');
      const thumbnails = slider.querySelectorAll('.thumbnail');

      // Hide all slides
      slides.forEach(slide => {
        slide.classList.remove('active');
        slide.style.display = 'none';
      });

      // Show current slide
      slides[index].classList.add('active');
      slides[index].style.display = 'block';

      // Update thumbnails
      thumbnails.forEach(thumb => {
        thumb.classList.remove('active');
      });
      if (thumbnails[index]) {
        thumbnails[index].classList.add('active');
      }

      currentSlide = index;

      // Lazy load next image
      const nextIndex = (index + 1) % totalSlides;
      const nextSlide = slides[nextIndex];
      const nextImg = nextSlide.querySelector('img[data-src]');
      if (nextImg) {
        imageLoader.loadImage(nextImg);
      }
    };

    // Navigation
    slider.querySelector('.prev').addEventListener('click', () => {
      showSlide((currentSlide - 1 + totalSlides) % totalSlides);
      resetAutoplay();
    });

    slider.querySelector('.next').addEventListener('click', () => {
      showSlide((currentSlide + 1) % totalSlides);
      resetAutoplay();
    });

    // Thumbnail clicks
    slider.querySelectorAll('.thumbnail').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const index = parseInt(thumb.dataset.index);
        showSlide(index);
        resetAutoplay();
      });
    });

    // Autoplay
    const startAutoplay = () => {
      if (autoplay && !autoplayInterval) {
        autoplayInterval = setInterval(() => {
          showSlide((currentSlide + 1) % totalSlides);
        }, interval);
      }
    };

    const stopAutoplay = () => {
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
        autoplayInterval = null;
      }
    };

    const resetAutoplay = () => {
      stopAutoplay();
      startAutoplay();
    };

    // Start autoplay
    if (autoplay) {
      startAutoplay();
    }

    // Pause on hover
    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (slider.contains(document.activeElement)) {
        if (e.key === 'ArrowLeft') {
          showSlide((currentSlide - 1 + totalSlides) % totalSlides);
          resetAutoplay();
        } else if (e.key === 'ArrowRight') {
          showSlide((currentSlide + 1) % totalSlides);
          resetAutoplay();
        }
      }
    });

    // Initialize first slide
    showSlide(0);
  }

  // Utility to convert images for responsive display
  async convertToResponsive(container) {
    const images = container.querySelectorAll('img:not([data-processed])');
    
    images.forEach(img => {
      if (img.src && !img.src.includes('data:image')) {
        const picture = this.createPictureElement({
          src: img.src,
          alt: img.alt,
          width: img.width,
          height: img.height,
          sizes: [400, 800, 1200],
          lazy: true
        });
        
        img.replaceWith(picture);
      }
    });
  }
}

export const responsiveImages = new ResponsiveImages();
