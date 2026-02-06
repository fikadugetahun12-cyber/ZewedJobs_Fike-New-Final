// video-manager.js - Video handling with YouTube/Vimeo integration
class VideoManager {
  constructor() {
    this.players = new Map();
    this.videoCache = new Map();
    this.autoPlayAllowed = false;
    this.init();
  }

  init() {
    this.setupAutoPlayDetection();
    this.setupLazyLoading();
    this.setupYouTubeAPI();
  }

  setupAutoPlayDetection() {
    // Check autoplay support
    const video = document.createElement('video');
    video.muted = true;
    const promise = video.play();
    
    if (promise !== undefined) {
      promise.then(() => {
        this.autoPlayAllowed = true;
      }).catch(() => {
        this.autoPlayAllowed = false;
      });
    }
  }

  setupLazyLoading() {
    // Lazy load video elements
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const video = entry.target;
          this.loadVideo(video);
          observer.unobserve(video);
        }
      });
    });

    document.querySelectorAll('video[data-src]').forEach(video => {
      observer.observe(video);
    });
  }

  async loadVideo(videoElement) {
    const src = videoElement.dataset.src;
    const poster = videoElement.dataset.poster;
    
    if (!src) return;
    
    // Check cache
    if (this.videoCache.has(src)) {
      const cached = this.videoCache.get(src);
      videoElement.src = cached.src;
      videoElement.poster = cached.poster;
      return;
    }
    
    // Load video
    videoElement.src = src;
    if (poster) {
      videoElement.poster = poster;
    }
    
    // Cache the video
    this.videoCache.set(src, {
      src,
      poster,
      timestamp: Date.now()
    });
    
    // Preload metadata
    await videoElement.load();
  }

  setupYouTubeAPI() {
    // Load YouTube IFrame API if needed
    if (document.querySelector('.youtube-video')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }

  createYouTubePlayer(containerId, videoId, options = {}) {
    return new Promise((resolve) => {
      if (window.YT && window.YT.Player) {
        const player = new YT.Player(containerId, {
          videoId,
          playerVars: {
            autoplay: options.autoplay ? 1 : 0,
            controls: options.controls !== false ? 1 : 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            ...options.playerVars
          },
          events: {
            onReady: (event) => resolve(event.target),
            onStateChange: options.onStateChange
          }
        });
        this.players.set(containerId, player);
      } else {
        // Fallback to iframe
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}`;
        iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        document.getElementById(containerId).appendChild(iframe);
        resolve(iframe);
      }
    });
  }

  createVideoElement(config) {
    const {
      src,
      poster,
      autoplay = false,
      loop = false,
      muted = false,
      controls = true,
      playsinline = true,
      className = '',
      id = ''
    } = config;

    const video = document.createElement('video');
    
    if (id) video.id = id;
    if (className) video.className = className;
    
    // Set attributes
    if (autoplay && this.autoPlayAllowed) video.autoplay = true;
    if (loop) video.loop = true;
    if (muted) video.muted = true;
    if (controls) video.controls = true;
    if (playsinline) video.playsInline = true;
    
    // Create source elements
    if (Array.isArray(src)) {
      src.forEach(source => {
        const sourceElement = document.createElement('source');
        sourceElement.src = source.url;
        sourceElement.type = source.type || 'video/mp4';
        video.appendChild(sourceElement);
      });
    } else {
      video.src = src;
    }
    
    if (poster) {
      video.poster = poster;
    }
    
    // Add loading state
    video.classList.add('video-loading');
    
    video.addEventListener('loadeddata', () => {
      video.classList.remove('video-loading');
      video.classList.add('video-loaded');
    });
    
    video.addEventListener('error', () => {
      video.classList.add('video-error');
      this.showVideoError(video);
    });
    
    return video;
  }

  createVideoGallery(videos, config = {}) {
    const {
      columns = 3,
      autoplayOnHover = true,
      className = ''
    } = config;

    const gallery = document.createElement('div');
    gallery.className = `video-gallery ${className}`;
    gallery.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${columns}, 1fr);
      gap: 20px;
    `;

    videos.forEach((videoConfig, index) => {
      const item = document.createElement('div');
      item.className = 'video-item';
      
      const video = this.createVideoElement({
        ...videoConfig,
        autoplay: false,
        controls: true
      });
      
      if (autoplayOnHover) {
        item.addEventListener('mouseenter', () => {
          video.muted = true;
          video.play().catch(() => {});
        });
        
        item.addEventListener('mouseleave', () => {
          video.pause();
          video.currentTime = 0;
        });
      }
      
      item.appendChild(video);
      gallery.appendChild(item);
    });

    return gallery;
  }

  showVideoError(video) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'video-error-message';
    errorDiv.innerHTML = `
      <p>Video failed to load</p>
      <button onclick="this.parentElement.remove(); video.load()">
        Retry
      </button>
    `;
    
    video.parentNode.insertBefore(errorDiv, video.nextSibling);
  }

  // Video analytics
  trackVideoEvents(video, videoId) {
    const events = [
      'play',
      'pause',
      'ended',
      'timeupdate',
      'volumechange'
    ];
    
    let playStarted = false;
    let lastTimeUpdate = 0;
    
    events.forEach(event => {
      video.addEventListener(event, (e) => {
        const data = {
          videoId,
          event,
          currentTime: video.currentTime,
          duration: video.duration,
          volume: video.volume,
          muted: video.muted,
          timestamp: Date.now()
        };
        
        // Custom tracking logic
        switch (event) {
          case 'play':
            playStarted = true;
            this.sendAnalytics('video_play', data);
            break;
            
          case 'pause':
            if (playStarted) {
              this.sendAnalytics('video_pause', data);
            }
            break;
            
          case 'ended':
            this.sendAnalytics('video_complete', data);
            playStarted = false;
            break;
            
          case 'timeupdate':
            // Throttle time updates
            const now = Date.now();
            if (now - lastTimeUpdate > 1000) {
              this.sendAnalytics('video_progress', data);
              lastTimeUpdate = now;
            }
            break;
        }
      });
    });
  }

  sendAnalytics(event, data) {
    // Send to analytics service
    if (typeof gtag !== 'undefined') {
      gtag('event', event, data);
    }
    
    // Or send to your own API
    fetch('/api/video-analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => {});
  }

  // Utility methods
  formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  createPlaylist(videos, options = {}) {
    const playlist = document.createElement('div');
    playlist.className = 'video-playlist';
    
    const currentVideo = this.createVideoElement({
      ...videos[0],
      controls: true
    });
    
    playlist.appendChild(currentVideo);
    
    const list = document.createElement('ul');
    list.className = 'playlist-items';
    
    videos.forEach((video, index) => {
      const item = document.createElement('li');
      item.className = index === 0 ? 'active' : '';
      item.innerHTML = `
        <span class="playlist-index">${index + 1}</span>
        <span class="playlist-title">${video.title || `Video ${index + 1}`}</span>
        <span class="playlist-duration">${this.formatDuration(video.duration || 0)}</span>
      `;
      
      item.addEventListener('click', () => {
        // Update active item
        list.querySelectorAll('li').forEach(li => li.classList.remove('active'));
        item.classList.add('active');
        
        // Switch video
        currentVideo.src = video.src;
        currentVideo.load();
        currentVideo.play();
      });
      
      list.appendChild(item);
    });
    
    playlist.appendChild(list);
    return playlist;
  }
}

export const videoManager = new VideoManager();

// CSS for video styling
export const videoStyles = `
  .video-loading {
    background: #f0f0f0;
    position: relative;
  }
  
  .video-loading::after {
    content: 'Loading video...';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #666;
  }
  
  .video-error {
    border: 2px solid #ff6b6b;
  }
  
  .video-error-message {
    background: #ffeaea;
    padding: 10px;
    border-radius: 4px;
    margin-top: 10px;
    text-align: center;
  }
  
  .video-error-message button {
    background: #ff6b6b;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 3px;
    cursor: pointer;
  }
  
  .video-gallery {
    margin: 20px 0;
  }
  
  .video-item {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
  }
  
  .video-item video {
    width: 100%;
    height: auto;
    display: block;
  }
  
  .playlist-items {
    list-style: none;
    padding: 0;
    margin: 20px 0;
    max-height: 300px;
    overflow-y: auto;
  }
  
  .playlist-items li {
    padding: 10px;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .playlist-items li.active {
    background: #f0f7ff;
    font-weight: bold;
  }
  
  .playlist-items li:hover {
    background: #f5f5f5;
  }
  
  .playlist-index {
    background: #007bff;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  }
  
  .playlist-title {
    flex: 1;
  }
  
  .playlist-duration {
    color: #666;
    font-size: 12px;
  }
`;
