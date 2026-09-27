(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // On phones the nav is a swipeable row; start it scrolled to the current page's tab.
  var currentTab = document.querySelector('.site-nav ul [aria-current="page"]');
  var navRow = currentTab && currentTab.closest('ul');
  function showCurrentTab() {
    if (navRow.scrollWidth <= navRow.clientWidth) return;
    navRow.scrollLeft += currentTab.getBoundingClientRect().left - navRow.getBoundingClientRect().left - 20;
  }
  if (navRow) {
    showCurrentTab();
    // Web fonts can change tab widths after first paint; realign once they're in.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(showCurrentTab);
  }

  var revealTargets = document.querySelectorAll('.project .band, .project .card, .entry');
  if (revealTargets.length && !reduceMotion && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-reveal');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    revealTargets.forEach(function (el) { observer.observe(el); });
  }

  var lightbox = document.getElementById('lightbox');
  if (!lightbox || typeof lightbox.showModal !== 'function') return;

  var fullImg = lightbox.querySelector('img');
  var lastTrigger = null;

  document.querySelectorAll('.img-trigger').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var img = btn.querySelector('img');
      lastTrigger = btn;
      fullImg.src = img.currentSrc || img.src;
      fullImg.alt = img.alt;
      lightbox.showModal();
    });
  });

  function returnFocus() {
    if (lastTrigger) lastTrigger.focus();
  }

  // Restore focus synchronously here; the 'close' event is queued as a task and can be deferred.
  function closeLightbox() {
    lightbox.close();
    returnFocus();
  }

  lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);

  // A click whose target is the <dialog> itself landed on the backdrop, not the content.
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  // Esc fires 'cancel' synchronously; take over so focus returns immediately.
  lightbox.addEventListener('cancel', function (e) {
    e.preventDefault();
    closeLightbox();
  });

  lightbox.addEventListener('close', returnFocus);
})();
