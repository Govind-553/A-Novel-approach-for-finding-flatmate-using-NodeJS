const togglePassword = document.querySelector('#togglePassword');
const passwordInput = document.querySelector('#password');

  togglePassword.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    togglePassword.classList.toggle('fa-eye');
    togglePassword.classList.toggle('fa-eye-slash');
  });

  const trashButton = document.querySelector('#trashImage'); 
  const fileInput = document.querySelector('#profileImage'); 

  trashButton.addEventListener('click', () => {
    fileInput.value = '';
  });

  const form = document.getElementById('registrationForm');
  const modal = document.getElementById("successModal");

  form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const submitBtn = this.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerText;
      
      submitBtn.innerText = "Registering...";
      submitBtn.disabled = true;

      try {
          const response = await apiFetch(this.getAttribute('action'), {
              method: 'POST',
              body: formData
          });

          const result = await response.json();

          if (result.success) {
              form.reset();
              modal.classList.add("show");
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
  
  function closeModal() {
    modal.classList.remove("show");
    window.location.href = '/loginpage';
  }