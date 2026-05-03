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
  ocean_banner:   "https://h.accesstrade.net/sp/cc?rk=0100o23o00orwp"
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

          track("water_affiliate_click", {
            ...params,
            event_callback: navigate,
            event_timeout: 800
          });
          track("water_cta_click", params);
          window.setTimeout(navigate, 800);
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

});
