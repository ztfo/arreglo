import { SongData } from '../../core/types';
import { MessageOverlay } from './MessageOverlay';

export class SongForm {
    private form: HTMLFormElement;
    private onSubmit: (data: SongData) => void;
    private patterns: Array<{ name: string }> = [];
    private messageOverlay: MessageOverlay;

    constructor(onSubmit: (data: SongData) => void) {
        this.onSubmit = onSubmit;
        this.form = document.getElementById('songForm') as HTMLFormElement;
        this.messageOverlay = new MessageOverlay();
        this.initializeForm();
    }

    private initializeForm() {
        const addPatternBtn = document.getElementById('addPattern') as HTMLButtonElement;
        const patternInput = document.getElementById('patternInput') as HTMLInputElement;
        const fileInput = document.getElementById('daw-screenshot') as HTMLInputElement;
        const uploadPreview = document.querySelector('.upload-preview') as HTMLDivElement;

        const addPattern = () => {
            const name = patternInput.value.trim();
            if (name) {
                this.patterns.push({ name });
                this.updatePatternsList();
                patternInput.value = '';
            }
        };

        // Handle button click
        addPatternBtn?.addEventListener('click', addPattern);

        // Handle Enter key
        patternInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent form submission
                addPattern();
            }
        });

        // Handle file upload
        fileInput.addEventListener('change', async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                await this.handleFileUpload(file);
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

        // Add test button handler
        const testButton = document.getElementById('testButton') as HTMLButtonElement;
        if (testButton) {
            testButton.addEventListener('click', (event) => {
                event.preventDefault();
                // Show loading state
                this.showLoading(true);
                // Get form data but mark it as a test
                const formData = this.getFormData();
                formData.isTest = true;
                this.onSubmit(formData);
            });
        }

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
        const patternsListPreview = document.getElementById('patternsListPreview') as HTMLDivElement;
        
        // Function to create pattern item
        const createPatternItem = (pattern: { name: string }, index: number) => {
            const div = document.createElement('div');
            div.className = 'pattern-item';
            div.innerHTML = `
                <span>${pattern.name}</span>
                <button type="button" class="remove-pattern" data-index="${index}">×</button>
            `;
            return div;
        };

        // Function to create empty state
        const createEmptyState = (isPreview: boolean = false) => {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            const rowCount = isPreview ? 3 : 9;
            
            for (let i = 0; i < rowCount; i++) {
                const emptyRow = document.createElement('div');
                emptyRow.className = 'empty-row';
                emptyState.appendChild(emptyRow);
            }
            
            return emptyState;
        };

        // Update main patterns list
        patternsList.innerHTML = '';
        if (this.patterns.length > 0) {
            this.patterns.forEach((pattern, index) => {
                patternsList.appendChild(createPatternItem(pattern, index));
            });
        } else {
            patternsList.appendChild(createEmptyState());
        }

        // Update preview patterns list
        if (patternsListPreview) {
            patternsListPreview.innerHTML = '';
            if (this.patterns.length > 0) {
                this.patterns.forEach((pattern, index) => {
                    patternsListPreview.appendChild(createPatternItem(pattern, index));
                });
            } else {
                patternsListPreview.appendChild(createEmptyState(true));
            }
        }

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
        const overlay = document.querySelector('.alert-tray.overlay');
        if (overlay) {
            if (show) {
                overlay.classList.add('active', 'show-loading');
            } else {
                overlay.classList.remove('show-loading');
                // Only remove active if no other states are showing
                if (!overlay.classList.contains('show-error')) {
                    overlay.classList.remove('active');
                }
            }
        }
    }

    public clearError() {
        const overlay = document.querySelector('.alert-tray.overlay');
        if (overlay) {
            overlay.classList.remove('show-error');
            // Only remove active if no other states are showing
            if (!overlay.classList.contains('show-loading')) {
                overlay.classList.remove('active');
            }
        }
    }

    public clearLoading() {
        const overlay = document.querySelector('.alert-tray.overlay');
        if (overlay) {
            overlay.classList.remove('show-loading');
            // Only remove active if no other states are showing
            if (!overlay.classList.contains('show-error')) {
                overlay.classList.remove('active');
            }
        }
    }

    // Add this method to handle loading state during image processing
    private async handleFileUpload(file: File) {
        try {
            this.patterns = [];
            this.updatePatternsList();
            this.setLoadingState(true);
            
            const base64Image = await this.fileToBase64(file);
            const trackNames = await this.extractTrackNames(base64Image);
            
            if (!trackNames || trackNames.length === 0) {
                throw new Error('No track names could be extracted from the image');
            }
            
            trackNames.forEach(name => {
                if (!this.patterns.some(p => p.name === name)) {
                    this.patterns.push({ name });
                }
            });
            
            this.updatePatternsList();
            this.setLoadingState(false);
            
        } catch (error) {
            console.error('Error processing image:', error);
            const errorMessage = error instanceof Error
                ? error.message + '\n\nTip: For best results, only take a screenshot of the track name bar or playlist/arrangement view in your DAW. Avoid including the entire screen or mixer.'
                : 'Could not extract track names from image.\n\nTip: For best results, only take a screenshot of the track name bar or playlist/arrangement view in your DAW. Avoid including the entire screen or mixer.';
            this.messageOverlay.show(errorMessage, 'error');
            this.setLoadingState(false);
        }
    }

    private setLoadingState(isLoading: boolean) {
        const label = document.querySelector('.label') as HTMLElement;
        const emptyState = document.querySelector('.empty-state') as HTMLElement;
        
        if (label) {
            if (isLoading) {
                label.classList.add('processing');
            } else {
                label.classList.remove('processing');
            }
        }

        if (emptyState) {
            if (isLoading) {
                emptyState.classList.add('processing');
            } else {
                emptyState.classList.remove('processing');
            }
        }
    }
} 