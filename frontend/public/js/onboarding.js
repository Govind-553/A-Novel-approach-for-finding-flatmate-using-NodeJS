// Accordion Functionality for Welcome Page
function toggleAccordion(header) {
    const item = header.parentElement;
    const content = item.querySelector('.accordion-content');
    const isActive = item.classList.contains('active');

    document.querySelectorAll('.accordion-item').forEach(accItem => {
        accItem.classList.remove('active');
        accItem.querySelector('.accordion-content').style.maxHeight = null;
        const icon = accItem.querySelector('.accordion-icon');
        if (icon) {
            icon.classList.remove('fa-minus');
            icon.classList.add('fa-plus');
        }
    });

    // Toggle current item
    if (!isActive) {
        item.classList.add('active');
        content.style.maxHeight = content.scrollHeight + "px";
        const icon = item.querySelector('.accordion-icon');
        if (icon) {
            icon.classList.remove('fa-plus');
            icon.classList.add('fa-minus');
        }
    }
}

// Selection Page Logic
function selectRole(role, cardElement) {
    document.querySelectorAll('.selection-card').forEach(card => card.classList.remove('selected'));
    cardElement.classList.add('selected');

    sessionStorage.setItem('userRole', role);
}

function proceedToHome() {
    const role = sessionStorage.getItem('userRole');
    if (!role) {
        showErrorModal();
        return;
    }
    
    window.location.href = '/main.html';
}

function goBack() {
    sessionStorage.removeItem('userRole'); // Clear selection
    window.history.back();
}

function showErrorModal() {
    const modal = document.getElementById('errorModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeErrorModal() {
    const modal = document.getElementById('errorModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Ensure selection is cleared when revisiting the page
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.selection-card')) {
        sessionStorage.removeItem('userRole'); 
        document.querySelectorAll('.selection-card').forEach(card => card.classList.remove('selected'));
    }

    const currentRole = sessionStorage.getItem('userRole');
    if (currentRole && document.querySelector('.selection-card')) {
        const card = document.querySelector(`.selection-card[onclick*="'${currentRole}'"]`);
        if (card) card.classList.add('selected');
    }
});
