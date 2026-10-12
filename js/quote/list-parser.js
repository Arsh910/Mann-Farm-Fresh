// Turns a pasted buying list such as "aloo 50 kg" into lines matched against the catalogue.
(function () {
  const UNIT_WORDS = {
    kg: 'kg', kgs: 'kg', kilo: 'kg',
    g: 'g', gm: 'g', gms: 'g', gram: 'g', grams: 'g',
    dozen: 'dozen', dz: 'dozen',
    pc: 'pcs', pcs: 'pcs', piece: 'pcs', pieces: 'pcs',
    crate: 'crate', crates: 'crate', box: 'box',
    bunch: 'bunch', gaddi: 'bunch'
  };

  // the longest name or alias found in the line wins, so "baby aloo" beats "aloo"
  function matchProduct(text) {
    text = text.toLowerCase();
    let best = null, length = 0;
    for (const item of MANN.ITEMS)
      for (const alias of item.aliases)
        if (text.includes(alias) && alias.length > length) { best = item.name; length = alias.length; }
    return best;
  }

  // one result per line: {line, name (null when not in the catalogue), qty, unit}
  MANN.parseList = raw => raw.split(/\n|,/).map(s => s.trim()).filter(Boolean).map(line => {
    const amount = line.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?/);
    const unitWord = amount && amount[2] ? amount[2].toLowerCase() : '';
    return { line, name: matchProduct(line), qty: amount ? amount[1] : '', unit: UNIT_WORDS[unitWord] || 'kg' };
  });
})();
