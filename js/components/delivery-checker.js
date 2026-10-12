// <delivery-checker>: enter a pincode or city, see the next delivery, cut-off and minimum order.
(function () {
  const { esc, icon, PHONE } = MANN;
  const POPULAR = ['Chandigarh', 'Mohali', 'Ludhiana', 'Gurugram'];
  const CHECK_MS = 600; // prototype: stands in for the network request

  const fact = (label, value) => `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`;

  function resultHTML(place) {
    const route = MANN.findRoute(place);
    if (!route) return `
      <div class="ck-res ck-no">
        <p class="status warn">No fixed route to ${esc(place)} yet</p>
        <p>You can still send your list. Our team confirms delivery within 2 working hours, or call <a href="${PHONE.href}">${PHONE.text}</a>.</p>
      </div>`;
    const next = MANN.nextDelivery(route);
    return `
      <div class="ck-res">
        <p class="status ok">Yes, we deliver to ${esc(place)}</p>
        <p class="ck-when">${next ? `Next delivery <b>${esc(next.label)}</b>` : 'Delivery on a schedule that suits you'}</p>
        <p class="ck-cut">${next ? `Order by ${esc(next.orderBy)} to make it. ` : ''}The time slot is flexible: you choose what suits your kitchen or store.</p>
        <dl class="ck-facts">
          ${fact('Route', route.area)}
          ${fact('Delivery days', route.days)}
          ${fact('Time slot', `Flexible, usually ${route.win}`)}
          ${fact('Order cut-off', route.cut)}
          ${fact('Minimum order', route.min)}
        </dl>
        <p class="fine">Sample route rules for the prototype.</p>
      </div>`;
  }

  customElements.define('delivery-checker', class extends HTMLElement {
    connectedCallback() {
      this.innerHTML = `
        <div class="checker">
          <form class="fit-form" novalidate>
            <input name="delivery-area" autocomplete="postal-code" placeholder="e.g. 160062 or Ludhiana…" aria-label="Pincode or city">
            <button class="btn dark sm" type="submit">
              <span>Check<span class="fit-more"> time</span></span>
              <i>${icon('arrow-up-right')}<span class="spinner" aria-hidden="true"></span></i>
            </button>
          </form>
          <div class="chips">
            <span class="chips-label">Popular:</span>
            ${POPULAR.map(place => `<button class="chip" type="button">${place}</button>`).join('')}
          </div>
          <div class="ck-out" aria-live="polite"></div>
        </div>`;

      const input = this.querySelector('input'), button = this.querySelector('button[type="submit"]'), out = this.querySelector('.ck-out');
      let timer = 0;
      const check = place => {
        place = place.trim();
        if (!place) {
          out.innerHTML = '<p class="hint">Enter a pincode or city, then tap <b>Check</b>.</p>';
          input.focus();
          return;
        }
        clearTimeout(timer);
        button.classList.add('loading');
        button.setAttribute('aria-busy', 'true');
        out.innerHTML = `<p class="ck-checking"><span class="spinner" aria-hidden="true"></span>Checking delivery to <b>${esc(place)}</b>…</p>`;
        timer = setTimeout(() => {
          button.classList.remove('loading');
          button.removeAttribute('aria-busy');
          out.innerHTML = resultHTML(place);
        }, CHECK_MS);
      };

      this.querySelector('form').addEventListener('submit', e => { e.preventDefault(); check(input.value); });
      this.querySelectorAll('.chip').forEach(chip => chip.addEventListener('click', () => { input.value = chip.textContent; check(chip.textContent); }));
    }
  });
})();
