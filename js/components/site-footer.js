// <site-footer>: brand blurb, link columns, legal line and the large wordmark.
(function () {
  const { PHONE, HOURS } = MANN;

  const column = (title, links) => `
    <div>
      <h4>${title}</h4>
      <ul>${links.map(([label, href]) => `<li><a href="${href}">${label}</a></li>`).join('')}</ul>
    </div>`;

  customElements.define('site-footer', class extends HTMLElement {
    connectedCallback() {
      const { link } = MANN;
      this.innerHTML = `
        <footer>
          <div class="wrap">
            <div class="foot">
              <div>
                ${MANN.logo(true)}
                <p>Contract-farmed produce for kitchens and stores across Tricity, Punjab and Delhi NCR.</p>
                <a class="home-link" href="${link('#home')}" id="home">
                  <span><small>Buying for your home?</small>Shop family boxes</span><i aria-hidden="true">→</i>
                </a>
              </div>
              ${column('Explore', [
                ['All products', 'products.html'],
                ['How it works', link('#how')],
                ['Founders', 'founders.html'],
                ['Who we supply', link('#buyers')],
                ['Locations', 'locations.html']
              ])}
              ${column('Order', [
                ['Get a quote', link('#quote')],
                ['Check delivery time', link('#where')],
                ['FAQ', link('#faq')]
              ])}
              <div>
                <h4>Contact</h4>
                <ul>
                  <li><a href="${PHONE.href}">${PHONE.html}</a></li>
                  <li><span class="muted">${HOURS}</span></li>
                </ul>
              </div>
            </div>
            <div class="legal">
              <span>© 2026 <span translate="no">Mann Farm Fresh</span></span>
              <span>Design prototype by MODO Visuals · photos to be replaced with Mann's own shoot</span>
            </div>
          </div>
          <p class="wordmark" aria-hidden="true" translate="no">MANN</p>
        </footer>`;
    }
  });
})();
