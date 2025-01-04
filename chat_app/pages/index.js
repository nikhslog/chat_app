import Head from 'next/head';
import { useEffect } from 'react';
import styles from '../styles/Home.module.css';

export default function Home() {
  useEffect(() => {
    // Typing animation
    const words = ["Mumtaz.", "Moonchild."];
    const animatedWordElement = document.querySelector(".animated-word");
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function typeAnimation() {
      const currentWord = words[wordIndex];
      const displayedText = isDeleting
        ? currentWord.substring(0, charIndex--)
        : currentWord.substring(0, charIndex++);

      if (animatedWordElement) {
        animatedWordElement.textContent = displayedText;

        if (!isDeleting && charIndex === currentWord.length) {
          setTimeout(() => (isDeleting = true), 1000);
        } else if (isDeleting && charIndex === 0) {
          isDeleting = false;
          wordIndex = (wordIndex + 1) % words.length;
        }

        setTimeout(typeAnimation, isDeleting ? 50 : 100);
      }
    }

    // Chat functionality
    const API_BASE_URL = '/api';
    const messageArea = document.getElementById('messageArea');
    const messageInput = document.getElementById('messageInput');
    const nameSelection = document.getElementById('nameSelection');
    const currentUserInfo = document.getElementById('currentUserInfo');
    const errorMessage = document.getElementById('errorMessage');
    const loadingMessage = document.getElementById('loadingMessage');

    let currentUser = '';
    let chatState = {
      messages: [],
      nikhilTaken: false,
      nikhTaken: false,
      activeUsers: []
    };
    let messagePollingInterval;

    // Initialize typing animation and chat
    typeAnimation();
    if (messageArea) {
      messageArea.style.display = 'none';
    }
    if (document.querySelector('.chat-input')) {
      document.querySelector('.chat-input').style.display = 'none';
    }
    initializeChatState();

    // Add message input event listener
    if (messageInput) {
      messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          sendMessage();
        }
      });
    }

    // Chat functions
    async function showLoading(message) {
      if (loadingMessage) {
        loadingMessage.textContent = message;
        loadingMessage.style.display = 'block';
      }
    }

    function hideLoading() {
      if (loadingMessage) {
        loadingMessage.style.display = 'none';
      }
    }

    function showError(message) {
      if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
          errorMessage.style.display = 'none';
        }, 3000);
      }
    }

    async function initializeChatState() {
        try {
            showLoading('Connecting to chat...');
            const response = await fetch(`${API_BASE_URL}/chat`);
            if (!response.ok) throw new Error('Failed to connect to chat server');
            
            const messages = await response.json();
            chatState.messages = messages;
            hideLoading();
        } catch (error) {
            console.error('Failed to initialize chat:', error);
            showError('Failed to connect to chat server. Please try again.');
            hideLoading();
        }
    }

    async function joinChat() {
        try {
            showLoading('Joining chat...');
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: !chatState.nikhilTaken ? 'Nikhil' : 'Nikh'
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to join chat');
            }

            currentUser = data.username;
            chatState.activeUsers.push(currentUser);
            
            // Update UI
            nameSelection.style.display = 'none';
            messageArea.style.display = 'block';
            document.querySelector('.chat-input').style.display = 'flex';
            currentUserInfo.textContent = `You are: ${currentUser}`;

            // Send system message
            await sendMessage('System', `${currentUser} has joined the chat`);
            
            // Start message polling
            await updateMessages();
            messagePollingInterval = setInterval(updateMessages, 1000);

            window.addEventListener('beforeunload', handleDisconnect);
            hideLoading();
        } catch (error) {
            console.error('Failed to join chat:', error);
            showError(error.message || 'Failed to join chat. Please try again.');
            hideLoading();
        }
    }

    async function handleDisconnect() {
        try {
            await fetch(`${API_BASE_URL}/users`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: currentUser })
            });

            await sendMessage('System', `${currentUser} has left the chat`);
            clearInterval(messagePollingInterval);
        } catch (error) {
            console.error('Failed to handle disconnect:', error);
        }
    }

    async function sendMessage(sender = currentUser, text = messageInput.value.trim()) {
        try {
            if (!text) return;

            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sender, text })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const data = await response.json();
            messageInput.value = '';
            await updateMessages();
        } catch (error) {
            console.error('Failed to send message:', error);
            showError('Failed to send message. Please try again.');
        }
    }

    async function updateMessages() {
        try {
            const response = await fetch(`${API_BASE_URL}/chat`);
            if (!response.ok) throw new Error('Failed to fetch messages');
            
            const messages = await response.json();
            
            messageArea.innerHTML = '';
            messages.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${msg.sender === currentUser ? 'sent' : 'received'}`;
                if (msg.sender === 'System') {
                    messageDiv.style.backgroundColor = '#718096';
                    messageDiv.style.color = 'white';
                    messageDiv.style.textAlign = 'center';
                    messageDiv.style.margin = '8px auto';
                }
                messageDiv.textContent = msg.sender === 'System' ? msg.text : `${msg.sender}: ${msg.text}`;
                messageArea.appendChild(messageDiv);
            });
            messageArea.scrollTop = messageArea.scrollHeight;
        } catch (error) {
            console.error('Failed to update messages:', error);
            showError('Failed to update messages');
        }
    }

    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Cleanup on unmount
    return () => {
      if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  return (
    <>
      <Head>
        <title>Vintage Chat</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <style jsx global>{`
        @font-face {
            font-family: 'Rumburak';
            src: url('/rumburak/Rumburak.ttf') format('truetype');
        }
        /* Your existing CSS styles here */
        body, html {
            height: 100%;
            margin: 0;
            font-family: 'Rumburak', serif;
            overflow-x: hidden;
        }
        body, html {
            height: 100%;
            margin: 0;
            font-family: 'Rumburak', serif;
            overflow-x: hidden;
        }
        .hero {
            height: 100vh;
            background: url('Untitled design (5).png') center/cover no-repeat;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .text-wrapper {
            transform: translateY(30px) translateX(-100px);
            z-index: 1;
        }
        .text {
            color: #0b141a;
            font-size: 2.5rem;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            margin: 10px 0;
            line-height: 1.4;
            max-width: 900px;
        }
        .animated-word-wrapper {
            display: inline-block;
            line-height: 1;
            vertical-align: baseline;
        }
        .animated-word {
            color: white;
            font-weight: bold;
            border-right: 2px solid white;
            white-space: nowrap;
            overflow: hidden;
            display: inline-block;
        }
        .chat-section {
            min-height: 100vh;
            background: url('Untitled design (7).png') center/cover no-repeat;
            padding: 2rem;
            display: flex;
            justify-content: flex-start;
            align-items: center;
        }
        .chat-container {
            width: 300px;
            height: 400px;
            background: rgba(229, 229, 229, 0.85);
            border-radius: 10px;
            border: 2px solid #4a5568;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            margin-left: 50px;
            display: flex;
            flex-direction: column;
        }
        .chat-header {
            padding: 10px;
            background: #4a5568;
            color: white;
            border-radius: 8px 8px 0 0;
            font-size: 0.9rem;
            text-align: center;
        }
        .name-selection-area {
            padding: 15px;
            background: rgba(255, 255, 255, 0.8);
            text-align: center;
        }
        .user-info {
            padding: 8px;
            background: #1a202c;
            color: white;
            text-align: center;
            margin-top: 10px;
            border-radius: 4px;
            font-size: 0.9rem;
        }
        .chat-messages {
            flex-grow: 1;
            overflow-y: auto;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.6);
        }
        .message {
            margin: 8px;
            padding: 8px 12px;
            border-radius: 8px;
            max-width: 80%;
            font-size: 0.9rem;
            font-family: serif;
        }
        .sent {
            background: #4a5568;
            color: white;
            margin-left: auto;
        }
        .received {
            background: #d1d5db;
            color: #1a202c;
            margin-right: auto;
        }
        .chat-input {
            display: flex;
            padding: 10px;
            background: #4a5568;
            border-radius: 0 0 8px 8px;
        }
        .chat-input input {
            flex-grow: 1;
            padding: 5px 10px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            margin-right: 5px;
            font-family: serif;
            background: rgba(255, 255, 255, 0.9);
        }
        .chat-input button {
            padding: 5px 10px;
            background: #1a202c;
            color: white;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            cursor: pointer;
            font-family: serif;
        }
        .join-button {
            padding: 10px 20px;
            background: #1a202c;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
            margin-top: 10px;
        }
        .error-message {
            color: #e53e3e;
            margin-top: 10px;
            font-size: 0.9rem;
        }
        .loading {
            color: #4a5568;
            margin-top: 10px;
            font-size: 0.9rem;
        }
      `}</style>

      <section className="hero">
        <div className="text-wrapper">
          <div className="text">
            That Shah Jahan didn't have the chance to show the Taj to his Mumtaz but,
          </div>
          <div className="text">
            I got to show my Taj Mahal to 
            <span className="animated-word-wrapper">
              <span className="animated-word"></span>
            </span>
          </div>
        </div>
      </section>

      <section className="chat-section">
        <div className="chat-container">
          <div className="chat-header">
            <span>Vintage Chat</span>
          </div>
          <div className="name-selection-area" id="nameSelection">
            <div>Click to join chat:</div>
            <button className="join-button" onClick={() => window.joinChat()}>Join Chat</button>
            <div className="user-info" id="currentUserInfo"></div>
            <div className="error-message" id="errorMessage"></div>
            <div className="loading" id="loadingMessage"></div>
          </div>
          <div className="chat-messages" id="messageArea"></div>
          <div className="chat-input">
            <input type="text" id="messageInput" placeholder="Write a message..." />
            <button onClick={() => window.sendMessage()}>Send</button>
          </div>
        </div>
      </section>
    </>
  );
}