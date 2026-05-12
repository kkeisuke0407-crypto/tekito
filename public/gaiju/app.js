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

  // ── Scroll fade-up animations ─────────────────────────────
  var animTargets = [
    ".section-head",
    ".risk-card",
    ".cost-card",
    ".cost-factors",
    ".bat-warning",
    ".ranking-card",
    ".summary-cta-box",
    ".compare-wrap",
    ".faq-item",
  ];
  var allAnimEls = [];
  animTargets.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      allAnimEls.push(el);
    });
  });

  // Stagger siblings inside card groups
  [".risk-cards", ".cost-grid", ".ranking-cards", ".faq-list"].forEach(function (cls) {
    var container = document.querySelector(cls);
    if (!container) return;
    Array.prototype.forEach.call(container.children, function (child, i) {
      child.style.transitionDelay = (i * 0.08) + "s";
    });
  });

  allAnimEls.forEach(function (el) { el.classList.add("anim-up"); });

  if ("IntersectionObserver" in window) {
    var scrollObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("shown");
          scrollObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -32px 0px" });
    allAnimEls.forEach(function (el) { scrollObs.observe(el); });

    // ── Eval bar animated fill ────────────────────────────────
    document.querySelectorAll(".eval-bars").forEach(function (barsEl) {
      var fills = barsEl.querySelectorAll(".eval-bar-fill");
      fills.forEach(function (fill) {
        fill.setAttribute("data-w", fill.style.width);
        fill.style.width = "0";
        fill.style.transition = "none";
      });
      var barObs = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        fills.forEach(function (fill, i) {
          setTimeout(function () {
            fill.style.transition = "width .8s cubic-bezier(.22,.68,0,1.1)";
            fill.style.width = fill.getAttribute("data-w");
          }, i * 140 + 160);
        });
        barObs.disconnect();
      }, { threshold: 0.5 });
      barObs.observe(barsEl);
    });
  }

  // ── Button ripple on click ────────────────────────────────
  document.querySelectorAll(".ranking-cta, .hero-cta, .footer-cta-btn, .summary-cta-btn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      var ripple = document.createElement("span");
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height) * 1.5;
      ripple.style.cssText =
        "position:absolute;border-radius:50%;background:rgba(255,255,255,.3);" +
        "pointer-events:none;transform:scale(0);animation:ripple-expand .55s ease forwards;" +
        "width:" + size + "px;height:" + size + "px;" +
        "left:" + (e.clientX - rect.left - size / 2) + "px;" +
        "top:" + (e.clientY - rect.top - size / 2) + "px;";
      btn.appendChild(ripple);
      setTimeout(function () { ripple.remove(); }, 600);
    });
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
