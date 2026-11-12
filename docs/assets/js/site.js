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

  // Original photograph only. One deliberate, finite motion on Play.
  var portrait = document.querySelector("[data-portrait]");
  var layers = document.querySelector("[data-portrait-layers]");
  var controls = document.querySelector("[data-portrait-controls]");
  if (portrait && layers && controls && layers.animate) {
    var playButton = controls.querySelector("[data-portrait-toggle]");
    var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    var animation = null;
    controls.hidden = false;
    function syncMotion() {
      if (animation) { animation.cancel(); animation = null; }
      playButton.disabled = motionPreference.matches;
      playButton.setAttribute("aria-label", motionPreference.matches ? "Portrait animation disabled by reduced motion preference" : "Play portrait animation");
    }
    syncMotion();
    if (motionPreference.addEventListener) motionPreference.addEventListener("change", syncMotion);
    playButton.addEventListener("click", function () {
      if (motionPreference.matches || animation) return;
      playButton.disabled = true;
      animation = layers.animate([
        { transform: "translateY(0) scale(1)" },
        { transform: "translateY(-6px) scale(1.015)", offset: 0.5 },
        { transform: "translateY(0) scale(1)" }
      ], { duration: 3600, easing: "ease-in-out", iterations: 1 });
      animation.onfinish = function () { animation = null; playButton.disabled = false; };
    });
    document.addEventListener("visibilitychange", function () { if (document.hidden) syncMotion(); });
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
