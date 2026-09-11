/* =========================================================
   UAE SOURCING — interactions
   ========================================================= */
(function () {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Scroll reveal ---------- */
  const revealables = $$('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const delay = parseInt(e.target.dataset.delay || 0, 10);
        setTimeout(() => e.target.classList.add('is-in'), delay);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px' });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- 2. Animated counters ---------- */
  const counters = $$('.counter');
  const runCounter = (el) => {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-US') + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window && !reduced) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        runCounter(e.target);
        cio.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));
  } else {
    counters.forEach((el) => {
      el.textContent = parseFloat(el.dataset.target).toLocaleString('en-US') + (el.dataset.suffix || '');
    });
  }

  /* ---------- 3. Header state + scroll progress + back-to-top ---------- */
  const header   = $('#header');
  const progress = $('#scrollProgress');
  const toTop    = $('#toTop');
  const heroImg  = $('.hero__bg img');

  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    header.classList.toggle('is-stuck', y > 10);
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    toTop.classList.toggle('is-visible', y > 600);

    // hero parallax
    if (heroImg && !reduced && y < window.innerHeight * 1.2) {
      heroImg.style.transform = `scale(1.06) translate3d(0, ${y * 0.16}px, 0)`;
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  toTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  });

  /* ---------- 4. Mobile navigation ---------- */
  const burger = $('#burger');
  const nav    = $('#nav');

  const closeNav = () => {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  burger.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // accordion dropdowns on touch / small screens
  $$('.has-drop > a').forEach((link) => {
    link.addEventListener('click', (e) => {
      if (window.innerWidth > 1024) return;
      e.preventDefault();
      link.parentElement.classList.toggle('is-open');
    });
  });

  $$('.nav a').forEach((a) => {
    a.addEventListener('click', () => {
      if (window.innerWidth <= 1024 && !a.parentElement.classList.contains('has-drop')) closeNav();
    });
  });

  document.addEventListener('click', (e) => {
    if (window.innerWidth > 1024) return;
    if (nav.classList.contains('is-open') && !nav.contains(e.target) && !burger.contains(e.target)) closeNav();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });

  /* ---------- 5. Scroll spy ---------- */
  const navLinks = $$('.nav__list > li > a[href^="#"]');
  const sections = navLinks
    .map((a) => ({ link: a, el: document.querySelector(a.getAttribute('href')) }))
    // ignore #top (wraps the whole page) and the zero-height helper anchors
    .filter((s) => s.el && s.el.id !== 'top' && !s.el.classList.contains('anchor'));

  if ('IntersectionObserver' in window && sections.length) {
    const sio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const match = sections.find((s) => s.el === e.target);
        if (!match) return;
        navLinks.forEach((l) => l.classList.remove('is-active'));
        match.link.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => sio.observe(s.el));
  }

  /* ---------- 6. Delivery options (hero card) ---------- */
  const deliveryItems = $$('.delivery__item');
  deliveryItems.forEach((item) => {
    item.addEventListener('click', () => {
      deliveryItems.forEach((i) => i.classList.remove('is-active'));
      item.classList.add('is-active');
      const radio = document.querySelector(`.ship__opt input[value="${item.dataset.freight}"]`);
      if (radio) radio.checked = true;
    });
  });

  // keep the hero card in sync when the form radios change
  $$('.ship__opt input').forEach((radio) => {
    radio.addEventListener('change', () => {
      deliveryItems.forEach((i) => i.classList.toggle('is-active', i.dataset.freight === radio.value));
    });
  });

  /* ---------- 7. File upload label ---------- */
  const fileInput = $('#fileInput');
  const fileName  = $('#fileName');
  const uploadBtn = $('.upload__btn');

  // Labels live in the markup so they are translated with the rest of the page.
  const uploadTxt = (key, fallback) => (fileName && fileName.dataset[key]) || fallback;

  if (uploadBtn) uploadBtn.addEventListener('click', () => fileInput.click());
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const files = Array.from(fileInput.files || []);
      if (!files.length) { fileName.textContent = uploadTxt('none', 'No file chosen'); return; }
      const tooBig = files.find((f) => f.size > 10 * 1024 * 1024);
      if (tooBig) {
        fileName.textContent = uploadTxt('toobig', 'File too large').replace('%s', tooBig.name);
        fileInput.value = '';
        return;
      }
      fileName.textContent = files.length === 1
        ? files[0].name
        : uploadTxt('many', '%n files selected').replace('%n', files.length);
    });
  }

  /* ---------- 8. Quote form ---------- */
  const form     = $('#quoteForm');
  const formDone = $('#formDone');
  const formErr  = $('#formErr');
  const waSend   = $('#waSend');

  // Mirrors the submitted request back to the client so they can send the same
  // summary over WhatsApp in one tap. This is deliberately customer-initiated:
  // an automatic business-initiated message would need Meta's approved-template
  // flow, which is a separate piece of work.
  const buildWhatsAppLink = (number, data) => {
    const lines = [
      data.get('product') && `Product: ${data.get('product')}`,
      data.get('qty') && `Quantity: ${data.get('qty')}`,
      data.get('dest_country') && `Destination: ${data.get('dest_country')}`,
      data.get('shipping') && `Shipping: ${data.get('shipping')}`,
      data.get('company') && `Company: ${data.get('company')}`,
    ].filter(Boolean);
    const text = ['Quote request — UAE Sourcing', ''].concat(lines).join('\n');
    return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
  };

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fields = $$('input, select, textarea', form);
      fields.forEach((f) => f.classList.add('is-touched'));

      const firstInvalid = fields.find((f) => !f.checkValidity());
      if (firstInvalid) {
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        return;
      }

      const submitBtn = $('button[type=submit]', form);
      const restore   = submitBtn ? submitBtn.textContent : '';
      const data      = new FormData(form);
      data.append('locale', form.dataset.locale || 'en');

      if (formErr) formErr.hidden = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        if (submitBtn.dataset.sending) submitBtn.textContent = submitBtn.dataset.sending;
      }

      try {
        const res = await fetch(form.dataset.endpoint, { method: 'POST', body: data });
        if (!res.ok) throw new Error('HTTP ' + res.status);

        if (waSend && form.dataset.wa) waSend.href = buildWhatsAppLink(form.dataset.wa, data);
        if (formDone) {
          formDone.hidden = false;
          formDone.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        }
        form.reset();
        if (fileName) fileName.textContent = uploadTxt('none', 'No file chosen');
        fields.forEach((f) => f.classList.remove('is-touched'));
      } catch (err) {
        if (formErr) {
          formErr.hidden = false;
          formErr.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = restore;
        }
      }
    });
  }

  /* ---------- 9. Brands carousel (auto-scroll + arrows) ---------- */
  const track    = $('#brandsTrack');
  const viewport = $('#brandsViewport');

  if (track && viewport) {
    // duplicate the list so the marquee loops seamlessly
    const originals = Array.from(track.children);
    originals.forEach((li) => track.appendChild(li.cloneNode(true)));

    let offset = 0;
    let paused = false;
    const speed = 0.35; // px per frame

    const loopWidth = () => track.scrollWidth / 2;

    const tick = () => {
      if (!paused && !reduced) {
        offset += speed;
        if (offset >= loopWidth()) offset -= loopWidth();
        track.style.transform = `translate3d(${-offset}px,0,0)`;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    viewport.addEventListener('mouseenter', () => { paused = true; });
    viewport.addEventListener('mouseleave', () => { paused = false; });

    const nudge = (dir) => {
      offset += dir * 260;
      const w = loopWidth();
      if (offset < 0) offset += w;
      if (offset >= w) offset -= w;
      track.style.transition = 'transform .45s cubic-bezier(.22,.68,.36,1)';
      track.style.transform = `translate3d(${-offset}px,0,0)`;
      setTimeout(() => { track.style.transition = ''; }, 460);
    };
    $('.brands__nav--prev').addEventListener('click', () => nudge(-1));
    $('.brands__nav--next').addEventListener('click', () => nudge(1));
  }

})();
