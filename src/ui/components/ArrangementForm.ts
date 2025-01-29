export class ArrangementForm {
    private container: HTMLElement;
    private titleInput!: HTMLInputElement;
    private genreInput!: HTMLInputElement;
    private styleInput!: HTMLInputElement;
    private sectionsInput!: HTMLInputElement;
    private submitButton!: HTMLButtonElement;

    private defaultSections = "Intro, Verse, Pre-Chorus, Chorus, Bridge, Outro";

    constructor(container: HTMLElement) {
        this.container = container;
        this.createForm();
    }

    private createForm() {
        // Title input
        const titleLabel = document.createElement('label');
        titleLabel.textContent = 'Song Title';
        this.titleInput = document.createElement('input');
        this.titleInput.type = 'text';
        this.titleInput.required = true;

        // Genre input
        const genreLabel = document.createElement('label');
        genreLabel.textContent = 'Genre (optional)';
        this.genreInput = document.createElement('input');
        this.genreInput.type = 'text';
        this.genreInput.placeholder = 'e.g., Rock, Pop, Hip Hop';

        // Style input
        const styleLabel = document.createElement('label');
        styleLabel.textContent = 'Style (optional)';
        this.styleInput = document.createElement('input');
        this.styleInput.type = 'text';
        this.styleInput.placeholder = 'e.g., Progressive, Alternative, Trap';

        // Sections input
        const sectionsLabel = document.createElement('label');
        sectionsLabel.textContent = 'Song Sections';
        const sectionsDescription = document.createElement('div');
        sectionsDescription.className = 'input-description';
        sectionsDescription.textContent = 'Comma-separated list of sections in order';
        this.sectionsInput = document.createElement('input');
        this.sectionsInput.type = 'text';
        this.sectionsInput.value = this.defaultSections;
        this.sectionsInput.placeholder = 'e.g., Intro, Verse, Chorus, Bridge, Outro';

        // Submit button
        this.submitButton = document.createElement('button');
        this.submitButton.textContent = 'Generate Arrangement';

        // Add elements to container
        [
            titleLabel, this.titleInput,
            genreLabel, this.genreInput,
            styleLabel, this.styleInput,
            sectionsLabel, sectionsDescription, this.sectionsInput,
            this.submitButton
        ].forEach(element => this.container.appendChild(element));
    }

    public onSubmit(callback: (data: {
        title: string;
        genre?: string;
        style?: string;
        customSections?: string;
    }) => void) {
        this.submitButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (!this.titleInput.value) {
                alert('Please enter a song title');
                return;
            }

            callback({
                title: this.titleInput.value,
                genre: this.genreInput.value || undefined,
                style: this.styleInput.value || undefined,
                customSections: this.sectionsInput.value || this.defaultSections
            });
        });
    }
} 
