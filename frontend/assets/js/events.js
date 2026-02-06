/**
 * ZewedJobs - Events Management
 * Event listing, registration, and live sessions
 */

class EventsManager {
    constructor() {
        this.events = [];
        this.upcomingEvents = [];
        this.pastEvents = [];
        this.liveEvents = [];
        this.registeredEvents = new Set();
        this.currentEvent = null;
        this.eventCategories = [];
        this.initialize();
    }

    initialize() {
        console.log('📅 Events Manager initialized');
        
        // Load user's event data
        this.loadUserEvents();
        
        // Initialize event components
        this.initEventFilters();
        this.initEventCards();
        this.initEventRegistration();
        this.initLiveSessions();
        this.initCalendarView();
        this.initCountdownTimers();
        
        // Load events
        this.loadEvents();
        this.loadEventCategories();
        
        // Start live event checker
        this.startLiveEventChecker();
    }

    // Events Loading
    async loadEvents(filters = {}) {
        try {
            this.showLoading(true);
            
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    params.append(key, value);
                }
            });
            
            const response = await fetch(`/api/events?${params.toString()}`);
            
            if (response.ok) {
                const data = await response.json();
                this.events = data.events || [];
                this.categorizeEvents();
                this.displayEvents();
            } else {
                throw new Error('Failed to load events');
            }
        } catch (error) {
            console.error('Error loading events:', error);
            this.showError('Failed to load events. Please try again.');
            this.showSampleEvents();
        } finally {
            this.showLoading(false);
        }
    }

    categorizeEvents() {
        const now = new Date();
        
        this.upcomingEvents = this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate > now && !event.isLive;
        });
        
        this.pastEvents = this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate < now && !event.isLive;
        });
        
        this.liveEvents = this.events.filter(event => event.isLive);
    }

    async loadEventCategories() {
        try {
            const response = await fetch('/api/events/categories');
            if (response.ok) {
                this.eventCategories = await response.json();
                this.displayCategories();
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    displayEvents() {
        const eventsGrid = document.getElementById('events-grid');
        const upcomingGrid = document.getElementById('upcoming-events-grid');
        const pastGrid = document.getElementById('past-events-grid');
        const liveGrid = document.getElementById('live-events-grid');
        
        // Display all events
        if (eventsGrid) {
            eventsGrid.innerHTML = '';
            this.events.forEach(event => {
                const eventCard = this.createEventCard(event);
                eventsGrid.appendChild(eventCard);
            });
        }
        
        // Display upcoming events
        if (upcomingGrid) {
            upcomingGrid.innerHTML = '';
            this.upcomingEvents.forEach(event => {
                const eventCard = this.createEventCard(event);
                upcomingGrid.appendChild(eventCard);
            });
        }
        
        // Display past events
        if (pastGrid) {
            pastGrid.innerHTML = '';
            this.pastEvents.forEach(event => {
                const eventCard = this.createEventCard(event);
                pastGrid.appendChild(eventCard);
            });
        }
        
        // Display live events
        if (liveGrid) {
            liveGrid.innerHTML = '';
            this.liveEvents.forEach(event => {
                const eventCard = this.createEventCard(event);
                liveGrid.appendChild(eventCard);
            });
        }
    }

    createEventCard(event) {
        const card = document.createElement('div');
        card.className = 'event-card';
        
        if (event.isLive) card.classList.add('live');
        if (event.featured) card.classList.add('featured');
        
        const isRegistered = this.registeredEvents.has(event.id);
        const eventDate = new Date(event.date);
        const isUpcoming = eventDate > new Date();
        
        // Format date for display
        const day = eventDate.getDate();
        const month = eventDate.toLocaleString('default', { month: 'short' });
        const time = eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        card.innerHTML = `
            <div class="event-image">
                <img src="${event.image || '/assets/images/default-event.jpg'}" 
                     alt="${event.title}"
                     loading="lazy">
                <div class="event-date">
                    <span class="event-day">${day}</span>
                    <span class="event-month">${month}</span>
                </div>
                ${event.isLive ? '<div class="live-badge">LIVE</div>' : ''}
            </div>
            
            <div class="event-content">
                <span class="event-category">${event.category || 'General'}</span>
                
                <h3 class="event-title">${event.title}</h3>
                
                <p class="event-description">${this.truncateText(event.description, 80)}</p>
                
                <div class="event-meta">
                    <div class="meta-item">
                        <i class="far fa-calendar"></i>
                        <span>${eventDate.toLocaleDateString()}</span>
                    </div>
                    <div class="meta-item">
                        <i class="far fa-clock"></i>
                        <span>${time}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${event.location || 'Online'}</span>
                    </div>
                </div>
                
                <div class="event-footer">
                    <div class="event-price">
                        ${event.price === 0 || event.price === 'Free' ? 
                            '<span class="free">Free</span>' : 
                            `<span>${this.formatCurrency(event.price)}</span>`}
                    </div>
                    
                    <div class="event-actions">
                        ${isRegistered ? `
                            <button class="btn-registered" disabled>
                                <i class="fas fa-check-circle"></i> Registered
                            </button>
                        ` : isUpcoming ? `
                            <button class="btn-register" onclick="eventsManager.registerForEvent('${event.id}')">
                                Register Now
                            </button>
                        ` : `
                            <button class="btn-view" onclick="eventsManager.viewEvent('${event.id}')">
                                View Recording
                            </button>
                        `}
                        <button class="btn-details" onclick="eventsManager.viewEventDetails('${event.id}')">
                            Details
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    }

    // Event Filtering
    initEventFilters() {
        // Event type tabs
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.filterByType(btn.dataset.type);
            });
        });
        
        // Category filter
        const categoryFilter = document.getElementById('filter-category');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterByCategory(e.target.value);
            });
        }
        
        // Date filter
        const dateFilter = document.getElementById('filter-date');
        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.filterByDate(e.target.value);
            });
        }
        
        // Location filter
        const locationFilter = document.getElementById('filter-location');
        if (locationFilter) {
            locationFilter.addEventListener('change', (e) => {
                this.filterByLocation(e.target.value);
            });
        }
        
        // Price filter
        const priceFilter = document.getElementById('filter-price');
        if (priceFilter) {
            priceFilter.addEventListener('change', (e) => {
                this.filterByPrice(e.target.value);
            });
        }
        
        // Search input
        const searchInput = document.getElementById('event-search');
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                this.searchEvents(e.target.value);
            }, 300));
        }
    }

    filterByType(type) {
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`.filter-btn[data-type="${type}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Load events with filter
        const filters = {};
        if (type !== 'all') {
            filters.type = type;
        }
        this.loadEvents(filters);
    }

    filterByCategory(category) {
        this.loadEvents({ category: category === 'all' ? '' : category });
    }

    filterByDate(dateRange) {
        this.loadEvents({ date: dateRange === 'all' ? '' : dateRange });
    }

    filterByLocation(location) {
        this.loadEvents({ location: location === 'all' ? '' : location });
    }

    filterByPrice(price) {
        this.loadEvents({ price: price === 'all' ? '' : price });
    }

    searchEvents(query) {
        if (query.length < 2) {
            this.loadEvents();
            return;
        }
        
        this.loadEvents({ search: query });
    }

    // Event Registration
    initEventRegistration() {
        const registerForm = document.getElementById('event-registration-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.submitRegistration();
            });
        }
        
        // Add to calendar button
        const calendarBtn = document.getElementById('add-to-calendar');
        if (calendarBtn) {
            calendarBtn.addEventListener('click', () => {
                this.addToCalendar();
            });
        }
    }

    async registerForEvent(eventId) {
        if (!window.userAuth?.isAuthenticated) {
            showNotification('Please login to register for events', 'warning');
            openModal('auth-modal');
            return;
        }
        
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;
        
        // Check if free event
        if (event.price > 0) {
            // Redirect to payment
            window.location.href = `/pages/payment.html?type=event&id=${eventId}&amount=${event.price}`;
            return;
        }
        
        // Show registration form
        this.showRegistrationForm(event);
    }

    showRegistrationForm(event) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'registration-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Register for ${event.title}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="event-info">
                        <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> ${new Date(event.date).toLocaleTimeString()}</p>
                        <p><strong>Location:</strong> ${event.location || 'Online'}</p>
                    </div>
                    
                    <form id="event-registration-form">
                        <div class="form-group">
                            <label>Full Name *</label>
                            <input type="text" id="reg-name" 
                                   value="${window.userAuth?.currentUser?.name || ''}" 
                                   required>
                        </div>
                        
                        <div class="form-group">
                            <label>Email *</label>
                            <input type="email" id="reg-email" 
                                   value="${window.userAuth?.currentUser?.email || ''}" 
                                   required>
                        </div>
                        
                        <div class="form-group">
                            <label>Phone Number *</label>
                            <input type="tel" id="reg-phone" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Company/Organization</label>
                            <input type="text" id="reg-company">
                        </div>
                        
                        <div class="form-group">
                            <label>Job Title</label>
                            <input type="text" id="reg-job-title">
                        </div>
                        
                        ${event.questions ? event.questions.map((question, index) => `
                            <div class="form-group">
                                <label>${question}</label>
                                <textarea id="reg-question-${index}" rows="3"></textarea>
                            </div>
                        `).join('') : ''}
                        
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="reg-newsletter" checked>
                                Subscribe to event updates and newsletter
                            </label>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-outline" 
                                    onclick="closeModal('registration-modal')">
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary">
                                Complete Registration
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        closeModal('registration-modal');
    }

    async submitRegistration() {
        const eventId = this.getCurrentEventId();
        if (!eventId) return;
        
        const formData = {
            name: document.getElementById('reg-name')?.value,
            email: document.getElementById('reg-email')?.value,
            phone: document.getElementById('reg-phone')?.value,
            company: document.getElementById('reg-company')?.value,
            jobTitle: document.getElementById('reg-job-title')?.value,
            subscribeToNewsletter: document.getElementById('reg-newsletter')?.checked,
            eventId: eventId
        };
        
        // Validate form
        if (!formData.name || !formData.email || !formData.phone) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/events/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.userAuth?.authToken || ''}`
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                this.registeredEvents.add(eventId);
                this.updateRegistrationUI(eventId, true);
                closeModal('registration-modal');
                
                showNotification('Successfully registered for the event!', 'success');
                
                // Send confirmation email
                this.sendConfirmationEmail(formData.email, eventId);
                
                // Add to calendar
                this.scheduleCalendarReminder(eventId);
                
                // Track registration
                this.trackEvent('event', 'registered', eventId);
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Registration failed');
            }
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    updateRegistrationUI(eventId, isRegistered) {
        // Update event card
        const eventCard = document.querySelector(`.event-card[data-event-id="${eventId}"]`);
        if (eventCard) {
            const actionsDiv = eventCard.querySelector('.event-actions');
            if (actionsDiv) {
                actionsDiv.innerHTML = isRegistered ? `
                    <button class="btn-registered" disabled>
                        <i class="fas fa-check-circle"></i> Registered
                    </button>
                ` : `
                    <button class="btn-register" onclick="eventsManager.registerForEvent('${eventId}')">
                        Register Now
                    </button>
                    <button class="btn-details" onclick="eventsManager.viewEventDetails('${eventId}')">
                        Details
                    </button>
                `;
            }
        }
        
        // Update registration button on event detail page
        if (this.getCurrentEventId() === eventId) {
            const registerBtn = document.getElementById('register-btn');
            if (registerBtn && isRegistered) {
                registerBtn.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <span>Registered</span>
                `;
                registerBtn.disabled = true;
                registerBtn.classList.remove('btn-primary');
                registerBtn.classList.add('btn-success');
            }
        }
    }

    // Live Sessions
    initLiveSessions() {
        // Live chat
        const chatForm = document.getElementById('live-chat-form');
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendChatMessage();
            });
        }
        
        // Questions submission
        const questionForm = document.getElementById('question-form');
        if (questionForm) {
            questionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitQuestion();
            });
        }
        
        // Poll voting
        document.querySelectorAll('.poll-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.voteInPoll(e.target.dataset.pollId, e.target.dataset.optionId);
            });
        });
        
        // Connect to WebSocket for live updates
        this.connectToLiveStream();
    }

    connectToLiveStream() {
        // Check if we're on a live event page
        const eventId = this.getCurrentEventId();
        if (!eventId) return;
        
        const event = this.events.find(e => e.id === eventId);
        if (!event || !event.isLive) return;
        
        // Connect to WebSocket
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws/events/${eventId}`;
        
        try {
            this.socket = new WebSocket(wsUrl);
            
            this.socket.onopen = () => {
                console.log('Connected to live event stream');
                this.joinLiveSession(eventId);
            };
            
            this.socket.onmessage = (event) => {
                this.handleLiveMessage(JSON.parse(event.data));
            };
            
            this.socket.onclose = () => {
                console.log('Disconnected from live event stream');
                setTimeout(() => this.connectToLiveStream(), 5000); // Reconnect after 5 seconds
            };
            
            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('Failed to connect to live stream:', error);
        }
    }

    joinLiveSession(eventId) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        
        const message = {
            type: 'join',
            eventId: eventId,
            userId: window.userAuth?.currentUser?.id || 'anonymous',
            userName: window.userAuth?.currentUser?.name || 'Guest'
        };
        
        this.socket.send(JSON.stringify(message));
    }

    sendChatMessage() {
        const messageInput = document.getElementById('chat-message');
        const message = messageInput?.value.trim();
        
        if (!message || !this.socket) return;
        
        const chatMessage = {
            type: 'chat',
            eventId: this.getCurrentEventId(),
            userId: window.userAuth?.currentUser?.id || 'anonymous',
            userName: window.userAuth?.currentUser?.name || 'Guest',
            message: message,
            timestamp: new Date().toISOString()
        };
        
        this.socket.send(JSON.stringify(chatMessage));
        
        // Clear input
        if (messageInput) {
            messageInput.value = '';
        }
    }

    submitQuestion() {
        const questionInput = document.getElementById('question-input');
        const question = questionInput?.value.trim();
        
        if (!question || !this.socket) return;
        
        const questionMessage = {
            type: 'question',
            eventId: this.getCurrentEventId(),
            userId: window.userAuth?.currentUser?.id || 'anonymous',
            userName: window.userAuth?.currentUser?.name || 'Guest',
            question: question,
            timestamp: new Date().toISOString()
        };
        
        this.socket.send(JSON.stringify(questionMessage));
        
        // Clear input
        if (questionInput) {
            questionInput.value = '';
            showNotification('Question submitted!', 'success');
        }
    }

    voteInPoll(pollId, optionId) {
        if (!this.socket) return;
        
        const voteMessage = {
            type: 'vote',
            eventId: this.getCurrentEventId(),
            pollId: pollId,
            optionId: optionId,
            userId: window.userAuth?.currentUser?.id || 'anonymous'
        };
        
        this.socket.send(JSON.stringify(voteMessage));
    }

    handleLiveMessage(data) {
        switch (data.type) {
            case 'chat':
                this.displayChatMessage(data);
                break;
            case 'question':
                this.displayQuestion(data);
                break;
            case 'poll':
                this.displayPoll(data);
                break;
            case 'poll_results':
                this.updatePollResults(data);
                break;
            case 'viewer_count':
                this.updateViewerCount(data.count);
                break;
            case 'event_update':
                this.handleEventUpdate(data);
                break;
        }
    }

    displayChatMessage(message) {
        const chatContainer = document.getElementById('chat-messages');
        if (!chatContainer) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        messageElement.innerHTML = `
            <div class="chat-user">${message.userName}</div>
            <div class="chat-text">${message.message}</div>
            <div class="chat-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
        `;
        
        chatContainer.appendChild(messageElement);
        
        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    displayQuestion(question) {
        const questionsContainer = document.getElementById('questions-list');
        if (!questionsContainer) return;
        
        const questionElement = document.createElement('div');
        questionElement.className = 'question-item';
        questionElement.innerHTML = `
            <div class="question-user">${question.userName}</div>
            <div class="question-text">${question.question}</div>
            <div class="question-time">${new Date(question.timestamp).toLocaleTimeString()}</div>
        `;
        
        questionsContainer.appendChild(questionElement);
    }

    displayPoll(poll) {
        const pollContainer = document.getElementById('live-poll');
        if (!pollContainer) return;
        
        pollContainer.innerHTML = `
            <div class="poll-question">${poll.question}</div>
            <div class="poll-options">
                ${poll.options.map((option, index) => `
                    <button class="poll-option" 
                            data-poll-id="${poll.id}"
                            data-option-id="${option.id}">
                        ${option.text}
                    </button>
                `).join('')}
            </div>
            <div class="poll-timer">Time remaining: <span id="poll-timer">${poll.duration}s</span></div>
        `;
        
        // Start poll timer
        this.startPollTimer(poll.id, poll.duration);
    }

    updatePollResults(results) {
        const pollContainer = document.getElementById('live-poll');
        if (!pollContainer) return;
        
        pollContainer.innerHTML = `
            <div class="poll-question">${results.question}</div>
            <div class="poll-results">
                ${results.options.map(option => `
                    <div class="poll-result-item">
                        <div class="result-label">${option.text}</div>
                        <div class="result-bar">
                            <div class="result-fill" style="width: ${option.percentage}%"></div>
                        </div>
                        <div class="result-percentage">${option.percentage}%</div>
                        <div class="result-votes">(${option.votes} votes)</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    updateViewerCount(count) {
        const viewerCount = document.getElementById('viewer-count');
        if (viewerCount) {
            viewerCount.textContent = `${count} viewers`;
        }
    }

    handleEventUpdate(update) {
        // Handle event updates like session changes, breaks, etc.
        console.log('Event update:', update);
        
        if (update.message) {
            showNotification(update.message, 'info');
        }
    }

    startPollTimer(pollId, duration) {
        let timeLeft = duration;
        const timerElement = document.getElementById('poll-timer');
        
        const timer = setInterval(() => {
            timeLeft--;
            
            if (timerElement) {
                timerElement.textContent = `${timeLeft}s`;
            }
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                if (timerElement) {
                    timerElement.textContent = 'Poll ended';
                }
            }
        }, 1000);
    }

    startLiveEventChecker() {
        // Check for live events every 30 seconds
        setInterval(() => {
            this.checkLiveEvents();
        }, 30000);
    }

    checkLiveEvents() {
        // Check if any events are currently live
        const now = new Date();
        
        this.events.forEach(event => {
            const eventDate = new Date(event.date);
            const endDate = new Date(event.endDate || eventDate.getTime() + (2 * 60 * 60 * 1000)); // Default 2 hours
            
            if (now >= eventDate && now <= endDate && !event.isLive) {
                // Event should be live
                this.markEventAsLive(event.id);
            } else if ((now < eventDate || now > endDate) && event.isLive) {
                // Event should not be live
                this.markEventAsNotLive(event.id);
            }
        });
    }

    markEventAsLive(eventId) {
        // Update event status
        const event = this.events.find(e => e.id === eventId);
        if (event) {
            event.isLive = true;
            this.liveEvents.push(event);
            
            // Show live notification
            if (Notification.permission === 'granted') {
                new Notification('Live Event Started!', {
                    body: `${event.title} is now live. Join now!`,
                    icon: '/assets/images/logo.png'
                });
            }
            
            // Update UI
            this.displayEvents();
        }
    }

    markEventAsNotLive(eventId) {
        // Update event status
        const event = this.events.find(e => e.id === eventId);
        if (event) {
            event.isLive = false;
            this.liveEvents = this.liveEvents.filter(e => e.id !== eventId);
            
            // Update UI
            this.displayEvents();
        }
    }

    // Calendar View
    initCalendarView() {
        const calendarGrid = document.getElementById('calendar-grid');
        if (!calendarGrid) return;
        
        this.renderCalendar(new Date());
        
        // Calendar navigation
        const prevMonthBtn = document.getElementById('prev-month');
        const nextMonthBtn = document.getElementById('next-month');
        
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => {
                this.navigateCalendar(-1);
            });
        }
        
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => {
                this.navigateCalendar(1);
            });
        }
    }

    renderCalendar(date) {
        const calendarGrid = document.getElementById('calendar-grid');
        const monthYear = document.getElementById('current-month-year');
        
        if (!calendarGrid || !monthYear) return;
        
        // Set month/year header
        monthYear.textContent = date.toLocaleDateString('default', { 
            month: 'long', 
            year: 'numeric' 
        });
        
        // Clear calendar
        calendarGrid.innerHTML = '';
        
        // Add day headers
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });
        
        // Get first day of month
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const startingDay = firstDay.getDay();
        
        // Get last day of month
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Add empty cells for days before first day
        for (let i = 0; i < startingDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyCell);
        }
        
        // Add days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.textContent = day;
            
            // Check if day has events
            const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
            const hasEvents = this.checkDateForEvents(currentDate);
            
            if (hasEvents) {
                dayCell.classList.add('has-event');
                dayCell.title = `${hasEvents} event(s) on this day`;
                
                dayCell.addEventListener('click', () => {
                    this.showEventsForDate(currentDate);
                });
            }
            
            // Highlight today
            const today = new Date();
            if (currentDate.toDateString() === today.toDateString()) {
                dayCell.classList.add('today');
            }
            
            calendarGrid.appendChild(dayCell);
        }
    }

    navigateCalendar(direction) {
        const currentDate = this.currentCalendarDate || new Date();
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1);
        
        this.currentCalendarDate = newDate;
        this.renderCalendar(newDate);
    }

    checkDateForEvents(date) {
        const eventsOnDate = this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === date.toDateString();
        });
        
        return eventsOnDate.length;
    }

    showEventsForDate(date) {
        const eventsOnDate = this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === date.toDateString();
        });
        
        if (eventsOnDate.length === 0) return;
        
        // Show events in a modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'date-events-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Events on ${date.toLocaleDateString()}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="date-events-list">
                        ${eventsOnDate.map(event => `
                            <div class="date-event-item">
                                <h4>${event.title}</h4>
                                <p>${new Date(event.date).toLocaleTimeString()} • ${event.location || 'Online'}</p>
                                <button class="btn btn-sm" onclick="eventsManager.viewEventDetails('${event.id}')">
                                    View Details
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        closeModal('date-events-modal');
    }

    // Countdown Timers
    initCountdownTimers() {
        // Initialize countdown for upcoming events
        this.updateAllCountdowns();
        
        // Update countdowns every second
        setInterval(() => {
            this.updateAllCountdowns();
        }, 1000);
    }

    updateAllCountdowns() {
        document.querySelectorAll('.countdown-timer').forEach(timer => {
            const eventId = timer.dataset.eventId;
            const event = this.events.find(e => e.id === eventId);
            
            if (event) {
                const countdown = this.calculateCountdown(new Date(event.date));
                timer.innerHTML = this.renderCountdown(countdown);
                
                // Update registration button if event is about to start
                if (countdown.days === 0 && countdown.hours === 0 && countdown.minutes < 30) {
                    this.updateRegistrationButton(eventId, 'Starting Soon');
                }
            }
        });
    }

    calculateCountdown(eventDate) {
        const now = new Date();
        const diff = eventDate.getTime() - now.getTime();
        
        if (diff <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        return { days, hours, minutes, seconds, isPast: false };
    }

    renderCountdown(countdown) {
        if (countdown.isPast) {
            return '<span class="countdown-ended">Event Ended</span>';
        }
        
        return `
            <div class="countdown-item">
                <span class="countdown-value">${countdown.days.toString().padStart(2, '0')}</span>
                <span class="countdown-label">Days</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-value">${countdown.hours.toString().padStart(2, '0')}</span>
                <span class="countdown-label">Hours</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-value">${countdown.minutes.toString().padStart(2, '0')}</span>
                <span class="countdown-label">Minutes</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-value">${countdown.seconds.toString().padStart(2, '0')}</span>
                <span class="countdown-label">Seconds</span>
            </div>
        `;
    }

    updateRegistrationButton(eventId, status) {
        const registerBtn = document.querySelector(`.btn-register[data-event-id="${eventId}"]`);
        if (registerBtn && status === 'Starting Soon') {
            registerBtn.innerHTML = '<i class="fas fa-clock"></i> Starting Soon';
            registerBtn.disabled = true;
        }
    }

    // Utility Methods
    loadUserEvents() {
        const registered = localStorage.getItem('registered_events');
        if (registered) {
            try {
                this.registeredEvents = new Set(JSON.parse(registered));
            } catch (error) {
                this.registeredEvents = new Set();
            }
        }
    }

    getCurrentEventId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id') || document.getElementById('event-id')?.value;
    }

    displayCategories() {
        const categoriesContainer = document.querySelector('.categories-tabs');
        if (!categoriesContainer) return;
        
        categoriesContainer.innerHTML = '';
        
        // Add "All" tab
        const allTab = document.createElement('button');
        allTab.className = 'category-tab active';
        allTab.dataset.category = 'all';
        allTab.textContent = 'All Events';
        allTab.addEventListener('click', () => this.filterByCategory('all'));
        categoriesContainer.appendChild(allTab);
        
        // Add category tabs
        this.eventCategories.forEach(category => {
            const tab = document.createElement('button');
            tab.className = 'category-tab';
            tab.dataset.category = category.id;
            tab.innerHTML = `
                <span>${category.name}</span>
                <span class="category-count">${category.count || 0}</span>
            `;
            tab.addEventListener('click', () => this.filterByCategory(category.id));
            categoriesContainer.appendChild(tab);
        });
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }

    formatCurrency(amount) {
        if (amount === 0) return 'Free';
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 0
        }).format(amount);
    }

    showLoading(show) {
        const loading = document.getElementById('events-loading');
        if (loading) {
            loading.style.display = show ? 'block' : 'none';
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div class="error-content">
                <i class="fas fa-exclamation-circle"></i>
                <span>${message}</span>
            </div>
        `;
        
        const eventsGrid = document.getElementById('events-grid');
        if (eventsGrid) {
            eventsGrid.innerHTML = '';
            eventsGrid.appendChild(errorDiv);
        }
    }

    showSampleEvents() {
        const sampleEvents = [
            {
                id: 'sample1',
                title: 'Tech Career Fair 2024',
                description: 'Connect with top tech companies and find your dream job in the technology sector.',
                image: '/assets/images/events/tech-fair.jpg',
                category: 'Career',
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
                location: 'Addis Ababa Exhibition Center',
                price: 0,
                featured: true
            },
            {
                id: 'sample2',
                title: 'Live Web Development Workshop',
                description: 'Hands-on workshop on modern web development techniques and best practices.',
                image: '/assets/images/events/web-workshop.jpg',
                category: 'Workshop',
                date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
                location: 'Online',
                price: 500,
                isLive: true
            }
        ];
        
        this.events = sampleEvents;
        this.categorizeEvents();
        this.displayEvents();
    }

    sendConfirmationEmail(email, eventId) {
        // This would typically be handled by the backend
        console.log('Confirmation email sent to:', email, 'for event:', eventId);
    }

    scheduleCalendarReminder(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;
        
        const eventDate = new Date(event.date);
        const reminderDate = new Date(eventDate.getTime() - (60 * 60 * 1000)); // 1 hour before
        
        // Create calendar event
        const calendarEvent = {
            title: event.title,
            start: eventDate,
            end: new Date(eventDate.getTime() + (2 * 60 * 60 * 1000)), // 2 hours duration
            location: event.location || 'Online',
            description: event.description,
            reminder: reminderDate
        };
        
        // Save to local storage
        const reminders = JSON.parse(localStorage.getItem('event_reminders') || '[]');
        reminders.push(calendarEvent);
        localStorage.setItem('event_reminders', JSON.stringify(reminders));
        
        // Schedule notification
        this.scheduleNotification(calendarEvent);
    }

    scheduleNotification(event) {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }
        
        const now = new Date();
        const timeUntilReminder = event.reminder.getTime() - now.getTime();
        
        if (timeUntilReminder > 0) {
            setTimeout(() => {
                new Notification('Event Reminder', {
                    body: `${event.title} starts in 1 hour!`,
                    icon: '/assets/images/logo.png'
                });
            }, timeUntilReminder);
        }
    }

    addToCalendar() {
        const eventId = this.getCurrentEventId();
        const event = this.events.find(e => e.id === eventId);
        
        if (!event) return;
        
        // Create iCalendar content
        const icsContent = this.generateICS(event);
        
        // Create download link
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${event.title.replace(/\s+/g, '-')}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Calendar event added!', 'success');
    }

    generateICS(event) {
        const eventDate = new Date(event.date);
        const endDate = new Date(eventDate.getTime() + (2 * 60 * 60 * 1000)); // 2 hours
        
        return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ZewedJobs//Events Calendar//EN
BEGIN:VEVENT
UID:${event.id}@zewedjobs.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${eventDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location || 'Online'}
URL:${window.location.href}
END:VEVENT
END:VCALENDAR`;
    }

    trackEvent(category, action, label = '') {
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                'event_category': category,
                'event_label': label
            });
        }
        
        console.log(`[Event Analytics] ${category} - ${action}: ${label}`);
    }

    // Public Methods
    viewEvent(eventId) {
        window.location.href = `/pages/event-details.html?id=${eventId}`;
    }

    viewEventDetails(eventId) {
        this.viewEvent(eventId);
    }

    viewRecording(eventId) {
        window.location.href = `/pages/event-recording.html?id=${eventId}`;
    }

    getRegisteredEvents() {
        return Array.from(this.registeredEvents);
    }

    getUpcomingEvents() {
        return this.upcomingEvents;
    }

    getLiveEvents() {
        return this.liveEvents;
    }

    joinLiveEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;
        
        if (event.isLive) {
            window.location.href = `/pages/live-event.html?id=${eventId}`;
        } else {
            showNotification('This event is not live yet', 'info');
        }
    }
}

// Initialize Events Manager
window.eventsManager = new EventsManager();

// Global helper functions
window.registerForEvent = function(eventId) {
    eventsManager.registerForEvent(eventId);
};

window.joinLiveEvent = function(eventId) {
    eventsManager.joinLiveEvent(eventId);
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventsManager;
}
