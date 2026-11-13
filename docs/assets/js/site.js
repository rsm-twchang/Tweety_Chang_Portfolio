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

  // Living portrait. Pointer entry activates tracking; Play also works on touch.
  // An explicit Pause keeps tracking off until the visitor presses Play again.
  // Live: she looks toward the cursor, smiles as it nears her face, and blinks.
  // Touch screens: gaze and smile follow the portrait's position while scrolling.
  // User-approved source photographs, plus one generated upper-right gaze extension.
  var portrait = document.querySelector("[data-portrait]");
  var layers = document.querySelector("[data-portrait-layers]");
  var controls = document.querySelector("[data-portrait-controls]");
  if (portrait && layers && controls) {
    var NAMES = ["smile", "look-left", "look-right", "look-up", "look-down", "look-upper-right", "wink", "surprise", "frown", "tilt"];
    var frames = {};
    var loaded = false;
    var current = null;     // frame on screen (null = original photo)
    var follow = null;      // frame chosen by cursor or scroll position
    var paused = true;
    var autoStart = !reduceMotion;
    var busy = false;       // a scripted sequence is playing
    var timers = [];
    var pauseBtn = controls.querySelector("[data-portrait-toggle]");
    var note = controls.querySelector("[data-portrait-note]");
    var exprBtns = controls.querySelectorAll("[data-expression]");
    var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var size = (window.devicePixelRatio || 1) > 1.5 ? 960 : 480;

    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function loadFrames() {
      if (loaded) return;
      loaded = true;
      NAMES.forEach(function (name) {
        var img = new Image();
        img.className = "frame";
        img.alt = "";
        img.decoding = "async";
        img.addEventListener("load", function () {
          frames[name] = img;
          if (current === name) { current = null; show(name); }
        });
        img.src = "assets/img/portrait-cutout/" + name + "-" + size + ".webp";
        layers.appendChild(img);
      });
    }

    function show(name, blink) {
      // Use one teeth-showing smile for every smiling interaction.
      if (["natural", "warm", "soft", "laugh", "grin"].indexOf(name) !== -1) name = "smile";
      if (name === "turn-left") name = "look-left";
      if (name === "turn-right") name = "look-right";
      if (name === "blink") name = "wink";
      if (name === "concern" || name === "concern2") name = "tilt";
      if (name === "puff") name = "surprise";
      if (name === current) return;
      if (current && frames[current]) frames[current].classList.remove("is-on", "is-blink");
      current = name;
      layers.classList.toggle("has-frame", !!(name && frames[name]));
      if (name && frames[name]) {
        frames[name].classList.toggle("is-blink", !!blink);
        frames[name].classList.add("is-on");
      }
    }

    var smiling = false;    // Smile is held: one natural smile, nothing else
    function settle() { show(paused ? null : smiling ? "natural" : follow); }

    function play(steps) {
      if (paused) return;
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

    // Natural blinks while she faces forward
    function scheduleIdle() {
      clearTimers();
      if (paused || reduceMotion) return;
      later(function () {
        if (busy || follow || smiling || document.hidden) return scheduleIdle();
        play(Math.random() < 0.15 ? [["blink", 120], [null, 140], ["blink", 120]] : [["blink", 130]]);
      }, 2800 + Math.random() * 3400);
    }

    function setFollow(name) {
      if (name === follow) return;
      follow = name;
      if (!busy && !paused && !smiling) show(follow);
    }

    // Cursor position relative to her face, in portrait widths
    function frameFromPointer(x, y) {
      var r = layers.getBoundingClientRect();
      var dx = (x - (r.left + r.width * 0.5)) / r.width;
      var dy = (y - (r.top + r.height * 0.36)) / r.width;
      var d = Math.hypot(dx, dy);
      if (dx > 0.22 && dy < -0.22) return "look-upper-right";
      if (d < 0.16) return "smile";
      if (d < 0.36) return "soft";
      if (Math.abs(dx) >= Math.abs(dy) * 0.8) {
        // Turn the head once the cursor is past 65% of the way to that side's window edge
        var fx = r.left + r.width * 0.5;
        var room = dx > 0 ? window.innerWidth - fx : fx;
        var far = Math.abs(x - fx) > room * 0.65;
        if (dx > 0) return far ? "turn-right" : "look-right";
        return far ? "turn-left" : "look-left";
      }
      return dy < 0 ? "look-up" : "look-down";
    }

    // Touch: look toward the middle of the screen, smile when centered
    function frameFromScroll() {
      var r = layers.getBoundingClientRect();
      var off = ((r.top + r.height * 0.4) - window.innerHeight / 2) / window.innerHeight;
      if (Math.abs(off) < 0.1) return "smile";
      if (Math.abs(off) > 0.45) return null;
      return off > 0 ? "look-up" : "look-down";
    }

    function setLive(live) {
      paused = !live;
      if (live) loadFrames();
      portrait.classList.toggle("is-paused", paused);
      pauseBtn.textContent = paused ? "Play" : "Pause";
      pauseBtn.setAttribute("aria-pressed", String(!paused));
      pauseBtn.setAttribute("aria-label", paused ? "Play portrait" : "Pause portrait");
      if (note) note.textContent = paused ? "Taking a moment." : "A little more human.";
      exprBtns.forEach(function (b) { b.hidden = paused; });
      clearTimers(); busy = false;
      if (paused) { follow = null; smiling = false; if (smileBtn) smileBtn.setAttribute("aria-pressed", "false"); show(null); }
      else { if (!finePointer) follow = frameFromScroll(); settle(); scheduleIdle(); }
    }

    var raf = 0, lastX = 0, lastY = 0;
    if (finePointer) {
      window.addEventListener("pointermove", function (e) {
        lastX = e.clientX; lastY = e.clientY;
        if (autoStart && paused) {
          var bounds = portrait.getBoundingClientRect();
          if (lastX >= bounds.left && lastX <= bounds.right && lastY >= bounds.top && lastY <= bounds.bottom) {
            autoStart = false;
            setLive(true);
          }
        }
        if (raf || paused) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var r = portrait.getBoundingClientRect();
          if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
          if (!pauseBtn.matches(":hover")) setFollow(frameFromPointer(lastX, lastY));
          if (reduceMotion) return;
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
      // About to pause? She looks a little concerned.
      pauseBtn.addEventListener("pointerenter", function () { if (!paused) setFollow("concern"); });
      // Start loading frames as soon as someone reaches for Play
      pauseBtn.addEventListener("pointerenter", loadFrames, { once: true });
    } else {
      window.addEventListener("scroll", function () {
        if (raf || paused) return;
        raf = requestAnimationFrame(function () { raf = 0; setFollow(frameFromScroll()); });
      }, { passive: true });
    }
    pauseBtn.addEventListener("focus", loadFrames, { once: true });

    // Smile is a toggle: it holds one natural smile until pressed again or paused
    var smileBtn = controls.querySelector('[data-expression="smile"]');
    function setSmiling(on) {
      smiling = on;
      if (smileBtn) smileBtn.setAttribute("aria-pressed", String(on));
      clearTimers(); busy = false; settle(); scheduleIdle();
    }
    if (smileBtn) smileBtn.addEventListener("click", function () { setSmiling(!smiling); });

    pauseBtn.addEventListener("click", function () { autoStart = false; setLive(paused); });

    // Tap the portrait: wake it up when paused, otherwise a small surprise
    var PLAYFUL = [
      [["wink", 900], ["warm", 500]],
      [["puff", 1300], ["grin", 700]],
      [["tilt", 1400], ["soft", 500]],
      [["frown", 900], ["laugh", 1200], ["warm", 500]],
      [["concern2", 1100], ["grin", 800]]
    ];
    var playfulIndex = 0;
    layers.addEventListener("click", function () {
      autoStart = false;
      if (paused) setLive(true);
      else play(PLAYFUL[playfulIndex++ % PLAYFUL.length]);
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { clearTimers(); busy = false; settle(); }
      else scheduleIdle();
    });

    controls.hidden = false;
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
