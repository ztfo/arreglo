export class AuthUI {
  private container: HTMLElement;
  private emailInput: HTMLInputElement;
  private sendLinkBtn: HTMLButtonElement;

  constructor() {
    const html = `
      <div class="auth-panel">
        <h3>Sign in</h3>
        <div class="form-group">
          <label for="authEmail">Email</label>
          <input type="email" id="authEmail" placeholder="you@example.com" required />
        </div>
        <button id="sendMagicLink" class="btn primary-button">Send Magic Link</button>
      </div>`;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    this.container = wrapper.firstElementChild as HTMLElement;
    document.body.appendChild(this.container);

    this.emailInput = this.container.querySelector('#authEmail') as HTMLInputElement;
    this.sendLinkBtn = this.container.querySelector('#sendMagicLink') as HTMLButtonElement;
  }

  onSendLink(handler: (email: string) => void) {
    this.sendLinkBtn.addEventListener('click', () => {
      const email = this.emailInput.value.trim();
      if (!email) return;
      handler(email);
    });
  }
}

