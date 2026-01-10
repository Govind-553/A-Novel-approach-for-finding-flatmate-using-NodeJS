document.addEventListener("DOMContentLoaded", function () {
    const registrationForm = document.getElementById("registrationForm");
    const modal = document.getElementById("successModal"); // Assuming successModal exists in HTML

    // Form submission handler
    if (registrationForm) {
        registrationForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;

            submitBtn.innerText = "Registering...";
            submitBtn.disabled = true;

            try {
                // Use the action attribute (e.g. /register)
                const action = this.getAttribute('action');
                const response = await apiFetch(action, {
                    method: 'POST',
                    body: formData
                });

                // apiFetch returns the response object
                const result = await response.json();

                if (result.success) {
                    registrationForm.reset();
                    // Redirect to subscription page with session file name
                    if (result.sessionFileName) {
                        window.location.href = `/subscription?session=${result.sessionFileName}`;
                    } else {
                         window.location.href = '/servicelogin';
                    }
                } else {
                    alert(result.message || 'Registration failed. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred during registration.');
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});

  const togglePassword = document.querySelector('#togglePassword');
  const passwordInput = document.querySelector('#password');

  togglePassword.addEventListener('click', () => {

    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;

    togglePassword.classList.toggle('fa-eye');
    togglePassword.classList.toggle('fa-eye-slash');
  });

const trashButton = document.querySelector('#trashLink'); 
const urlInput = document.querySelector('#priceChartLink'); 
const priceChartContainer = document.getElementById('priceChartContainer');

trashButton.addEventListener('click', (e) => {
    e.stopPropagation();
    urlInput.value = '';
    console.log('Price chart link cleared');
});

// Script for modal hide & display for price chart modal
var priceChartLink = document.getElementById('priceChartLink');
var modalOverlay = document.getElementById('priceChartModal');
var closeModalBtn = document.getElementById('closeModal');

// Click on the container to trigger modal if input is disabled
priceChartContainer.addEventListener('click', function () {
  if (priceChartLink.disabled) {
    modalOverlay.classList.add('modal-open'); 
  }
});

// Close modal on button click
closeModalBtn.addEventListener('click', function (e) {
  e.stopPropagation(); // Prevent bubbling
  modalOverlay.classList.remove('modal-open'); 
  priceChartLink.removeAttribute('disabled');
  priceChartLink.style.pointerEvents = 'auto'; // Re-enable pointer events
  priceChartLink.style.backgroundColor = 'white';
  priceChartLink.focus();
});

// Close modal on overlay click
modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) {
        modalOverlay.classList.remove('modal-open');
    }
});