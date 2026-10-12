// Photos show a soft shimmer until they arrive, then fade in (helps on slow connections).
document.querySelectorAll('main img, .mnav img').forEach(img => {
  if (img.complete && img.naturalWidth) return;
  img.classList.add('is-loading');
  img.addEventListener('load', () => {
    img.classList.remove('is-loading');
    // the hero photo has its own entrance animation
    if (!img.closest('.hero')) img.classList.add('is-loaded');
  }, { once: true });
  img.addEventListener('error', () => img.classList.remove('is-loading'), { once: true });
});
