// DOM Elements
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.querySelector('.sidebar');
const logoutBtn = document.getElementById('logoutBtn');

// Current page indicator
const currentPage = window.location.pathname.split('/').pop();

// Data storage
let currentData = {
    jobs: [],
    users: [],
    courses: [],
    events: [],
    payments: [],
    certificates: [],
    partners: [],
    donations: [],
    ads: []
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadPageData();
    updateActiveMenuItem();
    
    // Check if user is logged in (except on login page)
    if (!currentPage.includes('index.html') && currentPage !== '' && !sessionStorage.getItem('zewedJobsLoggedIn')) {
        window.location.href = 'index.html';
    }
});

// Setup all event listeners
function setupEventListeners() {
    // Mobile Menu Toggle
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // Logout Handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Modal handlers
    const closeModalButtons = document.querySelectorAll('.close-modal');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
        }
    });
    
    // Search functionality
    setupSearchFilters();
    
    // Form submissions
    setupFormSubmissions();
}

// Update active menu item based on current page
function updateActiveMenuItem() {
    const menuItems = document.querySelectorAll('.sidebar-menu a');
    const pageMap = {
        'dashboard.html': 'dashboard',
        'jobs.html': 'jobs',
        'courses.html': 'courses',
        'events.html': 'events',
        'payments.html': 'payments',
        'users.html': 'users',
        'certificates.html': 'certificates',
        'partners.html': 'partners',
        'donations.html': 'donations',
        'ads.html': 'ads'
    };
    
    const currentPageKey = pageMap[currentPage];
    
    menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === currentPageKey) {
            item.classList.add('active');
        }
    });
}

// Handle logout
function handleLogout() {
    sessionStorage.removeItem('zewedJobsLoggedIn');
    window.location.href = 'index.html';
}

// Load page-specific data
function loadPageData() {
    switch(currentPage) {
        case 'dashboard.html':
            loadDashboardData();
            break;
        case 'jobs.html':
            loadJobsTable();
            break;
        case 'users.html':
            loadUsersTable();
            break;
        case 'courses.html':
            loadCoursesTable();
            break;
        case 'events.html':
            loadEventsTable();
            break;
        case 'payments.html':
            loadPaymentsTable();
            break;
        case 'certificates.html':
            loadCertificatesTable();
            break;
        case 'partners.html':
            loadPartnersTable();
            break;
        case 'donations.html':
            loadDonationsTable();
            break;
        case 'ads.html':
            loadAdsTable();
            break;
    }
}

// Setup search filters
function setupSearchFilters() {
    const searchInputs = {
        'jobSearch': filterJobs,
        'userSearch': filterUsers,
        'courseSearch': filterCourses,
        'eventSearch': filterEvents,
        'certificateSearch': filterCertificates,
        'partnerSearch': filterPartners,
        'donationSearch': filterDonations,
        'adSearch': filterAds
    };
    
    for (const [id, filterFunc] of Object.entries(searchInputs)) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', filterFunc);
        }
    }
    
    // Setup filter selects
    const filterSelects = {
        'jobTypeFilter': filterJobs,
        'jobStatusFilter': filterJobs,
        'userRoleFilter': filterUsers,
        'userStatusFilter': filterUsers,
        'paymentStatusFilter': filterPayments,
        'paymentDateFilter': filterPayments
    };
    
    for (const [id, filterFunc] of Object.entries(filterSelects)) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', filterFunc);
        }
    }
}

// Setup form submissions
function setupFormSubmissions() {
    const saveJobBtn = document.getElementById('saveJobBtn');
    if (saveJobBtn) {
        saveJobBtn.addEventListener('click', saveJob);
    }
    
    const saveUserBtn = document.getElementById('saveUserBtn');
    if (saveUserBtn) {
        saveUserBtn.addEventListener('click', saveUser);
    }
    
    const saveEditBtn = document.getElementById('saveEditBtn');
    if (saveEditBtn) {
        saveEditBtn.addEventListener('click', saveEdit);
    }
    
    const confirmActionBtn = document.getElementById('confirmActionBtn');
    if (confirmActionBtn) {
        confirmActionBtn.addEventListener('click', function() {
            if (window.currentAction) {
                window.currentAction();
                document.getElementById('confirmModal').style.display = 'none';
            }
        });
    }
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

// Login handler
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('loginError');
    
    // Default credentials (for demo only)
    const validUsername = "admin";
    const validPassword = "zewed2023";
    
    if (username === validUsername && password === validPassword) {
        sessionStorage.setItem('zewedJobsLoggedIn', 'true');
        window.location.href = 'dashboard.html';
    } else {
        loginError.style.display = 'block';
        setTimeout(() => {
            loginError.style.display = 'none';
        }, 3000);
    }
}

// Dashboard data loading
function loadDashboardData() {
    // Update dashboard stats
    const stats = {
        totalJobs: Math.floor(Math.random() * 100) + 200,
        totalUsers: Math.floor(Math.random() * 500) + 1500,
        totalRevenue: `ETB ${(Math.random() * 100000 + 50000).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`,
        totalEvents: Math.floor(Math.random() * 10) + 5
    };
    
    if (document.getElementById('totalJobs')) document.getElementById('totalJobs').textContent = stats.totalJobs;
    if (document.getElementById('totalUsers')) document.getElementById('totalUsers').textContent = stats.totalUsers;
    if (document.getElementById('totalRevenue')) document.getElementById('totalRevenue').textContent = stats.totalRevenue;
    if (document.getElementById('totalEvents')) document.getElementById('totalEvents').textContent = stats.totalEvents;
    
    // Load recent activities
    const activities = [
        {activity: "New job posted by Ethio Telecom", user: "employer@ethiotelecom.et", date: getFormattedDate(-1), status: "Approved"},
        {activity: "User registration - John Doe", user: "john.doe@example.com", date: getFormattedDate(-2), status: "Active"},
        {activity: "Payment received for job promotion", user: "abebech@company.com", date: getFormattedDate(-3), status: "Completed"},
        {activity: "Certificate issued - AWS Course", user: "tesfaye@gmail.com", date: getFormattedDate(-4), status: "Issued"},
        {activity: "Job flagged for review", user: "moderator1", date: getFormattedDate(-5), status: "Pending"},
        {activity: "New partnership with Dashen Bank", user: "partner@dashenbank.com", date: getFormattedDate(-6), status: "Approved"},
        {activity: "Donation received from ABC Foundation", user: "donor@abcfoundation.org", date: getFormattedDate(-7), status: "Received"}
    ];
    
    const activitiesTable = document.getElementById('recentActivities');
    if (activitiesTable) {
        activitiesTable.innerHTML = activities.map(activity => `
            <tr>
                <td>${activity.activity}</td>
                <td>${activity.user}</td>
                <td>${activity.date}</td>
                <td><span class="badge badge-${activity.status === 'Approved' || activity.status === 'Active' || activity.status === 'Completed' || activity.status === 'Issued' || activity.status === 'Received' ? 'success' : 'warning'}">${activity.status}</span></td>
            </tr>
        `).join('');
    }
    
    // Initialize charts if on dashboard
    if (typeof Chart !== 'undefined') {
        initializeCharts();
    }
}

// Initialize Charts
function initializeCharts() {
    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
        new Chart(revenueCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Revenue (ETB)',
                    data: [45000, 52000, 48000, 61000, 75000, 82000, 78000, 85000, 92000, 89000, 95000, 124560],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'ETB ' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
    
    // User Growth Chart
    const userCtx = document.getElementById('userChart');
    if (userCtx) {
        new Chart(userCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
                datasets: [{
                    label: 'New Users',
                    data: [120, 150, 180, 200, 220, 250, 280, 320, 350, 384],
                    backgroundColor: '#10b981',
                    borderColor: '#0da271',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }
}

// Data loading functions
function loadJobsTable() {
    const jobs = [
        {id: "#101", title: "Senior Software Engineer", company: "Ethio Telecom", type: "Full-time", applications: 42, status: "Active"},
        {id: "#102", title: "Marketing Manager", company: "Dashen Bank", type: "Full-time", applications: 28, status: "Active"},
        {id: "#103", title: "Graphic Designer", company: "Awash Bank", type: "Part-time", applications: 15, status: "Pending"},
        {id: "#104", title: "Data Analyst", company: "Hibret Bank", type: "Remote", applications: 37, status: "Active"},
        {id: "#105", title: "HR Specialist", company: "Commercial Bank", type: "Full-time", applications: 22, status: "Active"},
        {id: "#106", title: "Network Administrator", company: "Ethio Telecom", type: "Contract", applications: 18, status: "Pending"},
        {id: "#107", title: "Sales Executive", company: "Coca-Cola Ethiopia", type: "Full-time", applications: 31, status: "Active"},
        {id: "#108", title: "Accountant", company: "PricewaterhouseCoopers", type: "Full-time", applications: 25, status: "Expired"}
    ];
    
    currentData.jobs = jobs;
    renderJobsTable(jobs);
}

function loadUsersTable() {
    const users = [
        {id: "#U1001", name: "Admin User", email: "admin@zewedjobs.com", phone: "+251 911 234 567", role: "Admin", regDate: "2023-01-15", status: "Active"},
        {id: "#U1002", name: "John Doe", email: "john.doe@example.com", phone: "+251 912 345 678", role: "Job Seeker", regDate: "2023-10-14", status: "Active"},
        {id: "#U1003", name: "Ethio Telecom HR", email: "hr@ethiotelecom.et", phone: "+251 111 111 111", role: "Employer", regDate: "2023-09-20", status: "Active"},
        {id: "#U1004", name: "Sarah Johnson", email: "sarah@instructor.com", phone: "+251 933 444 555", role: "Instructor", regDate: "2023-08-15", status: "Active"},
        {id: "#U1005", name: "Michael Bekele", email: "michael@example.com", phone: "+251 944 555 666", role: "Job Seeker", regDate: "2023-10-10", status: "Inactive"},
        {id: "#U1006", name: "Awash Bank", email: "careers@awashbank.com", phone: "+251 115 151 515", role: "Employer", regDate: "2023-07-30", status: "Active"},
        {id: "#U1007", name: "Helen Mesfin", email: "helen.mesfin@example.com", phone: "+251 977 777 777", role: "Job Seeker", regDate: "2023-10-05", status: "Active"},
        {id: "#U1008", name: "Samuel Kebede", email: "samuel@instructor.com", phone: "+251 988 888 888", role: "Instructor", regDate: "2023-09-10", status: "Suspended"}
    ];
    
    currentData.users = users;
    renderUsersTable(users);
}

function loadCoursesTable() {
    const courses = [
        {id: "#C001", name: "Web Development Bootcamp", category: "Technology", instructor: "Alex Johnson", students: 125, price: "ETB 5,000", status: "Active"},
        {id: "#C002", name: "Digital Marketing Mastery", category: "Marketing", instructor: "Sarah Williams", students: 89, price: "ETB 3,500", status: "Active"},
        {id: "#C003", name: "Project Management Professional", category: "Business", instructor: "Michael Chen", students: 67, price: "ETB 4,200", status: "Upcoming"},
        {id: "#C004", name: "Data Science Fundamentals", category: "Technology", instructor: "Dr. Samuel Kebede", students: 45, price: "ETB 6,000", status: "Active"},
        {id: "#C005", name: "Mobile App Development", category: "Technology", instructor: "Emily Rodriguez", students: 78, price: "ETB 4,800", status: "Active"},
        {id: "#C006", name: "Financial Analysis Course", category: "Finance", instructor: "David Smith", students: 52, price: "ETB 5,500", status: "Active"}
    ];
    
    currentData.courses = courses;
    renderCoursesTable(courses);
}

function loadEventsTable() {
    const events = [
        {id: "#E001", name: "Tech Job Fair 2023", date: "2023-11-15", location: "Addis Ababa Exhibition Center", attendees: 350, status: "Upcoming"},
        {id: "#E002", name: "Career Workshop", date: "2023-10-30", location: "Online", attendees: 120, status: "Upcoming"},
        {id: "#E003", name: "Digital Marketing Conference", date: "2023-10-10", location: "Sheraton Addis", attendees: 200, status: "Completed"},
        {id: "#E004", name: "Startup Networking Event", date: "2023-11-05", location: "Blue Nile Lounge", attendees: 85, status: "Upcoming"},
        {id: "#E005", name: "Women in Tech Summit", date: "2023-09-28", location: "Elilly Hotel", attendees: 150, status: "Completed"},
        {id: "#E006", name: "Agriculture Innovation Forum", date: "2023-11-20", location: "Hilton Hotel", attendees: 0, status: "Upcoming"}
    ];
    
    currentData.events = events;
    renderEventsTable(events);
}

function loadPaymentsTable() {
    const payments = [
        {id: "#TXN00123", user: "Ethio Telecom", amount: "ETB 5,000", method: "Bank Transfer", date: "2023-10-15", status: "Completed"},
        {id: "#TXN00122", user: "Dashen Bank", amount: "ETB 3,500", method: "Online Payment", date: "2023-10-14", status: "Completed"},
        {id: "#TXN00121", user: "Awash Bank", amount: "ETB 7,200", method: "Bank Transfer", date: "2023-10-13", status: "Pending"},
        {id: "#TXN00120", user: "John Doe", amount: "ETB 1,500", method: "Credit Card", date: "2023-10-12", status: "Completed"},
        {id: "#TXN00119", user: "Sarah Johnson", amount: "ETB 4,200", method: "Mobile Payment", date: "2023-10-11", status: "Failed"},
        {id: "#TXN00118", user: "Hibret Bank", amount: "ETB 6,000", method: "Bank Transfer", date: "2023-10-10", status: "Completed"},
        {id: "#TXN00117", user: "Commercial Bank", amount: "ETB 8,500", method: "Bank Transfer", date: "2023-10-09", status: "Completed"}
    ];
    
    currentData.payments = payments;
    renderPaymentsTable(payments);
}

function loadCertificatesTable() {
    const certificates = [
        {id: "#CERT001", recipient: "John Doe", course: "Web Development Bootcamp", issueDate: "2023-10-12", expiryDate: "2026-10-12", code: "ZJ-WD-2023-001", status: "Issued"},
        {id: "#CERT002", recipient: "Sarah Williams", course: "Digital Marketing", issueDate: "2023-10-10", expiryDate: "2026-10-10", code: "ZJ-DM-2023-002", status: "Issued"},
        {id: "#CERT003", recipient: "Michael Chen", course: "Data Science Fundamentals", issueDate: "2023-10-05", expiryDate: "2026-10-05", code: "ZJ-DS-2023-003", status: "Pending"},
        {id: "#CERT004", recipient: "Emily Rodriguez", course: "Project Management", issueDate: "2023-09-28", expiryDate: "2026-09-28", code: "ZJ-PM-2023-004", status: "Issued"},
        {id: "#CERT005", recipient: "Alex Johnson", course: "Mobile App Development", issueDate: "2023-09-20", expiryDate: "2026-09-20", code: "ZJ-MA-2023-005", status: "Expired"},
        {id: "#CERT006", recipient: "David Smith", course: "Financial Analysis", issueDate: "2023-09-15", expiryDate: "2026-09-15", code: "ZJ-FA-2023-006", status: "Issued"}
    ];
    
    currentData.certificates = certificates;
    renderCertificatesTable(certificates);
}

function loadPartnersTable() {
    const partners = [
        {id: "#P001", organization: "Ethio Telecom", contact: "Mr. Samuel Bekele", type: "Platinum", startDate: "2022-01-15", status: "Active"},
        {id: "#P002", organization: "Dashen Bank", contact: "Ms. Helen Mesfin", type: "Gold", startDate: "2022-03-20", status: "Active"},
        {id: "#P003", organization: "Awash Bank", contact: "Mr. Daniel Tsegaye", type: "Silver", startDate: "2022-05-10", status: "Active"},
        {id: "#P004", organization: "Commercial Bank", contact: "Mrs. Sofia Abraham", type: "Gold", startDate: "2022-07-15", status: "Active"},
        {id: "#P005", organization: "Ethiopian Airlines", contact: "Mr. Kaleb Asrat", type: "Platinum", startDate: "2022-02-28", status: "Inactive"},
        {id: "#P006", organization: "Coca-Cola Ethiopia", contact: "Ms. Genet Alemu", type: "Silver", startDate: "2022-08-10", status: "Active"}
    ];
    
    currentData.partners = partners;
    renderPartnersTable(partners);
}

function loadDonationsTable() {
    const donations = [
        {id: "#D001", donor: "ABC Foundation", amount: "ETB 50,000", purpose: "Platform Development", date: "2023-09-15", method: "Bank Transfer", status: "Received"},
        {id: "#D002", donor: "XYZ Corporation", amount: "ETB 25,000", purpose: "Student Scholarships", date: "2023-08-20", method: "Check", status: "Received"},
        {id: "#D003", donor: "Individual Donor", amount: "ETB 10,000", purpose: "General Support", date: "2023-07-05", method: "Online Payment", status: "Received"},
        {id: "#D004", donor: "Tech For Good Inc.", amount: "ETB 75,000", purpose: "Job Training Program", date: "2023-10-05", method: "Bank Transfer", status: "Pending"},
        {id: "#D005", donor: "Community Partners", amount: "ETB 15,000", purpose: "Event Sponsorship", date: "2023-06-30", method: "Mobile Payment", status: "Received"},
        {id: "#D006", donor: "Global Giving Foundation", amount: "ETB 100,000", purpose: "Platform Expansion", date: "2023-05-15", method: "Bank Transfer", status: "Received"}
    ];
    
    currentData.donations = donations;
    renderDonationsTable(donations);
}

function loadAdsTable() {
    const ads = [
        {id: "#AD001", campaign: "Homepage Banner", client: "Ethio Telecom", type: "Banner", impressions: "125,430", clicks: "2,540", status: "Active"},
        {id: "#AD002", campaign: "Job Listing Sidebar", client: "Dashen Bank", type: "Sidebar", impressions: "89,210", clicks: "1,230", status: "Active"},
        {id: "#AD003", campaign: "Newsletter Sponsor", client: "Awash Bank", type: "Email", impressions: "45,000", clicks: "890", status: "Expired"},
        {id: "#AD004", campaign: "Mobile App Ad", client: "Commercial Bank", type: "In-App", impressions: "210,500", clicks: "3,450", status: "Active"},
        {id: "#AD005", campaign: "Social Media Campaign", client: "Ethiopian Airlines", type: "Social", impressions: "350,000", clicks: "5,670", status: "Pending"},
        {id: "#AD006", campaign: "Job Alert Email", client: "Hibret Bank", type: "Email", impressions: "85,000", clicks: "1,150", status: "Active"}
    ];
    
    currentData.ads = ads;
    renderAdsTable(ads);
}

// Render functions
function renderJobsTable(jobs) {
    const tableBody = document.getElementById('jobsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = jobs.map(job => `
        <tr>
            <td>${job.id}</td>
            <td><strong>${job.title}</strong></td>
            <td>${job.company}</td>
            <td><span class="badge badge-secondary">${job.type}</span></td>
            <td>${job.applications}</td>
            <td><span class="badge badge-${job.status === 'Active' ? 'success' : job.status === 'Pending' ? 'warning' : 'danger'}">${job.status}</span></td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editItem('job', '${job.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-sm" onclick="confirmDelete('job', '${job.id}', '${job.title}')"><i class="fas fa-trash"></i></button>
                ${job.status === 'Pending' ? `<button class="btn btn-success btn-sm" onclick="approveItem('job', '${job.id}')"><i class="fas fa-check"></i></button>` : ''}
            </td>
        </tr>
    `).join('');
}

function renderUsersTable(users) {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td><strong>${user.name}</strong></td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td><span class="badge badge-${user.role === 'Admin' ? 'danger' : user.role === 'Employer' ? 'warning' : user.role === 'Instructor' ? 'info' : 'secondary'}">${user.role}</span></td>
            <td>${user.regDate}</td>
            <td><span class="badge badge-${user.status === 'Active' ? 'success' : user.status === 'Inactive' ? 'warning' : 'danger'}">${user.status}</span></td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editItem('user', '${user.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-sm" onclick="confirmDelete('user', '${user.id}', '${user.name}')"><i class="fas fa-trash"></i></button>
                <button class="btn btn-info btn-sm" onclick="viewDetails('user', '${user.id}')"><i class="fas fa-eye"></i></button>
            </td>
        </tr>
    `).join('');
}

function renderCoursesTable(courses) {
    const tableBody = document.getElementById('coursesTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = courses.map(course => `
        <tr>
            <td>${course.id}</td>
            <td><strong>${course.name}</strong></td>
            <td><span class="badge badge-secondary">${course.category}</span></td>
            <td>${course.instructor}</td>
            <td>${course.students}</td>
            <td>${course.price}</td>
            <td><span class="badge badge-${course.status === 'Active' ? 'success' : course.status === 'Upcoming' ? 'warning' : 'secondary'}">${course.status}</span></td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editItem('course', '${course.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-sm" onclick="confirmDelete('course', '${course.id}', '${course.name}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function renderEventsTable(events) {
    const tableBody = document.getElementById('eventsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = events.map(event => `
        <tr>
            <td>${event.id}</td>
            <td><strong>${event.name}</strong></td>
            <td>${event.date}</td>
            <td>${event.location}</td>
            <td>${event.attendees}</td>
            <td><span class="badge badge-${event.status === 'Upcoming' ? 'warning' : 'success'}">${event.status}</span></td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editItem('event', '${event.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-sm" onclick="confirmDelete('event', '${event.id}', '${event.name}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function renderPaymentsTable(payments) {
    const tableBody = document.getElementById('paymentsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = payments.map(payment => `
        <tr>
            <td>${payment.id}</td>
            <td><strong>${payment.user}</strong></td>
            <td>${payment.amount}</td>
            <td>${payment.method}</td>
            <td>${payment.date}</td>
            <td><span class="badge badge-${payment.status === 'Completed' ? 'success' : payment.status === 'Pending' ? 'warning' : 'danger'}">${payment.status}</span></td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="viewDetails('payment', '${payment.id}')"><i class="fas fa-eye"></i></button>
                <button class="btn btn-info btn-sm" onclick="downloadReceipt('${payment.id}')"><i class="fas fa-download"></i></button>
            </td>
        </tr>
    `).join('');
}

function renderCertificatesTable(certificates) {
    const tableBody = document.getElementById('certificatesTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = certificates.map(cert => `
        <tr>
            <td>${cert.id}</td>
            <td><strong>${cert.recipient}</strong></td>
            <td>${cert.course}</td>
            <td>${cert.issueDate}</td>
            <td>${cert.expiryDate}</td>
            <td><code>${cert.code}</code></td>
            <td><span class="badge badge-${cert.status === 'Issued' ? 'success' : cert.status === 'Pending' ? 'warning' : 'danger'}">${cert.status}</span></td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editItem('certificate', '${cert.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-success btn-sm" onclick="issueCertificate('${cert.id}')"><i class="fas fa-certificate"></i></button>
                <button class="btn btn-info btn-sm" onclick="downloadCertificate('${cert.id}')"><i class="fas fa-download"></i></button>
            </td>
        </tr>
    `).join('');
}

function renderPartnersTable(partners) {
    const tableBody = document.getElementById('partnersTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = partners.map(partner => `
        <tr>
            <td>${partner.id}</td>
            <td><strong>${partner.organization}</strong></td>
            <td>${partner.contact}</td>
            <td><span class="badge badge-${partner.type === 'Platinum' ? 'info' : partner.type === 'Gold' ? 'warning' : 'secondary'}">${partner.type}</span></td>
            <td>${partner.startDate}</td>
            <td><span class="badge badge-${partner.status === 'Active' ? 'success' : 'danger'}">${partner.status}</span></td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editItem('partner', '${partner.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-sm" onclick="confirmDelete('partner', '${partner.id}', '${partner.organization}')"><i class="fas fa-trash"></i></button>
                <button class="btn btn-info btn-sm" onclick="viewDetails('partner', '${partner.id}')"><i class="fas fa-eye"></i></button>
            </td>
        </tr>
    `).join('');
}

function renderDonationsTable(donations) {
    const tableBody = document.getElementById('donationsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = donations.map(donation => `
        <tr>
            <td>${donation.id}</td>
            <td><strong>${donation.donor}</strong></td>
            <td>${donation.amount}</td>
            <td>${donation.purpose}</td>
            <td>${donation.date}</td>
            <td>${donation.method}</td>
            <td><span class="badge badge-${donation.status === 'Received' ? 'success' : 'warning'}">${donation.status}</span></td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editItem('donation', '${donation.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-success btn-sm" onclick="confirmReceipt('${donation.id}')"><i class="fas fa-check-circle"></i></button>
                <button class="btn btn-info btn-sm" onclick="downloadReceipt('${donation.id}')"><i class="fas fa-download"></i></button>
            </td>
        </tr>
    `).join('');
}

function renderAdsTable(ads) {
    const tableBody = document.getElementById('adsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = ads.map(ad => `
        <tr>
            <td>${ad.id}</td>
            <td><strong>${ad.campaign}</strong></td>
            <td>${ad.client}</td>
            <td><span class="badge badge-secondary">${ad.type}</span></td>
            <td>${ad.impressions}</td>
            <td>${ad.clicks}</td>
            <td><span class="badge badge-${ad.status === 'Active' ? 'success' : ad.status === 'Pending' ? 'warning' : 'danger'}">${ad.status}</span></td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editItem('ad', '${ad.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-sm" onclick="confirmDelete('ad', '${ad.id}', '${ad.campaign}')"><i class="fas fa-trash"></i></button>
                <button class="btn btn-info btn-sm" onclick="viewAnalytics('${ad.id}')"><i class="fas fa-chart-bar"></i></button>
            </td>
        </tr>
    `).join('');
}

// Filter functions
function filterJobs() {
    const searchTerm = document.getElementById('jobSearch')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('jobTypeFilter')?.value || '';
    const statusFilter = document.getElementById('jobStatusFilter')?.value || '';
    
    const filtered = currentData.jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchTerm) || 
                            job.company.toLowerCase().includes(searchTerm);
        const matchesType = !typeFilter || job.type.toLowerCase() === typeFilter.toLowerCase();
        const matchesStatus = !statusFilter || job.status.toLowerCase() === statusFilter.toLowerCase();
        
        return matchesSearch && matchesType && matchesStatus;
    });
    renderJobsTable(filtered);
}

function filterUsers() {
    const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('userRoleFilter')?.value || '';
    const statusFilter = document.getElementById('userStatusFilter')?.value || '';
    
    const filtered = currentData.users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm) || 
                            user.email.toLowerCase().includes(searchTerm);
        const matchesRole = !roleFilter || user.role.toLowerCase() === roleFilter.toLowerCase();
        const matchesStatus = !statusFilter || user.status.toLowerCase() === statusFilter.toLowerCase();
        
        return matchesSearch && matchesRole && matchesStatus;
    });
    
    renderUsersTable(filtered);
}

function filterCourses() {
    const searchTerm = document.getElementById('courseSearch')?.value.toLowerCase() || '';
    const filtered = currentData.courses.filter(course => 
        course.name.toLowerCase().includes(searchTerm) || 
        course.category.toLowerCase().includes(searchTerm) ||
        course.instructor.toLowerCase().includes(searchTerm)
    );
    renderCoursesTable(filtered);
}

function filterEvents() {
    const searchTerm = document.getElementById('eventSearch')?.value.toLowerCase() || '';
    const filtered = currentData.events.filter(event => 
        event.name.toLowerCase().includes(searchTerm) || 
        event.location.toLowerCase().includes(searchTerm)
    );
    renderEventsTable(filtered);
}

function filterPayments() {
    const statusFilter = document.getElementById('paymentStatusFilter')?.value || '';
    const dateFilter = document.getElementById('paymentDateFilter')?.value || '';
    
    const filtered = currentData.payments.filter(payment => {
        const matchesStatus = !statusFilter || payment.status.toLowerCase() === statusFilter.toLowerCase();
        const matchesDate = !dateFilter || payment.date === dateFilter;
        
        return matchesStatus && matchesDate;
    });
    
    renderPaymentsTable(filtered);
}

function filterCertificates() {
    const searchTerm = document.getElementById('certificateSearch')?.value.toLowerCase() || '';
    const filtered = currentData.certificates.filter(cert => 
        cert.recipient.toLowerCase().includes(searchTerm) || 
        cert.course.toLowerCase().includes(searchTerm) ||
        cert.code.toLowerCase().includes(searchTerm)
    );
    renderCertificatesTable(filtered);
}

function filterPartners() {
    const searchTerm = document.getElementById('partnerSearch')?.value.toLowerCase() || '';
    const filtered = currentData.partners.filter(partner => 
        partner.organization.toLowerCase().includes(searchTerm) || 
        partner.contact.toLowerCase().includes(searchTerm) ||
        partner.type.toLowerCase().includes(searchTerm)
    );
    renderPartnersTable(filtered);
}

function filterDonations() {
    const searchTerm = document.getElementById('donationSearch')?.value.toLowerCase() || '';
    const filtered = currentData.donations.filter(donation => 
        donation.donor.toLowerCase().includes(searchTerm) || 
        donation.purpose.toLowerCase().includes(searchTerm) ||
        donation.method.toLowerCase().includes(searchTerm)
    );
    renderDonationsTable(filtered);
}

function filterAds() {
    const searchTerm = document.getElementById('adSearch')?.value.toLowerCase() || '';
    const filtered = currentData.ads.filter(ad => 
        ad.campaign.toLowerCase().includes(searchTerm) || 
        ad.client.toLowerCase().includes(searchTerm) ||
        ad.type.toLowerCase().includes(searchTerm)
    );
    renderAdsTable(filtered);
}

// Form Submission Functions
function saveJob() {
    const jobTitle = document.getElementById('jobTitle').value;
    const jobCompany = document.getElementById('jobCompany').value;
    const jobType = document.getElementById('jobType').value;
    const jobLocation = document.getElementById('jobLocation').value;
    
    if (!jobTitle || !jobCompany || !jobType) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Generate new job ID
    const newId = `#${Math.floor(Math.random() * 900) + 100}`;
    
    // Add to data
    const newJob = {
        id: newId,
        title: jobTitle,
        company: jobCompany,
        type: jobType,
        location: jobLocation,
        applications: 0,
        status: 'Pending'
    };
    
    currentData.jobs.unshift(newJob);
    renderJobsTable(currentData.jobs);
    document.getElementById('addJobModal').style.display = 'none';
    alert('Job added successfully!');
}

function saveUser() {
    const userName = document.getElementById('userName').value;
    const userEmail = document.getElementById('userEmail').value;
    const userPhone = document.getElementById('userPhone').value;
    const userRole = document.getElementById('userRole').value;
    const userPassword = document.getElementById('userPassword').value;
    const userConfirmPassword = document.getElementById('userConfirmPassword').value;
    const userStatus = document.getElementById('userStatus').value;
    
    if (!userName || !userEmail || !userRole || !userPassword) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (userPassword !== userConfirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    // Generate new user ID
    const newId = `#U${Math.floor(Math.random() * 9000) + 1000}`;
    
    // Add to data
    const newUser = {
        id: newId,
        name: userName,
        email: userEmail,
        phone: userPhone,
        role: userRole,
        regDate: new Date().toISOString().split('T')[0],
        status: userStatus
    };
    
    currentData.users.unshift(newUser);
    renderUsersTable(currentData.users);
    document.getElementById('addUserModal').style.display = 'none';
    alert('User added successfully!');
}

// Action functions
function confirmDelete(type, id, name) {
    window.currentItemType = type;
    window.currentItemId = id;
    window.currentAction = function() {
        deleteItem(type, id);
    };
    
    const confirmMessage = document.getElementById('confirmMessage');
    if (confirmMessage) {
        confirmMessage.textContent = `Are you sure you want to delete ${type}: ${name}?`;
    }
    
    document.getElementById('confirmModal').style.display = 'flex';
}

function deleteItem(type, id) {
    // Remove from data
    currentData[type + 's'] = currentData[type + 's'].filter(item => item.id !== id);
    
    // Re-render table
    const renderFunction = window[`render${type.charAt(0).toUpperCase() + type.slice(1)}sTable`];
    if (renderFunction) {
        renderFunction(currentData[type + 's']);
    }
    
    alert(`${type} ${id} deleted successfully!`);
}

function editItem(type, id) {
    window.currentItemType = type;
    window.currentItemId = id;
    
    const item = currentData[type + 's'].find(item => item.id === id);
    if (!item) return;
    
    const editModal = document.getElementById('editModal');
    const editModalTitle = document.getElementById('editModalTitle');
    const editModalBody = document.getElementById('editModalBody');
    
    if (!editModal || !editModalTitle || !editModalBody) return;
    
    editModalTitle.textContent = `Edit ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    
    // Generate form based on type
    let formHtml = '';
    
    if (type === 'job') {
        formHtml = `
            <form id="editForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Job Title *</label>
                        <input type="text" class="form-control" id="editJobTitle" value="${item.title}" required>
                    </div>
                    <div class="form-group">
                        <label>Company *</label>
                        <input type="text" class="form-control" id="editJobCompany" value="${item.company}" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Job Type *</label>
                        <select class="form-select" id="editJobType" required>
                            <option value="full-time" ${item.type === 'full-time' ? 'selected' : ''}>Full-time</option>
                            <option value="part-time" ${item.type === 'part-time' ? 'selected' : ''}>Part-time</option>
                            <option value="contract" ${item.type === 'contract' ? 'selected' : ''}>Contract</option>
                            <option value="internship" ${item.type === 'internship' ? 'selected' : ''}>Internship</option>
                            <option value="remote" ${item.type === 'remote' ? 'selected' : ''}>Remote</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select class="form-select" id="editJobStatus">
                            <option value="active" ${item.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="expired" ${item.status === 'expired' ? 'selected' : ''}>Expired</option>
                        </select>
                    </div>
                </div>
            </form>
        `;
    } else if (type === 'user') {
        formHtml = `
            <form id="editForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Full Name *</label>
                        <input type="text" class="form-control" id="editUserName" value="${item.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Email *</label>
                        <input type="email" class="form-control" id="editUserEmail" value="${item.email}" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Phone Number</label>
                        <input type="tel" class="form-control" id="editUserPhone" value="${item.phone}">
                    </div>
                    <div class="form-group">
                        <label>Role *</label>
                        <select class="form-select" id="editUserRole" required>
                            <option value="admin" ${item.role === 'admin' ? 'selected' : ''}>Admin</option>
                            <option value="job_seeker" ${item.role === 'job_seeker' ? 'selected' : ''}>Job Seeker</option>
                            <option value="employer" ${item.role === 'employer' ? 'selected' : ''}>Employer</option>
                            <option value="instructor" ${item.role === 'instructor' ? 'selected' : ''}>Instructor</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Status</label>
                    <select class="form-select" id="editUserStatus">
                        <option value="active" ${item.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${item.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="suspended" ${item.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                    </select>
                </div>
            </form>
        `;
    }
    
    editModalBody.innerHTML = formHtml;
    editModal.style.display = 'flex';
}

function saveEdit() {
    const type = window.currentItemType;
    const id = window.currentItemId;
    
    if (type === 'job') {
        const title = document.getElementById('editJobTitle').value;
        const company = document.getElementById('editJobCompany').value;
        const jobType = document.getElementById('editJobType').value;
        const status = document.getElementById('editJobStatus').value;
        
        const jobIndex = currentData.jobs.findIndex(job => job.id === id);
        if (jobIndex !== -1) {
            currentData.jobs[jobIndex] = {
                ...currentData.jobs[jobIndex],
                title,
                company,
                type: jobType,
                status
            };
            renderJobsTable(currentData.jobs);
        }
    } else if (type === 'user') {
        const name = document.getElementById('editUserName').value;
        const email = document.getElementById('editUserEmail').value;
        const phone = document.getElementById('editUserPhone').value;
        const role = document.getElementById('editUserRole').value;
        const status = document.getElementById('editUserStatus').value;
        
        const userIndex = currentData.users.findIndex(user => user.id === id);
        if (userIndex !== -1) {
            currentData.users[userIndex] = {
                ...currentData.users[userIndex],
                name,
                email,
                phone,
                role,
                status
            };
            renderUsersTable(currentData.users);
        }
    }
    
    document.getElementById('editModal').style.display = 'none';
    alert(`${type} updated successfully!`);
}

function viewDetails(type, id) {
    const item = currentData[type + 's'].find(item => item.id === id);
    if (!item) return;
    
    let details = '';
    if (type === 'user') {
        details = `
            <h3>User Details</h3>
            <p><strong>ID:</strong> ${item.id}</p>
            <p><strong>Name:</strong> ${item.name}</p>
            <p><strong>Email:</strong> ${item.email}</p>
            <p><strong>Phone:</strong> ${item.phone}</p>
            <p><strong>Role:</strong> ${item.role}</p>
            <p><strong>Status:</strong> ${item.status}</p>
            <p><strong>Registration Date:</strong> ${item.regDate}</p>
        `;
    } else if (type === 'payment') {
        details = `
            <h3>Payment Details</h3>
            <p><strong>Transaction ID:</strong> ${item.id}</p>
            <p><strong>User/Company:</strong> ${item.user}</p>
            <p><strong>Amount:</strong> ${item.amount}</p>
            <p><strong>Payment Method:</strong> ${item.method}</p>
            <p><strong>Date:</strong> ${item.date}</p>
            <p><strong>Status:</strong> ${item.status}</p>
        `;
    }
    
    alert(details.replace(/<[^>]*>/g, ''));
}

function approveItem(type, id) {
    const itemIndex = currentData[type + 's'].findIndex(item => item.id === id);
    if (itemIndex !== -1) {
        currentData[type + 's'][itemIndex].status = 'Active';
        renderJobsTable(currentData.jobs);
        alert(`${type} ${id} approved successfully!`);
    }
}

function issueCertificate(id) {
    const certIndex = currentData.certificates.findIndex(cert => cert.id === id);
    if (certIndex !== -1 && currentData.certificates[certIndex].status === 'Pending') {
        currentData.certificates[certIndex].status = 'Issued';
        currentData.certificates[certIndex].issueDate = new Date().toISOString().split('T')[0];
        renderCertificatesTable(currentData.certificates);
        alert(`Certificate ${id} issued successfully!`);
    }
}

function downloadCertificate(id) {
    alert(`Downloading certificate ${id}...`);
}

function downloadReceipt(id) {
    alert(`Downloading receipt for ${id}...`);
}

function confirmReceipt(id) {
    const donationIndex = currentData.donations.findIndex(donation => donation.id === id);
    if (donationIndex !== -1 && currentData.donations[donationIndex].status === 'Pending') {
        currentData.donations[donationIndex].status = 'Received';
        renderDonationsTable(currentData.donations);
        alert(`Donation ${id} marked as received!`);
    }
}

function viewAnalytics(id) {
    alert(`Showing analytics for ad campaign ${id}...`);
}

function exportPayments() {
    const dataStr = JSON.stringify(currentData.payments, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'payments-export.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    alert('Payments data exported successfully!');
}

// Utility functions
function getFormattedDate(daysOffset = 0) {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
}

// Make functions available globally
window.confirmDelete = confirmDelete;
window.editItem = editItem;
window.viewDetails = viewDetails;
window.approveItem = approveItem;
window.issueCertificate = issueCertificate;
window.downloadCertificate = downloadCertificate;
window.downloadReceipt = downloadReceipt;
window.confirmReceipt = confirmReceipt;
window.viewAnalytics = viewAnalytics;
window.exportPayments = exportPayments;
