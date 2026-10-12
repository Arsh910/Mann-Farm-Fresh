// Steps 1 and 2 of the quote form. The list comes from three sources: pasted text,
// an uploaded photo or file, and products picked in the dialog. Step 2 shows them as quantity rows.
(function () {
  const { $, esc, plural, icon } = MANN;
  const NOT_LISTED = 'Not in our list · our team will check';
  const textInput = $('listInput'), fileInput = $('fileIn'), dropZone = $('dropZone'), rowsEl = $('parsed');

  const picked = new Map(); // key -> {name, hi, sub, ok, qty, unit}
  let memo = {};            // row key -> {qty, unit} as edited in step 2
  let rows = [];

  const uploadMode = () => !$('tabUpload').hidden;
  const hasFile = () => uploadMode() && fileInput.files.length > 0;
  const textLines = () => textInput.value.split(/\n|,/).map(x => x.trim()).filter(Boolean);

  // pasted lines first, then picked products the text did not already cover
  function buildRows() {
    const out = [];
    if (!uploadMode()) MANN.parseList(textInput.value).forEach((line, index) => out.push({
      key: 't:' + line.line, source: 'text', index, ok: !!line.name,
      name: line.name || line.line.replace(/\d+(?:\.\d+)?\s*[a-zA-Z]*/, '').trim() || line.line,
      from: line.name ? `from “${line.line}”` : NOT_LISTED,
      qty: line.qty, unit: line.unit
    }));
    picked.forEach((choice, key) => {
      if (out.some(row => row.ok && row.name === choice.name)) return;
      out.push({
        key: 'p:' + key, source: 'pick', pickKey: key, ok: choice.ok, name: choice.name,
        from: choice.ok ? choice.hi || choice.sub : NOT_LISTED,
        qty: choice.qty || '', unit: choice.unit || 'kg'
      });
    });
    out.forEach(row => { const edit = memo[row.key]; if (edit) { row.qty = edit.qty; row.unit = edit.unit; } });
    return out;
  }

  // ---------- step 1: paste ----------
  function updateLineCount() {
    const lines = MANN.parseList(textInput.value), matched = lines.filter(l => l.name).length, unknown = lines.length - matched;
    $('lineCount').textContent = lines.length ? `${matched} matched${unknown ? ` · ${unknown} to check` : ''}` : 'Start typing above';
  }
  textInput.addEventListener('input', updateLineCount);
  $('clearList').addEventListener('click', () => { textInput.value = ''; updateLineCount(); textInput.focus(); });
  updateLineCount();

  const tabs = document.querySelectorAll('#wz1 .tabs button');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => t.setAttribute('aria-selected', t === tab));
    const upload = tab.dataset.tab === 'upload';
    $('tabPaste').hidden = upload;
    $('tabUpload').hidden = !upload;
  }));

  // ---------- step 1: upload ----------
  let thumbUrl = '';
  const fileSize = bytes => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

  // swaps the drop zone for a card describing the attached file
  function showFile() {
    const file = fileInput.files[0];
    if (thumbUrl) { URL.revokeObjectURL(thumbUrl); thumbUrl = ''; }
    dropZone.hidden = !!file;
    $('fileCard').hidden = !file;
    if (!file) return;
    const thumb = $('fcThumb');
    if (file.type.startsWith('image/')) {
      thumbUrl = URL.createObjectURL(file);
      thumb.style.backgroundImage = `url("${thumbUrl}")`;
      thumb.textContent = '';
    } else {
      thumb.style.backgroundImage = '';
      thumb.textContent = (file.name.split('.').pop() || 'FILE').toUpperCase().slice(0, 4);
    }
    $('fileName').textContent = file.name;
    $('fileMeta').innerHTML = `${icon('check')}<span>Attached · ${fileSize(file.size)}</span>`;
  }
  function clearFile() { fileInput.value = ''; showFile(); }

  fileInput.addEventListener('change', showFile);
  $('fileChange').addEventListener('click', () => fileInput.click());
  $('fileRemove').addEventListener('click', () => { clearFile(); fileInput.focus(); });
  ['dragenter', 'dragover'].forEach(type => dropZone.addEventListener(type, e => { e.preventDefault(); dropZone.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(type => dropZone.addEventListener(type, e => { e.preventDefault(); dropZone.classList.remove('over'); }));
  dropZone.addEventListener('drop', e => {
    if (!e.dataTransfer.files.length) return;
    const one = new DataTransfer();
    one.items.add(e.dataTransfer.files[0]);
    fileInput.files = one.files;
    fileInput.dispatchEvent(new Event('change'));
  });

  // ---------- step 1: picked products ----------
  function renderPicked() {
    $('picked').hidden = !picked.size;
    $('pickedCount').textContent = `${plural(picked.size, 'product')} picked`;
    $('pickedChips').innerHTML = [...picked].map(([key, choice]) => `
      <span class="pchip${choice.ok ? '' : ' bad'}">${esc(choice.name)}${choice.qty ? ` · ${esc(choice.qty)} ${esc(choice.unit)}` : ''}<button type="button" data-unpick="${esc(key)}" aria-label="Remove ${esc(choice.name)}">${icon('close-small')}</button></span>`).join('');
  }
  $('pickedChips').addEventListener('click', e => {
    const button = e.target.closest('button[data-unpick]');
    if (!button) return;
    picked.delete(button.dataset.unpick);
    renderPicked();
  });

  // products added on the catalogue or product pages land in the form
  const basket = MANN.basket.read();
  if (Object.keys(basket).length) {
    for (const [name, { qty, unit }] of Object.entries(basket)) {
      const item = MANN.ITEMS.find(i => i.name === name);
      if (item) picked.set(name, { name, hi: item.hi, sub: item.sub, ok: true, qty, unit });
    }
    MANN.basket.clear();
    renderPicked();
  }

  const picker = MANN.productPicker({
    picked,
    onEdit: name => { delete memo['p:' + name]; },
    onClose: () => { renderPicked(); if (!$('wz2').hidden) renderRows(); }
  });
  $('openPicker').addEventListener('click', picker.open);
  $('editPicked').addEventListener('click', picker.open);
  // "Products" in the header and menu: jump to the form, and open the picker if step 1 is showing
  document.querySelectorAll('[data-picker]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    MANN.menu.close();
    $('quote').scrollIntoView({ block: 'start' });
    if (!$('wz1').hidden) picker.open();
  }));

  // ---------- step 2: quantities ----------
  const rowHTML = row => `
    <div class="prow ${row.ok ? 'ok' : 'bad'}" data-key="${esc(row.key)}">
      <span class="pi" aria-hidden="true">${row.ok ? icon('check') : '!'}</span>
      <div class="nm">${esc(row.name)}<small>${esc(row.from)}</small></div>
      <div class="qty">
        <input name="qty" autocomplete="off" aria-label="Quantity of ${esc(row.name)}" value="${esc(row.qty)}" inputmode="decimal" placeholder="Qty">
        <select name="unit" aria-label="Unit for ${esc(row.name)}">${MANN.unitOptions(row.unit)}</select>
      </div>
      <button type="button" class="rm" aria-label="Remove ${esc(row.name)}">${icon('close-small')}</button>
    </div>`;

  function renderRows() {
    rows = buildRows();
    rowsEl.innerHTML = rows.map(rowHTML).join('');
    $('count').textContent = rows.length ? `${plural(rows.length, 'item')} in your list` : 'No items yet';
    const note = $('fileNote');
    note.hidden = !hasFile();
    if (hasFile()) note.innerHTML = `<span>📎</span><span>We'll read <b>${esc(fileInput.files[0].name)}</b> and confirm the items and quantities with you.</span>`;
    $('wzErr2').textContent = '';
  }

  const rememberRow = rowEl => { memo[rowEl.dataset.key] = { qty: rowEl.querySelector('input').value.trim(), unit: rowEl.querySelector('select').value }; };
  rowsEl.addEventListener('input', e => {
    const rowEl = e.target.closest('.prow');
    if (!rowEl) return;
    rememberRow(rowEl);
    const qty = rowEl.querySelector('input');
    if (rowEl.classList.contains('missing') && parseFloat(qty.value) > 0) { rowEl.classList.remove('missing'); qty.removeAttribute('aria-invalid'); }
  });
  rowsEl.addEventListener('change', e => { const rowEl = e.target.closest('.prow'); if (rowEl) rememberRow(rowEl); });
  // removing a row removes it from wherever it came from
  rowsEl.addEventListener('click', e => {
    const button = e.target.closest('.rm');
    const row = button && rows.find(r => r.key === button.closest('.prow').dataset.key);
    if (!row) return;
    if (row.source === 'text') {
      const lines = textLines();
      lines.splice(row.index, 1);
      textInput.value = lines.join('\n');
      updateLineCount();
    } else {
      picked.delete(row.pickKey);
      renderPicked();
    }
    delete memo[row.key];
    renderRows();
  });

  MANN.quoteList = {
    rows: () => rows,
    renderRows,
    uploadMode,
    isEmpty: () => !buildRows().length && !hasFile(),
    fileName: () => (hasFile() ? fileInput.files[0].name : ''),
    // marks every row that has no quantity and returns those rows
    missingRows() {
      const missing = [...rowsEl.querySelectorAll('.prow')].filter(rowEl => !(parseFloat(rowEl.querySelector('input').value) > 0));
      missing.forEach(rowEl => { rowEl.classList.add('missing'); rowEl.querySelector('input').setAttribute('aria-invalid', 'true'); });
      return missing;
    },
    reset() {
      textInput.value = '';
      updateLineCount();
      picked.clear();
      memo = {};
      clearFile();
      renderPicked();
    }
  };
})();
