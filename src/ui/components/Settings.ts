import { ApiConfig } from '../../core/types';

export class Settings {
  private panel: HTMLElement;
  private dataConsent: HTMLInputElement;
  private _config: ApiConfig = {
    DATA_COLLECTION_CONSENT: true
  };

  public get config(): ApiConfig {
    return this._config;
  }

  constructor(private onSave: (config: ApiConfig) => void) {
    this.panel = document.getElementById('settings') as HTMLElement;
    this.dataConsent = document.getElementById('dataCollectionConsent') as HTMLInputElement;

    document.getElementById('settingsButton')?.addEventListener('click', () => {
        this.toggle();
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
    this.dataConsent.checked = config.DATA_COLLECTION_CONSENT || false;
  }

  private handleSave() {
    const config: ApiConfig = {
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
}
