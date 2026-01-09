// Global auth state
let isUserLoggedIn = false;

document.addEventListener('DOMContentLoaded', async () => {
    const userRole = sessionStorage.getItem('userRole');
    const signinBtn = document.getElementById('nav-signin');
    const servicesBtn = document.getElementById('nav-services');

    if (userRole === 'student') {
        if (signinBtn) {
            signinBtn.textContent = 'Sign in';
            signinBtn.onclick = () => location.href = '/loginpage';
            signinBtn.style.display = 'inline-block';
        }
        if (servicesBtn) servicesBtn.style.display = 'none';
    } else if (userRole === 'serviceProvider') {
        if (signinBtn) {
            signinBtn.style.display = 'none';
        }
        if (servicesBtn) {
            servicesBtn.textContent = 'Sign in'; 
            servicesBtn.onclick = () => location.href = '/servicelogin';
            servicesBtn.style.display = 'inline-block';
        }
    } else {
        // Guest user - hide services button
        if (servicesBtn) servicesBtn.style.display = 'none';
    }

    try {
        try {
            const authResponse = await apiFetch('/check-auth');
            if (authResponse.ok) {
                const authData = await authResponse.json();
                isUserLoggedIn = authData.loggedIn;
                console.log('Auth check result:', authData);
                console.log('isUserLoggedIn:', isUserLoggedIn);
            }
        } catch (authError) {
            console.error('Error checking auth:', authError);
            isUserLoggedIn = false;
        }

        const response = await apiFetch('/data');
        if (!response.ok) throw new Error('Failed to fetch data');
        const { services, profiles } = await response.json();

        renderProfiles(profiles);
        renderServices(services, 'Food', '.foodSwiper .swiper-wrapper', 'foodservice.jpg');
        renderServices(services, 'Laundry', '.laundrySwiper .swiper-wrapper', 'laundryservice.jpg');
        renderServices(services, 'Broker', '.brokerSwiper .swiper-wrapper', 'brokerservice.jpg');
        
        initializeSwipers();
        
    } catch (error) {
        console.error('Error loading data:', error);
    }
});

async function logout() {
    try {
        await apiFetch('/logout', { method: 'POST' });
        sessionStorage.removeItem('userRole'); 
        window.location.href = '/'; 
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/';
    }
}

// Make popup functions global
window.openPopup = function(button) {
    const popup = button.nextElementSibling;
    popup.classList.add("open-popup");
    popup.style.display = 'block';
}

window.closePopup = function(button) {
    const popup = button.parentElement;
    popup.classList.remove("open-popup");
    popup.style.display = 'none';
}

function openUserPopup(button) {
        const popup = button.nextElementSibling;
        popup.classList.add("open-popup");
    }

    function closeUserPopup(button) {
        const popup = button.parentElement;
        popup.classList.remove("open-popup");
    }

function getSwiperConfig() {
    return {
        slidesPerView: 1, 
        spaceBetween: 20,
        centeredSlides: false,
        grabCursor: true,
        loop: true,
        on: {
            slideChange: function () {
                // Auto-close any open popups when sliding
                const openPopups = document.querySelectorAll('.popup.open-popup');
                openPopups.forEach(popup => {
                    popup.classList.remove('open-popup');
                });
            }
        },
        slidesPerGroup: 1, /* Default for mobile */
        breakpoints: {
            768: { 
                slidesPerView: 2, 
                spaceBetween: 30,
                slidesPerGroup: 2, /* Tablet: Slide 2 at a time */
            },
            1024: { 
                slidesPerView: 3, 
                spaceBetween: 40,
                slidesPerGroup: 3, /* Laptop: Slide 3 at a time */
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

function initializeSwipers() {
    const commonConfig = getSwiperConfig();

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
}

function setupSearchAndFilter() {
    // Search functionality
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', function () {
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
                        slide.style.display = 'flex'; // Changed from block to flex for card layout
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

    const clearButton = document.getElementById('clear-button');
    if (clearButton) {
        clearButton.addEventListener('click', function () {
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

    // Filter functionality
    const filterButton = document.getElementById('filterButton');
    if (filterButton) {
        filterButton.addEventListener('click', () => {
            const dropdown = document.getElementById('filterDropdown');
            if (dropdown.style.display === 'none' || dropdown.style.display === '') {
                dropdown.style.display = 'block';
            } else {
                dropdown.style.display = 'none';
                resetFilters();
            }
        });
    }

    const applyFilters = document.getElementById('applyFilters');
    if (applyFilters) {
        applyFilters.addEventListener('click', () => {
            const selectedYear = document.getElementById('yearFilter').value;
            const selectedBranch = document.getElementById('branchFilter').value;
    
            const profileContainer = document.querySelector('.profilesSwiper .swiper-wrapper');
    
            profileContainer.querySelectorAll('.swiper-slide.card').forEach(card => {
                const professionText = card.querySelector('.profession').textContent.trim();
                const [userYear, userBranch] = professionText.split('-').map(str => str.trim());
    
                const yearMatch = selectedYear === "All Years" || userYear === selectedYear;
                const branchMatch = selectedBranch === "All Branches" || userBranch === selectedBranch;
    
                card.style.display = (yearMatch && branchMatch) ? "flex" : "none"; // Changed to flex
            });
    
            const profilesSwiper = document.querySelector('.profilesSwiper').swiper;
            if (profilesSwiper) {
                profilesSwiper.update();
                profilesSwiper.slideTo(0);
            }
            document.getElementById('filterDropdown').style.display = 'none';
        });
    }

    function resetFilters() {
        document.getElementById('yearFilter').value = "All Years";
        document.getElementById('branchFilter').value = "All Branches";
    
        document.querySelectorAll('.profilesSwiper .swiper-wrapper .swiper-slide.card').forEach(card => {
            card.style.display = "flex"; 
        });
    
        const profilesSwiperEl = document.querySelector('.profilesSwiper');
        if (profilesSwiperEl && profilesSwiperEl.swiper) {
             let profilesSwiper = profilesSwiperEl.swiper;
             if (profilesSwiper.destroy) {
                 profilesSwiper.destroy(true, true); 
             }
             
             const commonConfig = getSwiperConfig();
             const swiperConfig = {
                 ...commonConfig,
                 pagination: { ...commonConfig.pagination, el: ".profiles-pagination" },
                 navigation: { nextEl: ".profiles-next", prevEl: ".profiles-prev" },
             };
             profilesSwiper = new Swiper(".profilesSwiper", swiperConfig);
             profilesSwiper.slideTo(0, 0); 
        }
    }
}

// Initialize search and filter
setupSearchAndFilter();
setupTabs();

function setupTabs() {
    // about-us section tabs script
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

    // Initialize the tabs to show the register pages for students and service providers        
    const getStartedBtn = document.querySelector('.get-started');

    // Add click event to Get Started button
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', function() {
            const activeRent = document.querySelector('button[onclick="showTab(\'rent\')"].active');
            const activeFind = document.querySelector('button[onclick="showTab(\'find\')"].active');

            if (activeRent) {
                window.location.href = '/registrationpage';
            } else if (activeFind) {
                window.location.href = '/serviceregister';
            }
        });
    }
    
    // Initialize default tab
    showTab('rent');
}

function renderProfiles(profiles) {
    const container = document.querySelector('.profilesSwiper .swiper-wrapper');
    if (!container) return;
    
    container.innerHTML = profiles.map(user => {
        const popupContent = isUserLoggedIn ? `
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
        ` : `
            <div style="text-align: center; color: #d9534f; padding: 10px;">
                <i class="fas fa-exclamation-circle fa-3x" style="margin-bottom: 10px;"></i>
                <h5>Please login or register to view details.</h5>
            </div>
        `;

        return `
        <div class="swiper-slide card" data-type="profiles">
            <div class="card-content">
                <div class="image">
                    <img src="${user.profile_pic}" alt="User pic">
                </div>
                <div class="name-profession">
                    <span class="name">${user.fULL_name}</span>
                    <span class="profession">${user.year}-${user.branch}</span>
                </div>
                <button class="card-btn secondary" onclick="openPopup(this)">Contact Me</button>
                <div class="popup">
                    ${popupContent}
                    <button type="button" onclick="closePopup(this)">OK</button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function renderServices(services, type, selector, imageName) {
    const container = document.querySelector(selector);
    if (!container) return;

    const filteredServices = services.filter(s => s.service === type);
    
    container.innerHTML = filteredServices.map(service => {
        const popupContent = isUserLoggedIn ? `
            <h5>Thank you for visiting our Service!</h5>
            <h5 style="text-align: left;">Connect with us using the details:</h5>
            <ul class="popup-list">
                <li><i class="fas fa-phone"></i> ${service.contact_number}</li>
                <li><i class="fas fa-envelope"></i> ${service.email}</li>
                <li onclick="window.location.href='${service.price_chart_link}';" style="cursor: pointer;"><i class="fas fa-file-invoice"></i> View Price Chart</li>
            </ul>
        ` : `
            <div style="text-align: center; color: #d9534f; padding: 10px;">
                <i class="fas fa-exclamation-circle fa-3x" style="margin-bottom: 10px;"></i>
                <h5>Please login or register to view details.</h5>
            </div>
        `;

        return `
        <div class="swiper-slide card" data-type="${type}">
            <div class="card-content">
                <div class="image">
                    <img src="/img/${imageName}" alt="${type}-service">
                </div>
                <div class="name-profession">
                    <span class="name">${service.business_Name}</span>
                </div>
                <button class="card-btn secondary service-contact-btn" onclick="openPopup(this)">Contact Us</button>
                <div class="popup" style="margin-top: 20px;">
                    ${popupContent}
                    <button type="button" style="background: #D0B8A8;" onclick="closePopup(this)">OK</button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Hamburger Toggle
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger-btn');
    const navbarRight = document.getElementById('navbar-links');
    
    if (hamburger && navbarRight) {
        hamburger.addEventListener('click', () => {
            navbarRight.classList.toggle('active');
            
            // Animate hamburger lines
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
                    scrollBtn.style.display = 'flex';
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
        // Contact Form & Modal Logic
    const contactForm = document.getElementById('contact-form');
    const successModal = document.getElementById('successModal');

    if (contactForm) {
        contactForm.addEventListener("submit", function(ev) {
            ev.preventDefault();
            const data = new FormData(contactForm);
            
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "Sending...";
            submitBtn.disabled = true;

            const action = contactForm.getAttribute('action');
            apiFetch(action, {
                method: contactForm.method,
                body: data,
                headers: {
                    'Accept': 'application/json'
                }
            }).then(response => {
                if (response.ok) {
                    contactForm.reset();
                    openSuccessModal();
                } else {
                    response.json().then(data => {
                        if (Object.hasOwn(data, 'errors')) {
                            alert(data["errors"].map(error => error["message"]).join(", "));
                        } else {
                            alert("Oops! There was a problem submitting your form");
                        }
                    });
                }
            }).catch(error => {
                console.error('Error:', error);
                alert("Oops! There was a problem submitting your form");
            }).finally(() => {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            });
        });
    }

    window.openSuccessModal = function() {
        if(successModal) {
            successModal.style.display = "block";
            // Trigger animation
            const checkmark = successModal.querySelector('.checkmark');
            if(checkmark) {
                // Reset animation
                checkmark.style.animation = 'none';
                checkmark.offsetHeight; /* trigger reflow */
                checkmark.style.animation = null; 
            }
        }
    }

    window.closeSuccessModal = function() {
        if(successModal) {
            successModal.style.display = "none";
        }
    }

    // Close modal when clicking outside of it
    window.onclick = function(event) {
        if (event.target == successModal) {
            closeSuccessModal();
        }
    }
});