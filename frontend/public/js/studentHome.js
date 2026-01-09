// Function to scroll to the service providers section   
 function scrollToSection() {
    document.getElementById('service-providers-section').scrollIntoView({ 
        behavior: 'smooth'
    });
}   

// Show the popping text on page load
window.addEventListener('load', function() {
    const poppingText = document.querySelector('.popping-text');
    if (poppingText) poppingText.style.display = 'flex';
});

// Auth Check for navigation
window.addEventListener('pageshow', async function(event) {
    // Refresh notifications
    if (typeof fetchUnreadCount === 'function') {
        fetchUnreadCount();
    }

    try {
        const response = await fetch('/check-auth');
        const data = await response.json();
        if (!data.loggedIn) {
            showSessionExpiredModal();
        }
    } catch (error) {
        console.error('Auth check failed', error);
    }
});

function showSessionExpiredModal() {
    if (document.getElementById('auth-modal-overlay')) return;

    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'auth-modal-overlay';

    const modalContent = document.createElement('div');
    modalContent.className = 'auth-modal-content';

    modalContent.innerHTML = `
        <div class="auth-modal-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
            </svg>
        </div>
        <h3 class="auth-modal-title">Access Denied</h3>
        <p class="auth-modal-message">Please login again to view this page.</p>
        <button id="auth-modal-btn">Login Again</button>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Prevent scrolling
    document.body.style.overflow = 'hidden';

    document.getElementById('auth-modal-btn').onclick = () => {
        document.body.style.overflow = '';
        window.location.href = '/main.html';
    };
}

const closeBtn = document.querySelector('.close-btn');
if (closeBtn) {
    document.querySelector('.close-btn').addEventListener('click', function() {
        const poppingText = document.querySelector('.popping-text');
        if (poppingText) poppingText.style.display = 'none';
    });
}

// Notification Logic
async function fetchUnreadCount() {
    try {
        // Add timestamp to prevent caching
        const response = await fetch(`/api/notifications/unread-count?t=${Date.now()}`);
        const data = await response.json();
        
        if (data.success) {
            updateNotificationBadge(data.count);
        }
    } catch (error) {
        console.error('Error fetching unread count:', error);
    }
}

function updateNotificationBadge(count) {
    const badge = document.getElementById('notification-count');
    if (!badge) return;

    if (count > 0) {
        badge.innerText = count;
        badge.style.display = 'flex'; 
    } else {
        badge.style.display = 'none'; 
    }
}

// Initial fetch
fetchUnreadCount();

// Refresh on tab focus/visibility change
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        fetchUnreadCount();
    }
});

// WebSocket for real-time updates
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const socket = new WebSocket(`${protocol}//${window.location.host}`);

socket.onopen = () => {
    const token = getCookie('token'); 
    if(token) {
            socket.send(JSON.stringify({ type: 'REGISTER' })); 
    }
};

socket.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        if (data.type === 'NOTIFICATION') {
            fetchUnreadCount();
        }
    } catch (e) {
        console.error("Socket message error", e);
    }
};

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// Global popup functions 
window.openPopup = function(button) {
    const popup = button.nextElementSibling;
    if (popup) {
        popup.classList.add("open-popup");
        popup.style.display = 'block';
    }
}

window.closePopup = function(button) {
    const popup = button.parentElement;
    if (popup) {
        popup.classList.remove("open-popup");
        popup.style.display = 'none';
    }
}

// Script to handle data fetching of service providers
function fetchServiceRecommendations() {
    fetch('/service-recommendations?t=' + Date.now(), { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                console.warn('Failed to load recommendations');
                return;
            }

            const unifiedData = [];

            // Process Food Services
            if (data.foodServices) {
                data.foodServices.forEach(service => {
                    unifiedData.push({
                        category: '🍱 Food',
                        name: service.business_Name,
                        contact: `Email: ${service.email}<br>Phone: ${service.contact_number}`,
                        details: `Type: ${service.food_type}`,
                        priceChart: service.price_chart_link
                    });
                });
            }

            // Process Laundry Services
            if (data.laundryServices) {
                data.laundryServices.forEach(service => {
                    unifiedData.push({
                        category: '🧺 Laundry',
                        name: service.business_Name,
                        contact: `Email: ${service.email}<br>Phone: ${service.contact_number}`,
                        details: `Service: ${service.laundry_service}`,
                        priceChart: service.price_chart_link
                    });
                });
            }

            // Process Broker Services
            if (data.brokerServices) {
                data.brokerServices.forEach(service => {
                    unifiedData.push({
                        category: '🏠 Broker',
                        name: service.business_Name,
                        contact: `Email: ${service.email}<br>Phone: ${service.contact_number}`,
                        details: `Room: ${service.room_type}<br>Amenities: ${service.amenities}<br>Price: ${service.pricing_value}<br>Landmark: ${service.landmark}`,
                        priceChart: service.price_chart_link
                    });
                });
            }

            populateTable('services-table-body', unifiedData, ['category', 'name', 'contact', 'details', 'priceChart']);
            populateServiceCards('service-cards-container', unifiedData);
        })
        .catch(err => {
            console.error('Error fetching recommendations:', err);
        });
}

document.addEventListener('DOMContentLoaded', fetchServiceRecommendations);
window.addEventListener('pageshow', (event) => {
    if (event.persisted || performance.getEntriesByType("navigation")[0].type === 'back_forward') {
        fetchServiceRecommendations();
    }
});

    // Filter Logic
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');
            filterTable(filterValue);
            filterServiceCards(filterValue);
        });
    });

    function filterTable(category) {
        const rows = document.querySelectorAll('#services-table-body tr');
        rows.forEach(row => {
            const categoryText = row.children[0].textContent; 
            if (category === 'all') {
                row.style.display = '';
            } else if (categoryText.includes(category)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    function filterServiceCards(category) {
        const cards = document.querySelectorAll('#service-cards-container .service-card');
        cards.forEach(card => {
            const categoryText = card.getAttribute('data-category');
            if (category === 'all') {
                card.style.display = 'flex';
            } else if (categoryText && categoryText.includes(category)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

function populateTable(tableId, data, keys) {
    const tbody = document.getElementById(tableId);
    if (!tbody) return;
    tbody.innerHTML = '';

    data.forEach(row => {
        const tr = document.createElement('tr');
        keys.forEach(key => {
            const td = document.createElement('td');
            if (key === 'priceChart') {
                td.innerHTML = `<a href="${row[key]}" target="_blank" class="price-chart-link">View Chart</a>`;
            } else {
                td.innerHTML = row[key] || ''; // Use innerHTML to allow <br> tags in contact/details
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

function populateServiceCards(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'service-card';
        card.setAttribute('data-category', item.category);

        let iconClass = 'fa-concierge-bell';
        if (item.category.includes('Food')) iconClass = 'fa-utensils';
        if (item.category.includes('Laundry')) iconClass = 'fa-tshirt';
        if (item.category.includes('Broker')) iconClass = 'fa-home';

        card.innerHTML = `
            <div class="service-card-header">
                <i class="fas ${iconClass} service-icon"></i>
                <h3>${item.name}</h3>
                <span class="service-category-tag">${item.category}</span>
            </div>
            <div class="service-card-body">
                <div class="service-info-row">
                    <strong>Contact:</strong>
                    <p>${item.contact.replace(/<br>/g, ', ')}</p>
                </div>
                <div class="service-info-row">
                    <strong>Details:</strong>
                    <p>${item.details.replace(/<br>/g, ' | ')}</p>
                </div>
                <div class="service-action-row">
                    <a href="${item.priceChart}" target="_blank" class="view-chart-btn">
                        <i class="fas fa-file-invoice-dollar"></i> View Price Chart
                    </a>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}    

// function to show the matching students profiles using K-Means clustering
function fetchRecommendations() {
    fetch('/roommate-recommendations?t=' + Date.now(), { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const container = document.getElementById('roommate-cards-container');
            if (container) {
                container.innerHTML = '';
                if (data.roommates.length === 0) {
                     container.innerHTML = '<div class="no-matches" style="text-align:center; width:100%; padding:20px;"><h6 style="font-size: 0.95rem; color: #666;">No matches found for your profile ⚠️</h6></div>';
                }
                data.roommates.forEach(user => {
                    const card = `
                <div class="swiper-slide card" data-type="roommates">
                    <div class="image-container">
                        <img src="${user.profile_pic}" alt="Profile Picture">
                    </div>
                    <h3>${user.fULL_name}</h3>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Phone:</strong> ${user.contact_number}</p>
                    <p><strong>Food:</strong> ${user.food_type}</p>
                    <p><strong>Room Type:</strong> ${user.room_type}</p>
                    <p><strong>Amenities:</strong> ${user.amenities}</p>
                </div>
            `;
                container.innerHTML += card;
                });

                // Initialize Roommate Swiper
                if (typeof Swiper !== 'undefined' && typeof getSwiperConfig === 'function') {
                    const commonConfig = getSwiperConfig();
                    new Swiper(".roommateSwiper", {
                        ...commonConfig,
                        pagination: { ...commonConfig.pagination, el: ".roommate-pagination" },
                        navigation: { nextEl: ".roommate-next", prevEl: ".roommate-prev" },
                    });
                }
            }
        }
    });
}

window.addEventListener('DOMContentLoaded', fetchRecommendations);
window.addEventListener('pageshow', (event) => {
    if (event.persisted || performance.getEntriesByType("navigation")[0].type === 'back_forward') {
        fetchRecommendations();
    }
});

// search-input script for searching profiles and services
const searchBtn = document.getElementById('search-button');
if (searchBtn) {
    searchBtn.addEventListener('click', function () {
        const searchQuery = document.getElementById('search-input').value.toLowerCase();
        let firstMatchFound = false;

        const swiperSections = [
            {
                selector: '.profilesSwiper',
                filter: user => user.getAttribute('data-type') === 'profiles',
                scrollClass: '.profilesSwiper'
            },
            {
                selector: '.foodSwiper',
                filter: service => service.getAttribute('data-type') === 'Food',
                scrollClass: '.foodSwiper'
            },
            {
                selector: '.laundrySwiper',
                filter: service => service.getAttribute('data-type') === 'Laundry',
                scrollClass: '.laundrySwiper'
            },
            {
                selector: '.brokerSwiper',
                filter: service => service.getAttribute('data-type') === 'Broker',
                scrollClass: '.brokerSwiper'
            }
        ];

        swiperSections.forEach(section => {
            const swiperContainer = document.querySelector(section.selector);
            const slides = swiperContainer.querySelectorAll('.swiper-slide');

            if (searchQuery === '') {
                slides.forEach(slide => {
                    slide.style.display = 'flex'; // Changed to flex to match style.css card display
                });
                if (swiperContainer.swiper) swiperContainer.swiper.update();
                return;
            }

            let hasMatch = false;

            slides.forEach(slide => {
                const name = slide.querySelector('.name')?.textContent.toLowerCase() || '';
                const type = slide.getAttribute('data-type')?.toLowerCase() || '';

                if (name.includes(searchQuery) || type.includes(searchQuery)) {
                    slide.style.display = 'flex'; // Changed to flex
                    hasMatch = true;
                } else {
                    slide.style.display = 'none';
                }
            });

            if (swiperContainer.swiper) swiperContainer.swiper.update();

            if (hasMatch && !firstMatchFound) {
                document.querySelector(section.scrollClass).scrollIntoView({ behavior: 'smooth' });
                firstMatchFound = true;
            }
        });
    });
}

const clearBtn = document.getElementById('clear-button');
if (clearBtn) {
    clearBtn.addEventListener('click', function () {
        document.getElementById('search-input').value = '';
        const swiperSections = [
            '.profilesSwiper',
            '.foodSwiper',
            '.laundrySwiper',
            '.brokerSwiper'
        ];

        swiperSections.forEach(selector => {
            const swiperContainer = document.querySelector(selector);
            const slides = swiperContainer.querySelectorAll('.swiper-slide');
            slides.forEach(slide => {
                slide.style.display = 'flex'; // Changed to flex
            });
            if (swiperContainer.swiper) swiperContainer.swiper.update();
        });
    });
}

// about-us section script
window.showTab = function(tab) {
    document.querySelectorAll('.tab').forEach(button => {
        button.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const tabContent = document.querySelector(`.${tab}`);
    const tabButton = document.querySelector(`.tab[onclick="showTab('${tab}')"]`);
    if (tabContent) tabContent.classList.add('active');
    if (tabButton) tabButton.classList.add('active');
}

// Swiper Config
function getSwiperConfig() {
    return {
        slidesPerView: 1, 
        spaceBetween: 20,
        centeredSlides: false,
        grabCursor: true,
        loop: true,
        on: {
            slideChange: function () {
                const openPopups = document.querySelectorAll('.popup.open-popup');
                openPopups.forEach(popup => {
                    popup.classList.remove('open-popup');
                    popup.style.display = 'none';
                });
            }
        },
        slidesPerGroup: 1, 
        breakpoints: {
            768: { 
                slidesPerView: 2, 
                spaceBetween: 30,
                slidesPerGroup: 2, 
            },
            1024: { 
                slidesPerView: 3, 
                spaceBetween: 40,
                slidesPerGroup: 3, 
            },
            1440: { 
                slidesPerView: 3, 
                spaceBetween: 50,
                slidesPerGroup: 3,
            }
        },
        pagination: {
            clickable: true,
            dynamicBullets: true,
            dynamicMainBullets: 3,
        },
    };
}

// Swiper Initialization
document.addEventListener('DOMContentLoaded', function () {
    fetch('/data')
        .then(response => response.json())
        .then(data => {
            // Profiles Swiper
            const profilesWrapper = document.querySelector('.profilesSwiper .swiper-wrapper');
            if (profilesWrapper) {
                data.profiles.forEach(user => {
                    const userSlide = document.createElement('div');
                    userSlide.classList.add('swiper-slide', 'card');
                    userSlide.setAttribute('data-type', 'profiles');
                    userSlide.innerHTML = `
                        <div class="card-content">
                            <div class="image">
                                <img src="${user.profile_pic}" alt="${user.full_name}'s pic" class="user-image">
                            </div>
                            <div class="name-profession">
                                <span class="name">${user.fULL_name}</span>
                                <span class="profession">${user.year} - ${user.branch}</span>
                            </div>
                            <button class="card-btn secondary" onclick="openPopup(this)">Contact Me</button>
                            <div class="popup">
                                <h5>Thank You for visiting My Profile!</h5>
                                <h5>Here are my contact details:</h5>
                                <ul class="popup-list">
                                    <li><i class="fas fa-phone"></i> ${user.contact_number}</li>
                                    <li><i class="fas fa-envelope"></i> ${user.email}</li>
                                </ul>
                                <div class="social-links" style="margin: 10px 0; display: flex; justify-content: center; gap: 10px;">
                                    ${user.github ? `<a href="${user.github}" target="_blank" title="GitHub" style="color: #333;"><i class="fab fa-github fa-lg"></i></a>` : ''}
                                    ${user.linkedin ? `<a href="${user.linkedin}" target="_blank" title="LinkedIn" style="color: #0077b5;"><i class="fab fa-linkedin fa-lg"></i></a>` : ''}
                                    ${user.instagram ? `<a href="${user.instagram}" target="_blank" title="Instagram" style="color: #E1306C;"><i class="fab fa-instagram fa-lg"></i></a>` : ''}
                                    ${user.portfolio ? `<a href="${user.portfolio}" target="_blank" title="Portfolio" style="color: #333;"><i class="fas fa-globe fa-lg"></i></a>` : ''}
                                </div>
                                <button type="button" onclick="closePopup(this)">OK</button>
                            </div>
                        </div>
                    `;
                    profilesWrapper.appendChild(userSlide);
                });
            }

            // Food Services Swiper
            const foodWrapper = document.querySelector('.foodSwiper .swiper-wrapper');
            if (foodWrapper) {
                const foodServices = data.services.filter(service => service.service === 'Food');
                foodServices.forEach(service => {
                    const serviceSlide = document.createElement('div');
                    serviceSlide.classList.add('swiper-slide', 'card');
                    serviceSlide.setAttribute('data-type', 'Food');
                    serviceSlide.innerHTML = `
                        <div class="card-content">
                            <div class="image">
                                <img src="/img/foodservice.jpg" alt="${service.business_Name} image" class="service-image">
                            </div>
                            <div class="name-profession">
                                <span class="name">${service.business_Name}</span>
                                <span class="profession">${service.service}</span>
                            </div>
                            <button class="card-btn secondary service-contact-btn" onclick="openPopup(this)">Contact Us</button>
                            <div class="popup" style="margin-top: 20px;">
                                <h5>Thank you for visiting our Service!</h5>
                                <h5 style="text-align: left;">Connect with us using the details:</h5>
                                <ul class="popup-list">
                                    <li><i class="fas fa-phone"></i> ${service.contact_number}</li>
                                    <li><i class="fas fa-envelope"></i> ${service.email}</li>
                                    <li onclick="window.location.href='${service.price_chart_link}';" style="cursor: pointer;"><i class="fas fa-file-invoice"></i> View Price Chart</li>
                                </ul>
                                <button type="button" style="background: #D0B8A8;" onclick="closePopup(this)">OK</button>
                            </div>
                        </div>
                    `;
                    foodWrapper.appendChild(serviceSlide);
                });
            }

            // Laundry Services Swiper
            const laundryWrapper = document.querySelector('.laundrySwiper .swiper-wrapper');
            if (laundryWrapper) {
                const laundryServices = data.services.filter(service => service.service === 'Laundry');
                laundryServices.forEach(service => {
                    const serviceSlide = document.createElement('div');
                    serviceSlide.classList.add('swiper-slide', 'card');
                    serviceSlide.setAttribute('data-type', 'Laundry');
                    serviceSlide.innerHTML = `
                        <div class="card-content">
                            <div class="image">
                                <img src="/img/laundryservice.jpg" alt="${service.business_Name} image" class="service-image">
                            </div>
                            <div class="name-profession">
                                <span class="name">${service.business_Name}</span>
                                <span class="profession">${service.service}</span>
                            </div>
                            <button class="card-btn secondary service-contact-btn" onclick="openPopup(this)">Contact Us</button>
                            <div class="popup" style="margin-top: 20px;">
                                <h5>Thank you for visiting our Service!</h5>
                                <h5 style="text-align: left;">Connect with us using the details:</h5>
                                <ul class="popup-list">
                                    <li><i class="fas fa-phone"></i> ${service.contact_number}</li>
                                    <li><i class="fas fa-envelope"></i> ${service.email}</li>
                                    <li onclick="window.location.href='${service.price_chart_link}';" style="cursor: pointer;"><i class="fas fa-file-invoice"></i> View Price Chart</li>
                                </ul>
                                <button type="button" style="background: #D0B8A8;" onclick="closePopup(this)">OK</button>
                            </div>
                        </div>
                    `;
                    laundryWrapper.appendChild(serviceSlide);
                });
            }

            // Broker Services Swiper
            const brokerWrapper = document.querySelector('.brokerSwiper .swiper-wrapper');
            if (brokerWrapper) {
                const brokerServices = data.services.filter(service => service.service === 'Broker');
                brokerServices.forEach(service => {
                    const serviceSlide = document.createElement('div');
                    serviceSlide.classList.add('swiper-slide', 'card');
                    serviceSlide.setAttribute('data-type', 'Broker');
                    serviceSlide.innerHTML = `
                        <div class="card-content">
                            <div class="image">
                                <img src="/img/brokerservice.jpg" alt="${service.business_Name} image" class="service-image">
                            </div>
                            <div class="name-profession">
                                <span class="name">${service.business_Name}</span>
                                <span class="profession">${service.service}</span>
                            </div>
                            <button class="card-btn secondary service-contact-btn" onclick="openPopup(this)">Contact Us</button>
                            <div class="popup" style="margin-top: 20px;">
                                <h5>Thank you for visiting our Service!</h5>
                                <h5 style="text-align: left;">Connect with us using the details:</h5>
                                <ul class="popup-list">
                                    <li><i class="fas fa-phone"></i> ${service.contact_number}</li>
                                    <li><i class="fas fa-envelope"></i> ${service.email}</li>
                                    <li onclick="window.location.href='${service.price_chart_link}';" style="cursor: pointer;"><i class="fas fa-file-invoice"></i> View Price Chart</li>
                                </ul>
                                <button type="button" style="background: #D0B8A8;" onclick="closePopup(this)">OK</button>
                            </div>
                        </div>
                    `;
                    brokerWrapper.appendChild(serviceSlide);
                });
            }

            const commonConfig = getSwiperConfig();

            // Initialize Swipers
            new Swiper(".profilesSwiper", {
                ...commonConfig,
                pagination: { ...commonConfig.pagination, el: ".profiles-pagination" },
                navigation: { nextEl: ".profiles-next", prevEl: ".profiles-prev" },
            });

            new Swiper(".foodSwiper", {
                ...commonConfig,
                pagination: { ...commonConfig.pagination, el: ".food-pagination" },
                navigation: { nextEl: ".food-next", prevEl: ".food-prev" },
            });

            new Swiper(".laundrySwiper", {
                ...commonConfig,
                pagination: { ...commonConfig.pagination, el: ".laundry-pagination" },
                navigation: { nextEl: ".laundry-next", prevEl: ".laundry-prev" },
            });

            new Swiper(".brokerSwiper", {
                ...commonConfig,
                pagination: { ...commonConfig.pagination, el: ".broker-pagination" },
                navigation: { nextEl: ".broker-next", prevEl: ".broker-prev" },
            });
        })
        .catch(error => console.error('Error fetching data:', error));
});

// logout popup script
function showLogoutPopup() {
    const popup = document.getElementById('logoutPopup');
    if (popup) popup.style.display = 'block';
}

async function logout() {
    try {
        await fetch('/logout', { method: 'POST' });
        sessionStorage.removeItem('userRole');
        window.location.href = '/main.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/main.html';
    }
}

function closeLogoutPopup() {
    const popup = document.getElementById('logoutPopup');
    if (popup) popup.style.display = 'none';
}

// Hamburger Toggle
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger-btn');
    const navbarRight = document.getElementById('navbar-links');
    
    if (hamburger && navbarRight) {
        hamburger.addEventListener('click', () => {
            navbarRight.classList.toggle('active');
            
            const lines = hamburger.querySelectorAll('.hamburger-line');
            if (navbarRight.classList.contains('active')) {
                 lines[0].style.transform = 'rotate(45deg) translate(5px, 6px)';
                 lines[1].style.opacity = '0';
                 lines[2].style.transform = 'rotate(-45deg) translate(5px, -6px)';
            } else {
                 lines[0].style.transform = 'none';
                 lines[1].style.opacity = '1';
                 lines[2].style.transform = 'none';
            }
        });
    }
});

// srcoll to top button script 
document.addEventListener('DOMContentLoaded', () => {
        const scrollBtn = document.getElementById('scrollTopBtn');

        if (scrollBtn) {
            window.onscroll = function () {
                if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
                    scrollBtn.style.display = 'flex'; // Changed to flex for proper centering
                } else {
                    scrollBtn.style.display = 'none';
                }
            };

            scrollBtn.onclick = function () {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
        }

        const scrollLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');

        scrollLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    const offset = 130;
                    window.scrollTo({
                        top: targetElement.offsetTop - offset,
                        behavior: 'smooth'
                    });
                }
            });
        });
    });