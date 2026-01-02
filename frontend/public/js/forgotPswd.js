const emailForm = document.getElementById('emailForm');
const passwordForm = document.getElementById('passwordForm');
const errorMessage = document.getElementById('errorMessage');
const instructionText = document.getElementById('instructionText');
const backLink = document.getElementById('backLink');
const successModal = document.getElementById('successModal');
    
    // Toggle Password Visibility Logic
    function setupToggle(inputId, toggleId) {
        const input = document.getElementById(inputId);
        const toggle = document.getElementById(toggleId);
        if (!input || !toggle) return;
        
        toggle.addEventListener('click', () => {
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            // Toggle Icon Class
            toggle.classList.toggle('fa-eye');
            toggle.classList.toggle('fa-eye-slash');
        });
    }

    // Initialize Toggles
    setupToggle('newPassword', 'toggleNewPassword');
    setupToggle('confirmPassword', 'toggleConfirmPassword');

    // Get 'type' from URL (student or service)
    const urlParams = new URLSearchParams(window.location.search);
    const userType = urlParams.get('type') || 'student'; // Default to student
    
    // Set up Back Link based on type
    const loginUrl = userType === 'service' ? '/servicelogin' : '/loginpage'; 
    backLink.href = loginUrl;

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.style.display = 'block';
    }
    
    function hideError() {
        errorMessage.style.display = 'none';
    }

    // Step 1: Verify Email
    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();
        const email = document.getElementById('email').value;
        const btn = emailForm.querySelector('button');
        const originalText = btn.textContent;
        btn.textContent = 'Verifying...';
        btn.disabled = true;

        let url = userType === 'service' ? '/verify-service-email' : '/verify-email';

        try {
            const formData = new URLSearchParams();
            formData.append('email', email);

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                // Success: Show Step 2
                document.getElementById('confirmedEmail').value = email;
                emailForm.classList.remove('active');
                passwordForm.classList.add('active');
                instructionText.textContent = 'Create a secure new password.';
                hideError();
            } else {
                showError(data.message || 'Email not found.');
            }
        } catch (err) {
            console.error(err);
            showError('Unable to verify email. Please try again.');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });

    // Step 2: Reset Password
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();
        
        const newPass = document.getElementById('newPassword').value;
        const confirmPass = document.getElementById('confirmPassword').value;
        const email = document.getElementById('confirmedEmail').value;

        if (newPass !== confirmPass) {
            showError('Passwords do not match.');
            return;
        }

        if (newPass.length < 6) {
            showError('Password should be at least 6 characters.');
            return;
        }

        const btn = passwordForm.querySelector('button');
        const originalText = btn.textContent;
        btn.textContent = 'Resetting...';
        btn.disabled = true;

        let url = userType === 'service' ? '/reset-service-password' : '/reset-password';

        try {
            const formData = new URLSearchParams();
            formData.append('email', email);
            formData.append('newPassword', newPass);

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                successModal.style.display = 'flex';
            } else {
                showError(data.message || 'Error resetting password.');
            }
        } catch (err) {
            console.error(err);
            showError('Server error. Please try again.');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });

    function redirectToLogin() {
        window.location.href = loginUrl;
    }