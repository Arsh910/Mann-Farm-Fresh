// Namespace, small helpers and site-wide facts. Loaded first on every page;
// every other script adds to window.MANN.
window.MANN = {
  $: id => document.getElementById(id),
  esc: s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])),
  plural: (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`,

  PHONE: { href: 'tel:+919872178832', html: '+91&nbsp;98721&nbsp;78832', text: '+91 98721 78832' },
  HOURS: 'Mon to Sat, 7am to 7pm',

  isHome: () => document.body.dataset.page === 'home',
  // a home-page section: "#how" on the home page, "index.html#how" everywhere else
  link: hash => (MANN.isHome() ? hash : 'index.html' + hash),
  orderLink: () => (MANN.isHome() ? '#quote' : 'index.html?mode=order#quote')
};
