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

  // Living portrait using the existing, aligned expression assets.
  // Mouse: she smiles more as the cursor gets closer to her face.
  // Touch: the same tiers follow the portrait's position as the page scrolls.
  var portrait = document.querySelector("[data-portrait]");
  var layers = document.querySelector("[data-portrait-layers]");
  var controls = document.querySelector("[data-portrait-controls]");
  if (portrait && layers && controls) {
    var NAMES = ["blink", "warm", "soft", "smile", "laugh", "wink", "surprise", "puff", "frown"];
    var TIERS = [null, "warm", "soft", "smile", "laugh"];   // far -> close
    var frames = {};
    var current = null;     // frame on screen
    var follow = null;      // expression chosen by pointer/scroll position
    var paused = true;
    var busy = false;       // a scripted sequence is playing
    var timers = [];
    var pauseBtn = controls.querySelector("[data-portrait-toggle]");
    var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var size = (window.devicePixelRatio || 1) > 1.5 ? 960 : 480;

    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function show(name, blink) {
      if (name === current) return;
      if (current && frames[current]) frames[current].classList.remove("is-on", "is-blink");
      current = name;
      if (name && frames[name]) {
        frames[name].classList.toggle("is-blink", !!blink);
        frames[name].classList.add("is-on");
      }
    }

    // Return to whatever the pointer position asks for
    function settle() { show(paused ? null : follow); }

    function play(steps) {
      clearTimers();
      busy = true;
      var i = 0;
      (function next() {
        if (i >= steps.length) { busy = false; settle(); scheduleIdle(); return; }
        var step = steps[i++];
        show(step[0], step[0] === "blink");
        later(next, step[1]);
      })();
    }

    // Idle life while the face is neutral: natural blinks
    function scheduleIdle() {
      clearTimers();
      if (paused || reduceMotion) return;
      later(function () {
        if (busy || follow || document.hidden) return scheduleIdle();
        play(Math.random() < 0.15 ? [["blink", 120], [null, 140], ["blink", 120]] : [["blink", 130]]);
      }, 2800 + Math.random() * 3400);
    }

    function setFollow(name) {
      if (name === follow) return;
      follow = name;
      if (!busy && !paused) show(follow);
    }

    // Distance from the cursor to the face, measured in portrait widths
    function tierFromPointer(x, y) {
      var r = layers.getBoundingClientRect();
      var fx = r.left + r.width * 0.5, fy = r.top + r.height * 0.36;
      var d = Math.hypot(x - fx, y - fy) / r.width;
      if (d < 0.16) return TIERS[4];
      if (d < 0.42) return TIERS[3];
      if (d < 0.8)  return TIERS[2];
      if (d < 1.3)  return TIERS[1];
      return TIERS[0];
    }

    // Touch screens: how close the portrait is to the middle of the viewport
    function tierFromScroll() {
      var r = layers.getBoundingClientRect();
      var off = Math.abs((r.top + r.height * 0.4) - window.innerHeight / 2) / window.innerHeight;
      if (off < 0.1) return TIERS[3];
      if (off < 0.22) return TIERS[2];
      if (off < 0.36) return TIERS[1];
      return TIERS[0];
    }

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
      scheduleIdle();
      if (!finePointer) setFollow(tierFromScroll());
    }

    var raf = 0, lastX = 0, lastY = 0;
    if (finePointer) {
      window.addEventListener("pointermove", function (e) {
        lastX = e.clientX; lastY = e.clientY;
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var r = portrait.getBoundingClientRect();
          if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
          if (!paused) setFollow(tierFromPointer(lastX, lastY));
          if (paused || reduceMotion) return;
          // Gentle tilt toward the pointer
          var x = Math.max(-1, Math.min(1, (lastX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
          var y = Math.max(-1, Math.min(1, (lastY - (r.top + r.height / 2)) / (window.innerHeight / 2)));
          portrait.style.setProperty("--ry", (x * 6).toFixed(2) + "deg");
          portrait.style.setProperty("--rx", (-y * 4).toFixed(2) + "deg");
          portrait.style.setProperty("--lx", (x * 14).toFixed(1) + "px");
          portrait.style.setProperty("--ly", (y * 10).toFixed(1) + "px");
        });
      }, { passive: true });
      document.documentElement.addEventListener("pointerleave", function () { setFollow(null); });
    } else {
      window.addEventListener("scroll", function () {
        if (raf || paused || !Object.keys(frames).length) return;
        raf = requestAnimationFrame(function () { raf = 0; setFollow(tierFromScroll()); });
      }, { passive: true });
    }

    pauseBtn.addEventListener("click", function () {
      if (reduceMotion) return;
      if (!Object.keys(frames).length) loadFrames();
      paused = !paused;
      portrait.classList.toggle("is-paused", paused);
      pauseBtn.setAttribute("aria-pressed", String(!paused));
      pauseBtn.setAttribute("aria-label", paused ? "Play portrait interaction" : "Pause portrait interaction");
      pauseBtn.textContent = paused ? "Play" : "Pause";
      clearTimers(); busy = false;
      if (paused) show(null);
      else { if (!finePointer) follow = tierFromScroll(); settle(); scheduleIdle(); }
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { clearTimers(); busy = false; settle(); }
      else scheduleIdle();
    });

    controls.hidden = false;
    pauseBtn.disabled = reduceMotion;
    if (reduceMotion) pauseBtn.setAttribute("aria-label", "Portrait interaction disabled by reduced motion preference");

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
