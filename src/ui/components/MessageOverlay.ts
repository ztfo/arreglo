export class MessageOverlay {
    private container: HTMLDivElement;
    private header: HTMLHeadingElement;
    private messageEl: HTMLParagraphElement;

    constructor() {
        this.container = document.querySelector('.message-overlay') as HTMLDivElement;
        this.header = this.container.querySelector('.message-header') as HTMLHeadingElement;
        this.messageEl = this.container.querySelector('.message-text') as HTMLParagraphElement;

        const dismissButton = this.container.querySelector('.dismiss-button');
        if (dismissButton) {
            dismissButton.addEventListener('click', () => this.hide());
        }
    }

    public show(message: string, type: 'success' | 'error' = 'success'): void {
        if (type === 'success') {
            this.header.textContent = 'Success';
            this.container.classList.add('success');
            this.container.classList.remove('error');
        } else {
            this.header.textContent = 'Error';
            this.container.classList.add('error');
            this.container.classList.remove('success');
        }

        this.messageEl.textContent = message;
        this.container.classList.add('visible');
    }

    public hide(): void {
        this.container.classList.remove('visible');
    }
} 