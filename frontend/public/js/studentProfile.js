// Store user data globally
let userData = {};

// Auth Check for navigation
window.addEventListener('pageshow', async function(event) {
    try {
        const response = await apiFetch('/check-auth');
        const data = await response.json();
        if (!data.loggedIn) {
            showSessionExpiredModal();
        }
    } catch (error) {
        console.error('Auth check failed', error);
        // Fallback: If auth check fails network-wise, we might want to assume logged out or do nothing.
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

// 1. Initialize logic
document.addEventListener('DOMContentLoaded', async function() {
            if (window.initialUserData) {
                userData = window.initialUserData;
            } else {
                console.warn("No initialUserData found in window scope. Fetching from API...");
                try {
                    const res = await apiFetch('/studentprofile?format=json');
                    // Check specifically for 401/403
                    if (res.status === 401 || res.status === 403) {
                         showSessionExpiredModal();
                         return;
                    }
                    
                    const data = await res.json();
                    if (data.success) {
                        userData = data.userData;
                    } else {
                        console.error("Failed to fetch profile data");
                    }
                } catch (e) {
                     console.error("Error fetching profile data", e);
                }
            }
            populateView();
            populateForm();
        });

        function populateView() {
            // Basic Info
            document.getElementById('profilePicDisplay').src = userData.profile_pic || '/img/User.png';
            document.getElementById('viewFullName').textContent = userData.fULL_name || 'Not Set';
            document.getElementById('viewEmail').textContent = userData.email || 'Not Set';
            document.getElementById('viewContact').textContent = userData.contact_number || 'Not Set';
            document.getElementById('viewAddress').textContent = userData.address || 'Not Set';
            document.getElementById('viewGender').textContent = userData.gender || 'Not Set';
            
            // Details
            document.getElementById('viewYear').textContent = userData.year || 'Year';
            document.getElementById('viewBranch').textContent = userData.branch || 'Branch';
            document.getElementById('viewAbout').textContent = userData.about_yourself || 'About Me';
            
            // Socials (Hide if empty)
            updateLink('Github', userData.github);
            updateLink('Linkedin', userData.linkedin);
            updateLink('Instagram', userData.instagram);
            updateLink('Portfolio', userData.portfolio);

            // Preferences
            document.getElementById('viewFood').textContent = userData.food_type || 'Any';
            document.getElementById('viewRoom').textContent = (userData.room_type || '').split(',').join(', ') || 'Any';
            document.getElementById('viewPricing').textContent = userData.pricing_value || 'Any';
            
            // Amenities View
            const amContainer = document.getElementById('viewAmenities');
            amContainer.innerHTML = '';
            const ams = userData.amenities ? userData.amenities.split(',') : [];
            if(ams.length === 0) amContainer.innerHTML = '<span class="pref-item">None selected</span>';
            ams.forEach(am => {
                amContainer.innerHTML += `<div class="pref-item"><i class="fas fa-check-circle"></i> ${am.trim()}</div>`;
            });

            // Landmarks View
            const lmContainer = document.getElementById('viewLandmarks');
            lmContainer.innerHTML = '';
             const lms = userData.landmark ? userData.landmark.split(',') : [];
            if(lms.length === 0) lmContainer.innerHTML = '<span class="pref-item">None selected</span>';
            lms.forEach(lm => {
                lmContainer.innerHTML += `<div class="pref-item"><i class="fas fa-map-pin"></i> ${lm.trim()}</div>`;
            });
        }

        function updateLink(name, url) {
            const link = document.getElementById('link' + name);
            const text = document.getElementById('text' + name);
            if (!url) {
                link.style.display = 'none'; // Hide in view mode if empty
            } else {
                link.style.display = 'flex';
                link.href = url;
                text.textContent = name;
            }
        }

        function populateForm() {
            document.getElementById('editFullName').value = userData.fULL_name || '';
            document.getElementById('editEmail').value = userData.email || '';
            document.getElementById('editContact').value = userData.contact_number || '';
            document.getElementById('editAddress').value = userData.address || '';
            document.getElementById('editGender').value = userData.gender || 'Male';
            document.getElementById('editPassword').value = userData.password || ''; 
            
            document.getElementById('editYear').value = userData.year || 'FE';
            document.getElementById('editBranch').value = userData.branch || 'CMPN';
            document.getElementById('editAbout').value = userData.about_yourself || '';
            
            document.getElementById('editGithub').value = userData.github || '';
            document.getElementById('editLinkedin').value = userData.linkedin || '';
            document.getElementById('editInstagram').value = userData.instagram || '';
            document.getElementById('editPortfolio').value = userData.portfolio || '';

            document.getElementById('editFood').value = userData.food_type || 'Veg';
            const roomTypes = userData.room_type ? userData.room_type.split(',') : [];
            document.querySelectorAll('input[name="room_type"]').forEach(cb => {
                if(roomTypes.map(r => r.trim()).includes(cb.value)) cb.checked = true;
            });
            document.getElementById('editPricing').value = userData.pricing_value || '';
            
            // Checkboxes
            const ams = userData.amenities ? userData.amenities.split(',') : [];
            document.querySelectorAll('input[name="amenities"]').forEach(cb => {
                if(ams.includes(cb.value)) cb.checked = true;
            });
            
            const lms = userData.landmark ? userData.landmark.split(',') : [];
             document.querySelectorAll('input[name="landmark"]').forEach(cb => {
                if(lms.includes(cb.value)) cb.checked = true;
            });
        }

        // 2. Toggle Mode
        function toggleEditMode(enable) {
            const body = document.body;
            const amCont = document.getElementById('editAmenitiesContainer');
            const lmCont = document.getElementById('editLandmarkContainer');
            const roomCont = document.getElementById('editRoomContainer');
            
            if (enable) {
                body.classList.remove('view-mode');
                body.classList.add('edit-mode');
                amCont.style.display = 'block';
                lmCont.style.display = 'block';
                roomCont.style.display = 'block';
            } else {
                body.classList.remove('edit-mode');
                body.classList.add('view-mode');
                 amCont.style.display = 'none';
                 lmCont.style.display = 'none';
                 roomCont.style.display = 'none';
            }
        }

        // 3. Save Logic
        async function saveProfile() {
            const form = document.getElementById('profileForm');
            const formData = new FormData();
            
            // Manually append data to handle checkboxes properly
            const textInputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="password"], textarea, select');
            textInputs.forEach(input => {
                formData.append(input.name, input.value);
            });
            
            // Room Types
            const roomTypes = Array.from(document.querySelectorAll('input[name="room_type"]:checked')).map(cb => cb.value).join(',');
            formData.append('room_type', roomTypes);

            // Amenities
            const ams = Array.from(document.querySelectorAll('input[name="amenities"]:checked')).map(cb => cb.value).join(',');
            formData.append('amenities', ams);
            
            // Landmarks
             const lms = Array.from(document.querySelectorAll('input[name="landmark"]:checked')).map(cb => cb.value).join(',');
            formData.append('landmark', lms);
            
            // Profile Pic
            const fileInput = document.getElementById('profilePicInput');
            if(fileInput.files[0]) {
                formData.append('profileImage', fileInput.files[0]);
            }

            try {
                const res = await apiFetch('/saveProfile', {
                    method: 'POST',
                    body: formData
                });
                
                if(res.ok) {
                    const txt = await res.text();
                    showStatusModal("Profile Saved!", false);
                } else {
                    showStatusModal("Error saving profile", true);
                }
            } catch (err) {
                console.error(err);
                showStatusModal("Connection Failed", true);
            }
        }

        // 4. Modal Logic
        function showStatusModal(message, isError) {
            const modal = document.getElementById('statusModal');
            const icon = document.getElementById('statusIcon');
            const msg = document.getElementById('statusMessage');
            
            modal.style.display = 'block';
            msg.textContent = message;
            
            if (isError) {
                icon.textContent = '❌'; 
                icon.style.color = 'red';
            } else {
                icon.textContent = '✅'; 
                icon.style.color = '#28a745';
            }
        }

        function closeStatusModal() {
            const modal = document.getElementById('statusModal');
            modal.style.display = 'none';
            if (document.getElementById('statusIcon').textContent === '✅') {
                 location.reload(); 
            }
        }
        