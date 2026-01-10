const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorModal = document.getElementById('errorModal');
const successModal = document.getElementById('successModal');
const togglePassword = document.getElementById('togglePassword');

    // Check for registration success param
    window.addEventListener('DOMContentLoaded', () => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('registration') === 'success') {
            window.history.replaceState(null, '', '/main.html');
            window.history.pushState(null, '', '/servicelogin');
            
            successModal.style.display = 'flex';
        }
    });

    function closeSuccessModal() {
        successModal.style.display = 'none';
    }

    /* ---------- Utility: Clear Form ---------- */
    function clearLoginForm() {
        emailInput.value = '';
        passwordInput.value = '';
    }

    /* ---------- Form Submit ---------- */
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const formData = new URLSearchParams(new FormData(loginForm));

        apiFetch('/login-service', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            clearLoginForm(); // clear fields on every submit

            if (data.success) {
                window.location.href = '/servicehomepage';
            } else {
                showErrorModal();
            }
        })
        .catch(error => {
            console.error('Error during login:', error);
            clearLoginForm();
        });
    });

    /* ---------- Modal Controls ---------- */
    function showErrorModal() {
        errorModal.style.display = 'flex';
    }

    function closeModal() {
        errorModal.style.display = 'none';
        clearLoginForm();
    }

    function handleTryAgain(event) {
        event.preventDefault();
        closeModal();
    }

    /* ---------- Password Toggle ---------- */
    togglePassword.addEventListener('click', () => {
        const isHidden = passwordInput.type === 'password';
        passwordInput.type = isHidden ? 'text' : 'password';
        togglePassword.classList.toggle('fa-eye');
        togglePassword.classList.toggle('fa-eye-slash');
    });