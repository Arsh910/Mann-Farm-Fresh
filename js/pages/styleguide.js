// Component gallery: draws the token swatches, the icon set and the script-rendered components.
(function () {
  const { $, esc, icon } = MANN;
  const COLOURS = ['bg', 'white', 'soft', 'soft-2', 'line', 'line-strong', 'ink', 'forest', 'forest-2', 'leaf', 'muted',
    'accent', 'on-dark-2', 'on-dark-3', 'ok', 'warn', 'warn-bg', 'warn-line', 'tomato'];
  const RADII = ['r-sm', 'r', 'r-lg', 'r-pill'];

  // one swatch per token: the sample is styled through the token itself
  function swatches(box, tokens, property) {
    const root = getComputedStyle(document.documentElement);
    box.innerHTML = tokens.map(t => `<figure class="sg-swatch"><span></span><figcaption><b>--${t}</b><small>${esc(root.getPropertyValue('--' + t).trim())}</small></figcaption></figure>`).join('');
    box.querySelectorAll('span').forEach((sample, i) => { sample.style[property] = `var(--${tokens[i]})`; });
  }
  swatches($('sgColors'), COLOURS, 'background');
  swatches($('sgRadii'), RADII, 'borderRadius');

  $('sgIcons').innerHTML = MANN.iconNames.map(name => `<div class="sg-icon">${icon(name)}${name}</div>`).join('');

  const potato = MANN.ITEMS.find(i => i.name === 'Potato'), tomato = MANN.ITEMS.find(i => i.name === 'Tomato');
  const fiveKg = { qty: '5', unit: 'kg' };
  $('sgStepper').innerHTML = MANN.qtyStepper('Tomato', fiveKg);
  $('sgCards').innerHTML = MANN.productCard(potato, null) + MANN.productCard(tomato, fiveKg);

  const row = (cls, name, note, control) => `<div class="prod${cls}"><span class="nm">${name}<small>${note}</small></span>${control}</div>`;
  $('sgPickerRows').innerHTML =
    row('', 'Potato', 'aloo', `<button type="button" class="add">${icon('plus')}Add</button>`) +
    row(' on', 'Tomato', 'tamatar', MANN.qtyStepper('Tomato', fiveKg, { remove: true })) +
    row(' prod-missing', '“dragonfruit” not found', "Don't worry, add it anyway and we'll look into it for you.", `<button type="button" aria-label="Add dragonfruit">${icon('plus')}</button>`);
})();
