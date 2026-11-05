/* Project filter, search and media lightbox. Pages work without this file. */
(() => {
  'use strict';
  const filters = [...document.querySelectorAll('[data-filter]')];
  const search = document.querySelector('#project-search');
  const cards = [...document.querySelectorAll('[data-project]')];
  let category = 'All';
  const applyFilters = () => {
    const term = (search?.value || '').toLocaleLowerCase().trim();
    let count = 0;
    cards.forEach(card => {
      const visible = (category === 'All' || (card.dataset.categories || card.dataset.category).split('|').includes(category)) && card.dataset.search.includes(term);
      card.hidden = !visible;
      if (visible) count++;
    });
    const result = document.querySelector('#result-count');
    if (result) result.textContent = `${String(count).padStart(2, '0')} projects${category === 'All' ? '' : ' · ' + category}`;
    const empty = document.querySelector('#empty-results');
    if (empty) empty.hidden = count !== 0;
  };
  filters.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.filter;
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    applyFilters();
  }));
  search?.addEventListener('input', applyFilters);
  const dialog = document.querySelector('#media-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const content = dialog.querySelector('.lightbox-content');
  const controls = dialog.querySelector('.lightbox-controls');
  const counter = dialog.querySelector('[data-counter]');
  const gallery = [...document.querySelectorAll('[data-image]')];
  let active = 0;
  let returnFocus;
  const displayImage = index => {
    active = (index + gallery.length) % gallery.length;
    const trigger = gallery[active];
    const img = document.createElement('img');
    img.src = trigger.dataset.image;
    img.alt = trigger.querySelector('img')?.alt || 'Campaign image';
    content.replaceChildren(img);
    controls.hidden = gallery.length < 2;
    counter.textContent = `${active + 1} / ${gallery.length}`;
  };
  const openDialog = trigger => {
    returnFocus = trigger;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  };
  gallery.forEach((trigger,index) => trigger.addEventListener('click', event => {
    event.preventDefault();
    displayImage(index);
    openDialog(trigger);
  }));
  document.querySelectorAll('[data-video]').forEach(trigger => trigger.addEventListener('click', event => {
    event.preventDefault();
    const frame = document.createElement('iframe');
    frame.src = trigger.dataset.video;
    frame.title = trigger.dataset.title || 'Campaign film';
    frame.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.setAttribute('allowfullscreen','');
    content.replaceChildren(frame);
    controls.hidden = true;
    openDialog(trigger);
  }));
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-prev]').addEventListener('click', () => displayImage(active - 1));
  dialog.querySelector('[data-next]').addEventListener('click', () => displayImage(active + 1));
  dialog.addEventListener('click', event => { if (event.target === dialog) { const box=dialog.getBoundingClientRect(); if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close(); } });
  dialog.addEventListener('keydown', event => {
    if (!controls.hidden && event.key === 'ArrowLeft') { event.preventDefault(); displayImage(active - 1); }
    if (!controls.hidden && event.key === 'ArrowRight') { event.preventDefault(); displayImage(active + 1); }
  });
  dialog.addEventListener('close', () => {
    content.replaceChildren();
    document.body.style.overflow = '';
    returnFocus?.focus();
  });
})();
