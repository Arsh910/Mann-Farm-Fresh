// Product card with "Add to quote", which turns into a quantity stepper once added.
// Quantities live in the quote basket (MANN.basket), so they follow the buyer between pages.
(function () {
  const { esc, icon } = MANN;

  // inBasket: {qty, unit} when the product is already in the quote basket
  MANN.productCard = (item, inBasket = MANN.basket.read()[item.name]) => {
    const href = `product.html?p=${esc(item.slug)}`;
    const facts = [item.hi, MANN.supplyFor(item), MANN.packFor(item)].filter(Boolean).map(esc).join(' · ');
    return `
      <article class="pcard${inBasket ? ' on' : ''}">
        <a class="pcard-img" href="${href}" aria-label="${esc(item.name)} details">
          <span class="pcard-tag">${esc(item.sub)}</span>
          <span class="pcard-mono" aria-hidden="true">${esc(item.name[0])}</span>
        </a>
        <div class="pcard-body">
          <h3><a href="${href}">${esc(item.name)}</a></h3>
          <p>${facts}</p>
          ${inBasket ? MANN.qtyStepper(item.name, inBasket) : `<button type="button" class="add" data-add="${esc(item.name)}">${icon('plus')}Add to quote</button>`}
        </div>
      </article>`;
  };

  // One delegated listener for any container of add buttons and steppers.
  // rerender() redraws the container when an item is added or its quantity reaches zero.
  MANN.wireBasketControls = (root, rerender) => {
    const { basket } = MANN;

    root.addEventListener('click', e => {
      const add = e.target.closest('[data-add]');
      if (add) {
        basket.set(add.dataset.add, 1, 'kg');
        rerender();
        const qty = root.querySelector(`input[data-qty="${CSS.escape(add.dataset.add)}"]`);
        if (qty) { qty.focus(); qty.select(); }
        return;
      }
      const step = e.target.closest('[data-inc],[data-dec]');
      if (!step) return;
      const name = step.dataset.inc || step.dataset.dec, current = basket.read()[name];
      if (!current) return;
      const next = MANN.stepQty(current, step.dataset.inc ? 1 : -1);
      basket.set(name, next, current.unit);
      if (next <= 0) rerender();
      else step.parentElement.querySelector('input').value = next;
    });

    root.addEventListener('change', e => {
      const qty = e.target.closest('input[data-qty]'), unit = e.target.closest('select[data-unit]');
      if (qty) {
        const current = basket.read()[qty.dataset.qty] || { unit: 'kg' };
        const amount = parseFloat(qty.value) || 0;
        basket.set(qty.dataset.qty, amount, current.unit);
        if (!(amount > 0)) rerender();
      }
      if (unit) {
        const current = basket.read()[unit.dataset.unit];
        if (current) basket.set(unit.dataset.unit, current.qty, unit.value);
      }
    });
  };
})();
