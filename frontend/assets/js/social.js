// social.js
export default {
    init() {
        this.loadSocialFeed();
        this.setupLiveUpdates();
        this.initializeHashtagFilter();
    },
    
    loadSocialFeed() {
        // Fetch from multiple social APIs
        Promise.all([
            this.fetchTwitterFeed(),
            this.fetchInstagramFeed(),
            this.fetchFacebookPosts()
        ]).then(([twitter, instagram, facebook]) => {
            this.mergeAndDisplayFeeds({ twitter, instagram, facebook });
        });
    },
    
    async fetchTwitterFeed() {
        // Twitter API integration
        const response = await fetch('/api/twitter-feed');
        return response.json();
    },
    
    setupLiveUpdates() {
        // WebSocket for live updates
        this.socket = new WebSocket(process.env.WEBSOCKET_URL);
        this.socket.onmessage = (event) => {
            const update = JSON.parse(event.data);
            this.addLiveUpdate(update);
        };
    },
    
    addLiveUpdate(update) {
        const feed = document.getElementById('live-feed');
        const updateElement = this.createUpdateElement(update);
        feed.prepend(updateElement);
        
        // Limit feed size
        const items = feed.querySelectorAll('.feed-item');
        if (items.length > 50) {
            items[items.length - 1].remove();
        }
    },
    
    createUpdateElement(update) {
        return `
            <div class="feed-item ${update.platform}">
                <img src="${update.avatar}" class="avatar">
                <div class="content">
                    <strong>${update.author}</strong>
                    <p>${update.text}</p>
                    <span class="time">${this.formatTime(update.timestamp)}</span>
                </div>
            </div>
        `;
    },
    
    formatTime(timestamp) {
        // Format relative time
        return new Intl.RelativeTimeFormat().format(
            Math.floor((Date.now() - timestamp) / 60000), 'minute'
        );
    }
};
