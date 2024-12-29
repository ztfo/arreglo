import { ApiConfig } from '../../core/types';

export class Settings {
  private panel: HTMLElement;
  private openaiKey: HTMLInputElement;
  private anthropicKey: HTMLInputElement;
  private preferredApi: HTMLSelectElement;

  constructor(private onSave: (config: ApiConfig) => void) {
    this.panel = document.getElementById('settings') as HTMLElement;
    this.openaiKey = document.getElementById('openaiKey') as HTMLInputElement;
    this.anthropicKey = document.getElementById('anthropicKey') as HTMLInputElement;
    this.preferredApi = document.getElementById('preferredApi') as HTMLSelectElement;

    document.getElementById('settingsButton')?.addEventListener('click', () => {
        this.toggle();
        if (this.panel.classList.contains('visible')) {
            this.openaiKey.focus();
        }
    });

    document.getElementById('saveSettings')?.addEventListener('click', () => {
        const config = {
            OPENAI_API_KEY: this.openaiKey.value,
            ANTHROPIC_API_KEY: this.anthropicKey.value,
            PREFERRED_API: this.preferredApi.value as 'anthropic' | 'openai'
        };
        this.onSave(config);
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
    this.openaiKey.value = config.OPENAI_API_KEY || '';
    this.anthropicKey.value = config.ANTHROPIC_API_KEY || '';
    this.preferredApi.value = config.PREFERRED_API || 'openai';
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