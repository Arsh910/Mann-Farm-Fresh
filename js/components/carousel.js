// "Who we supply" carousel: arrow buttons, a progress bar and an "03 / 06" counter
// on top of a native horizontal scroller.
(function () {
  const { $ } = MANN;
  const track = $('buyerTrack'), cards = [...track.children], prev = $('carPrev'), next = $('carNext');
  const cardStep = () => cards[1].offsetLeft - cards[0].offsetLeft;
  const pad = n => String(n).padStart(2, '0');
  let queued = false;

  function update() {
    queued = false;
    const max = track.scrollWidth - track.clientWidth, x = track.scrollLeft;
    const perView = Math.max(1, Math.round(track.clientWidth / cardStep()));
    const first = Math.min(cards.length - perView, Math.round(x / cardStep()));
    const lastShown = first + perView;
    prev.disabled = x <= 4;
    next.disabled = x >= max - 4;
    $('carBar').style.width = (max > 0 ? Math.max(perView / cards.length, lastShown / cards.length) : 1) * 100 + '%';
    $('carCount').textContent = `${pad(Math.min(cards.length, lastShown))} / ${pad(cards.length)}`;
  }

  track.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', () => requestAnimationFrame(update));
  prev.addEventListener('click', () => track.scrollBy({ left: -cardStep(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: cardStep(), behavior: 'smooth' }));
  update();
})();
