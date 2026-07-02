import './styles/main.css';
import { ErrorDisplay } from './components/ErrorDisplay';
import { Settings } from './components/Settings';
import { SongForm } from './components/SongForm';
import { Help } from './components/Help';
import { AuthUI } from './components/Auth';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ApiConfig, SongData } from '../core/types';
import { MessageOverlay } from './components/MessageOverlay';

export class App {
    private songForm!: SongForm;
    private settings: Settings;
    private help: Help;
    private messageOverlay: MessageOverlay;
    private isGenerating: boolean = false;
    private hasArrangement: boolean = false;
    private supabase!: SupabaseClient;
    private authUI!: AuthUI;
    private userStatusEl!: HTMLElement;
    private signOutBtn!: HTMLButtonElement;
    private creditBalanceEl!: HTMLElement;
    private buyCreditsBtn!: HTMLButtonElement;
    private balancePollTimer: number | null = null;
    private lastKnownBalance: number | null = null;

    constructor() {
        this.messageOverlay = new MessageOverlay();
        this.settings = new Settings(this.handleSettingsSave.bind(this));
        this.help = new Help();
        this.initializeApp();
        this.initializeAuth();

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
        this.userStatusEl = document.getElementById('userStatus') as HTMLElement;
        this.signOutBtn = document.getElementById('signOutButton') as HTMLButtonElement;
        this.creditBalanceEl = document.getElementById('creditBalance') as HTMLElement;
        this.buyCreditsBtn = document.getElementById('buyCreditsButton') as HTMLButtonElement;
        if (this.buyCreditsBtn) {
            this.buyCreditsBtn.addEventListener('click', () => this.openBuyCreditsModal());
        }
        if (this.signOutBtn) {
            this.signOutBtn.addEventListener('click', async () => {
                await this.supabase.auth.signOut();
                parent.postMessage({ pluginMessage: { type: 'clear-session' } }, '*');
                this.stopBalancePolling();
                this.updateAuthUI(null);
            });
        }
    }

    private initializeAuth() {
        // These should be injected at build time via webpack DefinePlugin
        // No hardcoded fallbacks to avoid exposing sensitive infrastructure details
        const url = process.env.SUPABASE_URL;
        const anon = process.env.SUPABASE_ANON_KEY;
        
        // Create AuthUI instance once (before checking config to avoid duplicates)
        this.authUI = new AuthUI();
        
        if (!url || !anon) {
            console.error('Supabase configuration missing. SUPABASE_URL and SUPABASE_ANON_KEY must be set at build time.');
            // Create a dummy client that will fail gracefully
            // This prevents the app from crashing but auth won't work
            this.supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
            this.messageOverlay.show('Authentication not configured. Please rebuild with environment variables.', 'error');
            return;
        }
        
        // The plugin iframe is sandboxed (no reliable localStorage), so sessions
        // are persisted in figma.clientStorage via the plugin sandbox instead
        this.supabase = createClient(url, anon, { auth: { persistSession: false } });

        this.authUI.onSendLink(async (email) => {
            const { error } = await this.supabase.auth.signInWithOtp({ email });
            if (error) {
                this.messageOverlay.show(`Could not send code: ${error.message}`, 'error');
                return;
            }
            this.authUI.showCodeStep();
            this.messageOverlay.show('Code sent. Check your email.', 'success');
        });

        this.authUI.onVerifyCode(async (email, code) => {
            const { data, error } = await this.supabase.auth.verifyOtp({ email, token: code, type: 'email' });
            if (error || !data.session) {
                this.messageOverlay.show(`Sign in failed: ${error?.message || 'no session returned'}`, 'error');
                return;
            }
            this.saveSession(data.session.access_token, data.session.refresh_token);
            this.messageOverlay.show('Signed in successfully.', 'success');
            this.updateAuthUI(data.session.user?.email || '');
        });

        // Keep the stored token fresh when the client refreshes it
        this.supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'TOKEN_REFRESHED' && session) {
                this.saveSession(session.access_token, session.refresh_token);
            }
        });

        // Ask the plugin sandbox for a stored session to restore
        parent.postMessage({ pluginMessage: { type: 'restore-session' } }, '*');
    }

    private saveSession(accessToken: string, refreshToken: string) {
        parent.postMessage({
            pluginMessage: { type: 'save-session', accessToken, refreshToken }
        }, '*');
    }

    private async restoreSession(accessToken: string, refreshToken: string) {
        const { data, error } = await this.supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
        });
        if (error || !data.session) {
            parent.postMessage({ pluginMessage: { type: 'clear-session' } }, '*');
            this.updateAuthUI(null);
            return;
        }
        // setSession may have refreshed an expired token — persist the fresh pair
        this.saveSession(data.session.access_token, data.session.refresh_token);
        this.updateAuthUI(data.session.user?.email || '');
    }

    private updateAuthUI(email: string | null) {
        const signedIn = !!email;
        if (this.userStatusEl) {
            this.userStatusEl.textContent = signedIn ? (email as string) : 'Not signed in';
        }
        const statusDot = document.getElementById('statusDot');
        if (statusDot) {
            statusDot.classList.toggle('online', signedIn);
        }
        if (this.signOutBtn) {
            this.signOutBtn.style.display = signedIn ? 'inline-flex' : 'none';
        }
        if (this.authUI) {
            this.authUI.setVisible(!signedIn);
        }
        if (this.buyCreditsBtn) {
            this.buyCreditsBtn.style.display = signedIn ? 'inline-flex' : 'none';
        }
        if (this.creditBalanceEl) {
            this.creditBalanceEl.style.display = signedIn ? '' : 'none';
        }
        if (signedIn) {
            parent.postMessage({ pluginMessage: { type: 'get-usage' } }, '*');
        }
    }

    private openBuyCreditsModal() {
        const toggle = document.getElementById('credits-toggle') as HTMLInputElement;
        if (toggle) toggle.checked = true;
        parent.postMessage({ pluginMessage: { type: 'get-credit-packs' } }, '*');
    }

    private renderCreditPacks(packs: Array<{ id: string; credits: number; amountCents: number }>) {
        const list = document.getElementById('creditPacksList');
        if (!list) return;
        if (!packs.length) {
            list.innerHTML = '<small>No packs available right now.</small>';
            return;
        }
        list.innerHTML = '';
        packs.forEach(pack => {
            const btn = document.createElement('button');
            btn.className = 'btn primary-button';
            btn.textContent = `${pack.credits} credits — $${(pack.amountCents / 100).toFixed(2)}`;
            btn.addEventListener('click', () => {
                btn.disabled = true;
                parent.postMessage({ pluginMessage: { type: 'buy-credits', pack: pack.id } }, '*');
            });
            list.appendChild(btn);
        });
    }

    private startBalancePolling() {
        // Poll for the webhook-granted credits for ~2 minutes after checkout
        // opens; stopBalancePolling() ends it early once the balance increases
        this.stopBalancePolling();
        let polls = 0;
        this.balancePollTimer = window.setInterval(() => {
            polls += 1;
            if (polls > 24) {
                this.stopBalancePolling();
                return;
            }
            parent.postMessage({ pluginMessage: { type: 'get-usage' } }, '*');
        }, 5000);
    }

    private stopBalancePolling() {
        if (this.balancePollTimer !== null) {
            window.clearInterval(this.balancePollTimer);
            this.balancePollTimer = null;
        }
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
                if (msg.statusCode === 402) {
                    this.openBuyCreditsModal();
                }
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
            } else if (msg.type === 'session-restored') {
                if (msg.accessToken && msg.refreshToken) {
                    this.restoreSession(msg.accessToken, msg.refreshToken);
                } else {
                    this.updateAuthUI(null);
                }
            } else if (msg.type === 'usage-loaded') {
                if (this.creditBalanceEl) {
                    this.creditBalanceEl.textContent = `${msg.creditBalance} credits`;
                }
                // Purchase landed — no need to keep polling
                if (this.lastKnownBalance !== null && msg.creditBalance > this.lastKnownBalance) {
                    this.stopBalancePolling();
                }
                this.lastKnownBalance = msg.creditBalance;
            } else if (msg.type === 'credit-packs') {
                this.renderCreditPacks(msg.packs || []);
            } else if (msg.type === 'checkout-url') {
                window.open(msg.url, '_blank');
                this.messageOverlay.show('Checkout opened in your browser. Credits appear here after payment.', 'success');
                this.startBalancePolling();
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
