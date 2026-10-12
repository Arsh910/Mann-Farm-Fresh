// The "Add products" dialog: browse or search the catalogue, add products and set quantities.
// It edits the `picked` map it is given: key -> {name, hi, sub, ok, qty, unit}.
(function () {
  const { $, esc, plural, icon } = MANN;

  // onEdit(name) runs when a product's quantity or unit changes; onClose() when the dialog closes
  MANN.productPicker = function ({ picked, onEdit, onClose }) {
    const dialog = $('picker'), search = $('catSearch'), side = $('catTabs'), grid = $('catGrid');
    const filter = MANN.catalogueFilter;
    let category = 'All';

    const showCount = () => { $('pkCount').textContent = picked.size ? `${plural(picked.size, 'product')} selected` : 'Nothing selected yet'; };

    function productRow(item) {
      const choice = picked.get(item.name);
      const name = `<span class="nm">${esc(item.name)}<small>${esc(item.hi || item.sub)}</small></span>`;
      if (choice) return `<div class="prod on">${name}${MANN.qtyStepper(item.name, choice, { remove: true })}</div>`;
      return `<div class="prod">${name}<button type="button" class="add" data-key="${esc(item.name)}" aria-label="Add ${esc(item.name)}">${icon('plus')}Add</button></div>`;
    }

    // a search with no match can still be added; the team looks into it
    function missingRow(query) {
      const added = picked.has('raw:' + query.toLowerCase());
      const note = added ? 'Added. Our team will look into it.' : "Don't worry, add it anyway and we'll look into it for you.";
      return `
        <div class="prod prod-missing${added ? ' on' : ''}">
          <span class="nm">“${esc(query)}” not found<small>${note}</small></span>
          <button type="button" data-raw="${esc(query)}" class="${added ? 'added' : ''}" aria-pressed="${added}" aria-label="${added ? 'Remove' : 'Add'} ${esc(query)}">${icon(added ? 'check' : 'plus')}</button>
        </div>`;
    }

    function render() {
      const query = search.value.trim();
      const items = filter.items(query, category);
      side.innerHTML = filter.navHTML(category, !!query);
      $('catCount').textContent = filter.countText(items.length, query, category);
      grid.innerHTML = items.map(productRow).join('') + (query && !items.length ? missingRow(query) : '');
      showCount();
    }

    // add or remove a product (data-key) or an unlisted search term (data-raw)
    function toggle(button) {
      const name = button.dataset.key;
      if (button.dataset.raw !== undefined) {
        const raw = button.dataset.raw, key = 'raw:' + raw.toLowerCase();
        if (picked.has(key)) picked.delete(key); else picked.set(key, { name: raw, ok: false });
      } else {
        const item = MANN.ITEMS.find(i => i.name === name);
        if (picked.has(name)) picked.delete(name);
        else picked.set(name, { name, hi: item.hi, sub: item.sub, ok: true, qty: '1', unit: 'kg' });
        onEdit(name);
      }
      render();
      const qty = name && grid.querySelector(`input[data-qty="${CSS.escape(name)}"]`);
      if (qty) { qty.focus(); qty.select(); }
    }

    grid.addEventListener('click', e => {
      const step = e.target.closest('button[data-inc],button[data-dec]');
      if (step) {
        const name = step.dataset.inc || step.dataset.dec, choice = picked.get(name);
        if (!choice) return;
        const next = MANN.stepQty(choice, step.dataset.inc ? 1 : -1);
        onEdit(name);
        if (next <= 0) { picked.delete(name); render(); return; }
        choice.qty = String(next);
        step.parentElement.querySelector('input').value = choice.qty;
        showCount();
        return;
      }
      const button = e.target.closest('button[data-key],button[data-raw]');
      if (button) toggle(button);
    });
    grid.addEventListener('input', e => {
      const qty = e.target.closest('input[data-qty]'), choice = qty && picked.get(qty.dataset.qty);
      if (choice) { choice.qty = qty.value.trim(); onEdit(qty.dataset.qty); }
    });
    grid.addEventListener('change', e => {
      const unit = e.target.closest('select[data-unit]'), choice = unit && picked.get(unit.dataset.unit);
      if (choice) { choice.unit = unit.value; onEdit(unit.dataset.unit); }
    });

    side.addEventListener('click', e => {
      const button = e.target.closest('button');
      if (!button) return;
      category = button.dataset.g;
      search.value = '';
      render();
      grid.closest('.pk-body').scrollTop = 0;
    });
    search.addEventListener('input', render);
    // Enter adds the first result
    search.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const first = grid.querySelector('button.add,button[data-raw][aria-pressed="false"]');
      if (first) toggle(first);
    });

    $('pickerClose').addEventListener('click', () => dialog.close());
    $('pickerDone').addEventListener('click', () => dialog.close());
    // a click on the backdrop lands on the dialog element itself
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', onClose);

    return {
      open() {
        search.value = '';
        category = 'All';
        render();
        dialog.showModal();
        search.focus();
      }
    };
  };
})();
