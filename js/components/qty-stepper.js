// Quantity stepper: minus, amount, plus and a unit. Used on product cards and in the product picker.
(function () {
  const { esc, icon } = MANN;

  MANN.unitOptions = selected => MANN.UNITS.map(u => `<option${u === selected ? ' selected' : ''}>${u}</option>`).join('');

  // value: {qty, unit}. The data-* attributes carry the product name so one listener can serve a whole grid.
  MANN.qtyStepper = (name, value, { remove = false } = {}) => {
    const n = esc(name);
    return `
      <div class="qstep">
        <button type="button" class="qbtn" data-dec="${n}" aria-label="Less ${n}">${icon('minus')}</button>
        <input type="number" inputmode="decimal" min="0" step="any" value="${esc(value.qty)}" data-qty="${n}" aria-label="${n} quantity">
        <button type="button" class="qbtn" data-inc="${n}" aria-label="More ${n}">${icon('plus')}</button>
        <select data-unit="${n}" aria-label="${n} unit">${MANN.unitOptions(value.unit)}</select>
        ${remove ? `<button type="button" class="rm" data-key="${n}" aria-label="Remove ${n}">${icon('close-small')}</button>` : ''}
      </div>`;
  };

  // the amount after one tap of + (direction 1) or - (direction -1)
  MANN.stepQty = (value, direction) => {
    const next = (parseFloat(value.qty) || 0) + direction * (MANN.QTY_STEP[value.unit] || 1);
    return Math.round(next * 100) / 100;
  };
})();
