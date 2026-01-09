let serviceData = {};
let extraFields = {};

        document.addEventListener('DOMContentLoaded', async function() {
            try {
                if (window.initialServiceData) {
                    serviceData = window.initialServiceData;

                    // Parse extra fields JSON
                    if (serviceData.extraFields && serviceData.extraFields !== "undefined" && typeof serviceData.extraFields === 'string') {
                         extraFields = JSON.parse(serviceData.extraFields.replace(/&quot;/g,'"'));
                    }
                } else {
                    console.log("Fetching service data from API...");
                    const res = await apiFetch('/serviceprofile?format=json');
                    const data = await res.json();
                    if(data.success) {
                        serviceData = data.serviceData;
                        // Parse extra fields JSON
                        if (serviceData.extraFields && serviceData.extraFields !== "undefined" && typeof serviceData.extraFields === 'string') {
                             extraFields = JSON.parse(serviceData.extraFields.replace(/&quot;/g,'"'));
                        }
                    } else {
                        throw new Error("Failed to load service data");
                    }
                }
            } catch (e) {
                console.error("Error parsing/fetching serviceData", e);
            }

            populateView();
            populateForm();
            updateIcon(serviceData.service);
            updateDynamicFields(serviceData.service); // Setup form fields
        });

        function updateIcon(type) {
            const img = document.getElementById('serviceIconDisplay');
            if(type === 'Food') img.src = '/img/foodservice.jpg';
            else if(type === 'Laundry') img.src = '/img/laundryservice.jpg';
            else if(type === 'Broker') img.src = '/img/brokerservice.jpg';
            else img.src = '/img/service.png';
        }

        function populateView() {
            document.getElementById('viewBusinessName').textContent = serviceData.business_Name || 'Not Set';
            document.getElementById('viewEmail').textContent = serviceData.email || 'Not Set';
            document.getElementById('viewContact').textContent = serviceData.contact_number || 'Not Set';
            document.getElementById('viewAddress').textContent = serviceData.address || 'Not Set';
            document.getElementById('viewServiceType').textContent = serviceData.service || 'Select Service';
            
            const pLink = document.getElementById('viewPriceLink');
            if(serviceData.price_chart_link) {
                pLink.href = serviceData.price_chart_link;
                pLink.textContent = "View Price Chart";
                pLink.style.display = 'block';
            } else {
                pLink.style.display = 'none';
            }

            // Populate Dynamic View
            const container = document.getElementById('viewDynamicContent');
            container.innerHTML = '';
            
            if(serviceData.service === 'Food') {
                 container.innerHTML += `<div class="info-item"><i class="fas fa-utensils"></i> ${extraFields.food_type || 'Not specified'}</div>`;
            } else if (serviceData.service === 'Laundry') {
                 container.innerHTML += `<strong>Services:</strong><br>${(extraFields.laundry_service || '').split(',').join('<br>')}`;
            } else if (serviceData.service === 'Broker') {
                 container.innerHTML += `
                    <div class="info-item"><i class="fas fa-home"></i> ${(Array.isArray(extraFields.room_type) ? extraFields.room_type.join(', ') : extraFields.room_type || '-')}</div>
                    <div class="info-item"><i class="fas fa-rupee-sign"></i> ${extraFields.pricing_value || '-'}</div>
                    <div class="info-item"><i class="fas fa-check-circle"></i> ${extraFields.availability || '-'}</div>
                    <hr>
                    <strong>Amenities:</strong> <small>${(extraFields.amenities || []).join(', ')}</small><br>
                    <strong>Landmarks:</strong> <small>${(extraFields.landmark || []).join(', ')}</small>
                 `;
            }
        }

        function populateForm() {
            document.getElementById('editBusinessName').value = serviceData.business_Name || '';
            document.getElementById('editEmail').value = serviceData.email || '';
            document.getElementById('editContact').value = serviceData.contact_number || '';
            document.getElementById('editAddress').value = serviceData.address || '';
            document.getElementById('editPassword').value = serviceData.password || '';
            document.getElementById('editService').value = serviceData.service || 'Food';
            document.getElementById('editPriceLink').value = serviceData.price_chart_link || '';
        }

        // Logic to build dynamic form fields based on Service Type
        function updateDynamicFields(type) {
            const container = document.getElementById('editDynamicContainer');
            container.innerHTML = ''; // Clear

            if (type === 'Food') {
                createSelect(container, 'food_type', 'Food Type', ['Veg', 'Non-Veg', 'All'], extraFields.food_type);
            } 
            else if (type === 'Laundry') {
                createCheckboxGroup(container, 'laundry_service', 'Services Offered', 
                    ['Wash & Iron', 'Dry Cleaning', 'Pickup & Delivery', 'Subscription Plans'], 
                    (extraFields.laundry_service || '').split(','));
            } 
            else if (type === 'Broker') {
                createCheckboxGroup(container, 'room_type', 'Room Type', 
                    ['Single - 1 Member', 'Shared: 2 Members', 'Apartment: 4 Members', '1 RK: 1-2 Members', '2 RK: 2-4 Members', '1 BHK: 2 Members', '2 BHK: 4 Members'], 
                    extraFields.room_type || []);
                createSelect(container, 'pricing_value', 'Price Range', ['Low: ₹5000 - 8000', 'Medium: ₹8000 - 20000', 'High: ₹20000 - 30000'], extraFields.pricing_value);
                createSelect(container, 'availability', 'Availability', ['Available', 'Not Available'], extraFields.availability);
                
                createCheckboxGroup(container, 'amenities', 'Amenities', 
                    ['WiFi', 'Non-AC', 'AC', 'TV', 'Furnished', 'Parking'], extraFields.amenities || []);
                    
                createCheckboxGroup(container, 'landmark', 'Landmarks', 
                    ['Near Bus Station', 'Near Railway Station', 'Near Metro', 'Near Market', 'Near College'], extraFields.landmark || []);
            }
        }

        // Helpers for Dynamic Form
        function createSelect(parent, name, label, options, selected) {
            let html = `<label>${label}</label><select class="edit-input" id="${name}" name="${name}">`;
            options.forEach(opt => {
                html += `<option value="${opt}" ${selected === opt ? 'selected' : ''}>${opt}</option>`;
            });
            html += `</select>`;
            parent.innerHTML += html;
        }

        function createCheckboxGroup(parent, name, label, options, checkedList) {
             let html = `<label><strong>${label}</strong></label><div class="checkbox-container">`;
             options.forEach(opt => {
                 const isChecked = checkedList.includes(opt) ? 'checked' : '';
                 html += `<label><input type="checkbox" name="${name}" value="${opt}" ${isChecked}> ${opt}</label>`;
             });
             html += `</div><br>`;
             parent.innerHTML += html;
        }

        function toggleEditMode(enable) {
            const body = document.body;
            if (enable) {
                body.classList.remove('view-mode');
                body.classList.add('edit-mode');
                // Re-inject dynamic form fields in case service type changed
                 updateDynamicFields(document.getElementById('editService').value);
            } else {
                body.classList.remove('edit-mode');
                body.classList.add('view-mode');
            }
        }

        async function saveProfile() {
            const form = document.getElementById('profileForm');
            const formData = new FormData();

            // Static Fields
            formData.append('businessName', document.getElementById('editBusinessName').value);
            formData.append('email', document.getElementById('editEmail').value);
            formData.append('contactNumber', document.getElementById('editContact').value);
            formData.append('address', document.getElementById('editAddress').value);
            formData.append('password', document.getElementById('editPassword').value);
            formData.append('service', document.getElementById('editService').value);
            formData.append('priceChartLink', document.getElementById('editPriceLink').value);

            // Dynamic Extra Fields Logic
            const serviceType = document.getElementById('editService').value;
            const updatedExtras = {};

            if(serviceType === 'Food') {
                updatedExtras.food_type = document.getElementById('food_type').value;
            } else if (serviceType === 'Laundry') {
                 updatedExtras.laundry_service = Array.from(document.querySelectorAll('input[name="laundry_service"]:checked'))
                    .map(el => el.value).join(',');
            } else if (serviceType === 'Broker') {
                updatedExtras.room_type = Array.from(document.querySelectorAll('input[name="room_type"]:checked')).map(el => el.value);
                 updatedExtras.pricing_value = document.getElementById('pricing_value').value;
                 updatedExtras.availability = document.getElementById('availability').value;
                 updatedExtras.amenities = Array.from(document.querySelectorAll('input[name="amenities"]:checked')).map(el => el.value);
                 updatedExtras.landmark = Array.from(document.querySelectorAll('input[name="landmark"]:checked')).map(el => el.value);
            }
            
            formData.append('extra_fields', JSON.stringify(updatedExtras));

            try {
                const res = await apiFetch('/profile-update', { method: 'POST', body: formData });
                if(res.ok) {
                    showStatusModal('Profile updated!', false);
                } else {
                    showStatusModal('Update failed', true);
                }
            } catch (e) {
                console.error(e);
                showStatusModal('Error saving profile', true);
            }
        }

        // Modal Logic
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