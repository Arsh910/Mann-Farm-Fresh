// Product page: fills the template from product.html?p=<slug> and lists related products.
(function () {
  const { $, esc, icon } = MANN;
  const slug = new URLSearchParams(location.search).get('p');
  const item = MANN.ITEMS.find(i => i.slug === slug) || MANN.ITEMS.find(i => i.slug === 'tomato');
  const pack = MANN.packFor(item);
  const canBeCut = item.group === 'Vegetables' || item.group === 'Leafy and herbs';

  document.title = `${item.name} · Mann Farm Fresh`;
  $('crumbName').textContent = item.name;
  $('pName').textContent = item.name;
  $('pSub').textContent = item.sub;
  $('pTag').textContent = item.sub;
  $('pMono').textContent = item.name[0];
  $('pHi').textContent = item.hi ? `Also asked for as “${item.hi}”` : '';
  $('pSupply').textContent = MANN.supplyFor(item);
  $('pPack').textContent = pack + (pack === 'Reusable crate' ? ' · custom bulk pack' : '');
  $('pForms').textContent = canBeCut ? 'Whole, or prepared (cut), on request' : 'Whole';

  // "Add to quote" becomes a quantity stepper once the product is in the basket
  const addBox = $('pAdd');
  const renderAdd = () => {
    const inBasket = MANN.basket.read()[item.name];
    addBox.innerHTML = inBasket
      ? `<p class="p-added">In your quote</p>${MANN.qtyStepper(item.name, inBasket)}`
      : `<button type="button" class="btn dark" data-add="${esc(item.name)}">Add to quote<i>${icon('plus')}</i></button>`;
  };
  MANN.wireBasketControls(addBox, renderAdd);
  renderAdd();

  const related = MANN.ITEMS.filter(other => other.sub === item.sub && other !== item).slice(0, 4);
  const relatedGrid = $('related');
  const renderRelated = () => { relatedGrid.innerHTML = related.map(other => MANN.productCard(other)).join(''); };
  MANN.wireBasketControls(relatedGrid, renderRelated);
  renderRelated();
  $('relLink').href = `products.html?c=${encodeURIComponent(item.sub)}`;
})();
