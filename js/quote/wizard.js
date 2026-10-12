// The quote form as a whole: moving between its four steps, the new/existing customer modes,
// sending the request and the "sent" summary dialog.
(function () {
  const { $, esc, plural, icon } = MANN;
  const list = MANN.quoteList, delivery = MANN.quoteDelivery;
  const SEND_MS = 900; // prototype: stands in for the network request
  const wizard = $('listTool'), stepNote = $('wzErr1'), sendBtn = $('reviewBtn'), sent = $('sentDetails');

  // ---------- copy for the two modes: new customers get a quote, existing customers place an order ----------
  const MODES = {
    quote: {
      note: 'Free quote · no commitment',
      title: 'What do you need?',
      hint: 'Please check every amount and unit. This is the list we will price.',
      send: 'Send for quote',
      steps: 'Quote request steps',
      reach: 'How can we reach you?',
      business: 'Business name <small class="muted">(optional)</small>',
      done: 'Request received',
      message: 'Thank you. Your quote is on its way.',
      next: [
        'We check your list and delivery route.',
        'Within 2 working hours you get a quote with grade, price and delivery slot.',
        'Approve it on WhatsApp and we deliver in the time slot you choose.'
      ],
      sentTitle: 'Your quote request',
      sentHint: 'This is a quote request, not an order. Prototype only: nothing has been sent.',
      reference: 'MFF-Q'
    },
    order: {
      note: 'For existing customers',
      title: 'What would you like to order?',
      hint: 'Please check every amount and unit. This is the list we will deliver.',
      send: 'Place order',
      steps: 'Order steps',
      reach: 'Which account is this for?',
      business: 'Business name',
      done: 'Order received',
      message: 'Thank you. Your order is with our team.',
      next: [
        'We check your order against your account and delivery route.',
        'We confirm the items, quantities and time slot with you on WhatsApp or a call.',
        'Your order is packed and delivered in the time slot you choose.'
      ],
      sentTitle: 'Your order',
      sentHint: 'Prototype only: nothing has been sent. Our team confirms every order with you.',
      reference: 'MFF-O'
    }
  };
  let mode = 'quote';

  function setMode(name) {
    if (!MODES[name] || (name === mode && wizard.dataset.mode === name)) return;
    if (!$('wz4').hidden) restart(); // a finished request starts fresh in the other mode
    mode = name;
    const copy = MODES[name];
    wizard.dataset.mode = name;
    wizard.querySelectorAll('.mode button').forEach(b => b.setAttribute('aria-selected', b.dataset.mode === name));
    if (!stepNote.classList.contains('is-err')) stepNote.textContent = copy.note;
    $('wz1Title').textContent = copy.title;
    $('listHint').textContent = copy.hint;
    $('reachTitle').textContent = copy.reach;
    $('bizLabel').innerHTML = copy.business;
    $('stepper').setAttribute('aria-label', copy.steps);
    $('doneTitle').textContent = copy.done;
    $('doneMsg').textContent = copy.message;
    $('doneNext').innerHTML = copy.next.map((text, i) => `<li><b>${i + 1}</b>${text}</li>`).join('');
    $('sentTitle').textContent = copy.sentTitle;
    $('sentHint').textContent = copy.sentHint;
    if (!sendBtn.classList.contains('loading')) sendBtn.querySelector('.send-txt').textContent = copy.send;
    $('bizErr').hidden = true;
    $('bizName').setAttribute('aria-invalid', 'false');
  }
  wizard.querySelector('.mode').addEventListener('click', e => { const b = e.target.closest('button[data-mode]'); if (b) setMode(b.dataset.mode); });
  // "Get a quote" and "Place order" links anywhere on the page switch the mode too
  document.querySelectorAll('[data-mode-link]').forEach(a => a.addEventListener('click', () => setMode(a.dataset.modeLink)));
  if (new URLSearchParams(location.search).get('mode') === 'order') setMode('order');

  // ---------- moving between steps ----------
  function go(step) {
    [1, 2, 3, 4].forEach(i => { $('wz' + i).hidden = i !== step; });
    document.querySelectorAll('.stepper li').forEach(li => {
      const i = +li.dataset.s;
      li.classList.toggle('done', i < step);
      if (i === step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      li.querySelector('.dot').innerHTML = i < step ? icon('check') : String(i);
    });
    // bring the top of the form back into view if it has scrolled under the header
    if (wizard.getBoundingClientRect().top < 0) {
      if (window.lenis) window.lenis.scrollTo(wizard, { offset: -($('siteHeader').offsetHeight + 12) });
      else wizard.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
    $('wz' + step).querySelector('h3').focus({ preventScroll: true });
  }

  const showError = (el, text) => { el.textContent = text; el.classList.add('is-err'); };
  const clearStepNote = () => { stepNote.textContent = MODES[mode].note; stepNote.classList.remove('is-err'); };

  $('wzNext').addEventListener('click', () => {
    if (list.isEmpty()) {
      showError(stepNote, list.uploadMode() ? 'Attach a photo or file, or search products to continue' : 'Add at least one item to continue');
      return;
    }
    clearStepNote();
    list.renderRows();
    go(2);
  });
  // attaching a file answers the "add at least one item" error
  $('fileIn').addEventListener('change', () => { if ($('fileIn').files.length && stepNote.classList.contains('is-err')) clearStepNote(); });

  $('addMore').addEventListener('click', () => go(1));
  $('wzBack2').addEventListener('click', () => go(1));
  $('wzNext2').addEventListener('click', () => {
    const missing = list.missingRows(), error = $('wzErr2');
    if (!list.rows().length && !list.fileName()) { showError(error, 'Your list is empty'); return; }
    if (missing.length) {
      showError(error, `Add a quantity for ${plural(missing.length, 'item')}`);
      missing[0].querySelector('input').focus();
      return;
    }
    error.textContent = '';
    go(3);
  });
  $('wzBack3').addEventListener('click', () => go(2));

  // ---------- sending ----------
  const clearOnInput = (field, error) => field.addEventListener('input', () => {
    if (field.getAttribute('aria-invalid') === 'true') { field.setAttribute('aria-invalid', 'false'); error.hidden = true; }
  });
  clearOnInput($('bizPhone'), $('phoneErr'));
  clearOnInput($('bizName'), $('bizErr'));

  function fillSummary(phone) {
    const rows = list.rows(), file = list.fileName(), business = $('bizName').value.trim();
    $('refNo').textContent = MODES[mode].reference + (1000 + Math.floor(Math.random() * 9000));
    $('sumItems').textContent = [rows.length ? plural(rows.length, 'item') : '', file].filter(Boolean).join(' + ');
    $('sumArea').textContent = delivery.area();
    $('sumPhone').textContent = (business ? business + ' · ' : '') + phone.replace(/(\d{5})(\d{5})/, '$1 $2');
    $('sentItems').innerHTML = rows.map(r => `<li${r.ok ? '' : ' class="flag"'}><span>${esc(r.name)}</span><span>${esc(r.qty)} ${esc(r.unit)}</span></li>`).join('')
      + (file ? `<li><span>📎 ${esc(file)}</span><span>We'll read it</span></li>` : '');
  }

  sendBtn.addEventListener('click', () => {
    const phoneField = $('bizPhone'), businessField = $('bizName');
    const phone = phoneField.value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    const badPhone = phone.length !== 10;
    phoneField.setAttribute('aria-invalid', badPhone);
    $('phoneErr').hidden = !badPhone;
    // an order needs the business name so the account can be found
    if (mode === 'order' && !businessField.value.trim()) {
      businessField.setAttribute('aria-invalid', 'true');
      $('bizErr').hidden = false;
      businessField.focus();
      return;
    }
    if (badPhone) { phoneField.focus(); return; }
    if (sendBtn.classList.contains('loading')) return;

    // the button shows progress and cannot be pressed twice
    const label = sendBtn.querySelector('.send-txt');
    sendBtn.classList.add('loading');
    sendBtn.setAttribute('aria-busy', 'true');
    label.textContent = 'Sending…';
    $('wzBack3').disabled = true;
    setTimeout(() => {
      sendBtn.classList.remove('loading');
      sendBtn.removeAttribute('aria-busy');
      label.textContent = MODES[mode].send;
      $('wzBack3').disabled = false;
      fillSummary(phone);
      go(4);
    }, SEND_MS);
  });

  // ---------- sent summary dialog ----------
  function restart() {
    list.reset();
    if (sent.open) sent.close();
    go(1);
  }
  $('seeDetails').addEventListener('click', () => sent.showModal());
  $('sentClose').addEventListener('click', () => sent.close());
  $('sentDone').addEventListener('click', () => sent.close());
  sent.addEventListener('click', e => { if (e.target === sent) sent.close(); });
  $('wzRestart').addEventListener('click', restart);
})();
