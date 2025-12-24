document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.getElementById('chatMessages');
    const typingIndicator = document.getElementById('typingIndicator');
    const chatbotWidget = document.getElementById('chatbot-widget');
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotHeader = document.querySelector('.chatbot-header');

    // Toggle chatbot widget
    function toggleChatbot() {
        if (chatbotWidget.classList.contains('minimized')) {
            chatbotWidget.classList.remove('minimized');
            chatbotWidget.classList.add('expanded');
            chatInput.focus();
        } else {
            chatbotWidget.classList.remove('expanded');
            chatbotWidget.classList.add('minimized');
        }
    }

    // Close chatbot widget
    function closeChatbot() {
        chatbotWidget.classList.remove('expanded');
        chatbotWidget.classList.add('minimized');
    }

    // Event listeners for toggle and close
    chatbotToggle.addEventListener('click', toggleChatbot);
    chatbotClose.addEventListener('click', closeChatbot);
    document.getElementById("chatbot-toggle").addEventListener("click", toggleChatbot);

    // Send message on button click
    sendButton.addEventListener('click', sendMessage);

    // Send message on Enter key press
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        // Add user message to chat
        addMessage(message, 'user');

        // Clear input
        chatInput.value = '';

        // Show typing indicator
        showTypingIndicator();

        // Send message to server
        fetch('/api/chatbot/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        })
        .then(response => response.json())
        .then(data => {
            // Hide typing indicator
            hideTypingIndicator();

            // Add bot response to chat
            setTimeout(() => {
                addMessage(data.response, 'bot');
            }, 500); // Small delay for natural feel
        })
        .catch(error => {
            console.error('Error:', error);
            hideTypingIndicator();
            addMessage('Sorry, I encountered an error. Please try again.', 'bot');
        });
    }

    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTypingIndicator() {
        typingIndicator.style.display = 'block';
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideTypingIndicator() {
        typingIndicator.style.display = 'none';
    }

    // Function to handle quick questions
    window.askQuestion = function(question) {
        chatInput.value = question;
        sendMessage();
    };

    // Function to handle key press in input
    window.handleKeyPress = function(event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    };
});
