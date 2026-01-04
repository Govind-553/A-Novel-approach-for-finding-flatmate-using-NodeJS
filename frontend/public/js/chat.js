
let socket;
let currentChatId = null;
let currentUserType = null; // 'student' or 'provider'

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentChatId = urlParams.get('chatId');
    const partnerName = urlParams.get('name');

    if (partnerName) {
        document.getElementById('chat-partner-name').innerText = partnerName;
    }
    currentUserType = getCookie('userType'); 
    
    // Set Profile Image
    const imgEl = document.getElementById('chat-partner-img');
    const iconEl = document.getElementById('chat-partner-icon');
    
    if (currentUserType === 'student') {
        // Student viewing Provider -> Use broker img
        imgEl.src = '/img/brokerservice.jpg';
        imgEl.style.display = 'block';
        iconEl.style.display = 'none';
    } else if (currentUserType === 'provider') {
        imgEl.src = '/img/User.jpg'; 
        imgEl.style.display = 'block';
        iconEl.style.display = 'none';
    } else {
        imgEl.style.display = 'none';
        iconEl.style.display = 'block';
    } 

    // Initialize WebSocket
    initWebSocket();

    // Fetch previous messages
    await fetchChatHistory(currentChatId);
});

function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    socket = new WebSocket(`${protocol}//${window.location.host}`);

    socket.onopen = () => {
        console.log('Connected to WebSocket');
        socket.send(JSON.stringify({ type: 'REGISTER', chatId: currentChatId, userType: currentUserType }));
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'MESSAGE') {
            // Prevent duplicate appending of my own message
            if (data.payload.sender !== currentUserType) {
                appendMessage(data.payload, 'received');
            }
        } else if (data.type === 'MESSAGES_READ') {
            markAllAsRead();
        } else if (data.type === 'MESSAGE_DELETED') {
            const msgEl = document.querySelector(`.message[data-id="${data.messageId}"]`);
            if (msgEl) msgEl.remove();
        }
    };

    socket.onclose = () => {
        console.log('Disconnected from WebSocket');
    };
}

async function fetchChatHistory(chatId) {
    currentChatId = chatId;
    try {
        const res = await fetch(`/api/chats/${chatId}/messages`);
        const data = await res.json();
        if (data.success) {
            const container = document.getElementById('chat-messages');
            container.innerHTML = '';
            
            // 1. Render Messages
            data.messages.forEach(msg => {
                const isMine = (currentUserType === 'student' && msg.sender === 'student') || 
                               (currentUserType === 'provider' && msg.sender === 'provider'); 
                appendMessage(msg, isMine ? 'sent' : 'received');
            });
            scrollToBottom();

            // 2. Set Header Info (Image & Name)
            if (data.chat) {
                const imgEl = document.getElementById('chat-partner-img');
                const nameEl = document.getElementById('chat-partner-name');
                const iconEl = document.getElementById('chat-partner-icon');

                if (currentUserType === 'student') {
                    // Chatting with Provider
                    const service = data.chat.serviceId;
                    if (service) {
                        nameEl.innerText = service.business_Name || 'Service Provider';
                        // fallback to static for provider if not present
                        imgEl.src = '/img/brokerservice.jpg'; 
                        imgEl.style.display = 'block';
                        iconEl.style.display = 'none';
                    }
                } else if (currentUserType === 'provider') {
                    // Chatting with Student
                    const student = data.chat.studentId;
                    if (student) {
                        nameEl.innerText = student.fULL_name || 'Student';
                        if (student.profile_pic) {
                            imgEl.src = student.profile_pic;
                        } else {
                            imgEl.src = '/img/User.png';
                        }
                        imgEl.style.display = 'block';
                        iconEl.style.display = 'none';
                    }
                }
            }
            
            // 3. Render Suggestions
            renderSuggestions();
        }
    } catch (err) {
        console.error('Failed to load chat history', err);
    }
}

function renderSuggestions() {
    const suggestionsContainer = document.getElementById('chat-suggestions');
    suggestionsContainer.innerHTML = '';

    let chips = [];
    if (currentUserType === 'student') {
        chips = [
            'Is this available?',
            'I am interested.',
            'When can I visit?',
            'Please share details.'
        ];
    } else if (currentUserType === 'provider') {
        chips = [
            'Hello! How can I help you?',
            'Are you interested?',
            'When would you like to visit?',
            'Do you have any questions?'
        ];
    }

    chips.forEach(text => {
        const chip = document.createElement('div');
        chip.className = 'suggestion-chip';
        chip.innerText = text;
        chip.onclick = () => useSuggestion(text);
        suggestionsContainer.appendChild(chip);
    });
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    if (!text) return;

    // Validation for critical fields
    if (!currentUserType) {
        console.error("User Type is missing! Attempting to refetch.");
        currentUserType = getCookie('userType');
        if (!currentUserType) {
            alert("Error: User identity invalid. Please refresh or re-login.");
            return;
        }
    }

    const messagePayload = {
        type: 'MESSAGE',
        chatId: currentChatId,
        content: text,
        sender: currentUserType,
        timestamp: new Date().toISOString()
    };
    
    console.log("Sending message:", messagePayload); // Debug log

    // Optimistic UI update
    appendMessage(messagePayload, 'sent');
    
    // Send to server
    socket.send(JSON.stringify(messagePayload));
    
    input.value = '';
    scrollToBottom();
}

function appendMessage(msg, type) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `message ${type}`;
    
    let ticksHtml = '';
    
    // Store ID
    div.setAttribute('data-id', msg._id || msg.id);

    if (type === 'sent') {
        const tickClass = msg.isRead ? 'read' : ''; 
        ticksHtml = `<span class="message-ticks ${tickClass}"><i class="fas fa-check-double"></i></span>`;
        
        // Add Context Menu listener for own messages
        div.addEventListener('contextmenu', (e) => {
            console.log("Right click detected on message:", msg._id); 
            e.preventDefault();
            showContextMenu(div, msg._id || msg.id);
        });
    } else {
    }

    div.innerHTML = `
        ${msg.content}
        <div class="message-meta" style="display:flex; justify-content:flex-end; align-items:center; gap:5px; margin-top:2px;">
            <small class="message-time">${new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
            ${ticksHtml}
        </div>
    `;
    container.appendChild(div);
    scrollToBottom();
}

let selectedMessageId = null;
const contextMenu = document.getElementById('contextMenu');

function showContextMenu(element, msgId) {
    selectedMessageId = msgId;
    
    // Show first to measure dimensions
    contextMenu.style.visibility = 'hidden';
    contextMenu.style.display = 'block';
    
    const menuHeight = contextMenu.offsetHeight;
    const menuWidth = contextMenu.offsetWidth;
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Vertical Position
    let top = rect.bottom;
    
    // Check if it fits below (buffer 10px)
    if (top + menuHeight + 10 > windowHeight) {
        top = rect.top - menuHeight;
    }
    
    // Safety check for top edge
    if (top < 10) top = 10;

    let left = rect.right - menuWidth;
    
    // Safety check for left edge
    if (left < 10) left = 10;

    console.log(`Menu Pos: Top=${top}, Left=${left}, H=${menuHeight}, W=${menuWidth}`);

    contextMenu.style.top = `${top}px`;
    contextMenu.style.left = `${left}px`;
    contextMenu.style.visibility = 'visible';
}

function deleteMessageAction() {
    if (selectedMessageId) {
        if (currentChatId) {
             socket.send(JSON.stringify({ 
                type: 'DELETE_MESSAGE', 
                chatId: currentChatId, 
                messageId: selectedMessageId 
            }));
        }
    }
    hideContextMenu();
}

function hideContextMenu() {
    contextMenu.style.display = 'none';
    selectedMessageId = null;
}

// Global click to hide context menu
document.addEventListener('click', hideContextMenu);

function markAllAsRead() {
    const ticks = document.querySelectorAll('.message-ticks:not(.read)');
    ticks.forEach(tick => tick.classList.add('read'));
}

function scrollToBottom() {
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
}

async function clearChat() {
    if(confirm("Are you sure you want to clear this chat?")) {
        await fetch(`/api/chats/${currentChatId}/clear`, { method: 'POST' });
        document.getElementById('chat-messages').innerHTML = '';
    }
}

async function endChat() {
    if(confirm("End this chat session?")) {
        await fetch(`/api/chats/${currentChatId}/end`, { method: 'POST' });
        alert("Chat ended.");
        window.history.back();
    }
}

// Utility
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// Enter key to send
document.getElementById('message-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
