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
      var items = Array.prototype.filter.call(group.children, function (child) {
        return child.classList && child.classList.contains('js-stagger-item');
      });
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

  function initScrollingTestimonials() {
    var root = document.querySelector('[data-testimonials-scroll]');
    if (!root) return;

    var testimonials = [
      {
        text: 'They do great work. I was very happy with how my windows looked after they cleaned them. Really recommend this company to clean your windows.',
        name: 'Ethan S.',
        role: 'Verified Review • Aug 2024'
      },
      {
        text: 'Hands down... the best experience I have ever had working with a window cleaning company. I have had many different companies come by and compared to this, their work was lackluster to say the least. I appreciated the communication from start to finish, and a clear explanation of what was occurring, the price options, and when it was going to be completed. Not to mention the execution...',
        name: 'Braden R.',
        role: 'Google Review • Jul 2024'
      },
      {
        text: 'They recently cleaned the interior and exterior windows at my residence and I highly recommend them. They were very professional and thorough, along with being easy to talk with. I will definitely stay with them going forward for this job. These are people I trust in my home, and I know that the work is being done as agreed upon.',
        name: 'Roselle D.',
        role: 'Verified Review • Jul 2024'
      },
      {
        text: 'Couldn’t be happier with their service. Very professional and efficient. My windows and siding have never looked better. Highly recommended!',
        name: 'Owen Gorzelanczyk',
        role: 'Facebook Recommendation • June 28, 2025'
      },
      {
        text: 'These guys did a great job for both my siding on my house and my windows. Very personable people and a joy to talk to. I would highly recommend them.',
        name: 'Trevor VandenHeuvel',
        role: 'Facebook Recommendation • June 6, 2025'
      },
      {
        text: 'Window cleaning was top-notch and the crew was easy to work with. Great communication and the results looked excellent.',
        name: 'Chris V.',
        role: 'Verified Review • Jul 2024'
      },
      {
        text: 'Overall 10/10 experience working with this company. They are friendly, timely, and my windows are completely spotless. This is by far the best window cleaning company in the area!',
        name: 'Bryce Gorzelanczyk',
        role: 'Google Review • A year ago'
      },
      {
        text: 'Super good window cleaners! Super respectful and professional. They were very efficient. And I have super clean windows now!',
        name: 'Chloe la Haye',
        role: 'Google Review • A year ago'
      },
      {
        text: '920 Window Pros did a great job on my house. Just moved in to a new place with very dirty windows and they look brand new!',
        name: "Aidan O'Leary",
        role: 'Google Review • A year ago'
      },
      {
        text: 'These kids did a spectacular job on the interior and exterior of my windows. Very respectful and efficient while at my house, would recommend to anyone in the Green Bay Area!',
        name: 'Will School',
        role: 'Google Review • A year ago'
      },
      {
        text: 'I recently had the pleasure of witnessing two young professionals clean my windows using a commercial water pipe brush, and I couldn’t be more impressed. Their approach was both efficient and meticulous.',
        name: 'Cole Deppeler',
        role: 'Google Review • A year ago'
      },
      {
        text: '920 Windows Pro did a great job on our windows - totally spotless and streak-free! They were professional and efficient. I highly recommend!',
        name: 'Marsha Burklund',
        role: 'Google Review • A year ago'
      },
      {
        text: 'Brock and his team are both professional and personable. He talked me through his plan and executed it very efficiently. Will definitely refer these guys to anyone who needs their windows done in the future!',
        name: 'Trevor VandenHeuvel',
        role: 'Google Review • Edited a year ago'
      },
      {
        text: 'I am very pleased with the professionalism and quality work of this company. They cleaned the interior and exterior windows of my home and did a great job. Very pleasant to talk with and no concerns having them in my home. They have my business going forward for sure. I highly recommend them!',
        name: 'Roselle',
        role: 'Google Review • A year ago'
      },
      {
        text: 'These kids did an amazing job cleaning my windows! They were very professional and respectful, leaving my windows looking good as new. I would definitely recommend to anyone looking to get their windows cleaned!!!!!',
        name: 'Cali Gorzelanczyk',
        role: 'Google Review • A year ago'
      }
    ];

    var columns = root.querySelectorAll('[data-testimonial-column]');
    if (!columns.length) return;

    columns.forEach(function (column, columnIndex) {
      var cards = testimonials.filter(function (_, idx) {
        return idx % columns.length === columnIndex;
      });

      if (!cards.length) return;

      var track = document.createElement('div');
      track.className = 'testimonials-scroll__track';

      // Duplicate set in DOM for seamless translateY(-50%) looping.
      var duplicated = cards.concat(cards);
      duplicated.forEach(function (t) {
        var card = document.createElement('article');
        card.className = 'testimonials-scroll__card';
        card.innerHTML =
          '<p class="testimonials-scroll__quote">"' + t.text + '"</p>' +
          '<div class="testimonials-scroll__author">' +
            '<p class="testimonials-scroll__name">' + t.name + '</p>' +
            '<p class="testimonials-scroll__role">' + t.role + '</p>' +
          '</div>';
        track.appendChild(card);
      });

      column.innerHTML = '';
      column.appendChild(track);
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
    initScrollingTestimonials();
  });
})();
