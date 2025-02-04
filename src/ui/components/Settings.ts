import { ApiConfig } from '../../core/types';

export class Settings {
  private panel: HTMLElement;
  private openaiKey: HTMLInputElement;
  private anthropicKey: HTMLInputElement;
  private preferredApi: HTMLSelectElement;
  private dataConsent: HTMLInputElement;
  private _config: ApiConfig = {
    OPENAI_API_KEY: '',
    ANTHROPIC_API_KEY: '',
    PREFERRED_API: 'openai',
    DATA_COLLECTION_CONSENT: true
  };

  public get config(): ApiConfig {
    return this._config;
  }

  constructor(private onSave: (config: ApiConfig) => void) {
    this.panel = document.getElementById('settings') as HTMLElement;
    this.openaiKey = document.getElementById('openaiKey') as HTMLInputElement;
    this.anthropicKey = document.getElementById('anthropicKey') as HTMLInputElement;
    this.preferredApi = document.getElementById('preferredApi') as HTMLSelectElement;
    this.dataConsent = document.getElementById('dataCollectionConsent') as HTMLInputElement;

    document.getElementById('settingsButton')?.addEventListener('click', () => {
        this.toggle();
        if (this.panel.classList.contains('visible')) {
            this.openaiKey.focus();
        }
    });

    document.getElementById('saveSettings')?.addEventListener('click', () => {
        this.handleSave();
        this.toggle();
        document.getElementById('settingsButton')?.focus();
    });
  }

  public async loadSettings() {
    parent.postMessage({ 
        pluginMessage: { 
            type: 'load-settings' 
        }
    }, '*');
  }

  public updateSettings(config: ApiConfig) {
    this._config = { ...config };
    this.openaiKey.value = config.OPENAI_API_KEY || '';
    this.anthropicKey.value = config.ANTHROPIC_API_KEY || '';
    this.preferredApi.value = config.PREFERRED_API || 'openai';
    this.dataConsent.checked = config.DATA_COLLECTION_CONSENT || false;
  }

  private handleSave() {
    const config: ApiConfig = {
      OPENAI_API_KEY: this.openaiKey.value,
      ANTHROPIC_API_KEY: this.anthropicKey.value,
      PREFERRED_API: this.preferredApi.value as 'anthropic' | 'openai',
      DATA_COLLECTION_CONSENT: this.dataConsent.checked
    };
    this._config = { ...config };
    this.onSave(config);
  }

  public toggle() {
    const isVisible = this.panel.classList.toggle('visible');
    this.panel.setAttribute('aria-hidden', (!isVisible).toString());
    if (!isVisible) {
      this.panel.setAttribute('inert', '');
    } else {
      this.panel.removeAttribute('inert');
    }
  }

  public getPreferredApi(): 'openai' | 'anthropic' {
    return this.config.PREFERRED_API;
  }
}