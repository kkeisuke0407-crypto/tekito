/* Detective Comparison LP – app.js
 * Update AFFILIATE_LINKS values when URLs are confirmed.
 */

const AFFILIATE_LINKS = {
  una:          "https://h.accesstrade.net/sp/cc?rk=0100q30l00orzx",        // うな探偵社
  // hal:       "https://example.com/hal-detective",                       // HAL探偵社（控え）
  haraichi:     "https://h.accesstrade.net/sp/cc?rk=0100ken700orzx",      // 原一探偵事務所
  kurol:        "https://h.accesstrade.net/sp/cc?rk=0100paqn00orzx",      // 総合探偵社クロル
  matching:     "https://h.accesstrade.net/sp/cc?rk=0100q1y600orzx",      // 探偵の窓口
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

});
