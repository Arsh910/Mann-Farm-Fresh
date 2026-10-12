// Catalogue page: categories on the left, search on top, a grid of product cards.
(function () {
  const { $ } = MANN;
  const filter = MANN.catalogueFilter;
  const grid = $('catalogue'), side = $('catSide'), search = $('catSearch');

  // products.html?c=Mushrooms opens on that category
  const preset = new URLSearchParams(location.search).get('c');
  let category = preset ? 'sub:' + preset : 'All';

  function render() {
    const query = search.value.trim();
    const items = filter.items(query, category);
    side.innerHTML = filter.navHTML(category, !!query);
    $('catCount').textContent = filter.countText(items.length, query, category)
      + (query && !items.length ? ". Add it on the quote form and we'll look into it." : '');
    grid.innerHTML = items.map(item => MANN.productCard(item)).join('');
  }

  side.addEventListener('click', e => {
    const button = e.target.closest('button');
    if (!button) return;
    category = button.dataset.g;
    search.value = '';
    render();
    grid.scrollIntoView({ block: 'nearest' });
  });
  search.addEventListener('input', render);
  MANN.wireBasketControls(grid, render);
  render();
})();
