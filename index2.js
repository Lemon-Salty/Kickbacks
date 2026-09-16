/* =====================================================================
   Kickbacks — index2.js
   - Age gate (same rules as index.html)
   - Floating nav (mobile toggle)
   - Scroll-to-top button
   - Reveal-on-scroll
   - Seamless marquees
   - Scroll-driven "pour" experience (vanilla port of the GSAP
     ScrollTrigger timeline used on the QuikShot page)
   ===================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     Age gate
     ------------------------------------------------------------------ */
  (function ageGate() {
    var overlay = document.getElementById('verify-overlay');
    var verifyButton = document.getElementById('verify-yes');
    var dayEl = document.getElementById('age_gate_day');
    var monthEl = document.getElementById('age_gate_month');
    var yearEl = document.getElementById('age_gate_year');

    function closeOverlay() {
      if (overlay) overlay.remove();
      document.body.style.overflow = '';
      try { localStorage.setItem('ageVerified', 'true'); } catch (e) {}
    }

    var verified = false;
    try { verified = localStorage.getItem('ageVerified') === 'true'; } catch (e) {}
    if (verified) {
      closeOverlay();
      return;
    }

    // Populate day / year selects
    if (dayEl) {
      for (var d = 1; d <= 31; d++) {
        var o = document.createElement('option');
        o.textContent = d;
        dayEl.appendChild(o);
      }
    }
    if (yearEl) {
      var thisYear = new Date().getFullYear();
      for (var y = thisYear; y >= thisYear - 100; y--) {
        var yo = document.createElement('option');
        yo.textContent = y;
        yearEl.appendChild(yo);
      }
    }

    if (overlay) document.body.style.overflow = 'hidden';
    if (!verifyButton) return;

    verifyButton.addEventListener('click', function () {
      var day = parseInt(dayEl && dayEl.value, 10);
      var month = parseInt(monthEl && monthEl.value, 10);
      var year = parseInt(yearEl && yearEl.value, 10);

      if (!day || !month || !year) {
        alert('Please select your birth date.');
        return;
      }

      var birthDate = new Date(Date.UTC(year, month - 1, day));
      if (Number.isNaN(birthDate.getTime())) {
        alert('Please select a valid date.');
        return;
      }

      var now = new Date();
      var today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      var age = today.getUTCFullYear() - birthDate.getUTCFullYear();
      var monthDiff = today.getUTCMonth() - birthDate.getUTCMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < birthDate.getUTCDate())) {
        age -= 1;
      }

      if (age >= 21) {
        closeOverlay();
      } else {
        alert('Sorry, you must be 21 or older to enter.');
      }
    });
  })();

  /* ------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------ */
  (function nav() {
    var toggle = document.getElementById('nav-toggle');
    var menu = document.getElementById('nav-mobile');
    if (!toggle || !menu) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.classList.toggle('is-open', open);
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  })();

  /* ------------------------------------------------------------------
     Scroll to top
     ------------------------------------------------------------------ */
  (function scrollTop() {
    var btn = document.getElementById('scroll-top');
    if (!btn) return;

    function update() {
      btn.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.6);
    }

    window.addEventListener('scroll', update, { passive: true });
    update();

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  })();

  /* ------------------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------------------ */
  (function reveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          // Stagger siblings that reveal together
          var siblings = Array.prototype.filter.call(
            el.parentNode.children,
            function (c) { return c.hasAttribute('data-reveal'); }
          );
          var idx = siblings.indexOf(el);
          el.style.transitionDelay = (Math.max(idx, 0) * 90) + 'ms';
          el.classList.add('is-visible');
          io.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (el) { io.observe(el); });
  })();

  /* ------------------------------------------------------------------
     Marquees: duplicate the track contents once so translateX(-50%)
     loops seamlessly.
     ------------------------------------------------------------------ */
  (function marquees() {
    ['logo-marquee-track', 'polaroid-marquee-track'].forEach(function (id) {
      var track = document.getElementById(id);
      if (!track) return;
      var clone = track.innerHTML;
      track.insertAdjacentHTML('beforeend', clone);
    });
  })();

  /* ------------------------------------------------------------------
     Newsletter form (front-end only placeholder — wire to your
     provider of choice)
     ------------------------------------------------------------------ */
  (function newsletter() {
    var form = document.getElementById('newsletter-form');
    var note = document.getElementById('newsletter-note');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"]');
      var value = input ? input.value.trim() : '';
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if (!ok) {
        if (note) note.textContent = 'Please enter a valid email.';
        return;
      }
      // TODO: POST `value` to your mailing-list endpoint.
      if (note) note.textContent = "You're on the list. Talk soon.";
      form.reset();
    });
  })();

  /* ------------------------------------------------------------------
     Pour experience — scroll-driven timeline
     ------------------------------------------------------------------ */
  (function pour() {
    var track = document.getElementById('pour-track');
    if (!track) return;

    function $(name) {
      return track.querySelector('[data-pour="' + name + '"]');
    }

    var el = {
      intro: $('intro'),
      title: $('title'),
      bottleWrap: $('bottle-wrap'),
      bottle: $('bottle'),
      bottleFront: $('bottle-front'),
      bottleFlipped: $('bottle-flipped'),
      statShot: $('stat-shot'),
      statChaser: $('stat-chaser'),
      instrShot: $('instruction-shot'),
      instrChaser: $('instruction-chaser'),
      streamLeft: $('stream-left'),
      streamRight: $('stream-right'),
      caption1: $('caption-1'),
      caption2: $('caption-2'),
      caption3: $('caption-3'),
      caption4: $('caption-4')
    };

    var shotCard = document.getElementById('stat-shot-card');
    var chaserCard = document.getElementById('stat-chaser-card');
    var shotDot = document.getElementById('stat-shot-dot');
    var chaserDot = document.getElementById('stat-chaser-dot');

    function streamParts(svg) {
      if (!svg) return null;
      return {
        svg: svg,
        fill: svg.querySelector('.pour-fill'),
        lines: Array.prototype.slice.call(svg.querySelectorAll('.pour-line')),
        drops: Array.prototype.slice.call(svg.querySelectorAll('circle'))
      };
    }

    var left = streamParts(el.streamLeft);
    var right = streamParts(el.streamRight);

    /* --- easing / math helpers --- */
    var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
    var lerp = function (a, b, t) { return a + (b - a) * t; };
    var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
    var easeIn = function (t) { return t * t; };
    var easeInOut = function (t) {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    };
    var backOut = function (t) {
      var c1 = 1.7, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };

    // Progress of a sub-segment [a, b] of the master timeline, eased.
    function seg(p, a, b, ease) {
      var t = clamp01((p - a) / (b - a));
      return ease ? ease(t) : t;
    }

    // Combined in/out: rises over [inA,inB], holds, falls over [outA,outB]
    function inOut(p, inA, inB, outA, outB) {
      return Math.min(seg(p, inA, inB, easeOut), 1 - seg(p, outA, outB, easeIn));
    }

    function setStyle(node, props) {
      if (!node) return;
      for (var k in props) node.style[k] = props[k];
    }

    // Left tilt = negative rotation (bottle leans toward the SHOT card)
    function applyStream(parts, p, start, tint) {
      if (!parts) return;
      // p is a local 0..1 progress for the pour phase
      var fade = inOut(p, 0.05, 0.15, 0.85, 0.95);
      setStyle(parts.svg, { opacity: fade });

      var fill = seg(p, 0.12, 0.6, easeIn);
      setStyle(parts.fill, { transform: 'scaleY(' + fill + ')' });

      parts.lines.forEach(function (line, i) {
        var t = seg(p, 0.12 + i * 0.05, 0.6 + i * 0.05, easeOut);
        line.style.strokeDashoffset = (340 * (1 - t)) + 'px';
      });

      parts.drops.forEach(function (drop, i) {
        var t = seg(p, 0.45 + i * 0.05, 0.65 + i * 0.05, easeOut);
        setStyle(drop, {
          opacity: t * 0.9,
          translate: '0 ' + (-12 * (1 - t)) + 'px',
          scale: String(lerp(0.6, 1, t))
        });
      });
    }

    /* --- the master timeline: p in [0, 1] --- */
    function render(p) {
      /* 1. "What is a Kickback?" interstitial */
      var introIn = seg(p, 0.0, 0.07, backOut);
      var introOut = seg(p, 0.14, 0.18, easeIn);
      setStyle(el.intro, {
        opacity: Math.min(introIn, 1 - introOut),
        scale: String(lerp(lerp(0.35, 1, introIn), 1.25, introOut)),
        translate: '0 ' + lerp(lerp(60, 0, introIn), -30, introOut) + 'px'
      });

      /* 2. Title + bottle + stat cards arrive */
      var titleIn = seg(p, 0.18, 0.23, easeOut);
      setStyle(el.title, {
        opacity: titleIn,
        translate: '0 ' + lerp(35, 0, titleIn) + 'px'
      });

      var bottleIn = seg(p, 0.2, 0.25, easeOut);
      setStyle(el.bottleWrap, {
        opacity: bottleIn,
        scale: String(lerp(0.75, 1, bottleIn)),
        translate: '0 ' + lerp(40, 0, bottleIn) + 'px'
      });

      var statsIn = seg(p, 0.23, 0.28, easeOut);
      var statsOut = seg(p, 0.73, 0.76, easeIn);
      var statsOpacity = Math.min(statsIn, 1 - statsOut);
      setStyle(el.statShot, {
        opacity: statsOpacity,
        translate: '0 ' + lerp(20, 0, statsIn) + 'px'
      });
      setStyle(el.statChaser, {
        opacity: statsOpacity,
        translate: '0 ' + lerp(20, 0, statsIn) + 'px'
      });

      /* 3. Captions */
      setStyle(el.caption1, { opacity: inOut(p, 0.24, 0.28, 0.30, 0.33) });
      setStyle(el.caption2, { opacity: inOut(p, 0.33, 0.36, 0.47, 0.50) });
      setStyle(el.caption3, { opacity: inOut(p, 0.52, 0.55, 0.70, 0.73) });
      setStyle(el.caption4, { opacity: seg(p, 0.76, 0.80, easeOut) });

      /* 4. Tilt for the vodka (left) */
      var tilt1 = seg(p, 0.34, 0.44, easeInOut) - seg(p, 0.47, 0.52, easeInOut);
      /* 5. Tilt for the chaser (right) */
      var tilt2 = seg(p, 0.55, 0.65, easeInOut) - seg(p, 0.68, 0.73, easeInOut);
      /* 6. The flip */
      var flip = seg(p, 0.76, 0.88, easeInOut);

      var rotation = (-55 * tilt1) + (55 * tilt2) + (180 * flip);
      var shiftX = (40 * tilt1) + (-40 * tilt2);
      setStyle(el.bottle, {
        rotate: rotation + 'deg',
        translate: shiftX + 'px 0'
      });

      applyStream(left, seg(p, 0.35, 0.49));
      applyStream(right, seg(p, 0.56, 0.70));

      var instr1 = inOut(p, 0.37, 0.42, 0.46, 0.49);
      setStyle(el.instrShot, {
        opacity: instr1,
        translate: '0 ' + lerp(20, 0, instr1) + 'px',
        scale: String(lerp(0.92, 1, instr1))
      });
      var instr2 = inOut(p, 0.58, 0.63, 0.67, 0.70);
      setStyle(el.instrChaser, {
        opacity: instr2,
        translate: '0 ' + lerp(20, 0, instr2) + 'px',
        scale: String(lerp(0.92, 1, instr2))
      });

      var shotActive = p > 0.38 && p < 0.49;
      var chaserActive = p > 0.59 && p < 0.71;
      if (shotCard) shotCard.classList.toggle('is-active', shotActive);
      if (shotDot) shotDot.classList.toggle('is-active', shotActive);
      if (chaserCard) chaserCard.classList.toggle('is-active', chaserActive);
      if (chaserDot) chaserDot.classList.toggle('is-active', chaserActive);

      /* Crossfade front -> flipped artwork halfway through the flip */
      var swap = seg(p, 0.80, 0.84, easeInOut);
      setStyle(el.bottleFront, { opacity: 1 - swap });
      setStyle(el.bottleFlipped, { opacity: swap });
    }

    /* --- scroll progress of the 450vh track ---
       Mirrors ScrollTrigger { start: 'top 85%', end: 'bottom bottom' } */
    function progress() {
      var rect = track.getBoundingClientRect();
      var vh = window.innerHeight;
      var start = vh * 0.85;
      var total = rect.height - vh + start;
      if (total <= 0) return 0;
      return clamp01((start - rect.top) / total);
    }

    var target = progress();
    var current = target;
    var raf = null;
    var alpha = reduceMotion ? 1 : 0.12; // scrub smoothing

    function tick() {
      raf = null;
      current += (target - current) * alpha;
      if (Math.abs(target - current) < 0.0005) current = target;
      render(current);
      if (current !== target) raf = requestAnimationFrame(tick);
    }

    function onScroll() {
      target = progress();
      if (raf === null) raf = requestAnimationFrame(tick);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    render(current);
  })();
})();
