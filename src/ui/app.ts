import './styles/main.css';
import { ErrorDisplay } from './components/ErrorDisplay';
import { Settings } from './components/Settings';
import { SongForm } from './components/SongForm';
import { ApiConfig, SongData } from '../core/types';
import { AnalyticsService } from '../services/AnalyticsService';
import { MessageOverlay } from './components/MessageOverlay';

export class App {
    private songForm!: SongForm;
    private settings: Settings;
    private messageOverlay: MessageOverlay;
    private isGenerating: boolean = false;

    constructor() {
        this.messageOverlay = new MessageOverlay();
        this.settings = new Settings(this.handleSettingsSave.bind(this));
        this.initializeApp();

        // Load settings when the app initializes
        document.addEventListener('DOMContentLoaded', () => {
            this.settings.loadSettings().then(() => {
                console.log('Settings loaded successfully.');
            });
        });

        parent.postMessage({ pluginMessage: { type: 'load-settings' } }, '*');
    }

    private initializeApp() {
        this.initializeMessageHandling();
        this.songForm = new SongForm(
            this.handleFormSubmit.bind(this)
        );
    }

    private initializeMessageHandling() {
        window.onmessage = (event) => {
            const msg = event.data.pluginMessage;
            if (!msg) return;

            if (msg.type === 'success') {
                this.isGenerating = false;
                this.messageOverlay.show(msg.message, 'success');
                this.songForm.showLoading(false);
            } else if (msg.type === 'error') {
                this.isGenerating = false;
                this.messageOverlay.show(msg.message, 'error');
                this.songForm.showLoading(false);
            } else if (msg.type === 'settings-loaded') {
                if (msg.config) {
                    this.settings.updateSettings(msg.config);
                }
            } else if (msg.type === 'settings-saved') {
                this.messageOverlay.show('Settings saved successfully!', 'success');
            } else if (msg.type === 'image-analyzed') {
                if (!msg.trackNames || msg.trackNames.length === 0) {
                    this.messageOverlay.show('No track names found in image', 'error');
                }
            }
        };
    }

    private async handleFormSubmit(songData: SongData) {
        if (this.isGenerating) return;
        
        try {
            this.isGenerating = true;
            parent.postMessage({ 
                pluginMessage: { 
                    type: 'generate-arrangement',
                    songData 
                }
            }, '*');
        } catch (error) {
            console.error('Error submitting form:', error);
            this.messageOverlay.show(
                error instanceof Error ? error.message : 'An error occurred',
                'error'
            );
        } finally {
            this.isGenerating = false;
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

    public clearLoading() {
        this.songForm.showLoading(false);
    }
}
