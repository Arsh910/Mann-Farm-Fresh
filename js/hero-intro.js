// Runs in <head> on the home page: hides the hero for its entrance animation unless the viewer
// prefers reduced motion. If the animation libraries have not arrived after 1.5s, the hero is
// shown as it is.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('anim');
  setTimeout(() => { if (!window.gsap) document.documentElement.classList.remove('anim'); }, 1500);
}
