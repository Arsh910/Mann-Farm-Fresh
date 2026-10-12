// Category list, search and result count shared by the catalogue page and the product picker.
// A category is 'All' or 'sub:' + the category name.
(function () {
  const { esc, plural } = MANN;

  MANN.catalogueFilter = {
    // side navigation: "All produce", then every category under its group heading
    navHTML(category, searching) {
      const button = (key, label, count, cls = '') =>
        `<button type="button" class="${cls}" data-g="${esc(key)}" aria-pressed="${!searching && category === key}">${esc(label)}<small>${count}</small></button>`;
      let html = button('All', 'All produce', MANN.ITEMS.length, 'all');
      for (const [group, subs] of Object.entries(MANN.PRODUCTS)) {
        html += `<h5>${esc(group)}</h5>`;
        for (const sub of Object.keys(subs)) html += button('sub:' + sub, sub, subs[sub].length);
      }
      return html;
    },

    // a search looks across every category and also matches Hindi names
    items(query, category) {
      const q = query.toLowerCase();
      if (q) return MANN.ITEMS.filter(i => i.aliases.some(a => a.includes(q)) || i.sub.toLowerCase().includes(q));
      return MANN.ITEMS.filter(i => category === 'All' || i.sub === category.slice(4));
    },

    countText(count, query, category) {
      if (query) return count ? `${count} match${count === 1 ? '' : 'es'} for “${query}”` : `No match for “${query}”`;
      return plural(count, 'product') + (category === 'All' ? '' : ` in ${category.slice(4)}`);
    }
  };
})();
