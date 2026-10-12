// Step 3 of the quote form: check the delivery area, then ask for contact details.
(function () {
  const { $, esc } = MANN;
  const CHECK_MS = 700; // prototype: stands in for the network request
  const input = $('fitInput'), button = $('fitBtn'), out = $('fitResult');
  let timer = 0, checkedFor = '', area = '';

  function foundHTML(place, route) {
    const next = MANN.nextDelivery(route);
    return `
      <div class="res-card res-line">
        <p class="status ok">Yes, we can deliver to ${esc(place)}</p>
        <button type="button" class="res-more" aria-expanded="false" aria-controls="fitDetails">See details</button>
      </div>
      ${next ? `<p class="res-when">Next delivery ${next.label} · flexible time slot · order by ${next.orderBy}</p>` : ''}
      <div id="fitDetails" hidden>
        <dl>
          <dt>Route</dt><dd>${route.area}</dd>
          <dt>Order by</dt><dd>${route.cut}</dd>
          <dt>Time slot</dt><dd>Flexible, you choose (usually ${route.win})</dd>
          <dt>Days</dt><dd>${route.days}</dd>
          <dt>Minimum order</dt><dd>${route.min}</dd>
        </dl>
        <p class="fine">Sample route rules for the prototype.</p>
      </div>`;
  }

  // the contact fields and the send button appear once an area has been checked
  function showResult(place) {
    const route = MANN.findRoute(place);
    area = route ? `${route.area} · ${place}` : place;
    checkedFor = place;
    out.className = 'result';
    out.innerHTML = route ? foundHTML(place, route) : `
      <div class="res-card warn">
        <p class="status warn">No fixed route to ${esc(place)} yet</p>
        <p class="hint">You can still send your list. Our team will confirm delivery within 2 working hours.</p>
      </div>`;
    const more = out.querySelector('.res-more');
    if (more) more.addEventListener('click', () => {
      const open = more.getAttribute('aria-expanded') !== 'true';
      more.setAttribute('aria-expanded', open);
      more.textContent = open ? 'Hide details' : 'See details';
      $('fitDetails').hidden = !open;
    });
    $('contactBlock').hidden = false;
    $('reviewBtn').hidden = false;
    $('fitChips').hidden = true;
  }

  function check(place) {
    place = place.trim();
    clearTimeout(timer);
    if (!place) {
      out.className = 'result';
      out.innerHTML = '<p class="hint">Enter a pincode or city above, then tap <b>Check</b>.</p>';
      input.focus();
      return;
    }
    button.classList.add('loading');
    button.setAttribute('aria-busy', 'true');
    out.className = 'result checking';
    out.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>Checking delivery to <b>${esc(place)}</b>…</span>`;
    timer = setTimeout(() => {
      button.classList.remove('loading');
      button.removeAttribute('aria-busy');
      showResult(place);
    }, CHECK_MS);
  }

  $('fitForm').addEventListener('submit', e => { e.preventDefault(); check(input.value); });
  // editing the field after a check greys out the old result
  input.addEventListener('input', () => {
    if (checkedFor && !out.classList.contains('checking')) out.classList.toggle('stale', input.value.trim() !== checkedFor);
  });
  document.querySelectorAll('#fitChips .chip').forEach(chip => chip.addEventListener('click', () => { input.value = chip.textContent; check(chip.textContent); }));

  MANN.quoteDelivery = {
    // what the summary shows: the checked route, or whatever was typed
    area() {
      const typed = input.value.trim();
      return (typed === checkedFor ? area : typed) || 'To confirm';
    }
  };
})();
