// <site-header>: announcement ticker, logo, main navigation and header actions.
(function () {
  const { icon, PHONE } = MANN;

  const TICKER = [
    'Flexible delivery times',
    'Tricity, Punjab and Delhi NCR',
    'Grown by our own contract farmers',
    'GST invoice with net weight',
    'Try us on five items for a week',
    'Quotes within 2 working hours'
  ];

  // also used by the phone menu and the footer, which sit on dark green and pass dark = true
  MANN.logo = (dark = false) => `
    <a class="logo" href="${MANN.isHome() ? '#top' : 'index.html'}" translate="no">
      <img src="img/${dark ? 'logo-dark' : 'logo'}.png" alt="Mann Farm Fresh" width="654" height="240">
    </a>`;

  function navLinks() {
    // on the home page "Products" opens the product picker in the quote form
    const products = MANN.isHome() ? '<a href="#quote" data-picker>Products</a>' : '<a href="products.html">Products</a>';
    return `${products}
      <a href="${MANN.link('#how')}">How it works</a>
      <a href="founders.html">Founders</a>
      <a href="${MANN.link('#buyers')}">Who we supply</a>
      <a href="locations.html">Locations</a>
      <a href="${MANN.link('#faq')}">FAQ</a>`;
  }

  // home: highlight the section in view. Other pages: highlight the page itself.
  function markCurrent(nav) {
    const links = [...nav.querySelectorAll('a:not([data-picker])')];
    if (!MANN.isHome()) {
      links.forEach(a => { if (a.pathname === location.pathname) a.setAttribute('aria-current', 'true'); });
      return;
    }
    const inPage = links.filter(a => a.hash && a.pathname === location.pathname);
    const spy = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) inPage.forEach(a => a.setAttribute('aria-current', a.hash === '#' + entry.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    inPage.forEach(a => { const section = document.querySelector(a.hash); if (section) spy.observe(section); });
  }

  customElements.define('site-header', class extends HTMLElement {
    connectedCallback() {
      const items = TICKER.map(text => `<span>${text}</span>`).join('');
      this.innerHTML = `
        <header class="site" id="siteHeader">
          <div class="ticker" role="note" aria-label="${TICKER.join('. ')}">
            <div class="ticker-track" aria-hidden="true">${items}${items}</div>
          </div>
          <div class="wrap">
            ${MANN.logo()}
            <nav class="main" aria-label="Main" id="mainNav">${navLinks()}</nav>
            <a class="call-btn" href="${PHONE.href}" aria-label="Call Mann Farm Fresh on ${PHONE.text}">${icon('phone')}<span>${PHONE.html}</span></a>
            <a class="nav-order" href="${MANN.orderLink()}" data-mode-link="order">Place order</a>
            <a class="nav-cta" href="${MANN.link('#quote')}" data-mode-link="quote">Get a quote${icon('arrow-right')}</a>
            <button class="menu-btn" id="menuBtn" type="button" aria-expanded="false" aria-controls="mnav" aria-label="Open menu">${icon('menu')}</button>
          </div>
        </header>`;
      // the sections it points at are parsed after the header
      document.addEventListener('DOMContentLoaded', () => markCurrent(this.querySelector('nav')));
    }
  });
})();
