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
  cosmo:          "https://px.a8.net/svt/ejp?a8mat=4B3G6G+F173ZE+4K9C+NW4IA",
  cosmo_banner:   "https://px.a8.net/svt/ejp?a8mat=4B3G6G+F173ZE+4K9C+NUMHT",
  water_one:      "https://h.accesstrade.net/sp/cc?rk=0100pknn00orwp",
  water_one_banner: "https://h.accesstrade.net/sp/cc?rk=0100pknr00orwp",
  ocean:          "https://h.accesstrade.net/sp/cc?rk=0100o23g00orwp",
  ocean_banner:   "https://h.accesstrade.net/sp/cc?rk=0100o23o00orwp"
};

document.documentElement.classList.add("js-ready");

function track(eventName, params) {
  try {
    if (window.dataLayer) window.dataLayer.push({ event: eventName, ...(params || {}) });
    if (typeof gtag === "function") gtag("event", eventName, params || {});
  } catch (_) {}
}

document.addEventListener("DOMContentLoaded", function () {

  // ── Reveal animation ──────────────────────────────────────────
  var revealEls = document.querySelectorAll(
    ".reveal-up, .monthly-answer, .monthly-answer-card, .choice-shortcut, .choice-card, .precheck-panel, .intent-card, .quick-card, .service-card, .fee-card, .compare-table-wrap, .faq-item"
  );
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -45px 0px" });

    revealEls.forEach(function (el, index) {
      el.classList.add("reveal-up");
      el.style.transitionDelay = Math.min(index % 4, 3) * 70 + "ms";
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("reveal-up", "is-visible");
    });
  }

  // ── Inject affiliate links ──────────────────────────────────────
  document.querySelectorAll("[data-affiliate]").forEach(function (el) {
    var key = el.getAttribute("data-affiliate");
    if (AFFILIATE_LINKS[key]) el.setAttribute("href", AFFILIATE_LINKS[key]);
  });

  // ── CTA click tracking ─────────────────────────────────────────
  document.querySelectorAll("[data-track]").forEach(function (el) {
    el.addEventListener("click", function (event) {
      var affiliateKey = el.getAttribute("data-affiliate") || "";
      var destination = el.getAttribute("href") || "";
      var params = {
        track_name: el.getAttribute("data-track") || "",
        affiliate_key: affiliateKey,
        link_url: destination,
        transport_type: "beacon"
      };

      if (affiliateKey) {
        var isPrimaryClick = !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0;
        var isOutboundLink = el.tagName === "A" && destination && destination !== "#";

        if (isPrimaryClick && isOutboundLink) {
          event.preventDefault();
          var didNavigate = false;
          var navigate = function () {
            if (didNavigate) return;
            didNavigate = true;
            window.location.href = destination;
          };

          track("water_affiliate_click", {
            ...params,
            event_callback: navigate,
            event_timeout: 2000
          });
          track("water_cta_click", params);
          window.setTimeout(navigate, 2000);
          return;
        }

        track("water_affiliate_click", params);
        track("water_cta_click", params);
      } else {
        track("water_engagement_click", params);
      }
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
    '<span class="sticky-label">月いくら？迷ったら公式条件へ</span>' +
    '<a href="' + AFFILIATE_LINKS.oken + '" class="sticky-btn btn-attention" data-affiliate="oken" data-track="sticky_oken_cost" rel="nofollow sponsored">月額条件を見る</a>' +
    '<button class="sticky-close" aria-label="閉じる">✕</button>';
  document.body.appendChild(bar);

  var stickyBtn = bar.querySelector("[data-affiliate]");
  var stickyKey = stickyBtn.getAttribute("data-affiliate");
  if (AFFILIATE_LINKS[stickyKey]) stickyBtn.setAttribute("href", AFFILIATE_LINKS[stickyKey]);
  stickyBtn.addEventListener("click", function (event) {
    var destination = stickyBtn.getAttribute("href");
    if (destination && destination !== "#") {
      event.preventDefault();
      var didNavigate = false;
      var navigate = function () { if (!didNavigate) { didNavigate = true; window.location.href = destination; } };
      track("water_affiliate_click", { track_name: "sticky_oken_cost", affiliate_key: "oken", link_url: destination, event_callback: navigate, event_timeout: 2000 });
      window.setTimeout(navigate, 2000);
    }
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
