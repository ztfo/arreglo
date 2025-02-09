export class MessageOverlay {
    private container: HTMLDivElement;

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'message-overlay';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        const content = document.createElement('div');
        content.className = 'message-content';
        content.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 8px;
            max-width: 80%;
            text-align: center;
        `;

        const message = document.createElement('p');
        message.className = 'message-text';
        message.style.marginBottom = '1rem';

        const dismissButton = document.createElement('button');
        dismissButton.textContent = 'Dismiss';
        dismissButton.className = 'dismiss-button';
        dismissButton.addEventListener('click', () => this.hide());

        content.appendChild(message);
        content.appendChild(dismissButton);
        this.container.appendChild(content);
        document.body.appendChild(this.container);
    }

    public show(message: string, type: 'success' | 'error' = 'success'): void {
        const messageEl = this.container.querySelector('.message-text') as HTMLParagraphElement;
        messageEl.textContent = message;
        messageEl.style.color = type === 'success' ? '#4CAF50' : '#f44336';
        this.container.style.display = 'flex';
    }

    public hide(): void {
        this.container.style.display = 'none';
    }
} 