export class ArrangementForm {
    private container: HTMLElement;
    private songNameInput!: HTMLInputElement;
    private tempoInput!: HTMLInputElement;
    private lengthInput!: HTMLInputElement;
    private genreSelect!: HTMLSelectElement;
    private patternsList!: HTMLDivElement;
    private patterns: Array<{name: string, bars: number}> = [];
    private sectionsContainer!: HTMLDivElement;
    private creativitySlider!: HTMLInputElement;
    private submitButton!: HTMLButtonElement;

    private readonly genres = [
        'House', 'Techno', 'Trance', 'Drum & Bass',
        'Hip Hop', 'Pop', 'Rock', 'EDM'
    ];

    private readonly sections = {
        'Intro': false,
        'Verse 1': false,
        'Verse 2': false,
        'Verse 3': false,
        'Chorus 1': false,
        'Chorus 2': false,
        'Chorus 3': false,
        'Bridge': false,
        'Build-up': false,
        'Drop': false,
        'Outro': false
    };

    constructor(container: HTMLElement) {
        this.container = container;
        this.createForm();
    }

    private createForm() {
        // Song Details Section
        const songDetailsSection = this.createSection('Song Details');

        // Song Name
        const songNameLabel = document.createElement('label');
        songNameLabel.textContent = 'Song Name';
        this.songNameInput = document.createElement('input');
        this.songNameInput.type = 'text';
        this.songNameInput.required = true;
        songDetailsSection.appendChild(songNameLabel);
        songDetailsSection.appendChild(this.songNameInput);

        // Tempo
        const tempoLabel = document.createElement('label');
        tempoLabel.textContent = 'Tempo (BPM)';
        this.tempoInput = document.createElement('input');
        this.tempoInput.type = 'number';
        this.tempoInput.min = '60';
        this.tempoInput.max = '200';
        this.tempoInput.value = '128';
        songDetailsSection.appendChild(tempoLabel);
        songDetailsSection.appendChild(this.tempoInput);

        // Length
        const lengthLabel = document.createElement('label');
        lengthLabel.textContent = 'Song Length (Bars)';
        this.lengthInput = document.createElement('input');
        this.lengthInput.type = 'number';
        this.lengthInput.min = '16';
        this.lengthInput.max = '256';
        this.lengthInput.value = '128';
        songDetailsSection.appendChild(lengthLabel);
        songDetailsSection.appendChild(this.lengthInput);

        // Genre
        const genreLabel = document.createElement('label');
        genreLabel.textContent = 'Genre';
        this.genreSelect = document.createElement('select');
        this.genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.toLowerCase();
            option.textContent = genre;
            this.genreSelect.appendChild(option);
        });
        songDetailsSection.appendChild(genreLabel);
        songDetailsSection.appendChild(this.genreSelect);

        // Patterns Section
        const patternsSection = this.createSection('Instrument/Track Patterns');
        
        // Pattern input container
        const patternInputContainer = document.createElement('div');
        patternInputContainer.className = 'pattern-input-container';
        
        const patternInput = document.createElement('input');
        patternInput.type = 'text';
        patternInput.placeholder = 'Pattern name (e.g., Four on the floor kick)';
        
        const patternBarsInput = document.createElement('input');
        patternBarsInput.type = 'number';
        patternBarsInput.min = '1';
        patternBarsInput.max = '32';
        patternBarsInput.value = '8';
        patternBarsInput.placeholder = 'Bars';
        
        const addPatternButton = document.createElement('button');
        addPatternButton.textContent = 'Add Pattern';
        addPatternButton.onclick = () => this.addPattern(patternInput.value, parseInt(patternBarsInput.value));
        
        patternInputContainer.appendChild(patternInput);
        patternInputContainer.appendChild(patternBarsInput);
        patternInputContainer.appendChild(addPatternButton);
        
        this.patternsList = document.createElement('div');
        this.patternsList.className = 'patterns-list';
        
        patternsSection.appendChild(patternInputContainer);
        patternsSection.appendChild(this.patternsList);

        // Sections Selection
        const sectionsSection = this.createSection('Song Sections');
        this.sectionsContainer = document.createElement('div');
        this.sectionsContainer.className = 'sections-grid';
        
        Object.keys(this.sections).forEach(section => {
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'checkbox-container';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = section.toLowerCase().replace(/\s+/g, '-');
            checkbox.value = section;
            
            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = section;
            
            checkboxContainer.appendChild(checkbox);
            checkboxContainer.appendChild(label);
            this.sectionsContainer.appendChild(checkboxContainer);
        });
        
        sectionsSection.appendChild(this.sectionsContainer);

        // Creativity Meter
        const creativitySection = this.createSection('Creativity Level');
        
        const creativityLabel = document.createElement('label');
        creativityLabel.textContent = 'Creativity (0 = Traditional, 5 = Experimental)';
        
        this.creativitySlider = document.createElement('input');
        this.creativitySlider.type = 'range';
        this.creativitySlider.min = '0';
        this.creativitySlider.max = '5';
        this.creativitySlider.value = '2';
        this.creativitySlider.step = '1';
        
        const creativityValue = document.createElement('span');
        creativityValue.textContent = this.creativitySlider.value;
        this.creativitySlider.oninput = () => {
            creativityValue.textContent = this.creativitySlider.value;
        };
        
        creativitySection.appendChild(creativityLabel);
        creativitySection.appendChild(this.creativitySlider);
        creativitySection.appendChild(creativityValue);

        // Submit Button
        this.submitButton = document.createElement('button');
        this.submitButton.textContent = 'Generate Arrangement';
        this.submitButton.className = 'submit-button';

        // Add all sections to container
        [
            songDetailsSection,
            patternsSection,
            sectionsSection,
            creativitySection,
            this.submitButton
        ].forEach(element => this.container.appendChild(element));
    }

    private createSection(title: string): HTMLDivElement {
        const section = document.createElement('div');
        section.className = 'form-section';
        
        const heading = document.createElement('h3');
        heading.textContent = title;
        section.appendChild(heading);
        
        return section;
    }

    private addPattern(name: string, bars: number) {
        if (!name || !bars) return;
        
        this.patterns.push({ name, bars });
        this.updatePatternsList();
        
        // Clear inputs
        const patternInput = this.container.querySelector('.pattern-input-container input[type="text"]') as HTMLInputElement;
        const barsInput = this.container.querySelector('.pattern-input-container input[type="number"]') as HTMLInputElement;
        if (patternInput) patternInput.value = '';
        if (barsInput) barsInput.value = '8';
    }

    private updatePatternsList() {
        this.patternsList.innerHTML = '';
        this.patterns.forEach((pattern, index) => {
            const patternElement = document.createElement('div');
            patternElement.className = 'pattern-item';
            
            const patternText = document.createElement('span');
            patternText.textContent = `${pattern.name} (${pattern.bars} bars)`;
            
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '×';
            deleteButton.onclick = () => {
                this.patterns.splice(index, 1);
                this.updatePatternsList();
            };
            
            patternElement.appendChild(patternText);
            patternElement.appendChild(deleteButton);
            this.patternsList.appendChild(patternElement);
        });
    }

    public onSubmit(callback: (data: {
        songName: string;
        tempo: number;
        length: number;
        genre: string;
        patterns: Array<{name: string, bars: number}>;
        sections: string[];
        creativity: number;
    }) => void) {
        this.submitButton.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (!this.songNameInput.value) {
                alert('Please enter a song name');
                return;
            }

            if (this.patterns.length === 0) {
                alert('Please add at least one pattern');
                return;
            }

            const selectedSections = Array.from(
                this.sectionsContainer.querySelectorAll('input[type="checkbox"]:checked')
            ).map(checkbox => (checkbox as HTMLInputElement).value);

            if (selectedSections.length === 0) {
                alert('Please select at least one section');
                return;
            }

            callback({
                songName: this.songNameInput.value,
                tempo: parseInt(this.tempoInput.value),
                length: parseInt(this.lengthInput.value),
                genre: this.genreSelect.value,
                patterns: this.patterns,
                sections: selectedSections,
                creativity: parseInt(this.creativitySlider.value)
            });
        });
    }
} 
