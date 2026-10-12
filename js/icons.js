// Every icon is defined once here. Scripts call MANN.icon('name');
// pages use <mann-icon name="…"></mann-icon>.
(function () {
  const line = (d, width) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;

  // name: [viewBox size, shapes]
  const ICONS = {
    'arrow-right': [16, line('M3 8h10M9 4l4 4-4 4', 1.7)],
    'arrow-up-right': [16, line('M5 11 11 5M6 5h5v5', 1.7)],
    'chevron-left': [18, line('M11 4 6 9l5 5', 1.8)],
    'chevron-right': [18, line('m7 4 5 5-5 5', 1.8)],
    check: [14, line('M3 7.5l2.5 2.5L11 4', 1.8)],
    'check-large': [28, line('M7 14.5l4.5 4.5L21 9', 2.6)],
    close: [24, line('M6 6l12 12M18 6 6 18', 2)],
    'close-small': [14, line('M3.5 3.5l7 7M10.5 3.5l-7 7', 1.8)],
    menu: [24, line('M4 8h16M4 16h16', 2)],
    minus: [18, line('M3 9h12', 1.8)],
    plus: [18, line('M9 3v12M3 9h12', 1.8)],
    phone: [24, line('M6.6 3.5h2.6l1.4 4-2 1.3a12 12 0 0 0 6.6 6.6l1.3-2 4 1.4v2.6a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z', 1.7)],
    search: [20, '<circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/>' + line('m14 14 4 4', 1.8)],
    upload: [24, line('M12 16V5m0 0-4.5 4.5M12 5l4.5 4.5', 1.8) + line('M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3', 1.8)]
  };

  MANN.iconNames = Object.keys(ICONS);

  // size sets width and height for icons that CSS does not size
  MANN.icon = (name, size) => {
    const [box, shapes] = ICONS[name];
    const dims = size ? ` width="${size}" height="${size}"` : '';
    return `<svg viewBox="0 0 ${box} ${box}"${dims} aria-hidden="true">${shapes}</svg>`;
  };

  customElements.define('mann-icon', class extends HTMLElement {
    connectedCallback() {
      this.innerHTML = MANN.icon(this.getAttribute('name'), this.getAttribute('size'));
    }
  });
})();
