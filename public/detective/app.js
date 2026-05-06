/* Detective Comparison LP – app.js
 * Update AFFILIATE_LINKS values when URLs are confirmed.
 */

const AFFILIATE_LINKS = {
  gal:          "https://example.com/gal-agency",          // 総合探偵社ガルエージェンシー
  haraichi:     "https://example.com/haraichi",            // 原一探偵事務所
  hal:          "https://example.com/hal-detective",       // HAL探偵社
  matching:     "https://example.com/detective-matching",  // 探偵マッチングサービス
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

          track("detective_affiliate_click", {
            ...params,
            event_callback: navigate,
            event_timeout: 2000
          });
          track("detective_cta_click", params);
          window.setTimeout(navigate, 2000);
          return;
        }

        track("detective_affiliate_click", params);
        track("detective_cta_click", params);
      } else {
        track("detective_engagement_click", params);
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

  // ── Sticky CTA bar ────────────────────────────────────────────
  var bar = document.createElement("div");
  bar.className = "sticky-cta-bar";
  bar.innerHTML =
    '<span class="sticky-label"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:.3rem" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>無料で複数の探偵事務所を比較できます</span>' +
    '<a href="#" class="sticky-btn" data-affiliate="matching" data-track="sticky_matching" rel="nofollow sponsored">今すぐ無料で比較する</a>' +
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
      track("detective_affiliate_click", {
        track_name: "sticky_matching", affiliate_key: "matching",
        link_url: destination, event_callback: navigate, event_timeout: 2000
      });
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
