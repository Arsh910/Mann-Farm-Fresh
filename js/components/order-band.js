// <order-band>: the dark "Ready to order" call to action that closes every inner page.
customElements.define('order-band', class extends HTMLElement {
  connectedCallback() {
    const { icon, PHONE } = MANN;
    this.innerHTML = `
      <section class="dark order-band">
        <div class="wrap">
          <div class="head">
            <div><p class="eyebrow">Ready to order</p><h2>Send today's produce requirement.</h2></div>
            <p>Share the products, quantity in kg or grams, city and how often you need delivery. We confirm availability and price after we receive it.</p>
          </div>
          <div class="cta-row">
            <a class="btn" href="index.html#quote">Get a quote<i>${icon('arrow-up-right')}</i></a>
            <a class="btn ghost call" href="${PHONE.href}">${icon('phone')}Call us</a>
          </div>
        </div>
      </section>`;
  }
});
