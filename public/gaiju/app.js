/* 害獣駆除の相場ナビ – app.js
 * A8.net提携承認後に AFFILIATE_LINKS の値を実際のURLに更新する。
 */

const AFFILIATE_LINKS = {
  kujo_tatsujin: "https://example.com/kujo-tatsujin",   // 駆除の達人
  gaiju_protect: "https://example.com/gaiju-protect",   // 害獣プロテック
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
      var destination  = el.getAttribute("href") || "";
      var params = {
        track_name:    el.getAttribute("data-track") || "",
        affiliate_key: affiliateKey,
        link_url:      destination,
        transport_type: "beacon"
      };

      if (affiliateKey) {
        var isPrimary   = !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0;
        var isOutbound  = el.tagName === "A" && destination && destination !== "#";

        if (isPrimary && isOutbound) {
          event.preventDefault();
          var done = false;
          var go   = function () { if (!done) { done = true; window.location.href = destination; } };
          track("gaiju_affiliate_click", { ...params, event_callback: go, event_timeout: 2000 });
          track("gaiju_cta_click", params);
          window.setTimeout(go, 2000);
          return;
        }
        track("gaiju_affiliate_click", params);
        track("gaiju_cta_click", params);
      } else {
        track("gaiju_engagement_click", params);
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

  // ── Smooth scroll ──────────────────────────────────────────────
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
    '<span class="sticky-label">天井の音・害獣被害は放置厳禁。まず無料で状況確認する</span>' +
    '<a href="#" class="sticky-btn" data-affiliate="gaiju_protect" data-track="sticky_protect" rel="nofollow sponsored">無料で見積もりを依頼する</a>' +
    '<button class="sticky-close" aria-label="閉じる">✕</button>';
  document.body.appendChild(bar);

  var stickyBtn = bar.querySelector("[data-affiliate]");
  var stickyKey = stickyBtn.getAttribute("data-affiliate");
  if (AFFILIATE_LINKS[stickyKey]) stickyBtn.setAttribute("href", AFFILIATE_LINKS[stickyKey]);

  stickyBtn.addEventListener("click", function (event) {
    var destination = stickyBtn.getAttribute("href");
    if (destination && destination !== "#") {
      event.preventDefault();
      var done = false;
      var go = function () { if (!done) { done = true; window.location.href = destination; } };
      track("gaiju_affiliate_click", { track_name: "sticky_protect", affiliate_key: "gaiju_protect", link_url: destination, event_callback: go, event_timeout: 2000 });
      window.setTimeout(go, 2000);
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
