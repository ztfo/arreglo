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

    this.loadSettings();

    document.getElementById('settingsButton')?.addEventListener('click', () => {
        this.toggle();
        if (this.panel.classList.contains('visible')) {
            this.openaiKey.focus();
        }
    });

    document.getElementById('saveSettings')?.addEventListener('click', () => {
        this.save();
        this.onSave({
            OPENAI_API_KEY: this.openaiKey.value,
            ANTHROPIC_API_KEY: this.anthropicKey.value,
            PREFERRED_API: this.preferredApi.value as 'anthropic' | 'openai'
        });
        this.toggle();
        document.getElementById('settingsButton')?.focus();
    });
  }

  public async loadSettings() {
    const config = {
      OPENAI_API_KEY: await figma.clientStorage.getAsync('OPENAI_API_KEY'),
      ANTHROPIC_API_KEY: await figma.clientStorage.getAsync('ANTHROPIC_API_KEY'),
      PREFERRED_API: (await figma.clientStorage.getAsync('PREFERRED_API')) || 'openai',
    };

    console.log('Loaded settings from clientStorage:', config);

    this.openaiKey.value = config.OPENAI_API_KEY || '';
    this.anthropicKey.value = config.ANTHROPIC_API_KEY || '';
    this.preferredApi.value = config.PREFERRED_API;
  }

  public async save() {
    const config: ApiConfig = {
      OPENAI_API_KEY: this.openaiKey.value,
      ANTHROPIC_API_KEY: this.anthropicKey.value,
      PREFERRED_API: this.preferredApi.value as 'anthropic' | 'openai',
    };

    console.log('Saving settings to clientStorage:', config);

    await figma.clientStorage.setAsync('OPENAI_API_KEY', config.OPENAI_API_KEY);
    await figma.clientStorage.setAsync('ANTHROPIC_API_KEY', config.ANTHROPIC_API_KEY);
    await figma.clientStorage.setAsync('PREFERRED_API', config.PREFERRED_API);

    console.log('Settings saved:', config);
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