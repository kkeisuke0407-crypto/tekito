/* Water Server LP – app.js
 * Update AFFILIATE_LINKS values when URLs are confirmed.
 */

const AFFILIATE_LINKS = {
  oken:           "https://px.a8.net/svt/ejp?a8mat=4B1XE4+325A0A+1LOO+5Z6WY",
  oken_banner:    "https://px.a8.net/svt/ejp?a8mat=4B1XE4+325A0A+1LOO+6NMJL",
  every_frecious: "https://px.a8.net/svt/ejp?a8mat=4B1XE4+3H144Q+2B8Y+15PEXE",
  every_banner:   "https://px.a8.net/svt/ejp?a8mat=4B1XE4+3H144Q+2B8Y+15XRUP",
  frecious:       "https://px.a8.net/svt/ejp?a8mat=4B1XE4+3TJ7U2+2B8Y+674EQ",
  frecious_banner: "https://px.a8.net/svt/ejp?a8mat=4B1XE4+3TJ7U2+2B8Y+6N741",
  water_one:      "https://h.accesstrade.net/sp/cc?rk=0100pknn00orwp",
  ocean:          "https://h.accesstrade.net/sp/cc?rk=0100o23g00orwp",
  lohasui:        "https://example.com/lohasui",
  premium_water:  "https://example.com/premium-water"
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

  // ── Compare table filter chips ─────────────────────────────────
  document.querySelectorAll(".filter-chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      document.querySelectorAll(".filter-chip").forEach(function (c) {
        c.classList.remove("active");
      });
      chip.classList.add("active");
      var filter = chip.getAttribute("data-filter");
      document.querySelectorAll("col[data-col-type]").forEach(function (col) {
        col.style.visibility = (filter === "all" || col.getAttribute("data-col-type") === filter)
          ? "" : "collapse";
      });
      track("compare_filter", { filter_type: filter });
    });
  });

  // ── Sticky CTA bar ────────────────────────────────────────────
  var bar = document.createElement("div");
  bar.className = "sticky-cta-bar";
  bar.innerHTML =
    '<span class="sticky-label">🏆 編集部おすすめ：オーケンウォーター</span>' +
    '<a href="#" class="sticky-btn" data-affiliate="oken" data-track="sticky_oken" rel="nofollow sponsored">公式で条件を確認</a>' +
    '<button class="sticky-close" aria-label="閉じる">✕</button>';
  document.body.appendChild(bar);

  var stickyBtn = bar.querySelector("[data-affiliate]");
  var stickyKey = stickyBtn.getAttribute("data-affiliate");
  if (AFFILIATE_LINKS[stickyKey]) stickyBtn.setAttribute("href", AFFILIATE_LINKS[stickyKey]);
  stickyBtn.addEventListener("click", function () {
    track("water_cta_click", { track_name: "sticky_oken", affiliate_key: "oken" });
  });

  var dismissed = false;
  bar.querySelector(".sticky-close").addEventListener("click", function () {
    dismissed = true;
    bar.classList.remove("visible");
  });

  var heroEl = document.querySelector(".hero");
  var faqEl  = document.getElementById("faq");
  window.addEventListener("scroll", function () {
    if (dismissed) return;
    var heroBottom = heroEl ? heroEl.getBoundingClientRect().bottom : 300;
    var faqTop     = faqEl  ? faqEl.getBoundingClientRect().top    : window.innerHeight + 1;
    if (heroBottom < 0 && faqTop > window.innerHeight) {
      bar.classList.add("visible");
    } else {
      bar.classList.remove("visible");
    }
  }, { passive: true });

});
