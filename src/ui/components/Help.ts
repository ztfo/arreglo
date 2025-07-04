export class Help {
    private modal: HTMLElement;
    private isVisible: boolean = false;

    constructor() {
        this.modal = document.getElementById('help-modal') as HTMLElement;
        this.initializeEventListeners();
    }

    private initializeEventListeners() {
        // Help button click
        const helpButton = document.getElementById('help-button') as HTMLButtonElement;
        if (helpButton) {
            helpButton.addEventListener('click', () => {
                this.show();
            });
        }

        // Close button click
        const closeButton = this.modal?.querySelector('.close-modal') as HTMLButtonElement;
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.hide();
            });
        }

        // Close on outside click
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    public show(): void {
        if (this.modal) {
            this.modal.style.display = 'flex';
            this.isVisible = true;
        }
    }

    public hide(): void {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.isVisible = false;
        }
    }

    public toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
} 