/**
 * ZewedJobs - Job Search & Management
 * Dynamic job listing, search, filtering, and application management
 */

class JobSearchManager {
    constructor() {
        this.jobs = [];
        this.filteredJobs = [];
        this.currentFilters = {
            category: [],
            location: [],
            type: [],
            salary: { min: 0, max: 1000000 },
            experience: [],
            posted: 'any',
            remote: false
        };
        this.currentPage = 1;
        this.jobsPerPage = 12;
        this.sortBy = 'recent';
        this.savedJobs = new Set();
        this.appliedJobs = new Set();
        this.initialize();
    }

    initialize() {
        console.log('🔍 Job Search Manager initialized');
        
        // Load saved and applied jobs
        this.loadSavedJobs();
        this.loadAppliedJobs();
        
        // Initialize job search
        this.initSearch();
        this.initFilters();
        this.initSorting();
        this.initJobActions();
        
        // Load initial jobs
        this.loadJobs();
    }

    // Job Loading
    async loadJobs(filters = {}) {
        try {
            // Show loading state
            this.showLoading(true);
            
            // Build query parameters
            const params = new URLSearchParams();
            
            // Add filters
            Object.entries({ ...this.currentFilters, ...filters }).forEach(([key, value]) => {
                if (Array.isArray(value) && value.length > 0) {
                    params.append(key, value.join(','));
                } else if (typeof value === 'object' && value !== null) {
                    if (value.min) params.append(`${key}_min`, value.min);
                    if (value.max) params.append(`${key}_max`, value.max);
                } else if (value && value !== 'any') {
                    params.append(key, value);
                }
            });
            
            // Add sorting and pagination
            params.append('sort', this.sortBy);
            params.append('page', this.currentPage);
            params.append('limit', this.jobsPerPage);
            
            // API call
            const response = await fetch(`/api/jobs?${params.toString()}`);
            
            if (response.ok) {
                const data = await response.json();
                this.jobs = data.jobs || [];
                this.totalJobs = data.total || 0;
                this.totalPages = data.pages || 1;
                
                // Display jobs
                this.displayJobs();
                this.updatePagination();
                this.updateJobCount();
            } else {
                throw new Error('Failed to load jobs');
            }
        } catch (error) {
            console.error('Error loading jobs:', error);
            this.showError('Failed to load jobs. Please try again.');
            // Show sample jobs for demo
            this.showSampleJobs();
        } finally {
            this.showLoading(false);
        }
    }

    displayJobs() {
        const jobsGrid = document.getElementById('jobs-grid');
        if (!jobsGrid) return;
        
        jobsGrid.innerHTML = '';
        
        if (this.jobs.length === 0) {
            jobsGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <h3>No jobs found</h3>
                    <p>Try adjusting your filters or search terms</p>
                    <button class="btn btn-primary" onclick="jobManager.clearFilters()">Clear Filters</button>
                </div>
            `;
            return;
        }
        
        this.jobs.forEach(job => {
            const jobCard = this.createJobCard(job);
            jobsGrid.appendChild(jobCard);
        });
    }

    createJobCard(job) {
        const card = document.createElement('div');
        card.className = 'job-card';
        if (job.featured) card.classList.add('featured');
        if (job.urgent) card.classList.add('urgent');
        
        const isSaved = this.savedJobs.has(job.id);
        const hasApplied = this.appliedJobs.has(job.id);
        
        card.innerHTML = `
            <div class="job-card-header">
                <div class="job-company">
                    <div class="company-logo">
                        <img src="${job.company.logo || '/assets/images/default-company.png'}" 
                             alt="${job.company.name}" 
                             loading="lazy">
                    </div>
                    <div class="company-info">
                        <h4>${job.company.name}</h4>
                        <p>${job.company.industry || ''}</p>
                    </div>
                </div>
                <div class="job-meta">
                    ${job.type ? `<span class="job-type">${job.type}</span>` : ''}
                    ${job.isRemote ? '<span class="remote-badge">Remote</span>' : ''}
                    ${job.featured ? '<span class="featured-badge">Featured</span>' : ''}
                </div>
            </div>
            
            <h3 class="job-title">${job.title}</h3>
            
            <p class="job-description">${this.truncateText(job.description, 120)}</p>
            
            <div class="job-details">
                <div class="detail-left">
                    <div class="job-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${job.location}</span>
                    </div>
                    <div class="job-salary">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>${this.formatSalary(job.salary)}</span>
                    </div>
                    <div class="job-experience">
                        <i class="fas fa-briefcase"></i>
                        <span>${job.experience || 'Any'}</span>
                    </div>
                </div>
                <div class="job-actions">
                    <button class="btn-save ${isSaved ? 'saved' : ''}" 
                            data-job-id="${job.id}"
                            onclick="jobManager.toggleSaveJob('${job.id}')">
                        <i class="fas ${isSaved ? 'fa-bookmark' : 'fa-bookmark-o'}"></i>
                    </button>
                    <button class="btn-apply ${hasApplied ? 'applied' : ''}" 
                            data-job-id="${job.id}"
                            onclick="jobManager.applyToJob('${job.id}')">
                        ${hasApplied ? 'Applied' : 'Apply Now'}
                    </button>
                </div>
            </div>
            
            <div class="job-footer">
                <span class="posted-date">
                    <i class="far fa-clock"></i>
                    ${this.formatRelativeTime(job.postedDate)}
                </span>
                <a href="/pages/job-details.html?id=${job.id}" class="view-details">
                    View Details <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        `;
        
        return card;
    }

    // Search Functionality
    initSearch() {
        const searchInput = document.getElementById('job-search');
        const locationInput = document.getElementById('location-search');
        const searchButton = document.getElementById('search-btn');
        
        if (searchButton) {
            searchButton.addEventListener('click', () => this.performSearch());
        }
        
        // Search on Enter
        [searchInput, locationInput].forEach(input => {
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.performSearch();
                    }
                });
            }
        });
        
        // Listen for URL parameters
        this.checkUrlParams();
    }

    performSearch() {
        const searchInput = document.getElementById('job-search');
        const locationInput = document.getElementById('location-search');
        
        const searchTerm = searchInput?.value.trim() || '';
        const location = locationInput?.value.trim() || '';
        
        // Update filters
        if (searchTerm) {
            this.currentFilters.search = searchTerm;
        } else {
            delete this.currentFilters.search;
        }
        
        if (location) {
            this.currentFilters.location = [location];
        } else {
            this.currentFilters.location = [];
        }
        
        // Reset to first page
        this.currentPage = 1;
        
        // Reload jobs with new filters
        this.loadJobs();
        
        // Update URL
        this.updateUrl();
    }

    // Filter Management
    initFilters() {
        // Category filters
        document.querySelectorAll('.filter-category').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const category = e.target.value;
                if (e.target.checked) {
                    this.addCategoryFilter(category);
                } else {
                    this.removeCategoryFilter(category);
                }
                this.applyFilters();
            });
        });
        
        // Job type filters
        document.querySelectorAll('.filter-type').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const type = e.target.value;
                if (e.target.checked) {
                    this.addTypeFilter(type);
                } else {
                    this.removeTypeFilter(type);
                }
                this.applyFilters();
            });
        });
        
        // Experience filters
        document.querySelectorAll('.filter-experience').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const experience = e.target.value;
                if (e.target.checked) {
                    this.addExperienceFilter(experience);
                } else {
                    this.removeExperienceFilter(experience);
                }
                this.applyFilters();
            });
        });
        
        // Remote filter
        const remoteFilter = document.getElementById('filter-remote');
        if (remoteFilter) {
            remoteFilter.addEventListener('change', (e) => {
                this.currentFilters.remote = e.target.checked;
                this.applyFilters();
            });
        }
        
        // Salary range
        const salaryMin = document.getElementById('salary-min');
        const salaryMax = document.getElementById('salary-max');
        const salaryValue = document.getElementById('salary-value');
        
        if (salaryMin && salaryMax && salaryValue) {
            const updateSalary = () => {
                const min = parseInt(salaryMin.value) || 0;
                const max = parseInt(salaryMax.value) || 1000000;
                this.currentFilters.salary = { min, max };
                salaryValue.textContent = `${this.formatCurrency(min)} - ${this.formatCurrency(max)}`;
                this.applyFilters();
            };
            
            salaryMin.addEventListener('input', debounce(updateSalary, 500));
            salaryMax.addEventListener('input', debounce(updateSalary, 500));
        }
        
        // Posted date filter
        const postedFilter = document.getElementById('filter-posted');
        if (postedFilter) {
            postedFilter.addEventListener('change', (e) => {
                this.currentFilters.posted = e.target.value;
                this.applyFilters();
            });
        }
        
        // Clear filters button
        const clearFiltersBtn = document.getElementById('clear-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }
    }

    addCategoryFilter(category) {
        if (!this.currentFilters.category.includes(category)) {
            this.currentFilters.category.push(category);
        }
    }

    removeCategoryFilter(category) {
        this.currentFilters.category = this.currentFilters.category.filter(c => c !== category);
    }

    addTypeFilter(type) {
        if (!this.currentFilters.type.includes(type)) {
            this.currentFilters.type.push(type);
        }
    }

    removeTypeFilter(type) {
        this.currentFilters.type = this.currentFilters.type.filter(t => t !== type);
    }

    addExperienceFilter(experience) {
        if (!this.currentFilters.experience.includes(experience)) {
            this.currentFilters.experience.push(experience);
        }
    }

    removeExperienceFilter(experience) {
        this.currentFilters.experience = this.currentFilters.experience.filter(e => e !== experience);
    }

    applyFilters() {
        // Reset to first page when filters change
        this.currentPage = 1;
        this.loadJobs();
        this.updateUrl();
    }

    clearFilters() {
        this.currentFilters = {
            category: [],
            location: [],
            type: [],
            salary: { min: 0, max: 1000000 },
            experience: [],
            posted: 'any',
            remote: false
        };
        
        // Reset UI elements
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        document.querySelectorAll('select').forEach(select => {
            select.value = '';
        });
        
        // Reset salary range
        const salaryMin = document.getElementById('salary-min');
        const salaryMax = document.getElementById('salary-max');
        const salaryValue = document.getElementById('salary-value');
        
        if (salaryMin && salaryMax && salaryValue) {
            salaryMin.value = 0;
            salaryMax.value = 1000000;
            salaryValue.textContent = 'Any salary';
        }
        
        // Reload jobs
        this.applyFilters();
        showNotification('Filters cleared', 'success');
    }

    // Sorting
    initSorting() {
        const sortSelect = document.getElementById('sort-jobs');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.loadJobs();
            });
        }
    }

    // Job Actions
    initJobActions() {
        // These are handled inline in the job cards
    }

    async toggleSaveJob(jobId) {
        if (!window.app?.currentUser) {
            showNotification('Please login to save jobs', 'warning');
            openModal('auth-modal');
            return;
        }
        
        try {
            if (this.savedJobs.has(jobId)) {
                await this.unsaveJob(jobId);
            } else {
                await this.saveJob(jobId);
            }
        } catch (error) {
            showNotification('Failed to update saved jobs', 'error');
        }
    }

    async saveJob(jobId) {
        try {
            const response = await fetch('/api/jobs/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.app.currentUser.token}`
                },
                body: JSON.stringify({ jobId })
            });
            
            if (response.ok) {
                this.savedJobs.add(jobId);
                this.updateSaveButton(jobId, true);
                showNotification('Job saved to your favorites', 'success');
                
                // Update saved jobs count
                window.app.updateFavoritesCount();
            }
        } catch (error) {
            throw error;
        }
    }

    async unsaveJob(jobId) {
        try {
            const response = await fetch('/api/jobs/unsave', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${window.app.currentUser.token}`
                },
                body: JSON.stringify({ jobId })
            });
            
            if (response.ok) {
                this.savedJobs.delete(jobId);
                this.updateSaveButton(jobId, false);
                showNotification('Job removed from favorites', 'info');
                
                // Update saved jobs count
                window.app.updateFavoritesCount();
            }
        } catch (error) {
            throw error;
        }
    }

    updateSaveButton(jobId, isSaved) {
        const saveBtn = document.querySelector(`.btn-save[data-job-id="${jobId}"]`);
        if (saveBtn) {
            saveBtn.classList.toggle('saved', isSaved);
            const icon = saveBtn.querySelector('i');
            if (icon) {
                icon.className = isSaved ? 'fas fa-bookmark' : 'far fa-bookmark';
            }
        }
    }

    async applyToJob(jobId) {
        if (!window.app?.currentUser) {
            showNotification('Please login to apply for jobs', 'warning');
            openModal('auth-modal');
            return;
        }
        
        if (this.appliedJobs.has(jobId)) {
            showNotification('You have already applied to this job', 'info');
            return;
        }
        
        // Check if profile is complete
        if (!await this.isProfileComplete()) {
            showNotification('Please complete your profile before applying', 'warning');
            window.location.href = '/pages/profile.html?complete=true';
            return;
        }
        
        // Show application modal
        this.showApplicationModal(jobId);
    }

    async showApplicationModal(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'application-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Apply for ${job.title}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="application-form">
                        <div class="form-section">
                            <h4>Your Information</h4>
                            <div class="form-group">
                                <label>Full Name</label>
                                <input type="text" id="applicant-name" value="${window.app.currentUser.name}" required>
                            </div>
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" id="applicant-email" value="${window.app.currentUser.email}" required>
                            </div>
                            <div class="form-group">
                                <label>Phone Number</label>
                                <input type="tel" id="applicant-phone" required>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h4>Resume & Documents</h4>
                            <div class="upload-area">
                                <input type="file" id="resume-upload" accept=".pdf,.doc,.docx" style="display: none;">
                                <div class="upload-prompt">
                                    <i class="fas fa-cloud-upload-alt"></i>
                                    <p>Upload your resume (PDF, DOC, DOCX)</p>
                                    <small>Max file size: 5MB</small>
                                </div>
                                <div class="file-preview"></div>
                            </div>
                            
                            <div class="form-group">
                                <label>Cover Letter</label>
                                <textarea id="cover-letter" rows="6" placeholder="Write your cover letter here..."></textarea>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h4>Additional Questions</h4>
                            ${job.questions ? job.questions.map((q, i) => `
                                <div class="form-group">
                                    <label>${q}</label>
                                    <textarea id="question-${i}" rows="3"></textarea>
                                </div>
                            `).join('') : '<p>No additional questions</p>'}
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-outline" onclick="closeModal('application-modal')">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="jobManager.submitApplication('${jobId}')">Submit Application</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        closeModal('application-modal'); // Initialize close functionality
    }

    async submitApplication(jobId) {
        const formData = new FormData();
        const job = this.jobs.find(j => j.id === jobId);
        
        // Collect form data
        const name = document.getElementById('applicant-name')?.value;
        const email = document.getElementById('applicant-email')?.value;
        const phone = document.getElementById('applicant-phone')?.value;
        const coverLetter = document.getElementById('cover-letter')?.value;
        
        if (!name || !email || !phone) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        formData.append('jobId', jobId);
        formData.append('name', name);
        formData.append('email', email);
        formData.append('phone', phone);
        formData.append('coverLetter', coverLetter);
        
        // Add answers to additional questions
        if (job.questions) {
            job.questions.forEach((q, i) => {
                const answer = document.getElementById(`question-${i}`)?.value;
                formData.append(`question_${i}`, answer || '');
            });
        }
        
        // Add resume file
        const resumeFile = document.getElementById('resume-upload')?.files[0];
        if (resumeFile) {
            formData.append('resume', resumeFile);
        }
        
        try {
            const response = await fetch('/api/jobs/apply', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.app.currentUser.token}`
                },
                body: formData
            });
            
            if (response.ok) {
                this.appliedJobs.add(jobId);
                this.updateApplyButton(jobId, true);
                closeModal('application-modal');
                showNotification('Application submitted successfully!', 'success');
                
                // Track event
                if (window.app) {
                    window.app.trackEvent('Job', 'Applied', job.title);
                }
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Application failed');
            }
        } catch (error) {
            showNotification(error.message || 'Failed to submit application', 'error');
        }
    }

    updateApplyButton(jobId, hasApplied) {
        const applyBtn = document.querySelector(`.btn-apply[data-job-id="${jobId}"]`);
        if (applyBtn) {
            applyBtn.classList.toggle('applied', hasApplied);
            applyBtn.textContent = hasApplied ? 'Applied' : 'Apply Now';
            applyBtn.disabled = hasApplied;
        }
    }

    async isProfileComplete() {
        try {
            const response = await fetch('/api/user/profile/check', {
                headers: {
                    'Authorization': `Bearer ${window.app.currentUser.token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.isComplete || false;
            }
        } catch (error) {
            console.error('Error checking profile:', error);
        }
        return false;
    }

    // Pagination
    updatePagination() {
        const pagination = document.querySelector('.pagination');
        if (!pagination) return;
        
        pagination.innerHTML = '';
        
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        pagination.appendChild(prevBtn);
        
        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, startPage + 4);
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `pagination-btn ${i === this.currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => this.goToPage(i));
            pagination.appendChild(pageBtn);
        }
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = this.currentPage === this.totalPages;
        nextBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        pagination.appendChild(nextBtn);
    }

    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;
        
        this.currentPage = page;
        this.loadJobs();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // URL Management
    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Check for search parameters
        const search = urlParams.get('q');
        const location = urlParams.get('location');
        const category = urlParams.get('category');
        
        if (search) {
            const searchInput = document.getElementById('job-search');
            if (searchInput) searchInput.value = search;
            this.currentFilters.search = search;
        }
        
        if (location) {
            const locationInput = document.getElementById('location-search');
            if (locationInput) locationInput.value = location;
            this.currentFilters.location = [location];
        }
        
        if (category) {
            this.currentFilters.category = category.split(',');
        }
        
        // Load jobs if there are URL parameters
        if (search || location || category) {
            this.loadJobs();
        }
    }

    updateUrl() {
        const params = new URLSearchParams();
        
        if (this.currentFilters.search) {
            params.set('q', this.currentFilters.search);
        }
        
        if (this.currentFilters.location?.length > 0) {
            params.set('location', this.currentFilters.location[0]);
        }
        
        if (this.currentFilters.category?.length > 0) {
            params.set('category', this.currentFilters.category.join(','));
        }
        
        const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
        window.history.pushState({}, '', newUrl);
    }

    // Utility Methods
    loadSavedJobs() {
        const saved = localStorage.getItem('saved_jobs');
        if (saved) {
            try {
                this.savedJobs = new Set(JSON.parse(saved));
            } catch (error) {
                this.savedJobs = new Set();
            }
        }
    }

    loadAppliedJobs() {
        const applied = localStorage.getItem('applied_jobs');
        if (applied) {
            try {
                this.appliedJobs = new Set(JSON.parse(applied));
            } catch (error) {
                this.appliedJobs = new Set();
            }
        }
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }

    formatSalary(salary) {
        if (!salary || salary === 'Negotiable') return 'Negotiable';
        
        if (typeof salary === 'object') {
            const { min, max, currency = 'ETB' } = salary;
            return `${this.formatCurrency(min, currency)} - ${this.formatCurrency(max, currency)}`;
        }
        
        return this.formatCurrency(salary);
    }

    formatCurrency(amount, currency = 'ETB') {
        if (!amount) return 'Negotiable';
        
        const formatter = new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        
        return formatter.format(amount);
    }

    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours} hours ago`;
        if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
        return date.toLocaleDateString();
    }

    updateJobCount() {
        const jobCount = document.getElementById('job-count');
        if (jobCount) {
            jobCount.textContent = `${this.totalJobs.toLocaleString()} jobs found`;
        }
    }

    showLoading(show) {
        const loading = document.getElementById('jobs-loading');
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
        
        const jobsGrid = document.getElementById('jobs-grid');
        if (jobsGrid) {
            jobsGrid.innerHTML = '';
            jobsGrid.appendChild(errorDiv);
        }
    }

    showSampleJobs() {
        const sampleJobs = [
            {
                id: 'sample1',
                title: 'Software Developer',
                company: { name: 'Tech Solutions Inc.', logo: '/assets/images/default-company.png' },
                description: 'Looking for a skilled software developer with experience in JavaScript and React.',
                location: 'Addis Ababa',
                salary: { min: 25000, max: 40000, currency: 'ETB' },
                type: 'Full-time',
                experience: '2+ years',
                isRemote: true,
                postedDate: new Date(Date.now() - 86400000).toISOString() // 1 day ago
            },
            {
                id: 'sample2',
                title: 'Marketing Manager',
                company: { name: 'Digital Agency', logo: '/assets/images/default-company.png' },
                description: 'Seeking an experienced marketing manager to lead our digital campaigns.',
                location: 'Remote',
                salary: { min: 30000, max: 50000, currency: 'ETB' },
                type: 'Full-time',
                experience: '3+ years',
                isRemote: true,
                featured: true,
                postedDate: new Date(Date.now() - 172800000).toISOString() // 2 days ago
            }
        ];
        
        this.jobs = sampleJobs;
        this.displayJobs();
    }

    // Job Categories
    getJobCategories() {
        return [
            { id: 'it', name: 'Information Technology', icon: '💻', count: 1250 },
            { id: 'marketing', name: 'Marketing & Sales', icon: '📈', count: 850 },
            { id: 'finance', name: 'Finance & Accounting', icon: '💰', count: 620 },
            { id: 'engineering', name: 'Engineering', icon: '⚙️', count: 780 },
            { id: 'healthcare', name: 'Healthcare', icon: '🏥', count: 540 },
            { id: 'education', name: 'Education', icon: '🎓', count: 430 },
            { id: 'customer-service', name: 'Customer Service', icon: '👥', count: 320 },
            { id: 'design', name: 'Design & Creative', icon: '🎨', count: 290 }
        ];
    }

    displayJobCategories() {
        const categoriesGrid = document.querySelector('.categories-grid');
        if (!categoriesGrid) return;
        
        const categories = this.getJobCategories();
        categoriesGrid.innerHTML = '';
        
        categories.forEach(category => {
            const categoryCard = document.createElement('div');
            categoryCard.className = 'category-card';
            categoryCard.innerHTML = `
                <div class="category-icon">${category.icon}</div>
                <h4>${category.name}</h4>
                <p>Find your perfect job in ${category.name.toLowerCase()}</p>
                <span class="category-count">${category.count}+ Jobs</span>
            `;
            
            categoryCard.addEventListener('click', () => {
                this.currentFilters.category = [category.id];
                this.applyFilters();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            
            categoriesGrid.appendChild(categoryCard);
        });
    }

    // Job Alerts
    setupJobAlerts() {
        const alertForm = document.getElementById('job-alert-form');
        if (alertForm) {
            alertForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('alert-email').value;
                const keywords = document.getElementById('alert-keywords').value;
                const frequency = document.getElementById('alert-frequency').value;
                
                if (!window.app?.currentUser) {
                    showNotification('Please login to set up job alerts', 'warning');
                    return;
                }
                
                try {
                    const response = await fetch('/api/jobs/alerts', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${window.app.currentUser.token}`
                        },
                        body: JSON.stringify({ email, keywords, frequency })
                    });
                    
                    if (response.ok) {
                        showNotification('Job alert created successfully!', 'success');
                        alertForm.reset();
                    }
                } catch (error) {
                    showNotification('Failed to create job alert', 'error');
                }
            });
        }
    }
}

// Initialize Job Manager
window.jobManager = new JobSearchManager();

// Global helper functions
window.searchJobs = function(query, location) {
    const searchInput = document.getElementById('job-search');
    const locationInput = document.getElementById('location-search');
    
    if (searchInput) searchInput.value = query || '';
    if (locationInput) locationInput.value = location || '';
    
    window.jobManager.performSearch();
};

window.applyToJob = function(jobId) {
    window.jobManager.applyToJob(jobId);
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JobSearchManager;
}
