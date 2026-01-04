document.addEventListener('DOMContentLoaded', async () => {
    const notificationList = document.getElementById('notification-list');
    
    await fetchNotifications();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    
    socket.onopen = () => {
        // Register user for notifications
        const userId = getCookie('userId') || getCookie('id'); // Attempt to get ID
        const token = getCookie('token');
        if(token) {
             socket.send(JSON.stringify({ type: 'REGISTER' })); 
         }
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'NOTIFICATION') {
            // Re-fetch or append
            fetchNotifications();
        }
    };

});

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

async function fetchNotifications() {
    try {
        const response = await fetch('/api/notifications'); 
        const data = await response.json();

        if (data.success && data.notifications.length > 0) {
            renderNotifications(data.notifications);
        } else {
            notificationList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash fa-3x"></i>
                    <p>No new notifications at the moment.</p>
                </div>`;
        }
    } catch (error) {
        console.error('Error fetching notifications:', error);
    }
}

function renderNotifications(notifications) {
    const notificationList = document.getElementById('notification-list');
    notificationList.innerHTML = ''; // Clear current list

    notifications.forEach(notif => {
        const card = document.createElement('div');
        card.className = 'notification-card';
        // Construct visual card
        const payload = notif.payload || {};
        card.innerHTML = `
            <div class="notification-content">
                <h3>Room Available!</h3>
                <p><strong>Provider:</strong> ${payload.providerName || 'Unknown'}</p>
                <p><strong>Contact:</strong> ${payload.contactNumber || 'N/A'}</p>
                <p><strong>Email:</strong> ${payload.email || 'N/A'}</p>
                <p><small>${new Date(notif.createdAt).toLocaleString()}</small></p>
            </div>
            <div class="notification-actions">
                <button class="chat-btn" onclick="openChat('${payload.chatId}', '${payload.providerName}')">
                    <i class="fas fa-comments"></i> Chat
                </button>
                <button class="delete-btn" onclick="showDeleteModal('${notif._id}', this)">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        notificationList.appendChild(card);
    });
}

function openChat(chatId, providerName) {
    window.location.href = `/chat?chatId=${chatId}&name=${encodeURIComponent(providerName)}`;
}

let notificationToDelete = null;
let cardToDelete = null;

function showDeleteModal(id, btnElement) {
    notificationToDelete = id;
    cardToDelete = btnElement.closest('.notification-card');
    const modal = document.getElementById('deleteModal');
    modal.classList.add('show');
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('show');
    notificationToDelete = null;
    cardToDelete = null;
}

// Bind confirmation button click
document.addEventListener('DOMContentLoaded', () => {
    // ... (existing code for socket) ...
    document.getElementById('confirmDeleteBtn').addEventListener('click', deleteNotification);
});


async function deleteNotification() {
    if (!notificationToDelete) return; // Should not happen

    const modal = document.getElementById('deleteModal');
    // Disable button to prevent double clicks
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    confirmBtn.disabled = true;
    confirmBtn.innerText = 'Deleting...';

    try {
        const response = await fetch(`/api/notifications/${notificationToDelete}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
            closeDeleteModal();
            // Remove the card from DOM
            if (cardToDelete) {
                cardToDelete.style.opacity = '0';
                cardToDelete.style.transform = 'translateY(10px)';
                setTimeout(() => {
                    cardToDelete.remove();
                    // Check if list is empty
                    const list = document.getElementById('notification-list');
                    if (list.children.length === 0) {
                        list.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-bell-slash fa-3x"></i>
                                <p>No new notifications at the moment.</p>
                            </div>`;
                    }
                }, 300);
            }
        } else {
            alert('Failed to delete notification');
            closeDeleteModal();
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
        closeDeleteModal();
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerText = 'Yes';
    }
}
