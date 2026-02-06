/**
 * ZewedJobs - AI Career Assistant
 * AI-powered chat for career guidance and job recommendations
 */

class AICareerAssistant {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.isTyping = false;
        this.conversationId = null;
        this.initialize();
    }

    initialize() {
        console.log('🤖 AI Career Assistant initialized');
        
        // Initialize chat elements
        this.chatWidget = document.getElementById('ai-widget');
        this.chatContainer = document.querySelector('.ai-chat-container');
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendButton = document.getElementById('send-message');
        
        // Load previous conversation
        this.loadConversation();
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Add welcome message if new conversation
        if (this.messages.length === 0) {
            this.addMessage('ai', this.getWelcomeMessage(), true);
        }
    }

    initEventListeners() {
        // Toggle chat widget
        if (this.chatWidget) {
            this.chatWidget.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleChat();
            });
        }
        
        // Send message on button click
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.sendMessage());
        }
        
        // Send message on Enter key
        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            // Auto-resize textarea
            this.chatInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
        }
        
        // Quick question buttons
        document.querySelectorAll('.quick-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const question = button.getAttribute('data-question');
                this.askQuickQuestion(question);
            });
        });
        
        // Close chat on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeChat();
            }
        });
        
        // Close chat when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && 
                !this.chatContainer?.contains(e.target) && 
                !this.chatWidget?.contains(e.target)) {
                this.closeChat();
            }
        });
    }

    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        this.isOpen = true;
        this.chatContainer.style.display = 'block';
        
        // Animate opening
        setTimeout(() => {
            this.chatContainer.classList.add('active');
            this.chatWidget.classList.add('active');
        }, 10);
        
        // Focus input
        setTimeout(() => {
            if (this.chatInput) {
                this.chatInput.focus();
            }
        }, 300);
        
        // Track event
        this.trackEvent('ai_chat', 'open');
    }

    closeChat() {
        this.chatContainer.classList.remove('active');
        this.chatWidget.classList.remove('active');
        
        setTimeout(() => {
            this.isOpen = false;
            this.chatContainer.style.display = 'none';
        }, 300);
    }

    getWelcomeMessage() {
        const greetings = [
            "Hello! I'm your AI Career Assistant. How can I help you today? 👋",
            "Hi there! I'm here to help with your career journey. What can I assist you with? 💼",
            "Welcome! I'm your AI career guide. Feel free to ask about jobs, skills, or career advice. 🚀",
            "Greetings! I'm excited to help you with your career goals. What would you like to know? 🌟"
        ];
        
        const time = new Date().getHours();
        let timeBasedGreeting = "";
        
        if (time < 12) {
            timeBasedGreeting = "Good morning! ";
        } else if (time < 18) {
            timeBasedGreeting = "Good afternoon! ";
        } else {
            timeBasedGreeting = "Good evening! ";
        }
        
        return timeBasedGreeting + greetings[Math.floor(Math.random() * greetings.length)];
    }

    async sendMessage() {
        const message = this.chatInput?.value.trim();
        
        if (!message || this.isTyping) return;
        
        // Clear input
        if (this.chatInput) {
            this.chatInput.value = '';
            this.chatInput.style.height = 'auto';
        }
        
        // Add user message
        this.addMessage('user', message);
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Get AI response
            const response = await this.getAIResponse(message);
            
            // Remove typing indicator
            this.removeTypingIndicator();
            
            // Add AI response
            this.addMessage('ai', response);
            
            // Save conversation
            this.saveConversation();
            
            // Track event
            this.trackEvent('ai_chat', 'message_sent', 'user');
            
        } catch (error) {
            this.removeTypingIndicator();
            this.addMessage('ai', "I apologize, but I'm having trouble connecting right now. Please try again later.", true);
            console.error('AI Chat Error:', error);
        }
    }

    askQuickQuestion(question) {
        if (this.chatInput) {
            this.chatInput.value = question;
            this.chatInput.focus();
            this.sendMessage();
        }
    }

    async getAIResponse(userMessage) {
        // Check for common questions first
        const quickResponse = this.getQuickResponse(userMessage.toLowerCase());
        if (quickResponse) {
            return new Promise(resolve => {
                setTimeout(() => resolve(quickResponse), 1000);
            });
        }
        
        // API call to backend AI service
        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: userMessage,
                    conversation_id: this.conversationId,
                    context: {
                        user_type: 'job_seeker',
                        platform: 'zewedjobs'
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error('API request failed');
            }
            
            const data = await response.json();
            
            // Store conversation ID if new
            if (data.conversation_id && !this.conversationId) {
                this.conversationId = data.conversation_id;
            }
            
            return data.response || "I'm here to help! Could you provide more details about what you're looking for?";
            
        } catch (error) {
            // Fallback to predefined responses
            return this.getFallbackResponse(userMessage);
        }
    }

    getQuickResponse(message) {
        const quickResponses = {
            // Job search
            'find.*software.*developer.*job': "I can help you find software developer jobs! Here are some current openings:\n\n1. **Senior Software Engineer** at Tech Solutions Inc.\n2. **Full Stack Developer** at Innovation Hub\n3. **Mobile App Developer** at Digital Dreams\n\nWould you like me to search for more specific positions or help you prepare for interviews?",
            'find.*job': "I can help you find jobs! Could you specify:\n1. What type of job are you looking for?\n2. Where do you prefer to work?\n3. What's your experience level?\n\nOr you can browse all jobs on our jobs page!",
            
            // Career advice
            'improve.*cv': "Great question! Here are some tips to improve your CV:\n\n1. **Tailor your CV** for each job application\n2. **Use action verbs** (developed, managed, created)\n3. **Include quantifiable achievements** (increased sales by 20%)\n4. **Keep it concise** (1-2 pages)\n5. **Proofread** carefully\n\nWould you like me to review your CV or help with a specific section?",
            'career.*change.*advice': "Career changes can be exciting! Here's my advice:\n\n1. **Self-assessment**: Identify transferable skills\n2. **Research**: Learn about your target industry\nn3. **Network**: Connect with professionals in the field\n4. **Upskill**: Take relevant courses or certifications\n5. **Start small**: Consider freelance or part-time work first\n\nWhat field are you interested in moving to?",
            
            // Interview prep
            'interview.*tips': "Here are essential interview tips:\n\n1. **Research** the company thoroughly\n2. **Practice** common questions\n3. **Prepare** questions to ask them\n4. **Dress** appropriately\n5. **Arrive** early\n6. **Follow up** with a thank you email\n\nWould you like mock interview practice?",
            
            // Skills development
            'learn.*skill': "Learning new skills is key! Popular skills in demand:\n\n**Technical**:\n- Programming (Python, JavaScript)\n- Data Analysis\n- Digital Marketing\n\n**Soft Skills**:\n- Communication\n- Leadership\n- Problem Solving\n\nWhat skill are you interested in?",
            
            // Salary negotiation
            'salary.*negotiation': "Salary negotiation tips:\n\n1. **Know your worth**: Research market rates\n2. **Consider total compensation**: Benefits, bonuses, flexibility\n3. **Practice** your negotiation conversation\n4. **Be confident** but flexible\n5. **Get offers in writing**\n\nNeed help with a specific offer?",
            
            // General help
            'help': "I can help you with:\n\n🔍 **Job Search** - Find relevant positions\n📄 **CV/Resume** - Improve and tailor\n💼 **Interview Prep** - Practice and tips\n🎓 **Skills Development** - Courses and learning paths\n💰 **Salary Guidance** - Market rates and negotiation\n🏢 **Career Planning** - Long-term strategy\n\nWhat would you like assistance with?",
            
            // Greetings
            'hello|hi|hey': "Hello! 👋 How can I assist you with your career today?",
            'thank you|thanks': "You're welcome! 😊 Is there anything else I can help you with?",
            'bye|goodbye': "Goodbye! Wishing you success in your career journey! 🚀 Don't hesitate to return if you need more help."
        };
        
        for (const [pattern, response] of Object.entries(quickResponses)) {
            const regex = new RegExp(pattern);
            if (regex.test(message)) {
                return response;
            }
        }
        
        return null;
    }

    getFallbackResponse(message) {
        const fallbacks = [
            "That's an interesting question! Could you provide more details so I can give you better assistance?",
            "I understand you're asking about that topic. Let me think about the best way to help you...",
            "I'm continuously learning about career development. Could you rephrase your question or ask something else?",
            "Great question! While I process that, would you like me to help you with job search, CV improvement, or interview preparation?",
            "I'm here to assist with career-related questions. Could you tell me more about what specifically you'd like to know?"
        ];
        
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    addMessage(sender, content, skipAnimation = false) {
        const message = {
            id: Date.now(),
            sender,
            content,
            timestamp: new Date().toISOString()
        };
        
        this.messages.push(message);
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.innerHTML = `
            <div class="avatar">
                ${sender === 'ai' ? '🤖' : '👤'}
            </div>
            <div class="content">
                <p>${this.formatMessageContent(content)}</p>
                <span class="timestamp">${this.formatTime(message.timestamp)}</span>
            </div>
        `;
        
        if (!skipAnimation) {
            messageDiv.classList.add('new');
            setTimeout(() => messageDiv.classList.remove('new'), 100);
        }
        
        if (this.chatMessages) {
            this.chatMessages.appendChild(messageDiv);
            this.scrollToBottom();
        }
        
        return messageDiv;
    }

    formatMessageContent(content) {
        // Convert markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    showTypingIndicator() {
        this.isTyping = true;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai typing';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="avatar">🤖</div>
            <div class="content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        if (this.chatMessages) {
            this.chatMessages.appendChild(typingDiv);
            this.scrollToBottom();
        }
    }

    removeTypingIndicator() {
        this.isTyping = false;
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    scrollToBottom() {
        if (this.chatMessages) {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }

    saveConversation() {
        const conversation = {
            id: this.conversationId || `conv_${Date.now()}`,
            messages: this.messages.slice(-50), // Keep last 50 messages
            updated: new Date().toISOString()
        };
        
        localStorage.setItem('ai_conversation', JSON.stringify(conversation));
        
        // Also save to server if user is logged in
        if (window.app?.currentUser) {
            this.saveToServer(conversation);
        }
    }

    loadConversation() {
        const saved = localStorage.getItem('ai_conversation');
        
        if (saved) {
            try {
                const conversation = JSON.parse(saved);
                this.conversationId = conversation.id;
                this.messages = conversation.messages || [];
                
                // Display loaded messages
                if (this.chatMessages && this.messages.length > 0) {
                    this.chatMessages.innerHTML = '';
                    this.messages.forEach(msg => {
                        this.addMessage(msg.sender, msg.content, true);
                    });
                    this.scrollToBottom();
                }
            } catch (error) {
                console.error('Error loading conversation:', error);
                this.messages = [];
            }
        }
    }

    async saveToServer(conversation) {
        try {
            await fetch('/api/ai/conversation/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.app.currentUser.token}`
                },
                body: JSON.stringify(conversation)
            });
        } catch (error) {
            console.error('Error saving conversation to server:', error);
        }
    }

    clearConversation() {
        this.messages = [];
        this.conversationId = null;
        
        if (this.chatMessages) {
            this.chatMessages.innerHTML = '';
        }
        
        localStorage.removeItem('ai_conversation');
        
        // Add welcome message
        this.addMessage('ai', this.getWelcomeMessage(), true);
        
        // Track event
        this.trackEvent('ai_chat', 'clear_conversation');
    }

    suggestJobsBasedOnConversation() {
        // Analyze conversation to suggest relevant jobs
        const conversationText = this.messages
            .map(msg => msg.content)
            .join(' ')
            .toLowerCase();
        
        const jobKeywords = {
            'software': ['developer', 'engineer', 'programmer'],
            'marketing': ['marketer', 'digital', 'social media'],
            'finance': ['accountant', 'analyst', 'banking'],
            'design': ['designer', 'ui', 'ux', 'graphic'],
            'management': ['manager', 'lead', 'director'],
            'sales': ['sales', 'business development', 'account executive']
        };
        
        let suggestedJobs = [];
        
        for (const [field, keywords] of Object.entries(jobKeywords)) {
            if (keywords.some(keyword => conversationText.includes(keyword))) {
                suggestedJobs.push(...this.getSampleJobs(field));
            }
        }
        
        // If no specific field found, suggest popular jobs
        if (suggestedJobs.length === 0) {
            suggestedJobs = this.getSampleJobs('general');
        }
        
        return suggestedJobs.slice(0, 3); // Return top 3
    }

    getSampleJobs(field) {
        const jobs = {
            'software': [
                { title: 'Senior Software Engineer', company: 'TechCorp', location: 'Addis Ababa' },
                { title: 'Frontend Developer', company: 'Digital Solutions', location: 'Remote' },
                { title: 'Mobile App Developer', company: 'Innovate Ethiopia', location: 'Addis Ababa' }
            ],
            'marketing': [
                { title: 'Digital Marketing Manager', company: 'Brand Ethiopia', location: 'Addis Ababa' },
                { title: 'Social Media Specialist', company: 'Creative Agency', location: 'Remote' },
                { title: 'Content Marketing Lead', company: 'Media House', location: 'Addis Ababa' }
            ],
            'general': [
                { title: 'Project Coordinator', company: 'Development Org', location: 'Addis Ababa' },
                { title: 'Customer Service Rep', company: 'Service Company', location: 'Remote' },
                { title: 'Administrative Assistant', company: 'Various Companies', location: 'Multiple' }
            ]
        };
        
        return jobs[field] || jobs['general'];
    }

    trackEvent(action, category, label = '') {
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                'event_category': category,
                'event_label': label
            });
        }
        
        console.log(`[AI Analytics] ${category} - ${action}: ${label}`);
    }

    // Advanced Features
    async analyzeResume(file) {
        const formData = new FormData();
        formData.append('resume', file);
        
        try {
            const response = await fetch('/api/ai/analyze-resume', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const analysis = await response.json();
                return this.formatResumeAnalysis(analysis);
            }
        } catch (error) {
            console.error('Resume analysis error:', error);
        }
        
        return "I couldn't analyze your resume at the moment. Please try again later or paste your resume text here.";
    }

    formatResumeAnalysis(analysis) {
        return `
📋 **Resume Analysis Results**:

**Overall Score**: ${analysis.score}/100

**Strengths**: 
${analysis.strengths.map(s => `✓ ${s}`).join('\n')}

**Areas for Improvement**:
${analysis.improvements.map(i => `⚠️ ${i}`).join('\n')}

**Keyword Suggestions**:
${analysis.keywords.map(k => `#${k}`).join(' ')}

**Actionable Tips**:
${analysis.tips.map(t => `• ${t}`).join('\n')}
        `;
    }

    async getCareerPath(skills, interests) {
        try {
            const response = await fetch('/api/ai/career-path', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skills, interests })
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Career path analysis error:', error);
        }
        
        return "I can suggest career paths based on your skills and interests. Could you tell me more about what you enjoy doing?";
    }

    // Export conversation
    exportConversation(format = 'text') {
        const exportData = {
            conversation_id: this.conversationId,
            messages: this.messages,
            exported_at: new Date().toISOString()
        };
        
        let content = '';
        
        if (format === 'text') {
            content = `AI Career Assistant Conversation\n`;
            content += `Exported: ${new Date().toLocaleString()}\n\n`;
            
            this.messages.forEach(msg => {
                const sender = msg.sender === 'ai' ? 'AI Assistant' : 'You';
                content += `${sender} (${this.formatTime(msg.timestamp)}):\n`;
                content += `${msg.content}\n\n`;
            });
        } else if (format === 'json') {
            content = JSON.stringify(exportData, null, 2);
        }
        
        // Create download
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-conversation-${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.trackEvent('ai_chat', 'export_conversation', format);
    }
}

// Initialize AI Assistant
window.aiAssistant = new AICareerAssistant();

// Global helper functions
window.openAIChat = function() {
    window.aiAssistant.openChat();
};

window.askAI = function(question) {
    window.aiAssistant.openChat();
    if (window.aiAssistant.chatInput) {
        window.aiAssistant.chatInput.value = question;
        setTimeout(() => window.aiAssistant.sendMessage(), 100);
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AICareerAssistant;
}
