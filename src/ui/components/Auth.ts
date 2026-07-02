export class AuthUI {
  private container: HTMLElement;
  private emailInput: HTMLInputElement;
  private sendLinkBtn: HTMLButtonElement;
  private codeGroup: HTMLElement;
  private codeInput: HTMLInputElement;
  private verifyBtn: HTMLButtonElement;

  constructor() {
    const html = `
      <div class="auth-panel">
        <div class="auth-card">
          <div class="auth-side auth-info">
            <div class="auth-logo"></div>
            <ul class="auth-features">
              <li><i class="fa-solid fa-wand-magic-sparkles"></i><span>AI-generated song arrangements</span></li>
              <li><i class="fa-solid fa-table-columns"></i><span>Visual sections on your canvas</span></li>
              <li><i class="fa-solid fa-camera"></i><span>Pull tracks from DAW screenshots</span></li>
              <li><i class="fa-solid fa-file-export"></i><span>Export to take into your DAW</span></li>
              <li><i class="fa-solid fa-circle-info"></i><span>No audio generation &mdash; arranges your loops into a song</span></li>
            </ul>
          </div>
          <div class="auth-side auth-form">
            <h3>welcome.</h3>
            <p class="auth-subtitle">New sign-ups get <strong>25 free credits</strong>.</p>
            <div class="form-group">
              <label for="authEmail">Email</label>
              <input type="email" id="authEmail" placeholder="you@example.com" required />
            </div>
            <button id="sendMagicLink" class="btn primary-button auth-button">Send Code</button>
            <p class="auth-hint">Already have an account? We'll email you a sign-in code.</p>
            <div class="form-group" id="authCodeGroup" style="display: none;">
              <label for="authCode">6-digit code from your email</label>
              <input type="text" id="authCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456" />
              <button id="verifyCode" class="btn primary-button auth-button">Verify</button>
            </div>
          </div>
        </div>
      </div>`;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    this.container = wrapper.firstElementChild as HTMLElement;
    document.body.appendChild(this.container);

    this.emailInput = this.container.querySelector('#authEmail') as HTMLInputElement;
    this.sendLinkBtn = this.container.querySelector('#sendMagicLink') as HTMLButtonElement;
    this.codeGroup = this.container.querySelector('#authCodeGroup') as HTMLElement;
    this.codeInput = this.container.querySelector('#authCode') as HTMLInputElement;
    this.verifyBtn = this.container.querySelector('#verifyCode') as HTMLButtonElement;
  }

  onSendLink(handler: (email: string) => void) {
    this.sendLinkBtn.addEventListener('click', () => {
      const email = this.emailInput.value.trim();
      if (!email) return;
      handler(email);
    });
  }

  onVerifyCode(handler: (email: string, code: string) => void) {
    this.verifyBtn.addEventListener('click', () => {
      const email = this.emailInput.value.trim();
      const code = this.codeInput.value.trim();
      if (!email || !code) return;
      handler(email, code);
    });
  }

  showCodeStep() {
    this.codeGroup.style.display = '';
    this.sendLinkBtn.textContent = 'Resend Code';
    this.codeInput.focus();
  }

  setVisible(visible: boolean) {
    this.container.style.display = visible ? '' : 'none';
    if (visible) {
      this.codeGroup.style.display = 'none';
      this.sendLinkBtn.textContent = 'Send Code';
      this.codeInput.value = '';
    }
  }
}
