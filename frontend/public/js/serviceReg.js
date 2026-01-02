document.addEventListener("DOMContentLoaded", function () {
        const registrationForm = document.getElementById("registrationForm");
        
        // Form submission handler
        registrationForm.addEventListener("submit", function (event) {
            // Standard form submission
        });
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
    e.stopPropagation(); // Prevent opening modal when clicking trash
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