// Shared page behaviour: delivery-time checker, catalogue, product page, quote basket
// and (on pages other than home) the phone menu. Data comes from data.js (window.MANN).
(function () {
  const M = window.MANN;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const PLUS = '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M9 3v12M3 9h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const MINUS = '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3 9h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const STEP = { kg: 1, g: 250, dozen: 1, pcs: 1, bunch: 1, crate: 1, box: 1 };
  const home = document.body.dataset.page === 'home';

  // ---------- phone menu (home has its own) ----------
  if (!home && $('mnav')) {
    const mnav = $('mnav'), mb = $('menuBtn');
    let t = 0;
    const open = () => { clearTimeout(t); mnav.hidden = false; mnav.offsetWidth; mnav.classList.add('open'); mb.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; $('menuClose').focus({ preventScroll: true }); };
    const close = () => { if (mnav.hidden) return; mnav.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; clearTimeout(t); t = setTimeout(() => { mnav.hidden = true; }, 420); };
    mb.addEventListener('click', open);
    $('menuClose').addEventListener('click', () => { close(); mb.focus(); });
    mnav.addEventListener('click', e => { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mnav.hidden) { close(); mb.focus(); } });
  }

  // highlight this page in the main menu
  if (!home) document.querySelectorAll('#mainNav a').forEach(a => { if (a.pathname === location.pathname) a.setAttribute('aria-current', 'true'); });

  // ---------- quote basket badge: "Your quote (3)" ----------
  function syncBasket() {
    const n = M.basket.count();
    document.querySelectorAll('[data-basket]').forEach(el => {
      el.hidden = !n;
      const c = el.querySelector('[data-basket-count]');
      if (c) c.textContent = n;
    });
  }
  syncBasket();
  addEventListener('storage', syncBasket);

  // ---------- delivery-time checker ----------
  function checkerResult(v) {
    const r = M.findRoute(v);
    if (!r) return `<div class="ck-res ck-no"><p class="status warn">No fixed route to ${esc(v)} yet</p><p>You can still send your list. Our team confirms delivery within 2 working hours, or call <a href="tel:+919872178832">+91 98721 78832</a>.</p></div>`;
    const n = M.nextDelivery(r);
    return `<div class="ck-res">
      <p class="status ok">Yes, we deliver to ${esc(v)}</p>
      <p class="ck-when">${n ? `Next delivery <b>${esc(n.label)}</b>` : 'Delivery on a schedule that suits you'}</p>
      <p class="ck-cut">${n ? `Order by ${esc(n.orderBy)} to make it. ` : ''}The time slot is flexible: you choose what suits your kitchen or store.</p>
      <dl class="ck-facts"><div><dt>Route</dt><dd>${esc(r.area)}</dd></div><div><dt>Delivery days</dt><dd>${esc(r.days)}</dd></div><div><dt>Time slot</dt><dd>Flexible, usually ${esc(r.win)}</dd></div><div><dt>Order cut-off</dt><dd>${esc(r.cut)}</dd></div><div><dt>Minimum order</dt><dd>${esc(r.min)}</dd></div></dl>
      <p class="fine">Sample route rules for the prototype.</p>
    </div>`;
  }
  document.querySelectorAll('[data-checker]').forEach(box => {
    const form = box.querySelector('form'), input = box.querySelector('input'), btn = box.querySelector('button[type="submit"]'), out = box.querySelector('.ck-out');
    let t = 0;
    const run = v => {
      v = v.trim();
      if (!v) { out.innerHTML = '<p class="hint">Enter a pincode or city, then tap <b>Check</b>.</p>'; input.focus(); return; }
      clearTimeout(t);
      btn.classList.add('loading'); btn.setAttribute('aria-busy', 'true');
      out.innerHTML = `<p class="ck-checking"><span class="spinner" aria-hidden="true"></span>Checking delivery to <b>${esc(v)}</b>…</p>`;
      t = setTimeout(() => { btn.classList.remove('loading'); btn.removeAttribute('aria-busy'); out.innerHTML = checkerResult(v); }, 600);
    };
    form.addEventListener('submit', e => { e.preventDefault(); run(input.value); });
    box.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => { input.value = c.textContent; run(c.textContent); }));
  });

  // ---------- shared product card with Add -> quantity stepper ----------
  function qtyHTML(i, q) {
    const opts = M.UNITS.map(u => `<option${u === q.unit ? ' selected' : ''}>${u}</option>`).join('');
    return `<div class="qstep"><button type="button" class="qbtn" data-dec="${esc(i.name)}" aria-label="Less ${esc(i.name)}">${MINUS}</button><input type="number" inputmode="decimal" min="0" step="any" value="${esc(q.qty)}" data-qty="${esc(i.name)}" aria-label="${esc(i.name)} quantity"><button type="button" class="qbtn" data-inc="${esc(i.name)}" aria-label="More ${esc(i.name)}">${PLUS}</button><select data-unit="${esc(i.name)}" aria-label="${esc(i.name)} unit">${opts}</select></div>`;
  }
  function cardHTML(i) {
    const q = M.basket.read()[i.name];
    return `<article class="pcard${q ? ' on' : ''}">
      <a class="pcard-img" href="product.html?p=${esc(i.slug)}" aria-label="${esc(i.name)} details"><span class="pcard-tag">${esc(i.sub)}</span><span class="pcard-mono" aria-hidden="true">${esc(i.name[0])}</span></a>
      <div class="pcard-body">
        <h3><a href="product.html?p=${esc(i.slug)}">${esc(i.name)}</a></h3>
        <p>${i.hi ? esc(i.hi) + ' · ' : ''}${esc(M.supplyFor(i))} · ${esc(M.packFor(i))}</p>
        ${q ? qtyHTML(i, q) : `<button type="button" class="add" data-add="${esc(i.name)}">${PLUS}Add to quote</button>`}
      </div>
    </article>`;
  }
  // one delegated handler for any grid of product cards
  function wireCards(root, rerender) {
    root.addEventListener('click', e => {
      const add = e.target.closest('[data-add]');
      if (add) { M.basket.set(add.dataset.add, 1, 'kg'); rerender(); syncBasket(); const qi = root.querySelector(`input[data-qty="${CSS.escape(add.dataset.add)}"]`); if (qi) { qi.focus(); qi.select(); } return; }
      const st = e.target.closest('[data-inc],[data-dec]');
      if (st) {
        const n = st.dataset.inc || st.dataset.dec, q = M.basket.read()[n]; if (!q) return;
        const v = (parseFloat(q.qty) || 0) + (st.dataset.inc ? 1 : -1) * (STEP[q.unit] || 1);
        M.basket.set(n, Math.round(v * 100) / 100, q.unit);
        if (v <= 0) rerender(); else st.parentElement.querySelector('input').value = Math.round(v * 100) / 100;
        syncBasket();
      }
    });
    root.addEventListener('change', e => {
      const i = e.target.closest('input[data-qty]'), u = e.target.closest('select[data-unit]');
      if (i) { const q = M.basket.read()[i.dataset.qty] || { unit: 'kg' }; M.basket.set(i.dataset.qty, parseFloat(i.value) || 0, q.unit); if (!(parseFloat(i.value) > 0)) rerender(); syncBasket(); }
      if (u) { const q = M.basket.read()[u.dataset.unit]; if (q) M.basket.set(u.dataset.unit, q.qty, u.value); }
    });
  }

  // ---------- catalogue page ----------
  const grid = $('catalogue');
  if (grid) {
    const side = $('catSide'), search = $('catSearch'), count = $('catCount');
    const params = new URLSearchParams(location.search);
    let cg = params.get('c') ? 'sub:' + params.get('c') : 'All';
    const sideHTML = q => {
      const btn = (key, label, n, cls = '') => `<button type="button" class="${cls}" data-g="${esc(key)}" aria-pressed="${!q && cg === key}">${esc(label)}<small>${n}</small></button>`;
      let h = btn('All', 'All produce', M.ITEMS.length, 'all');
      for (const [g, subs] of Object.entries(M.PRODUCTS)) { h += `<h5>${esc(g)}</h5>`; for (const sub of Object.keys(subs)) h += btn('sub:' + sub, sub, subs[sub].length); }
      return h;
    };
    const render = () => {
      const raw = search.value.trim(), q = raw.toLowerCase();
      side.innerHTML = sideHTML(q);
      const inCat = i => cg === 'All' || i.sub === cg.slice(4);
      const list = M.ITEMS.filter(i => q ? (i.aliases.some(a => a.includes(q)) || i.sub.toLowerCase().includes(q)) : inCat(i));
      count.textContent = q ? (list.length ? `${list.length} match${list.length === 1 ? '' : 'es'} for “${raw}”` : `No match for “${raw}”. Add it on the quote form and we'll look into it.`) : plural(list.length, 'product') + (cg === 'All' ? '' : ` in ${cg.slice(4)}`);
      grid.innerHTML = list.map(cardHTML).join('');
    };
    side.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; cg = b.dataset.g; search.value = ''; render(); grid.scrollIntoView({ block: 'nearest' }); });
    search.addEventListener('input', render);
    wireCards(grid, render);
    render();
  }

  // ---------- product page ----------
  const pp = $('productPage');
  if (pp) {
    const s = new URLSearchParams(location.search).get('p');
    const i = M.ITEMS.find(x => x.slug === s) || M.ITEMS.find(x => x.slug === 'tomato');
    document.title = `${i.name} · Mann Farm Fresh`;
    $('crumbName').textContent = i.name;
    $('pName').textContent = i.name;
    $('pSub').textContent = i.sub;
    $('pHi').textContent = i.hi ? `Also asked for as “${i.hi}”` : '';
    $('pMono').textContent = i.name[0];
    $('pTag').textContent = i.sub;
    $('pSupply').textContent = M.supplyFor(i);
    $('pPack').textContent = M.packFor(i) + (M.packFor(i) === 'Reusable crate' ? ' · custom bulk pack' : '');
    const cutOk = i.group === 'Vegetables' || i.group === 'Leafy and herbs';
    $('pForms').textContent = cutOk ? 'Whole, or prepared (cut), on request' : 'Whole';
    const box = $('pAdd');
    const renderAdd = () => {
      const q = M.basket.read()[i.name];
      box.innerHTML = q ? `<p class="p-added">In your quote</p>${qtyHTML(i, q)}` : `<button type="button" class="btn dark" data-add="${esc(i.name)}">Add to quote<i>${PLUS}</i></button>`;
    };
    wireCards(box, renderAdd);
    renderAdd();
    const rel = M.ITEMS.filter(x => x.sub === i.sub && x !== i).slice(0, 4);
    const rg = $('related');
    const renderRel = () => { rg.innerHTML = rel.map(cardHTML).join(''); };
    wireCards(rg, renderRel);
    renderRel();
    $('relLink').href = `products.html?c=${encodeURIComponent(i.sub)}`;
  }
})();
