import './styles/main.css';
import { ErrorDisplay } from './components/ErrorDisplay';
import { Settings } from './components/Settings';
import { SongForm } from './components/SongForm';
import { ApiConfig, SongData, ArrangementData } from '../core/types';
import { AnalyticsService } from '../services/AnalyticsService';
import { MessageOverlay } from './components/MessageOverlay';

export class App {
    private songForm: SongForm;
    private settings: Settings;
    private messageOverlay: MessageOverlay;

    constructor() {
        this.messageOverlay = new MessageOverlay();
        this.songForm = new SongForm(this.handleFormSubmit.bind(this));
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

            switch (msg.type) {
                case 'settings-loaded':
                    if (msg.config) {
                        this.settings.updateSettings(msg.config);
                    }
                    break;
                case 'settings-saved':
                    this.messageOverlay.show('Settings saved successfully!', 'success');
                    break;
                case 'error':
                    this.messageOverlay.show(msg.message || 'An error occurred', 'error');
                    this.songForm.showLoading(false);
                    break;
                case 'success':
                    this.messageOverlay.show(msg.message || 'Operation successful!', 'success');
                    this.songForm.showLoading(false);
                    break;
                case 'image-analyzed':
                    if (!msg.trackNames || msg.trackNames.length === 0) {
                        this.messageOverlay.show('No track names found in image', 'error');
                    }
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

    public clearLoading() {
        this.songForm.showLoading(false);
    }
}
