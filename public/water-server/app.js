/* Water Server LP – app.js
 * Update AFFILIATE_LINKS values when URLs are confirmed.
 */

const AFFILIATE_LINKS = {
  oken:           "https://px.a8.net/svt/ejp?a8mat=4B1XE4+325A0A+1LOO+5Z6WY",
  oken_banner:    "https://px.a8.net/svt/ejp?a8mat=4B1XE4+325A0A+1LOO+6NMJL",
  every_frecious: "https://px.a8.net/svt/ejp?a8mat=4B1XE4+3H144Q+2B8Y+15PEXE",
  every_banner:   "https://px.a8.net/svt/ejp?a8mat=4B1XE4+3H144Q+2B8Y+15XRUP",
  cosmo:          "https://px.a8.net/svt/ejp?a8mat=4B3G6G+F173ZE+4K9C+NW4IA",
  cosmo_banner:   "https://px.a8.net/svt/ejp?a8mat=4B3G6G+F173ZE+4K9C+NUMHT",
  crecla_putio:   "https://example.com/crecla-putio",
  frecious:       "https://px.a8.net/svt/ejp?a8mat=4B1XE4+3TJ7U2+2B8Y+674EQ",
  frecious_banner: "https://px.a8.net/svt/ejp?a8mat=4B1XE4+3TJ7U2+2B8Y+6N741",
  urunon:         "https://example.com/urunon",
  humming:        "https://example.com/humming-water"
};

function track(eventName, params) {
  try {
    if (window.dataLayer) window.dataLayer.push({ event: eventName, ...(params || {}) });
    if (typeof gtag === "function") gtag("event", eventName, params || {});
  } catch (_) {}
}

document.addEventListener("DOMContentLoaded", function () {

  // ── Inject affiliate links ──────────────────────────────────────
  document.querySelectorAll("[data-affiliate]").forEach(function (el) {
    var key = el.getAttribute("data-affiliate");
    if (AFFILIATE_LINKS[key]) el.setAttribute("href", AFFILIATE_LINKS[key]);
  });

  // ── CTA click tracking ─────────────────────────────────────────
  document.querySelectorAll("[data-track]").forEach(function (el) {
    el.addEventListener("click", function () {
      track("water_cta_click", {
        track_name:    el.getAttribute("data-track"),
        affiliate_key: el.getAttribute("data-affiliate") || ""
      });
    });
  });

  // ── FAQ accordion ──────────────────────────────────────────────
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var btn = item.querySelector(".faq-q");
    if (btn) btn.addEventListener("click", function () {
      item.classList.toggle("open");
    });
  });

  // ── Smooth scroll via data-scroll-to ─────────────────────────
  document.querySelectorAll("[data-scroll-to]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      var target = document.querySelector(el.getAttribute("data-scroll-to"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

});
