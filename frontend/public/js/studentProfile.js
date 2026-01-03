// Store user data globally
let userData = {};

// 1. Initialize logic
document.addEventListener('DOMContentLoaded', function() {
            if (window.initialUserData) {
                userData = window.initialUserData;
            } else {
                console.warn("No initialUserData found in window scope.");
                // Mock data for UI testing if backend var fails
                userData = {
                    fULL_name: "Student Name",
                    email: "student@example.com",
                    contact_number: "1234567890",
                    address: "Mumbai, India"
                };
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
                const res = await fetch('/saveProfile', {
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
            // Reload only on success close if needed, or simply reload directly after OK
            if (document.getElementById('statusIcon').textContent === '✅') {
                 location.reload(); 
            }
        }
        