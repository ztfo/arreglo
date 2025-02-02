import './styles/main.css';
import { App } from './app';

document.addEventListener('DOMContentLoaded', () => {
    // Add test button handler
    const testButton = document.getElementById('testButton');
    if (testButton) {
        testButton.addEventListener('click', () => {
            parent.postMessage({ pluginMessage: { type: 'test-arrangement' } }, '*');
        });
    }

    new App();
});