import { SongData } from '../../core/types';

export class SongForm {
    private form: HTMLFormElement;
    private onSubmit: (data: SongData) => void;

    constructor(onSubmit: (data: SongData) => void) {
        this.onSubmit = onSubmit;
        this.form = document.getElementById('songForm') as HTMLFormElement;
        this.initializeForm();
    }

    private initializeForm() {
        this.form.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = this.getFormData();
            this.showLoading(true);
            this.onSubmit(formData);
        });
    }

    private getFormData(): SongData {
        return {
            title: (document.getElementById('title') as HTMLInputElement).value,
            genre: (document.getElementById('genre') as HTMLSelectElement).value,
            length: parseInt((document.getElementById('length') as HTMLInputElement).value),
            tempo: parseInt((document.getElementById('tempo') as HTMLInputElement).value),
            instruments: (document.getElementById('instruments') as HTMLInputElement).value
                .split(',')
                .map(i => i.trim())
                .filter(i => i.length > 0)
        };
    }

    public showLoading(show: boolean) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = show ? 'block' : 'none';
        }
    }
} 