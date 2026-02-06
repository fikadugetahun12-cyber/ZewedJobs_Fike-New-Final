// ads.js
export default {
    init() {
        this.loadAds();
        this.setupAdRotation();
        this.trackAdPerformance();
        this.setupAdConsent();
    },
    
    loadAds() {
        // Load ads from different networks
        this.loadAdSense();
        this.loadMediaNet();
        this.loadDirectAds();
    },
    
    loadAdSense() {
        // Google AdSense
        if (document.getElementById('adsense-ad')) {
            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
            document.head.appendChild(script);
            
            (adsbygoogle = window.adsbygoogle || []).push({
                google_ad_client: process.env.ADSENSE_CLIENT_ID,
                enable_page_level_ads: true
            });
        }
    },
    
    loadDirectAds() {
        // Direct sponsor ads
        fetch('/api/sponsors/active')
            .then(res => res.json())
            .then(sponsors => {
                this.displaySponsorAds(sponsors);
            });
    },
    
    displaySponsorAds(sponsors) {
        const adSpots = document.querySelectorAll('.ad-spot');
        adSpots.forEach((spot, index) => {
            const sponsor = sponsors[index % sponsors.length];
            if (sponsor) {
                spot.innerHTML = `
                    <a href="${sponsor.url}" target="_blank" rel="sponsored">
                        <img src="${sponsor.banner}" alt="${sponsor.name}">
                        <span class="sponsor-label">Sponsored by ${sponsor.name}</span>
                    </a>
                `;
            }
        });
    },
    
    setupAdRotation() {
        // Rotate ads every 30 seconds
        setInterval(() => {
            this.rotateBannerAds();
        }, 30000);
    },
    
    rotateBannerAds() {
        const banners = document.querySelectorAll('.banner-ad');
        banners.forEach(banner => {
            // Fetch new ad
            this.fetchNewAd().then(ad => {
                if (ad) {
                    banner.innerHTML = ad.html;
                }
            });
        });
    },
    
    trackAdPerformance() {
        // Track clicks and impressions
        document.addEventListener('click', (e) => {
            const adLink = e.target.closest('[rel="sponsored"]');
            if (adLink) {
                this.trackClick(adLink.href);
            }
        });
        
        // Intersection Observer for impressions
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const adId = entry.target.dataset.adId;
                    this.trackImpression(adId);
                }
            });
        });
        
        document.querySelectorAll('.ad-container').forEach(ad => {
            observer.observe(ad);
        });
    },
    
    setupAdConsent() {
        // GDPR/CCPA compliance
        const consent = localStorage.getItem('ad-consent');
        if (consent === 'denied') {
            this.disableAds();
        } else if (!consent) {
            this.showConsentDialog();
        }
    },
    
    showConsentDialog() {
        // Show cookie consent banner
        const dialog = document.createElement('div');
        dialog.id = 'ad-consent-dialog';
        dialog.innerHTML = `
            <div class="consent-content">
                <p>We use ads to support our service. Do you accept personalized ads?</p>
                <button class="btn-accept">Accept</button>
                <button class="btn-deny">Deny</button>
            </div>
        `;
        document.body.appendChild(dialog);
        
        dialog.querySelector('.btn-accept').addEventListener('click', () => {
            localStorage.setItem('ad-consent', 'accepted');
            dialog.remove();
        });
        
        dialog.querySelector('.btn-deny').addEventListener('click', () => {
            localStorage.setItem('ad-consent', 'denied');
            this.disableAds();
            dialog.remove();
        });
    }
};
