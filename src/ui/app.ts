import './styles/main.css';
import { ErrorDisplay } from './components/ErrorDisplay';
import { Settings } from './components/Settings';
import { SongForm } from './components/SongForm';
import { ApiConfig, SongData, ArrangementData } from '../core/types';
import { AnalyticsService } from '../services/AnalyticsService';

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
                case 'settings-loaded':
                    if (msg.config) {
                        this.settings.updateSettings(msg.config);
                    }
                    break;
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

    private async handleFormSubmit(songData: SongData) {
        const startTime = performance.now();
        try {
            console.log('Form submitted with song data:', songData);
            
            parent.postMessage({ 
                pluginMessage: { 
                    type: 'generate-arrangement', 
                    songData,
                    collectAnalytics: true,
                    startTime
                } 
            }, '*');
        } catch (err) {
            console.error('Error in handleFormSubmit:', err);
            await AnalyticsService.collectArrangementData(
                songData,
                {} as ArrangementData,
                this.settings.config.PREFERRED_API,
                performance.now() - startTime,
                false,
                err instanceof Error ? err.message : String(err)
            );
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

    public showError(message: string) {
        const overlay = document.querySelector('.alert-tray.overlay');
        const errorMessage = document.getElementById('errorMessage');
        
        if (overlay && errorMessage) {
            errorMessage.textContent = message;
            overlay.classList.add('active', 'show-error');
        }

        const clearButton = document.getElementById('clearError');
        if (clearButton) {
            clearButton.onclick = () => {
                this.clearError();
                this.clearLoading();
            };
        }
    }

    public showSuccess(message: string) {
        const overlay = document.querySelector('.alert-tray.overlay');
        const errorMessage = document.getElementById('errorMessage');
        
        if (overlay && errorMessage) {
            errorMessage.textContent = message;
            overlay.classList.add('active', 'show-error');
        }

        const clearButton = document.getElementById('clearError');
        if (clearButton) {
            clearButton.onclick = () => {
                this.clearError();
                this.clearLoading();
            };
        }
    }

    public clearError() {
        const overlay = document.querySelector('.alert-tray.overlay');
        if (overlay) {
            overlay.classList.remove('show-error');
        }
    }

    public clearLoading() {
        const overlay = document.querySelector('.alert-tray.overlay');
        if (overlay) {
            overlay.classList.remove('active', 'show-loading');
        }
    }
}
