// Tweety Chang portfolio: small progressive enhancements. Page works without JS.
(function () {
  "use strict";

  var doc = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  doc.classList.add("js");

  // Mobile navigation toggle
  var nav = document.querySelector(".site-nav");
  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("nav-links");

  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    links.classList.toggle("open", open);
  }
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("open")) { setMenu(false); toggle.focus(); }
    });
  }

  // Hairline under the nav once the page scrolls
  function onScroll() { if (nav) nav.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Living portrait: breathing (CSS), pointer tilt, natural blinks, and expressions.
  // Every expression is a real photo frame; frames load only when the portrait is near view.
  var portrait = document.querySelector("[data-portrait]");
  var layers = document.querySelector("[data-portrait-layers]");
  var controls = document.querySelector("[data-portrait-controls]");
  if (portrait && layers && controls) {
    var NAMES = ["blink", "warm", "soft", "smile", "laugh", "wink", "surprise", "puff", "frown"];
    var frames = {};
    var current = null;
    var paused = reduceMotion;
    var busy = false;
    var timers = [];
    var pauseBtn = controls.querySelector("[data-portrait-toggle]");
    var size = (window.devicePixelRatio || 1) > 1.5 ? 960 : 480;

    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function loadFrames() {
      NAMES.forEach(function (name) {
        var img = new Image();
        img.className = "frame";
        img.alt = "";
        img.decoding = "async";
        img.src = "assets/img/portrait/" + name + "-" + size + ".webp";
        layers.appendChild(img);
        frames[name] = img;
      });
      controls.hidden = false;
      if (!reduceMotion) scheduleIdle();
    }

    // Show one frame (or neutral when name is null)
    function show(name, blink) {
      if (current && frames[current]) frames[current].classList.remove("is-on", "is-blink");
      current = name;
      if (name && frames[name]) {
        frames[name].classList.toggle("is-blink", !!blink);
        frames[name].classList.add("is-on");
      }
    }

    // Play a sequence of [frame, duration] steps, then return to neutral
    function play(steps, done) {
      clearTimers();
      busy = true;
      var i = 0;
      (function next() {
        if (i >= steps.length) { show(null); busy = false; if (done) done(); else if (!paused) scheduleIdle(); return; }
        var step = steps[i++];
        show(step[0], step[0] === "blink");
        later(next, step[1]);
      })();
    }

    // Idle life: a blink every few seconds, an occasional warm smile
    function scheduleIdle() {
      clearTimers();
      if (paused) return;
      later(function () {
        if (busy || paused) return scheduleIdle();
        if (Math.random() < 0.18) play([["warm", 2600], ["blink", 130]]);
        else if (Math.random() < 0.15) play([["blink", 120], [null, 140], ["blink", 120]]);
        else play([["blink", 130]]);
      }, 2800 + Math.random() * 3400);
    }

    var SEQUENCES = {
      smile: [["soft", 260], ["smile", 700], ["laugh", 1500], ["smile", 600], ["warm", 900]],
      wink: [["warm", 220], ["wink", 900], ["warm", 600]]
    };
    var PLAYFUL = [
      [["surprise", 1100], ["warm", 700]],
      [["puff", 1300], ["smile", 800]],
      [["frown", 900], ["laugh", 1200], ["warm", 600]]
    ];
    var playfulIndex = 0;

    controls.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-expression]");
      if (btn) play(SEQUENCES[btn.getAttribute("data-expression")]);
    });

    // A small surprise for anyone who taps the portrait itself
    layers.addEventListener("click", function () {
      play(PLAYFUL[playfulIndex++ % PLAYFUL.length]);
    });

    // Notice the visitor: soft smile on hover
    layers.addEventListener("pointerenter", function (e) {
      if (e.pointerType === "mouse" && !busy) { clearTimers(); show("soft"); }
    });
    layers.addEventListener("pointerleave", function (e) {
      if (e.pointerType === "mouse" && !busy) { show(null); scheduleIdle(); }
    });

    if (reduceMotion) {
      pauseBtn.hidden = true;
    } else {
      pauseBtn.addEventListener("click", function () {
        paused = !paused;
        portrait.classList.toggle("is-paused", paused);
        pauseBtn.setAttribute("aria-pressed", String(paused));
        pauseBtn.textContent = paused ? "Play" : "Pause";
        if (paused) { clearTimers(); busy = false; show(null); } else scheduleIdle();
      });

      // Gentle tilt toward the pointer
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        var raf = 0;
        window.addEventListener("pointermove", function (e) {
          if (paused || raf) return;
          raf = requestAnimationFrame(function () {
            raf = 0;
            var r = portrait.getBoundingClientRect();
            if (r.bottom < 0 || r.top > window.innerHeight) return;
            var x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
            var y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)));
            portrait.style.setProperty("--ry", (x * 6).toFixed(2) + "deg");
            portrait.style.setProperty("--rx", (-y * 4).toFixed(2) + "deg");
            portrait.style.setProperty("--lx", (x * 14).toFixed(1) + "px");
            portrait.style.setProperty("--ly", (y * 10).toFixed(1) + "px");
          });
        }, { passive: true });
      }
    }

    // Stop idle animation while the tab is hidden
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { clearTimers(); busy = false; show(null); }
      else if (!paused && Object.keys(frames).length) scheduleIdle();
    });

    // Load expression frames only when the portrait approaches the viewport
    if ("IntersectionObserver" in window) {
      var loadObs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { loadObs.disconnect(); loadFrames(); }
      }, { rootMargin: "400px 0px" });
      loadObs.observe(portrait);
    } else {
      loadFrames();
    }
  }

  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }

  // Gentle fade-in on scroll
  var reveals = document.querySelectorAll(".reveal");
  if (reduceMotion) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObs.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { revealObs.observe(el); });
  }

  // Highlight the nav link for the section in view
  var navLinks = {};
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(function (a) {
    navLinks[a.getAttribute("href").slice(1)] = a;
  });
  var sectionObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      Object.keys(navLinks).forEach(function (id) { navLinks[id].removeAttribute("aria-current"); });
      var link = navLinks[entry.target.id];
      if (link) link.setAttribute("aria-current", "true");
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  Object.keys(navLinks).forEach(function (id) {
    var section = document.getElementById(id);
    if (section) sectionObs.observe(section);
  });

  // Resume: if the PDF has not been uploaded yet, avoid a broken link
  var resumeLinks = document.querySelectorAll("[data-resume]");
  if (resumeLinks.length && window.fetch) {
    fetch(resumeLinks[0].getAttribute("href"), { method: "HEAD" })
      .then(function (res) { if (!res.ok) throw new Error("missing"); })
      .catch(function () {
        resumeLinks.forEach(function (a) {
          var item = a.closest("[data-resume-item]");
          if (item) { item.hidden = true; return; }
          a.setAttribute("href", "#experience");
          a.removeAttribute("download");
          a.textContent = "View My Experience";
        });
      });
  }
})();
