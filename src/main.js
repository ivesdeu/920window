(function () {
  'use strict';

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function initScrollReveal() {
    var nodes = document.querySelectorAll('.fade-in, .fade-left, .fade-right');
    nodes.forEach(function (el) {
      el.classList.add('visible');
    });

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

    var belowFold = [];
    nodes.forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.92) {
        el.classList.remove('visible');
        belowFold.push(el);
      }
    });
    if (!belowFold.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    );

    belowFold.forEach(function (el) {
      observer.observe(el);
    });
  }

  function initStaggerGroups() {
    var groups = document.querySelectorAll('.js-stagger-children');
    if (!groups.length) return;

    groups.forEach(function (group) {
      var items = group.querySelectorAll(':scope > .js-stagger-item');
      if (!items.length) return;

      items.forEach(function (item) {
        item.classList.remove('is-visible');
      });

      if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
        items.forEach(function (item) {
          item.classList.add('is-visible');
        });
        return;
      }

      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            items.forEach(function (item, i) {
              window.setTimeout(function () {
                item.classList.add('is-visible');
              }, i * 95);
            });
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -24px 0px' }
      );

      observer.observe(group);
    });
  }

  function initStatCounters() {
    var stats = document.querySelectorAll('.js-count-up');
    if (!stats.length) return;

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

    function runCount(el) {
      var target = parseFloat(el.getAttribute('data-target'));
      var suffix = el.getAttribute('data-suffix') || '';
      if (isNaN(target)) return;

      var duration = 1200;
      var startTime = null;

      function frame(t) {
        if (startTime === null) {
          startTime = t;
          el.textContent = '0' + suffix;
        }
        var p = Math.min((t - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 2.4);
        var n = Math.round(target * eased);
        el.textContent = n + suffix;
        if (p < 1) requestAnimationFrame(frame);
      }

      requestAnimationFrame(frame);
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCount(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.35 }
    );

    stats.forEach(function (el) {
      observer.observe(el);
    });
  }

  function initMobileNav() {
    var toggle = document.querySelector('.mobile-menu-toggle');
    var nav = document.querySelector('.mobile-nav');
    if (!toggle || !nav) return;

    toggle.setAttribute('aria-expanded', 'false');

    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('active');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function initHeaderScroll() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    function onScroll() {
      header.classList.toggle('scrolled', window.scrollY > 10);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initHeroMistPointer() {
    var hero = document.querySelector('.js-hero-mist');
    if (!hero || prefersReducedMotion()) return;

    var mx = 50;
    var my = 50;
    var tx = 50;
    var ty = 50;
    var rafId = null;

    function tick() {
      mx += (tx - mx) * 0.07;
      my += (ty - my) * 0.07;
      hero.style.setProperty('--mist-x', mx + '%');
      hero.style.setProperty('--mist-y', my + '%');
      if (Math.abs(tx - mx) > 0.12 || Math.abs(ty - my) > 0.12) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    }

    function scheduleTick() {
      if (rafId === null) rafId = requestAnimationFrame(tick);
    }

    hero.addEventListener(
      'pointermove',
      function (e) {
        if (!e.isPrimary) return;
        var r = hero.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var px = ((e.clientX - r.left) / r.width) * 100;
        var py = ((e.clientY - r.top) / r.height) * 100;
        tx = 50 + (px - 50) * 0.32;
        ty = 50 + (py - 50) * 0.32;
        scheduleTick();
      },
      { passive: true }
    );

    hero.addEventListener('pointerleave', function () {
      tx = 50;
      ty = 50;
      scheduleTick();
    });
  }

  function initSmoothAnchors() {
    if (prefersReducedMotion()) return;
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      var hash = a.getAttribute('href');
      if (!hash || hash === '#') return;
      var id = hash.slice(1);
      a.addEventListener('click', function (e) {
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function initHeroVideoPlayback() {
    var video = document.querySelector('.home-hero-video__video');
    var frame = document.querySelector('.home-hero-video__frame');
    if (!video) return;

    // Keep autoplay policies happy across browsers.
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    function tryPlay() {
      var p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () {
          // Ignore; browser may block until user gesture.
        });
      }
    }

    function markReady() {
      if (frame) frame.classList.add('is-video-ready');
    }

    video.addEventListener('playing', markReady);
    video.addEventListener('timeupdate', markReady, { once: true });
    video.addEventListener('loadeddata', markReady, { once: true });

    if (video.readyState >= 2) {
      markReady();
      tryPlay();
    } else {
      video.addEventListener('loadeddata', tryPlay, { once: true });
      video.addEventListener('canplay', tryPlay, { once: true });
    }

    // If tab/background pauses playback, resume when visible again.
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) tryPlay();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initScrollReveal();
    initStaggerGroups();
    initStatCounters();
    initMobileNav();
    initHeaderScroll();
    initHeroMistPointer();
    initSmoothAnchors();
    initHeroVideoPlayback();
  });
})();
