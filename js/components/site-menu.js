// <site-menu>: the full-screen menu on phones and tablets, opened by the header's menu button.
(function () {
  const { $, icon, PHONE, HOURS } = MANN;
  const SLIDE_MS = 420; // matches the slide transition in mobile-menu.css

  const item = (href, img, title, note, attrs = '') => `
    <li><a href="${href}"${attrs}>
      <img src="img/${img}.jpg" alt="" width="60" height="60" loading="lazy">
      <span><b>${title}</b><small>${note}</small></span>
    </a></li>`;

  customElements.define('site-menu', class extends HTMLElement {
    connectedCallback() {
      const { link } = MANN;
      this.innerHTML = `
        <div class="mnav" id="mnav" hidden role="dialog" aria-modal="true" aria-label="Menu">
          <div class="mnav-top">
            ${MANN.logo(true)}
            <button type="button" id="menuClose" aria-label="Close menu">${icon('close', 22)}</button>
          </div>
          <ul>
            ${item(link('#quote'), 'tomato', 'Browse produce', '94 vegetables, herbs and fruit', ' data-picker')}
            ${item(link('#how'), 's1', 'How it works', 'Plan, grow, harvest, grade, deliver')}
            ${item('founders.html', 'farmer', 'Founders', 'The people behind your produce')}
            ${item(link('#buyers'), 'restaurant', 'Who we supply', 'Restaurants, hotels, caterers, retail')}
            ${item('locations.html', 'dispatch', 'Locations', 'Delivery times in your area')}
            ${item(link('#faq'), 'field', 'FAQ', 'Prices, credit, WhatsApp orders')}
          </ul>
          <a class="btn" href="${link('#quote')}" data-mode-link="quote">Get a quote<i>${icon('arrow-up-right')}</i></a>
          <a class="btn ghost" href="${MANN.orderLink()}" data-mode-link="order">Place order</a>
          <a class="btn ghost call" href="${PHONE.href}">${icon('phone')}Call ${PHONE.html}</a>
          <p>Call or WhatsApp · ${HOURS}</p>
        </div>`;
      this.wire();
    }

    wire() {
      const menu = this.firstElementChild, openBtn = $('menuBtn'), closeBtn = $('menuClose');
      let timer = 0;

      const open = () => {
        clearTimeout(timer);
        menu.hidden = false;
        menu.offsetWidth; // forces a layout so the slide-in transition runs
        menu.classList.add('open');
        openBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        closeBtn.focus({ preventScroll: true });
      };
      // slide out, then hide once the transition is over (a timer also works with reduced motion)
      const close = () => {
        if (menu.hidden) return;
        menu.classList.remove('open');
        openBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        clearTimeout(timer);
        timer = setTimeout(() => { menu.hidden = true; }, SLIDE_MS);
      };

      openBtn.addEventListener('click', open);
      closeBtn.addEventListener('click', () => { close(); openBtn.focus(); });
      menu.addEventListener('click', e => { if (e.target.closest('a')) close(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { close(); openBtn.focus(); } });

      MANN.menu = { close };
    }
  });
})();
