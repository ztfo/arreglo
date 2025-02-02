import { SongData } from '../../core/types';

export class SongForm {
    private form: HTMLFormElement;
    private onSubmit: (data: SongData) => void;
    private patterns: Array<{ name: string }> = [];

    constructor(onSubmit: (data: SongData) => void) {
        this.onSubmit = onSubmit;
        this.form = document.getElementById('songForm') as HTMLFormElement;
        this.initializeForm();
    }

    private initializeForm() {
        // Initialize pattern input handling
        const addPatternBtn = document.getElementById('addPattern') as HTMLButtonElement;
        const patternInput = document.getElementById('patternInput') as HTMLInputElement;
        const fileInput = document.getElementById('daw-screenshot') as HTMLInputElement;
        const uploadPreview = document.querySelector('.upload-preview') as HTMLDivElement;

        addPatternBtn.addEventListener('click', () => {
            const name = patternInput.value.trim();
            if (name) {
                this.patterns.push({ name });
                this.updatePatternsList();
                patternInput.value = '';
            }
        });

        // Handle file upload
        fileInput.addEventListener('change', async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                // Convert image to base64
                const base64Image = await this.fileToBase64(file);
                
                // Call OpenAI Vision API
                const trackNames = await this.extractTrackNames(base64Image);
                
                // Add extracted track names to patterns
                trackNames.forEach(name => {
                    if (!this.patterns.some(p => p.name === name)) {
                        this.patterns.push({ name });
                    }
                });
                
                this.updatePatternsList();
                
                // Clear file input
                fileInput.value = '';
                
            } catch (error) {
                console.error('Error processing image:', error);
                const errorDiv = document.getElementById('error');
                const errorMessage = document.getElementById('errorMessage');
                if (errorDiv && errorMessage) {
                    errorMessage.textContent = error instanceof Error ? error.message : 'Error processing image';
                    errorDiv.style.display = 'block';
                }
            }
        });

        this.form.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = this.getFormData();
            this.showLoading(true);
            this.onSubmit(formData);
        });
    }

    private async fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = reader.result as string;
                resolve(base64String.split(',')[1]); // Remove data URL prefix
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    private async extractTrackNames(base64Image: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            parent.postMessage({ 
                pluginMessage: { 
                    type: 'analyze-image',
                    base64Image 
                }
            }, '*');
            
            const handler = (event: MessageEvent) => {
                const msg = event.data.pluginMessage;
                if (msg.type === 'image-analyzed') {
                    window.removeEventListener('message', handler);
                    resolve(msg.trackNames);
                } else if (msg.type === 'error') {
                    window.removeEventListener('message', handler);
                    reject(new Error(msg.message));
                }
            };
            
            window.addEventListener('message', handler);
        });
    }

    private updatePatternsList() {
        const patternsList = document.getElementById('patternsList') as HTMLDivElement;
        patternsList.innerHTML = '';
        this.patterns.forEach((pattern, index) => {
            const div = document.createElement('div');
            div.className = 'pattern-item';
            div.innerHTML = `
                <span>${pattern.name}</span>
                <button type="button" class="remove-pattern" data-index="${index}">×</button>
            `;
            patternsList.appendChild(div);
        });

        // Add remove button handlers
        document.querySelectorAll('.remove-pattern').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
                this.patterns.splice(index, 1);
                this.updatePatternsList();
            });
        });
    }

    private getSelectedSections(): string[] {
        const sections = document.querySelectorAll('input[name="sections"]:checked');
        return Array.from(sections).map(section => (section as HTMLInputElement).value);
    }

    private getFormData(): SongData {
        return {
            title: (document.getElementById('title') as HTMLInputElement).value,
            genre: (document.getElementById('genre') as HTMLSelectElement).value,
            length: parseInt((document.getElementById('length') as HTMLInputElement).value),
            tempo: parseInt((document.getElementById('tempo') as HTMLInputElement).value),
            instruments: this.patterns.map(p => p.name),
            patterns: this.patterns.map(p => ({ name: p.name, bars: 8 })), // Default to 8 bars
            creativity: parseInt((document.querySelector('input[name="creativity"]:checked') as HTMLInputElement)?.value || "2"),
            selectedSections: this.getSelectedSections()
        };
    }

    public showLoading(show: boolean) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.toggle('active', show);
        }
    }
} 