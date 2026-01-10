
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
    // Priority 1: Session Storage
    currentUserType = sessionStorage.getItem('userRole');
    if (!currentUserType) {
        // Priority 2: Cookie 
        currentUserType = getCookie('userType');
    }

    try {
        // Priority 3 (Authoritative): API Check
        const authRes = await apiFetch('/check-auth');
        const authData = await authRes.json();
        if (authData.loggedIn && authData.role) {
            currentUserType = authData.role;
            sessionStorage.setItem('userRole', currentUserType);
            console.log("User Role Confirmed via API:", currentUserType);
        }
    } catch (e) {
        console.warn("Auth check failed in chat.js", e);
    }
    
    // UI Setup based on Role
    const imgEl = document.getElementById('chat-partner-img');
    const iconEl = document.getElementById('chat-partner-icon');
    
    // Case-insensitive check just in case
    const type = (currentUserType || '').toLowerCase();
    
    if (type === 'student') {
        // Student viewing Provider -> Use broker img or generic
        imgEl.src = '/img/brokerservice.jpg';
        imgEl.style.display = 'block';
        iconEl.style.display = 'none';
        
        // Correct internal usage
        currentUserType = 'student'; 
    } else if (type === 'provider' || type === 'serviceprovider') {
        imgEl.src = '/img/User.png'; 
        imgEl.style.display = 'block';
        iconEl.style.display = 'none';
        
        // Normalize for sender check
        currentUserType = 'provider'; 
    } else {
        // Default / Error state
        console.warn("Unknown user type:", currentUserType);
        iconEl.style.display = 'block';
    } 

    // Initialize WebSocket
    initWebSocket();

    // Fetch previous messages
    await fetchChatHistory(currentChatId);

    // Global Context Menu Delegation
    document.getElementById('chat-messages').addEventListener('contextmenu', (e) => {
        const msgEl = e.target.closest('.message.sent');
        if (msgEl) {
            e.preventDefault();
            const msgId = msgEl.getAttribute('data-id');
            console.log("Right click context menu. Target:", msgEl);
            console.log("Retrieved data-id:", msgId);
            
            if (msgId && msgId !== 'undefined' && msgId !== 'null') {
                showContextMenu(msgEl, msgId);
            } else {
                console.warn("Context menu blocked: Invalid ID", msgId);
            }
        } else {
             console.log("Right click not on .message.sent");
        }
    });
});

function initWebSocket() {
    socket = new WebSocket('wss://flatmate-node-backend.onrender.com');

    socket.onopen = () => {
        console.log('Connected to WebSocket');
        socket.send(JSON.stringify({ type: 'REGISTER', chatId: currentChatId, userType: currentUserType }));
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'MESSAGE') {
            const payload = data.payload;
            if (payload.sender !== currentUserType) {
                appendMessage(payload, 'received');
            } else {
                console.log("Received self-sent message confirmation. Payload:", payload);
                const pendingMessages = document.querySelectorAll('.message.sent.pending, .message.sent:not([data-id])');
                console.log("Pending messages found:", pendingMessages.length);
                
                if (pendingMessages.length > 0) {
                     const targetMsg = pendingMessages[0];
                     
                     if (targetMsg) {
                         targetMsg.setAttribute('data-id', payload._id);
                         targetMsg.dataset.id = payload._id;
                         targetMsg.classList.remove('pending');
                         
                         // Update tick to double-check
                         const tickContainer = targetMsg.querySelector('.message-ticks');
                         if (tickContainer) {
                             tickContainer.innerHTML = '<i class="fas fa-check-double"></i>';
                         }
                         
                         console.log("Updated optimistic message ID to:", payload._id, "on element:", targetMsg);
                     }
                } else {
                    console.warn("No pending message element found to update for ID:", payload._id);
                }
            }
        } else if (data.type === 'MESSAGES_READ') {
            markAllAsRead();
        } else if (data.type === 'MESSAGE_DELETED') {
            const msgEl = document.querySelector(`.message[data-id="${data.messageId}"]`);
            if (msgEl) msgEl.remove();
        } else if (data.type === 'MESSAGE_EDITED') {
            const msgEl = document.querySelector(`.message[data-id="${data.messageId}"]`);
            if (msgEl) {
                for(let node of msgEl.childNodes) {
                    if(node.nodeType === Node.TEXT_NODE) {
                        node.nodeValue = data.newContent;
                        break;
                    }
                }
            }
            if (selectedMessageId === data.messageId) hideContextMenu();
        }
    
    };
    
    socket.onclose = () => {
        console.log('Disconnected from WebSocket');
    };
}

async function fetchChatHistory(chatId) {
    currentChatId = chatId;
    try {
        const res = await apiFetch(`/api/chats/${chatId}/messages`);
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
        if (!msg._id && !msg.id) console.warn("Message missing ID:", msg);
        const container = document.getElementById('chat-messages');
        const div = document.createElement('div');
        div.className = `message ${type}`;
    
        let ticksHtml = '';
    
        if (msg._id || msg.id) {
            div.setAttribute('data-id', msg._id || msg.id);
        }

        if (type === 'sent') {
            if (msg._id || msg.id) {
                 // Confirmed Sent Message
                 const tickClass = (msg.isRead) ? 'read' : ''; 
                 ticksHtml = `<span class="message-ticks ${tickClass}"><i class="fas fa-check-double"></i></span>`;
            } else {
                 div.classList.add('pending'); 
                 ticksHtml = `<span class="message-ticks"><i class="fas fa-check"></i></span>`;
            }
        }


        div.innerHTML = `
        ${msg.content}
        <div class="message-meta" style="display:flex; justify-content:flex-end; align-items:center; gap:5px; margin-top:2px;">
            <small class="message-time">${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
            ${ticksHtml}
        </div>
    `;
        container.appendChild(div);
        scrollToBottom();
    }

let selectedMessageId = null;
const contextMenu = document.getElementById('contextMenu');

function showContextMenu(element, msgId) {
    if (!msgId || msgId === 'null' || msgId === 'undefined') {
        console.error("Invalid Message ID passed to Context Menu:", msgId);
        return;
    }
    selectedMessageId = msgId;
    console.log("Context Menu Opened. selectedMessageId set to:", selectedMessageId);
    
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
    // We do NOT clear selectedMessageId here immediately if we need it? 
    // Actually, the edit action captures it before calling hideContextMenu.
    // The previous implementation called hideContextMenu() at the end of editMessageAction().
    // By the time saveEditedMessage() is called, selectedMessageId WAS null.
    // That is why I added the data attribute to the modal above.
    
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
        await apiFetch(`/api/chats/${currentChatId}/clear`, { method: 'POST' });
        document.getElementById('chat-messages').innerHTML = '';
    }
}

async function endChat() {
    // Customize message based on user type if needed, but generic is fine
    if(confirm("Close this chat session?")) {
        await apiFetch(`/api/chats/${currentChatId}/end`, { method: 'POST' });
        
        if (currentUserType === 'provider') {
             window.location.href = '/serviceChats';
        } else {
             alert("Chat ended.");
             window.history.back();
        }
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

// Global functions for Edit Modal
function editMessageAction() {
    console.log("Edit Action Triggered. ID:", selectedMessageId);
    if (selectedMessageId) {
        const msgEl = document.querySelector(`.message[data-id="${selectedMessageId}"]`);
        if (msgEl) {
            let currentText = "";
            for(let node of msgEl.childNodes) {
                if(node.nodeType === Node.TEXT_NODE) {
                    currentText += node.nodeValue.trim();
                }
            }
            
            const input = document.getElementById('editMessageInput');
            input.value = currentText.trim(); 
            
            const overlay = document.getElementById('editModalOverlay');
            overlay.setAttribute('data-editing-id', selectedMessageId);
            overlay.style.display = 'flex';
            input.focus();
            console.log("Modal opened. data-editing-id set to:", selectedMessageId);
        }
    }
    
    hideContextMenu(); 
}

function closeEditModal() {
    document.getElementById('editModalOverlay').style.display = 'none';
    document.getElementById('editModalOverlay').removeAttribute('data-editing-id');
}

function saveEditedMessage() {
    const input = document.getElementById('editMessageInput');
    const newContent = input.value.trim();
    const editingId = document.getElementById('editModalOverlay').getAttribute('data-editing-id');
    
    console.log("Saving Edit. Retrieved editingId from overlay:", editingId);

    if (newContent && editingId && currentChatId) {
        socket.send(JSON.stringify({ 
            type: 'EDIT_MESSAGE', 
            chatId: currentChatId, 
            messageId: editingId,
            newContent
        }));
        
        // Optimistic update
        const msgEl = document.querySelector(`.message[data-id="${editingId}"]`);
        if (msgEl) {
             for(let node of msgEl.childNodes) {
                if(node.nodeType === Node.TEXT_NODE) {
                    node.nodeValue = newContent;
                    break;
                }
            }
        }
    }
    closeEditModal();
}

