import './ui';
import '../ui/styles/main.css';
import { App } from './app';
import { images } from './assets/images';
import { MessageOverlay } from './components/MessageOverlay';

// Create message overlay instance
const messageOverlay = new MessageOverlay();

// Set the logo URL as a CSS custom property
document.documentElement.style.setProperty('--logo-url', `url("${images.logo}")`);

document.addEventListener('DOMContentLoaded', () => {
    // Add test button handler
    const testButton = document.getElementById('testButton');
    if (testButton) {
        testButton.addEventListener('click', () => {
            parent.postMessage({ pluginMessage: { type: 'test-arrangement' } }, '*');
        });
    }

    // Initialize creativity value display
    const creativityInput = document.getElementById('creativity');
    const creativityValue = document.getElementById('creativityValue');
    if (creativityInput && creativityValue) {
        creativityInput.addEventListener('input', (e) => {
            if (e.target instanceof HTMLInputElement) {
                creativityValue.textContent = e.target.value;
            }
        });
    }

    // Initialize the app
    new App();
});

// The UI listens for messages from the plugin
window.onmessage = async (event) => {
    const msg = event.data.pluginMessage;
    
    if (msg.type === 'success') {
        messageOverlay.show(msg.message, 'success');
    } else if (msg.type === 'error') {
        messageOverlay.show(msg.message, 'error');
    }
};