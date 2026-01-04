
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
            appendMessage(data.payload, 'received');
        }
    };

    socket.onclose = () => {
        console.log('Disconnected from WebSocket');
    };
}

async function fetchChatHistory(chatId) {
    try {
        const res = await fetch(`/api/chats/${chatId}/messages`);
        const data = await res.json();
        if (data.success) {
            const container = document.getElementById('chat-messages');
            container.innerHTML = '';
            data.messages.forEach(msg => {
                const isMine = (currentUserType === 'student' && msg.sender === 'student') || 
                               (currentUserType === 'provider' && msg.sender === 'provider'); 
                appendMessage(msg, isMine ? 'sent' : 'received');
            });
            scrollToBottom();
        }
    } catch (err) {
        console.error('Failed to load chat history', err);
    }
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
    div.innerHTML = `
        ${msg.content}
        <div class="message-time">${new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
    `;
    container.appendChild(div);
    scrollToBottom();
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
