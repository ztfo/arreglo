import './ui';
import '../ui/styles/main.css';
import { App } from './app';
import { images } from './assets/images';

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