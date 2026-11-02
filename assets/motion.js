(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || !('IntersectionObserver' in window)) return;
  const stories = [...document.querySelectorAll('.news-story')];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('reveal-waiting');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
  stories.forEach(story => {
    // Leave already visible stories and the collapsed archive immediately readable.
    if (story.closest('details:not([open])') || story.getBoundingClientRect().top < window.innerHeight) return;
    story.classList.add('reveal-ready', 'reveal-waiting');
    observer.observe(story);
  });
  const revealAll = () => {
    observer.disconnect();
    stories.forEach(story => story.classList.remove('reveal-waiting'));
  };
  reduced.addEventListener('change', event => { if (event.matches) revealAll(); });
  document.addEventListener('focusin', event => {
    const story = event.target.closest?.('.news-story');
    if (story) { story.classList.remove('reveal-waiting'); observer.unobserve(story); }
  });
  window.addEventListener('beforeprint', revealAll);
})();
