import { ChatManager } from './chat/chat-manager.js';
import { getConfig } from './config/imagen.js';

class ImagenManager {
    constructor() {
        this.chatManager = new ChatManager();
        this.apiKey = localStorage.getItem('apiKey');
        this.setupUI();
    }

    setupUI() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendBtn');
        
        this.sendButton.addEventListener('click', () => this.handleSendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSendMessage();
        });
    }

    displayGeneratedImage(base64Data) {
        const img = document.createElement('img');
        img.src = `data:image/png;base64,${base64Data}`;
        img.className = 'generated-image';
        
        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';
        imageContainer.appendChild(img);
        
        if (this.chatManager.currentStreamingMessage) {
            this.chatManager.currentStreamingMessage.appendChild(imageContainer);
        } else {
            this.chatManager.startModelMessage();
            this.chatManager.currentStreamingMessage.appendChild(imageContainer);
        }
        
        this.chatManager.scrollToBottom();
    }

    async generateImage(prompt) {
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${this.apiKey}`;
        
        const requestBody = {
            contents: [{
                role: "user",
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.4,
                topK: 32,
                topP: 1,
                maxOutputTokens: 2048
            },
            safety_settings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.error?.message || `HTTP error! status: ${response.status}`}`);
            }

            const data = await response.json();
            if (!data.candidates || !data.candidates.length) {
                throw new Error('No candidates in response');
            }

            const content = data.candidates[0].content;
            if (!content || !content.parts || !content.parts.length) {
                throw new Error('Invalid response structure');
            }

            const imagePart = content.parts.find(part => part.inlineData);
            if (!imagePart) {
                throw new Error('No image data in response');
            }

            return imagePart.inlineData.data;
        } catch (error) {
            console.error('Error generating image:', error);
            throw error;
        }
    }

    async handleSendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        this.messageInput.value = '';
        this.chatManager.addUserMessage(message);
        this.chatManager.startModelMessage();

        try {
            const imageData = await this.generateImage(message);
            this.displayGeneratedImage(imageData);
        } catch (error) {
            console.error('Error:', error);
            this.chatManager.updateStreamingMessage('Error: ' + error.message);
        } finally {
            this.chatManager.finalizeStreamingMessage();
        }
    }
}

// Initialize the Imagen Manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ImagenManager();
});