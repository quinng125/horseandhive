/* Horse & Hive Farm — site interactions. No dependencies. */
(() => {
  const doc = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header: solid once scrolled, tucks away on scroll-down, returns on scroll-up. */
  const header = document.querySelector('.site-header');
  const mobileCta = document.querySelector('.mobile-cta');
  let lastY = window.scrollY;
  let ticking = false;
  const hero = document.querySelector('.hero, .page-hero');
  const heroImg = document.querySelector('.hero .hero-media img');

  function onScroll() {
    const y = window.scrollY;
    const threshold = hero ? Math.max(80, hero.offsetHeight - 120) : 40;
    if (header) {
      header.classList.toggle('is-scrolled', y > 40);
      const goingDown = y > lastY + 4;
      const goingUp = y < lastY - 4;
      if (goingDown && y > threshold) header.classList.add('is-hidden');
      else if (goingUp || y < threshold) header.classList.remove('is-hidden');
    }
    if (mobileCta) mobileCta.classList.toggle('is-visible', y > window.innerHeight * 0.6);
    if (heroImg && !reduceMotion && y < window.innerHeight * 1.2) {
      heroImg.style.setProperty('--hero-shift', (y * 0.18).toFixed(1));
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true }
  );
  onScroll();

  /* Mobile menu */
  const menu = document.getElementById('mobile-menu');
  const openBtn = document.querySelector('.menu-toggle');
  const closeBtn = menu ? menu.querySelector('.mobile-menu-close') : null;

  function setMenu(open) {
    if (!menu || !openBtn) return;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menu.inert = !open;
    openBtn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    if (open) {
      window.setTimeout(() => closeBtn && closeBtn.focus(), 50);
    } else {
      openBtn.focus();
    }
  }
  if (menu) menu.inert = true;
  openBtn && openBtn.addEventListener('click', () => setMenu(true));
  closeBtn && closeBtn.addEventListener('click', () => setMenu(false));
  menu &&
    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) setMenu(false);
    });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu && menu.classList.contains('is-open')) setMenu(false);
    if (e.key === 'Tab' && menu && menu.classList.contains('is-open')) {
      const focusables = menu.querySelectorAll('a[href], button');
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /* Reveal on scroll */
  const revealables = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add('is-visible'));
  }

  /* Count-up numbers */
  const counters = document.querySelectorAll('[data-count]');
  function runCounter(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = (el.dataset.count.split('.')[1] || '').length;
    const duration = 1600;
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = (target * eased).toFixed(decimals);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if ('IntersectionObserver' in window && !reduceMotion) {
    const co = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            co.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => co.observe(el));
  }

  /* Scroll rails (horses, reviews) with prev/next buttons */
  document.querySelectorAll('[data-rail]').forEach((wrap) => {
    const track = wrap.querySelector('[data-rail-track]');
    const prev = wrap.querySelector('[data-rail-prev]');
    const next = wrap.querySelector('[data-rail-next]');
    if (!track) return;
    const step = () => {
      const item = track.children[0];
      if (!item) return track.clientWidth * 0.8;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return item.getBoundingClientRect().width + gap;
    };
    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max;
    };
    prev && prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: reduceMotion ? 'auto' : 'smooth' }));
    next && next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: reduceMotion ? 'auto' : 'smooth' }));
    track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* Enquiry form: validates, then opens the visitor's email app with a tidy message. */
  const form = document.querySelector('[data-enquiry]');
  if (form) {
    const params = new URLSearchParams(window.location.search);
    const interest = params.get('interest');
    if (interest) {
      const radio = form.querySelector(`input[name="interest"][data-slug="${CSS.escape(interest)}"]`);
      if (radio) radio.checked = true;
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let firstInvalid = null;
      form.querySelectorAll('.field-error').forEach((n) => n.remove());
      form.querySelectorAll('[aria-invalid]').forEach((n) => n.removeAttribute('aria-invalid'));

      form.querySelectorAll('[required]').forEach((input) => {
        if (!input.checkValidity()) {
          input.setAttribute('aria-invalid', 'true');
          const msg = document.createElement('p');
          msg.className = 'field-error';
          msg.id = `${input.id}-error`;
          msg.textContent = input.type === 'email' ? 'Please enter a valid email address.' : 'This field is required.';
          input.setAttribute('aria-describedby', msg.id);
          input.insertAdjacentElement('afterend', msg);
          firstInvalid = firstInvalid || input;
        }
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      const data = new FormData(form);
      const pick = (k) => (data.get(k) || '').toString().trim();
      const topic = pick('interest') || 'General question';
      const details = [
        `Name: ${pick('name')}`,
        `Email: ${pick('email')}`,
        pick('phone') && `Phone: ${pick('phone')}`,
        `Interested in: ${topic}`,
        pick('rider-age') && `Rider age: ${pick('rider-age')}`,
        pick('experience') && `Riding experience: ${pick('experience')}`,
        pick('days') && `Best days/times: ${pick('days')}`,
      ].filter(Boolean);
      const body = `${details.join('\n')}\n\n${pick('message')}`;
      const to = form.dataset.enquiry;
      const subject = `Website enquiry: ${topic} (${pick('name')})`;
      const href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = href;

      const success = form.querySelector('.form-success');
      if (success) {
        success.classList.add('is-visible');
        success.focus();
      }
    });
  }

  /* Before / after sliders (Photo Lab) */
  document.querySelectorAll('.compare').forEach((el) => {
    const range = el.querySelector('input[type="range"]');
    if (!range) return;
    const set = () => el.style.setProperty('--pos', `${range.value}%`);
    range.addEventListener('input', set);
    set();
  });

  doc.classList.add('is-ready');
})();
