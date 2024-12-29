import { Message } from '../../core/types';

export class ErrorDisplay {
    private container: HTMLElement;
    private message: HTMLElement;

    constructor() {
        this.container = document.getElementById('error') as HTMLElement;
        this.message = document.getElementById('errorMessage') as HTMLElement;
        
        document.getElementById('clearError')?.addEventListener('click', () => {
            this.clear();
        });
    }

    show(message: string) {
        this.message.textContent = message;
        this.container.style.display = 'block';
    }

    clear() {
        this.container.style.display = 'none';
        this.message.textContent = '';
    }
} 