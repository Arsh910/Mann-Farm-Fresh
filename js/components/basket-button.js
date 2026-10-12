// <basket-button>: floating "Your list (3)" link on inner pages, shown once the quote basket has items.
customElements.define('basket-button', class extends HTMLElement {
  connectedCallback() {
    this.innerHTML = '<a class="basket-btn" href="index.html#quote" data-basket hidden>Your list <b data-basket-count>0</b></a>';
    const link = this.firstElementChild, count = link.querySelector('b');
    const sync = () => {
      const n = MANN.basket.count();
      link.hidden = !n;
      count.textContent = n;
    };
    sync();
    document.addEventListener('basket:change', sync);
    // the basket also changes when another tab edits it
    addEventListener('storage', sync);
  }
});
