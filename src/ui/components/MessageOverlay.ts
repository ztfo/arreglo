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
            background: var(--dark);
            padding: 2rem;
            border-radius: 8px;
            max-width: 80%;
            text-align: center;
            position: relative;
            border: 1px solid var(--gold);
        `;

        // Add background icon
        const iconBackground = document.createElement('div');
        iconBackground.className = 'message-icon-background';
        iconBackground.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 8rem;
            opacity: 0.1;
            color: var(--gold);
            z-index: 0;
        `;

        // Add header
        const header = document.createElement('h3');
        header.className = 'message-header';
        header.style.cssText = `
            margin-bottom: 1rem;
            color: var(--gold);
            font-size: 1.5rem;
            position: relative;
            z-index: 1;
        `;

        // Add message paragraph
        const message = document.createElement('p');
        message.className = 'message-text';
        message.style.cssText = `
            margin-bottom: 1.5rem;
            color: var(--light);
            position: relative;
            z-index: 1;
        `;

        // Update dismiss button styling
        const dismissButton = document.createElement('button');
        dismissButton.textContent = 'Dismiss';
        dismissButton.className = 'dismiss-button';
        dismissButton.style.cssText = `
            background: var(--gold);
            color: var(--dark);
            border: none;
            padding: 0.5rem 1.5rem;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            position: relative;
            z-index: 1;
        `;
        dismissButton.addEventListener('click', () => this.hide());

        content.appendChild(iconBackground);
        content.appendChild(header);
        content.appendChild(message);
        content.appendChild(dismissButton);
        this.container.appendChild(content);
        document.body.appendChild(this.container);
    }

    public show(message: string, type: 'success' | 'error' = 'success'): void {
        const iconBackground = this.container.querySelector('.message-icon-background') as HTMLDivElement;
        const header = this.container.querySelector('.message-header') as HTMLHeadingElement;
        const messageEl = this.container.querySelector('.message-text') as HTMLParagraphElement;

        // Set icon and header based on type
        if (type === 'success') {
            iconBackground.innerHTML = '<i class="fas fa-check-circle"></i>';
            header.textContent = 'Success';
        } else {
            iconBackground.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
            header.textContent = 'Error';
        }

        messageEl.textContent = message;
        this.container.style.display = 'flex';
    }

    public hide(): void {
        this.container.style.display = 'none';
    }
} 