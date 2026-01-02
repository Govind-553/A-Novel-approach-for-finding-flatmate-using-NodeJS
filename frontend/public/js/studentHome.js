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

const closeBtn = document.querySelector('.close-btn');
if (closeBtn) {
    document.querySelector('.close-btn').addEventListener('click', function() {
        const poppingText = document.querySelector('.popping-text');
        if (poppingText) poppingText.style.display = 'none';
    });
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
document.addEventListener('DOMContentLoaded', () => {
    fetch('/service-recommendations', { credentials: 'include' })
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
        })
        .catch(err => {
            console.error('Error fetching recommendations:', err);
        });

    // Filter Logic
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');
            filterTable(filterValue);
        });
    });

    function filterTable(category) {
        const rows = document.querySelectorAll('#services-table-body tr');
        rows.forEach(row => {
            const categoryText = row.children[0].textContent; // First column is category
            if (category === 'all') {
                row.style.display = '';
            } else if (categoryText.includes(category)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
});

function populateTable(tableId, data, keys) {
    const tbody = document.getElementById(tableId);
    if (!tbody) return;
    tbody.innerHTML = '';

    data.forEach(row => {
        const tr = document.createElement('tr');
        keys.forEach(key => {
            const td = document.createElement('td');
            if (key === 'price_chart_link') {
                td.innerHTML = `<a href="${row[key]}">View Chart</a>`;
            } else {
                td.textContent = row[key] || '';
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}    

// function to show the matching students profiles using K-Means clustering
window.addEventListener('DOMContentLoaded', () => {
    fetch('/roommate-recommendations', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const container = document.getElementById('roommate-cards-container');
            if (container) {
                container.innerHTML = '';
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

function logout() {
    window.location.href = '/';
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