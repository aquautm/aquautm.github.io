document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.getElementById('chatMessages');
    const typingIndicator = document.getElementById('typingIndicator');
    const chatbotWidget = document.getElementById('chatbot-widget');
    const suggestionChips = document.getElementById('suggestionChips');
    
    const toggleBtns = document.querySelectorAll('.chatbot-toggle');
    const closeBtn = document.querySelector('.chatbot-close');

    let isFeedbackMode = false;

    function toggleChatbot() {
        if (chatbotWidget.classList.contains('minimized')) {
            chatbotWidget.classList.remove('minimized');
            chatbotWidget.classList.add('expanded');
            setTimeout(() => chatInput.focus(), 300);
        } else {
            chatbotWidget.classList.remove('expanded');
            chatbotWidget.classList.add('minimized');
        }
    }

    toggleBtns.forEach(btn => btn.addEventListener('click', toggleChatbot));
    if(closeBtn) closeBtn.addEventListener('click', () => {
        chatbotWidget.classList.remove('expanded');
        chatbotWidget.classList.add('minimized');
    });

    window.activateFeedbackMode = function() {
        isFeedbackMode = true;
        
        if(suggestionChips) suggestionChips.style.display = 'none';

        addMessage("Please type your message, issue, or suggestion below. It will be sent directly to the admins.", 'bot');
        
        chatInput.placeholder = "Type your feedback here...";
        chatInput.focus();
    };

    window.askQuestion = function(question) {
        if(isFeedbackMode) return; 
        chatInput.value = question;
        handleMessageFlow();
    };

    function handleMessageFlow() {
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        chatInput.value = '';

        hideTypingIndicator();

        if (isFeedbackMode) {
            submitFeedbackToServer(text);
        } else {
            sendMessageToChatbot(text);
        }
    }

    sendButton.addEventListener('click', handleMessageFlow);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleMessageFlow();
    });

    function sendMessageToChatbot(msg) {
        fetch('/api/chatbot/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
        })
        .then(res => res.json())
        .then(data => {
            hideTypingIndicator();
            addMessage(data.response, 'bot');
        })
        .catch(err => {
            hideTypingIndicator();
            addMessage("Sorry, I'm having trouble connecting.", 'bot');
        });
    }

    function submitFeedbackToServer(msg) {
        fetch('/api/feedback/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
        })
        .then(res => res.json())
        .then(data => {
            hideTypingIndicator();
            
            addMessage("✅ " + data.response, 'bot');
            
            isFeedbackMode = false;
            chatInput.placeholder = "Ask me about AquaUTM...";
            
            if(suggestionChips) suggestionChips.style.display = 'flex';
            
            setTimeout(() => {
                addMessage("How else can I help?", 'bot');
            }, 1000);
        })
        .catch(err => {
            hideTypingIndicator();
            addMessage("Error sending feedback. Please try again.", 'bot');
            isFeedbackMode = false;
            if(suggestionChips) suggestionChips.style.display = 'flex';
        });
    }

    function addMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        div.textContent = text;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTypingIndicator() {
        if(typingIndicator) {
            typingIndicator.style.display = 'block';
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    function hideTypingIndicator() {
        if(typingIndicator) typingIndicator.style.display = 'none';
    }
});