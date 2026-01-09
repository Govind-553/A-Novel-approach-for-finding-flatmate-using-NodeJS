const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorModal = document.getElementById('errorModal');
const togglePassword = document.getElementById('togglePassword');

    function clearLoginForm() {
        emailInput.value = '';
        passwordInput.value = '';
    }

    /* ---------- Form Submit ---------- */
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const formData = new URLSearchParams(new FormData(loginForm));

        apiFetch('/login', {
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
                window.location.href = '/homepage';
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