export class MessageOverlay {
    private container: HTMLDivElement;
    private iconContainer: HTMLDivElement;
    private header: HTMLHeadingElement;
    private messageEl: HTMLParagraphElement;

    constructor() {
        // Get existing elements instead of creating them
        this.container = document.querySelector('.message-overlay') as HTMLDivElement;
        this.iconContainer = this.container.querySelector('.message-icon') as HTMLDivElement;
        this.header = this.container.querySelector('.message-header') as HTMLHeadingElement;
        this.messageEl = this.container.querySelector('.message-text') as HTMLParagraphElement;

        // Add dismiss handler
        const dismissButton = this.container.querySelector('.dismiss-button');
        if (dismissButton) {
            dismissButton.addEventListener('click', () => this.hide());
        }
    }

    public show(message: string, type: 'success' | 'error' = 'success'): void {
        // Set icon and header based on type
        if (type === 'success') {
            this.iconContainer.innerHTML = '<i class="fas fa-check-circle"></i>';
            this.header.textContent = 'Success';
        } else {
            this.iconContainer.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
            this.header.textContent = 'Error';
        }

        this.messageEl.textContent = message;
        this.container.style.display = 'flex';
    }

    public hide(): void {
        this.container.style.display = 'none';
    }
} 