/**
 * ZewedJobs - Courses Management
 * Course browsing, enrollment, learning management
 */

class CourseManager {
    constructor() {
        this.courses = [];
        this.enrolledCourses = new Set();
        this.completedCourses = new Set();
        this.currentCourse = null;
        this.learningProgress = {};
        this.courseCategories = [];
        this.initialize();
    }

    initialize() {
        console.log('📚 Course Manager initialized');
        
        // Load user's course data
        this.loadUserCourses();
        
        // Initialize course components
        this.initCourseFilters();
        this.initCourseCards();
        this.initEnrollment();
        this.initLearningProgress();
        this.initCoursePlayer();
        this.initCertificates();
        
        // Load courses
        this.loadCourses();
        this.loadCategories();
    }

    // Course Loading
    async loadCourses(filters = {}) {
        try {
            // Show loading state
            this.showLoading(true);
            
            // Build query parameters
            const params = new URLSearchParams();
            
            // Add filters
            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    params.append(key, value);
                }
            });
            
            // API call
            const response = await fetch(`/api/courses?${params.toString()}`);
            
            if (response.ok) {
                const data = await response.json();
                this.courses = data.courses || [];
                this.displayCourses();
            } else {
                throw new Error('Failed to load courses');
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            this.showError('Failed to load courses. Please try again.');
            this.showSampleCourses();
        } finally {
            this.showLoading(false);
        }
    }

    async loadCategories() {
        try {
            const response = await fetch('/api/courses/categories');
            if (response.ok) {
                this.courseCategories = await response.json();
                this.displayCategories();
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    displayCourses() {
        const coursesGrid = document.getElementById('courses-grid');
        if (!coursesGrid) return;
        
        coursesGrid.innerHTML = '';
        
        if (this.courses.length === 0) {
            coursesGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📚</div>
                    <h3>No courses found</h3>
                    <p>Try adjusting your filters or check back later</p>
                </div>
            `;
            return;
        }
        
        this.courses.forEach(course => {
            const courseCard = this.createCourseCard(course);
            coursesGrid.appendChild(courseCard);
        });
    }

    createCourseCard(course) {
        const card = document.createElement('div');
        card.className = 'course-card';
        if (course.featured) card.classList.add('featured');
        
        const isEnrolled = this.enrolledCourses.has(course.id);
        const progress = this.learningProgress[course.id] || 0;
        const isCompleted = this.completedCourses.has(course.id);
        
        card.innerHTML = `
            <div class="course-image">
                <img src="${course.image || '/assets/images/default-course.jpg'}" 
                     alt="${course.title}"
                     loading="lazy">
                <span class="course-level">${course.level || 'All Levels'}</span>
                ${course.featured ? '<span class="featured-badge">Featured</span>' : ''}
            </div>
            
            <div class="course-content">
                <span class="course-category">${course.category || 'General'}</span>
                
                <h3 class="course-title">${course.title}</h3>
                
                <p class="course-description">${this.truncateText(course.description, 100)}</p>
                
                <div class="course-meta">
                    <div class="course-duration">
                        <i class="far fa-clock"></i>
                        <span>${course.duration || 'Self-paced'}</span>
                    </div>
                    <div class="course-students">
                        <i class="fas fa-users"></i>
                        <span>${this.formatNumber(course.enrolled || 0)} students</span>
                    </div>
                    <div class="course-rating">
                        <i class="fas fa-star"></i>
                        <span>${course.rating || '4.5'}</span>
                    </div>
                </div>
                
                ${isEnrolled ? `
                    <div class="course-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <span class="progress-text">${progress}% Complete</span>
                    </div>
                ` : ''}
                
                <div class="course-footer">
                    <div class="course-price">
                        ${course.price === 0 || course.price === 'Free' ? 
                            '<span class="free">Free</span>' : 
                            `<span>${this.formatCurrency(course.price)}</span>`}
                    </div>
                    
                    <div class="course-actions">
                        ${isEnrolled ? `
                            <button class="btn-continue" onclick="courseManager.continueCourse('${course.id}')">
                                ${isCompleted ? 'Review' : 'Continue'}
                            </button>
                        ` : `
                            <button class="btn-enroll" onclick="courseManager.enrollInCourse('${course.id}')">
                                Enroll Now
                            </button>
                        `}
                        <button class="btn-preview" onclick="courseManager.previewCourse('${course.id}')">
                            Preview
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    }

    // Course Filtering
    initCourseFilters() {
        // Category tabs
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.filterByCategory(tab.dataset.category);
            });
        });
        
        // Level filter
        const levelFilter = document.getElementById('filter-level');
        if (levelFilter) {
            levelFilter.addEventListener('change', (e) => {
                this.filterByLevel(e.target.value);
            });
        }
        
        // Price filter
        const priceFilter = document.getElementById('filter-price');
        if (priceFilter) {
            priceFilter.addEventListener('change', (e) => {
                this.filterByPrice(e.target.value);
            });
        }
        
        // Sort filter
        const sortFilter = document.getElementById('sort-courses');
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.sortCourses(e.target.value);
            });
        }
        
        // Search input
        const searchInput = document.getElementById('course-search');
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                this.searchCourses(e.target.value);
            }, 300));
        }
    }

    filterByCategory(category) {
        // Update active tab
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`.category-tab[data-category="${category}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Load courses with filter
        this.loadCourses({ category: category === 'all' ? '' : category });
    }

    filterByLevel(level) {
        this.loadCourses({ level: level === 'all' ? '' : level });
    }

    filterByPrice(price) {
        this.loadCourses({ price: price === 'all' ? '' : price });
    }

    sortCourses(sortBy) {
        this.loadCourses({ sort: sortBy });
    }

    searchCourses(query) {
        if (query.length < 2) {
            this.loadCourses();
            return;
        }
        
        this.loadCourses({ search: query });
    }

    // Course Enrollment
    initEnrollment() {
        const enrollBtn = document.getElementById('enroll-btn');
        if (enrollBtn) {
            enrollBtn.addEventListener('click', async () => {
                const courseId = this.getCurrentCourseId();
                if (courseId) {
                    await this.enrollInCourse(courseId);
                }
            });
        }
    }

    async enrollInCourse(courseId) {
        if (!window.userAuth?.isAuthenticated) {
            showNotification('Please login to enroll in courses', 'warning');
            openModal('auth-modal');
            return;
        }
        
        const course = this.courses.find(c => c.id === courseId);
        if (!course) return;
        
        // Check if free course
        if (course.price > 0) {
            // Redirect to payment
            window.location.href = `/pages/payment.html?type=course&id=${courseId}&amount=${course.price}`;
            return;
        }
        
        try {
            const response = await fetch('/api/courses/enroll', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.userAuth.authToken}`
                },
                body: JSON.stringify({ courseId })
            });
            
            if (response.ok) {
                this.enrolledCourses.add(courseId);
                this.updateEnrollmentUI(courseId, true);
                showNotification('Successfully enrolled in the course!', 'success');
                
                // Track enrollment
                this.trackEvent('course', 'enrolled', course.title);
                
                // Redirect to course page
                setTimeout(() => {
                    window.location.href = `/pages/course-details.html?id=${courseId}`;
                }, 1000);
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Enrollment failed');
            }
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    updateEnrollmentUI(courseId, isEnrolled) {
        // Update course card
        const courseCard = document.querySelector(`.course-card[data-course-id="${courseId}"]`);
        if (courseCard) {
            const actionsDiv = courseCard.querySelector('.course-actions');
            if (actionsDiv) {
                actionsDiv.innerHTML = isEnrolled ? `
                    <button class="btn-continue" onclick="courseManager.continueCourse('${courseId}')">
                        Continue
                    </button>
                ` : `
                    <button class="btn-enroll" onclick="courseManager.enrollInCourse('${courseId}')">
                        Enroll Now
                    </button>
                    <button class="btn-preview" onclick="courseManager.previewCourse('${courseId}')">
                        Preview
                    </button>
                `;
            }
        }
        
        // Update enrollment button on course detail page
        const enrollBtn = document.getElementById('enroll-btn');
        if (enrollBtn && this.getCurrentCourseId() === courseId) {
            if (isEnrolled) {
                enrollBtn.textContent = 'Continue Learning';
                enrollBtn.onclick = () => this.continueCourse(courseId);
            }
        }
    }

    // Learning Progress
    initLearningProgress() {
        this.loadLearningProgress();
        
        // Mark lesson as completed
        document.addEventListener('lessonCompleted', (e) => {
            this.markLessonComplete(e.detail.courseId, e.detail.lessonId);
        });
        
        // Track video progress
        document.addEventListener('videoProgress', (e) => {
            this.updateVideoProgress(e.detail.courseId, e.detail.lessonId, e.detail.progress);
        });
    }

    loadLearningProgress() {
        const progressData = localStorage.getItem('learning_progress');
        if (progressData) {
            try {
                this.learningProgress = JSON.parse(progressData);
            } catch (error) {
                this.learningProgress = {};
            }
        }
        
        // Load from server if authenticated
        if (window.userAuth?.isAuthenticated) {
            this.loadServerProgress();
        }
    }

    async loadServerProgress() {
        try {
            const response = await fetch('/api/courses/progress', {
                headers: {
                    'Authorization': `Bearer ${window.userAuth.authToken}`
                }
            });
            
            if (response.ok) {
                const serverProgress = await response.json();
                this.learningProgress = { ...this.learningProgress, ...serverProgress };
                
                // Update completed courses
                Object.entries(this.learningProgress).forEach(([courseId, progress]) => {
                    if (progress === 100) {
                        this.completedCourses.add(courseId);
                    }
                });
            }
        } catch (error) {
            console.error('Error loading server progress:', error);
        }
    }

    saveLearningProgress() {
        localStorage.setItem('learning_progress', JSON.stringify(this.learningProgress));
        
        // Save to server if authenticated
        if (window.userAuth?.isAuthenticated) {
            this.saveProgressToServer();
        }
    }

    async saveProgressToServer() {
        try {
            await fetch('/api/courses/progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.userAuth.authToken}`
                },
                body: JSON.stringify(this.learningProgress)
            });
        } catch (error) {
            console.error('Error saving progress to server:', error);
        }
    }

    markLessonComplete(courseId, lessonId) {
        if (!this.learningProgress[courseId]) {
            this.learningProgress[courseId] = 0;
        }
        
        // Calculate new progress
        const course = this.courses.find(c => c.id === courseId);
        if (course && course.lessons) {
            const totalLessons = course.lessons.length;
            const completedLessons = course.lessons.filter(lesson => 
                lesson.completed || lesson.id === lessonId
            ).length;
            
            const newProgress = Math.round((completedLessons / totalLessons) * 100);
            this.learningProgress[courseId] = newProgress;
            
            // Check if course is completed
            if (newProgress === 100) {
                this.completeCourse(courseId);
            }
            
            this.saveLearningProgress();
            this.updateProgressUI(courseId, newProgress);
            
            showNotification('Lesson marked as complete!', 'success');
        }
    }

    updateVideoProgress(courseId, lessonId, progress) {
        // Save video progress locally
        const videoProgressKey = `video_progress_${courseId}_${lessonId}`;
        localStorage.setItem(videoProgressKey, progress.toString());
    }

    completeCourse(courseId) {
        this.completedCourses.add(courseId);
        
        // Show completion modal
        this.showCompletionModal(courseId);
        
        // Generate certificate
        this.generateCertificate(courseId);
        
        // Track completion
        this.trackEvent('course', 'completed', courseId);
    }

    // Course Player
    initCoursePlayer() {
        // Video player controls
        const videoPlayer = document.getElementById('course-video');
        if (videoPlayer) {
            videoPlayer.addEventListener('timeupdate', () => {
                this.updateVideoTime(videoPlayer);
            });
            
            videoPlayer.addEventListener('ended', () => {
                this.markVideoComplete();
            });
        }
        
        // Play/pause button
        const playBtn = document.getElementById('play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.toggleVideoPlayback();
            });
        }
        
        // Fullscreen button
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
        
        // Speed control
        const speedSelect = document.getElementById('speed-select');
        if (speedSelect) {
            speedSelect.addEventListener('change', (e) => {
                this.setPlaybackSpeed(parseFloat(e.target.value));
            });
        }
        
        // Navigation between lessons
        const prevLessonBtn = document.getElementById('prev-lesson');
        const nextLessonBtn = document.getElementById('next-lesson');
        
        if (prevLessonBtn) {
            prevLessonBtn.addEventListener('click', () => {
                this.navigateToPreviousLesson();
            });
        }
        
        if (nextLessonBtn) {
            nextLessonBtn.addEventListener('click', () => {
                this.navigateToNextLesson();
            });
        }
    }

    updateVideoTime(videoPlayer) {
        const currentTime = document.getElementById('current-time');
        const progressBar = document.getElementById('video-progress');
        
        if (currentTime) {
            currentTime.textContent = this.formatTime(videoPlayer.currentTime);
        }
        
        if (progressBar) {
            const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
            progressBar.style.width = `${progress}%`;
        }
    }

    markVideoComplete() {
        const courseId = this.getCurrentCourseId();
        const lessonId = this.getCurrentLessonId();
        
        if (courseId && lessonId) {
            const event = new CustomEvent('lessonCompleted', {
                detail: { courseId, lessonId }
            });
            document.dispatchEvent(event);
        }
    }

    toggleVideoPlayback() {
        const videoPlayer = document.getElementById('course-video');
        const playBtn = document.getElementById('play-btn');
        
        if (videoPlayer.paused) {
            videoPlayer.play();
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            videoPlayer.pause();
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }

    toggleFullscreen() {
        const playerContainer = document.querySelector('.video-player-container');
        
        if (!document.fullscreenElement) {
            playerContainer.requestFullscreen().catch(err => {
                console.error('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    setPlaybackSpeed(speed) {
        const videoPlayer = document.getElementById('course-video');
        if (videoPlayer) {
            videoPlayer.playbackRate = speed;
        }
    }

    navigateToPreviousLesson() {
        const currentLessonId = this.getCurrentLessonId();
        const courseId = this.getCurrentCourseId();
        
        if (!courseId || !currentLessonId) return;
        
        const course = this.courses.find(c => c.id === courseId);
        if (!course || !course.lessons) return;
        
        const currentIndex = course.lessons.findIndex(lesson => lesson.id === currentLessonId);
        if (currentIndex > 0) {
            const prevLesson = course.lessons[currentIndex - 1];
            this.loadLesson(prevLesson.id);
        }
    }

    navigateToNextLesson() {
        const currentLessonId = this.getCurrentLessonId();
        const courseId = this.getCurrentCourseId();
        
        if (!courseId || !currentLessonId) return;
        
        const course = this.courses.find(c => c.id === courseId);
        if (!course || !course.lessons) return;
        
        const currentIndex = course.lessons.findIndex(lesson => lesson.id === currentLessonId);
        if (currentIndex < course.lessons.length - 1) {
            const nextLesson = course.lessons[currentIndex + 1];
            this.loadLesson(nextLesson.id);
        }
    }

    // Certificates
    initCertificates() {
        const downloadBtn = document.getElementById('download-certificate');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadCertificate();
            });
        }
        
        const shareBtn = document.getElementById('share-certificate');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareCertificate();
            });
        }
        
        const verifyBtn = document.getElementById('verify-certificate');
        if (verifyBtn) {
            verifyBtn.addEventListener('click', () => {
                this.verifyCertificate();
            });
        }
    }

    async generateCertificate(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course) return;
        
        const certificate = {
            id: `CERT-${Date.now()}-${courseId}`,
            courseId: courseId,
            courseTitle: course.title,
            studentName: window.userAuth?.currentUser?.name || 'Student',
            issueDate: new Date().toISOString(),
            completionDate: new Date().toISOString(),
            certificateUrl: `/certificates/${courseId}/${window.userAuth?.currentUser?.id}`
        };
        
        // Save certificate
        this.saveCertificate(certificate);
        
        // Show certificate notification
        showNotification('Certificate generated! Download your certificate now.', 'success');
        
        return certificate;
    }

    saveCertificate(certificate) {
        const certificates = JSON.parse(localStorage.getItem('certificates') || '[]');
        certificates.push(certificate);
        localStorage.setItem('certificates', JSON.stringify(certificates));
        
        // Save to server if authenticated
        if (window.userAuth?.isAuthenticated) {
            this.saveCertificateToServer(certificate);
        }
    }

    async saveCertificateToServer(certificate) {
        try {
            await fetch('/api/courses/certificates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.userAuth.authToken}`
                },
                body: JSON.stringify(certificate)
            });
        } catch (error) {
            console.error('Error saving certificate:', error);
        }
    }

    downloadCertificate() {
        const certificateId = this.getCurrentCertificateId();
        if (!certificateId) return;
        
        const certificate = this.getCertificateById(certificateId);
        if (!certificate) return;
        
        // Generate PDF certificate
        this.generateCertificatePDF(certificate);
    }

    generateCertificatePDF(certificate) {
        // Use a PDF generation library or service
        // This is a simplified example
        const certificateContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Certificate of Completion</title>
                <style>
                    body { 
                        font-family: 'Times New Roman', Times, serif;
                        margin: 0;
                        padding: 0;
                        background: linear-gradient(to bottom, #f0f0f0, #ffffff);
                    }
                    .certificate {
                        width: 800px;
                        height: 600px;
                        margin: 0 auto;
                        background: white;
                        border: 20px solid #2c3e50;
                        position: relative;
                        text-align: center;
                    }
                    .header {
                        padding: 40px 0 20px;
                        border-bottom: 2px solid #2c3e50;
                    }
                    .header h1 {
                        color: #2c3e50;
                        font-size: 48px;
                        margin: 0;
                    }
                    .header h2 {
                        color: #e74c3c;
                        font-size: 24px;
                        margin: 10px 0;
                    }
                    .content {
                        padding: 40px;
                    }
                    .student-name {
                        font-size: 36px;
                        color: #2c3e50;
                        margin: 20px 0;
                        text-transform: uppercase;
                    }
                    .course-title {
                        font-size: 24px;
                        color: #34495e;
                        margin: 20px 0;
                    }
                    .details {
                        margin: 30px 0;
                        font-size: 18px;
                        color: #7f8c8d;
                    }
                    .signatures {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 60px;
                        padding: 0 50px;
                    }
                    .signature {
                        text-align: center;
                    }
                    .signature-line {
                        width: 200px;
                        border-top: 1px solid #2c3e50;
                        margin: 60px auto 10px;
                    }
                    .certificate-id {
                        position: absolute;
                        bottom: 20px;
                        right: 20px;
                        font-size: 12px;
                        color: #95a5a6;
                    }
                </style>
            </head>
            <body>
                <div class="certificate">
                    <div class="header">
                        <h1>CERTIFICATE OF COMPLETION</h1>
                        <h2>ZewedJobs Academy</h2>
                    </div>
                    
                    <div class="content">
                        <p>This certifies that</p>
                        <div class="student-name">${certificate.studentName}</div>
                        <p>has successfully completed the course</p>
                        <div class="course-title">"${certificate.courseTitle}"</div>
                        
                        <div class="details">
                            <p>Date of Completion: ${new Date(certificate.completionDate).toLocaleDateString()}</p>
                            <p>Certificate ID: ${certificate.id}</p>
                        </div>
                        
                        <div class="signatures">
                            <div class="signature">
                                <div class="signature-line"></div>
                                <p>Director of Education</p>
                                <p>ZewedJobs Academy</p>
                            </div>
                            <div class="signature">
                                <div class="signature-line"></div>
                                <p>Head Instructor</p>
                                <p>${certificate.courseTitle}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="certificate-id">
                        Verify at: https://zewedjobs.com/verify/${certificate.id}
                    </div>
                </div>
            </body>
            </html>
        `;
        
        // Open in new window for printing/download
        const printWindow = window.open('', '_blank');
        printWindow.document.write(certificateContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Auto-print after loading
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }

    shareCertificate() {
        const certificateId = this.getCurrentCertificateId();
        if (!certificateId) return;
        
        const certificate = this.getCertificateById(certificateId);
        if (!certificate) return;
        
        const shareText = `I just completed "${certificate.courseTitle}" on ZewedJobs! Check out my certificate:`;
        const shareUrl = `https://zewedjobs.com/certificates/${certificateId}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'My ZewedJobs Certificate',
                text: shareText,
                url: shareUrl
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
                .then(() => showNotification('Certificate link copied to clipboard!', 'success'))
                .catch(() => showNotification('Could not share certificate', 'error'));
        }
    }

    verifyCertificate() {
        const certificateId = prompt('Enter Certificate ID to verify:');
        if (!certificateId) return;
        
        window.open(`/verify/${certificateId}`, '_blank');
    }

    // UI Helpers
    displayCategories() {
        const categoriesContainer = document.querySelector('.categories-tabs');
        if (!categoriesContainer) return;
        
        // Clear existing categories
        categoriesContainer.innerHTML = '';
        
        // Add "All" tab
        const allTab = document.createElement('button');
        allTab.className = 'category-tab active';
        allTab.dataset.category = 'all';
        allTab.textContent = 'All Categories';
        allTab.addEventListener('click', () => this.filterByCategory('all'));
        categoriesContainer.appendChild(allTab);
        
        // Add category tabs
        this.courseCategories.forEach(category => {
            const tab = document.createElement('button');
            tab.className = 'category-tab';
            tab.dataset.category = category.id;
            tab.innerHTML = `
                <i class="${category.icon || 'fas fa-folder'}"></i>
                <span>${category.name}</span>
                <span class="category-count">${category.count || 0}</span>
            `;
            tab.addEventListener('click', () => this.filterByCategory(category.id));
            categoriesContainer.appendChild(tab);
        });
    }

    updateProgressUI(courseId, progress) {
        // Update progress bar on course card
        const courseCard = document.querySelector(`.course-card[data-course-id="${courseId}"]`);
        if (courseCard) {
            const progressBar = courseCard.querySelector('.progress-fill');
            const progressText = courseCard.querySelector('.progress-text');
            
            if (progressBar) progressBar.style.width = `${progress}%`;
            if (progressText) progressText.textContent = `${progress}% Complete`;
        }
        
        // Update progress on course detail page
        if (this.getCurrentCourseId() === courseId) {
            const progressBar = document.getElementById('course-progress-bar');
            const progressText = document.getElementById('course-progress-text');
            
            if (progressBar) progressBar.style.width = `${progress}%`;
            if (progressText) progressText.textContent = `${progress}% Complete`;
        }
    }

    showCompletionModal(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'completion-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🎉 Course Completed!</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="completion-content">
                        <div class="completion-icon">🏆</div>
                        <h2>Congratulations!</h2>
                        <p>You have successfully completed <strong>"${course.title}"</strong></p>
                        
                        <div class="completion-stats">
                            <div class="stat">
                                <div class="stat-value">100%</div>
                                <div class="stat-label">Completion</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">${course.duration || 'N/A'}</div>
                                <div class="stat-label">Duration</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">${course.lessons?.length || 0}</div>
                                <div class="stat-label">Lessons</div>
                            </div>
                        </div>
                        
                        <div class="completion-actions">
                            <button class="btn btn-primary" onclick="courseManager.downloadCertificate()">
                                <i class="fas fa-download"></i> Download Certificate
                            </button>
                            <button class="btn btn-outline" onclick="courseManager.shareCertificate()">
                                <i class="fas fa-share-alt"></i> Share Achievement
                            </button>
                        </div>
                        
                        <div class="suggested-courses">
                            <h4>Continue Learning</h4>
                            <p>Check out these related courses:</p>
                            <div class="suggestions-list"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        closeModal('completion-modal');
        
        // Load suggested courses
        this.loadSuggestedCourses(courseId, modal);
    }

    loadSuggestedCourses(courseId, modal) {
        const suggestionsList = modal.querySelector('.suggestions-list');
        if (!suggestionsList) return;
        
        // Find related courses (same category or similar tags)
        const currentCourse = this.courses.find(c => c.id === courseId);
        if (!currentCourse) return;
        
        const relatedCourses = this.courses.filter(c => 
            c.id !== courseId && 
            (c.category === currentCourse.category || 
             c.tags?.some(tag => currentCourse.tags?.includes(tag)))
        ).slice(0, 3);
        
        if (relatedCourses.length === 0) return;
        
        relatedCourses.forEach(course => {
            const suggestion = document.createElement('div');
            suggestion.className = 'suggestion-item';
            suggestion.innerHTML = `
                <h5>${course.title}</h5>
                <p>${this.truncateText(course.description, 60)}</p>
                <button class="btn btn-sm" onclick="courseManager.viewCourse('${course.id}')">
                    View Course
                </button>
            `;
            suggestionsList.appendChild(suggestion);
        });
    }

    // Utility Methods
    loadUserCourses() {
        const enrolled = localStorage.getItem('enrolled_courses');
        const completed = localStorage.getItem('completed_courses');
        const progress = localStorage.getItem('learning_progress');
        
        if (enrolled) {
            try {
                this.enrolledCourses = new Set(JSON.parse(enrolled));
            } catch (error) {
                this.enrolledCourses = new Set();
            }
        }
        
        if (completed) {
            try {
                this.completedCourses = new Set(JSON.parse(completed));
            } catch (error) {
                this.completedCourses = new Set();
            }
        }
        
        if (progress) {
            try {
                this.learningProgress = JSON.parse(progress);
            } catch (error) {
                this.learningProgress = {};
            }
        }
    }

    getCurrentCourseId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id') || document.getElementById('course-id')?.value;
    }

    getCurrentLessonId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('lesson') || document.getElementById('lesson-id')?.value;
    }

    getCurrentCertificateId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('certificate') || document.getElementById('certificate-id')?.value;
    }

    getCertificateById(certificateId) {
        const certificates = JSON.parse(localStorage.getItem('certificates') || '[]');
        return certificates.find(cert => cert.id === certificateId);
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }

    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    formatCurrency(amount) {
        if (amount === 0) return 'Free';
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 0
        }).format(amount);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showLoading(show) {
        const loading = document.getElementById('courses-loading');
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
        
        const coursesGrid = document.getElementById('courses-grid');
        if (coursesGrid) {
            coursesGrid.innerHTML = '';
            coursesGrid.appendChild(errorDiv);
        }
    }

    showSampleCourses() {
        const sampleCourses = [
            {
                id: 'sample1',
                title: 'Introduction to Web Development',
                description: 'Learn the basics of HTML, CSS, and JavaScript to start your web development journey.',
                image: '/assets/images/courses/web-dev.jpg',
                category: 'Technology',
                level: 'Beginner',
                duration: '8 hours',
                enrolled: 1250,
                rating: 4.7,
                price: 0,
                featured: true
            },
            {
                id: 'sample2',
                title: 'Digital Marketing Fundamentals',
                description: 'Master the essentials of digital marketing including SEO, social media, and content marketing.',
                image: '/assets/images/courses/digital-marketing.jpg',
                category: 'Marketing',
                level: 'Beginner',
                duration: '10 hours',
                enrolled: 890,
                rating: 4.5,
                price: 1500,
                featured: false
            }
        ];
        
        this.courses = sampleCourses;
        this.displayCourses();
    }

    trackEvent(category, action, label = '') {
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                'event_category': category,
                'event_label': label
            });
        }
        
        console.log(`[Course Analytics] ${category} - ${action}: ${label}`);
    }

    // Public Methods
    async previewCourse(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course) return;
        
        // Show preview modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'preview-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${course.title} - Preview</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="preview-video">
                        <video controls style="width: 100%;">
                            <source src="${course.previewVideo || '/assets/videos/course-preview.mp4'}" type="video/mp4">
                        </video>
                    </div>
                    <div class="preview-content">
                        <h4>What you'll learn</h4>
                        <ul>
                            ${course.learningObjectives ? course.learningObjectives.map(obj => 
                                `<li>${obj}</li>`
                            ).join('') : '<li>No learning objectives specified</li>'}
                        </ul>
                        
                        <div class="preview-actions">
                            <button class="btn btn-primary" onclick="courseManager.enrollInCourse('${courseId}')">
                                Enroll Now
                            </button>
                            <button class="btn btn-outline" onclick="closeModal('preview-modal')">
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        closeModal('preview-modal');
    }

    continueCourse(courseId) {
        window.location.href = `/pages/course-details.html?id=${courseId}`;
    }

    viewCourse(courseId) {
        window.location.href = `/pages/course-details.html?id=${courseId}`;
    }

    loadLesson(lessonId) {
        const url = new URL(window.location.href);
        url.searchParams.set('lesson', lessonId);
        window.location.href = url.toString();
    }

    getEnrolledCourses() {
        return Array.from(this.enrolledCourses);
    }

    getCompletedCourses() {
        return Array.from(this.completedCourses);
    }

    getCourseProgress(courseId) {
        return this.learningProgress[courseId] || 0;
    }
}

// Initialize Course Manager
window.courseManager = new CourseManager();

// Global helper functions
window.enrollInCourse = function(courseId) {
    courseManager.enrollInCourse(courseId);
};

window.previewCourse = function(courseId) {
    courseManager.previewCourse(courseId);
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CourseManager;
}
