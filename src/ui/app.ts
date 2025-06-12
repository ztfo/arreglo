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
    private hasArrangement: boolean = false;

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
        this.initializeExportHandling();
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
                this.hasArrangement = true;
                this.updateExportButton();
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
            } else if (msg.type === 'export-success') {
                this.handleExportSuccess(msg.result);
            } else if (msg.type === 'export-formats') {
                this.updateExportFormats(msg.formats);
            }
        };
    }

    private initializeExportHandling() {
        const exportButton = document.getElementById('exportButton') as HTMLButtonElement;
        const exportToggle = document.getElementById('export-toggle') as HTMLInputElement;
        const confirmExport = document.getElementById('confirmExport') as HTMLButtonElement;
        const cancelExport = document.getElementById('cancelExport') as HTMLButtonElement;

        if (exportButton) {
            exportButton.addEventListener('click', () => {
                if (this.hasArrangement) {
                    exportToggle.checked = true;
                    // Get available export formats
                    parent.postMessage({ pluginMessage: { type: 'get-export-formats' } }, '*');
                }
            });
        }

        if (confirmExport) {
            confirmExport.addEventListener('click', () => this.handleExportConfirm());
        }

        if (cancelExport) {
            cancelExport.addEventListener('click', () => {
                exportToggle.checked = false;
            });
        }

        // Close export modal when clicking outside or on close button
        const closeExportModal = () => {
            exportToggle.checked = false;
        };

        const exportModal = document.querySelector('.export-modal');
        const closeModalButton = exportModal?.querySelector('.close-modal');
        
        if (closeModalButton) {
            closeModalButton.addEventListener('click', closeExportModal);
        }
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

    private updateExportButton() {
        const exportButton = document.getElementById('exportButton') as HTMLButtonElement;
        if (exportButton) {
            exportButton.disabled = !this.hasArrangement;
        }
    }

    private handleExportConfirm() {
        const formatInputs = document.getElementsByName('exportFormat') as NodeListOf<HTMLInputElement>;
        const includeMetadata = document.getElementById('includeMetadata') as HTMLInputElement;
        const exportTempo = document.getElementById('exportTempo') as HTMLInputElement;
        
        let selectedFormat = 'json';
        for (let i = 0; i < formatInputs.length; i++) {
            if (formatInputs[i].checked) {
                selectedFormat = formatInputs[i].value;
                break;
            }
        }

        const exportOptions = {
            format: selectedFormat,
            includeMetadata: includeMetadata.checked,
            tempo: parseInt(exportTempo.value) || 128,
            timeSignature: [4, 4] as [number, number],
            quantization: 480
        };

        // Send export request to plugin
        parent.postMessage({ 
            pluginMessage: { 
                type: 'export-arrangement',
                ...exportOptions
            }
        }, '*');

        // Close modal
        const exportToggle = document.getElementById('export-toggle') as HTMLInputElement;
        exportToggle.checked = false;

        // Show loading state
        this.messageOverlay.show('Exporting arrangement...', 'success');
    }

    private handleExportSuccess(result: any) {
        const { filename, mimeType, data, format } = result;
        
        try {
            // Convert array back to Uint8Array
            const uint8Array = new Uint8Array(data);
            const blob = new Blob([uint8Array], { type: mimeType });
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            this.messageOverlay.show(`Arrangement exported as ${format.toUpperCase()}!`, 'success');
        } catch (error) {
            console.error('Export download failed:', error);
            this.messageOverlay.show('Failed to download export file', 'error');
        }
    }

    private updateExportFormats(formats: Array<{ format: string; displayName: string }>) {
        // Update the export format options in the modal
        const formatsContainer = document.querySelector('.export-formats');
        if (!formatsContainer) return;

        formatsContainer.innerHTML = '';
        
        formats.forEach((formatInfo, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'format-option';
            
            const radioId = `format-${formatInfo.format}`;
            const isChecked = index === 0 ? 'checked' : '';
            
            optionDiv.innerHTML = `
                <input type="radio" name="exportFormat" value="${formatInfo.format}" id="${radioId}" ${isChecked}>
                <label for="${radioId}">
                    <i class="fa-solid ${this.getFormatIcon(formatInfo.format)}"></i>
                    <div class="format-details">
                        <strong>${formatInfo.displayName}</strong>
                        <small>${this.getFormatDescription(formatInfo.format)}</small>
                    </div>
                </label>
            `;
            
            formatsContainer.appendChild(optionDiv);
        });
    }

    private getFormatIcon(format: string): string {
        switch (format) {
            case 'json': return 'fa-code';
            case 'midi':
            case 'mid': return 'fa-music';
            case 'csv': return 'fa-table';
            default: return 'fa-file';
        }
    }

    private getFormatDescription(format: string): string {
        switch (format) {
            case 'json': return 'Structured data for developers';
            case 'midi':
            case 'mid': return 'Import into any DAW';
            case 'csv': return 'Spreadsheet format';
            default: return 'Export format';
        }
    }
}
