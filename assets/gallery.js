(() => {
  'use strict';
  const modal = document.querySelector('.photo-dialog');
  const modalImage = modal?.querySelector('.photo-dialog-image');
  const modalCount = modal?.querySelector('.photo-dialog-count');
  const closeButton = modal?.querySelector('[data-photo-close]');
  let activeGallery = null;
  let returnFocus = null;
  let previousOverflow = '';

  function swipe(surface, change) {
    let start = null;
    let suppressUntil = 0;
    const pointers = new Set();
    const isZoomed = () => (globalThis.visualViewport?.scale ?? 1) > 1.01;
    surface.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch') return;
      pointers.add(event.pointerId);
      if (pointers.size !== 1 || event.isPrimary === false || isZoomed()) {
        start = null;
        return;
      }
      start = { id: event.pointerId, x: event.clientX, y: event.clientY };
    });
    surface.addEventListener('pointercancel', event => {
      pointers.delete(event.pointerId);
      start = null;
    });
    surface.addEventListener('pointerup', event => {
      pointers.delete(event.pointerId);
      if (!start || start.id !== event.pointerId) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      start = null;
      if (pointers.size || isZoomed()) return;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        suppressUntil = Date.now() + 400;
        change(dx < 0 ? 1 : -1);
      }
    });
    surface.addEventListener('click', event => {
      if (Date.now() < suppressUntil) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  }

  document.querySelectorAll('.news-gallery').forEach(gallery => {
    const slides = Array.from(gallery.querySelectorAll('.gallery-slide'));
    if (!slides.length) return;
    const dots = Array.from(gallery.querySelectorAll('[data-photo-index]'));
    const counter = gallery.querySelector('.gallery-count');
    const controls = gallery.querySelector('.gallery-controls');
    let index = 0;
    const countText = () => `${index + 1} / ${slides.length}`;
    function renderModal() {
      if (activeGallery !== api || !modal?.open) return;
      const source = slides[index].querySelector('img');
      modalImage.src = slides[index].href;
      modalImage.alt = source.alt;
      modalCount.textContent = countText();
      modal.querySelectorAll('[data-photo-step]').forEach(button => {
        button.hidden = slides.length < 2;
      });
    }
    function select(next) {
      index = ((next % slides.length) + slides.length) % slides.length;
      slides.forEach((slide, i) => { slide.hidden = i !== index; });
      dots.forEach((dot, i) => { dot.setAttribute('aria-pressed', String(i === index)); });
      if (counter) counter.textContent = countText();
      renderModal();
    }
    const api = { step: delta => select(index + delta) };
    gallery.querySelector('[data-photo-prev]')?.addEventListener('click', () => api.step(-1));
    gallery.querySelector('[data-photo-next]')?.addEventListener('click', () => api.step(1));
    dots.forEach((dot, i) => dot.addEventListener('click', () => select(i)));
    gallery.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        api.step(event.key === 'ArrowRight' ? 1 : -1);
      }
    });
    swipe(gallery.querySelector('.gallery-frame'), api.step);
    slides.forEach((slide, i) => slide.addEventListener('click', event => {
      if (!modal || typeof modal.showModal !== 'function' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      activeGallery = api;
      returnFocus = slide;
      select(i);
      previousOverflow = document.body.style.overflow;
      modal.showModal();
      document.body.style.overflow = 'hidden';
      renderModal();
      closeButton.focus();
    }));
    gallery.dataset.ready = 'true';
    if (controls) controls.hidden = slides.length < 2;
    select(0);
  });

  if (!modal) return;
  closeButton.addEventListener('click', () => modal.close());
  modal.querySelectorAll('[data-photo-step]').forEach(button => {
    button.addEventListener('click', () => activeGallery?.step(Number(button.dataset.photoStep)));
  });
  modal.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      activeGallery?.step(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  modal.addEventListener('click', event => { if (event.target === modal) modal.close(); });
  modal.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    if (returnFocus) {
      const gallery = returnFocus.closest('.news-gallery');
      (gallery?.querySelector('.gallery-slide:not([hidden])') || returnFocus).focus();
    }
    activeGallery = null;
  });
  swipe(modal.querySelector('.photo-dialog-stage'), delta => activeGallery?.step(delta));
})();
