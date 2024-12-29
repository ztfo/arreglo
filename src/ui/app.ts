import './styles/main.css';
import { ErrorDisplay } from './components/ErrorDisplay';
import { Settings } from './components/Settings';
import { SongForm } from './components/SongForm';
import { ApiConfig, SongData } from '../core/types';

export class App {
    private songForm: SongForm;
    private settings: Settings;
    private errorDisplay: ErrorDisplay;

    constructor() {
        this.errorDisplay = new ErrorDisplay();
        this.songForm = new SongForm(this.handleFormSubmit.bind(this));
        this.settings = new Settings(this.handleSettingsSave.bind(this));

        this.initializeMessageHandling();

        // Load settings when the app initializes
        document.addEventListener('DOMContentLoaded', () => {
            this.settings.loadSettings().then(() => {
                console.log('Settings loaded successfully.');
            });
        });

        parent.postMessage({ pluginMessage: { type: 'load-settings' } }, '*');
    }

    private initializeMessageHandling() {
        window.onmessage = (event) => {
            const msg = event.data.pluginMessage;
            if (!msg) return;

            switch (msg.type) {
                case 'settings-saved':
                    this.errorDisplay.show('Settings saved successfully!');
                    break;
                case 'error':
                    this.errorDisplay.show(msg.message || 'An error occurred');
                    this.songForm.showLoading(false);
                    break;
                case 'success':
                    this.errorDisplay.show(msg.message || 'Operation successful!');
                    this.songForm.showLoading(false);
                    break;
            }
        };
    }

    private handleFormSubmit(songData: SongData) {
        try {
            console.log('Form submitted with song data:', songData);
            parent.postMessage({ 
                pluginMessage: { 
                    type: 'generate-arrangement', 
                    songData 
                } 
            }, '*');
        } catch (error) {
            console.error('Error in handleFormSubmit:', error);
        }
    }

    private handleSettingsSave(config: ApiConfig) {
        parent.postMessage({ 
            pluginMessage: { 
                type: 'save-settings', 
                config 
            } 
        }, '*');
    }
}
