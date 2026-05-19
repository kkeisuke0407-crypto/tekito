/* Water Server LP – app.js
 * Update AFFILIATE_LINKS values when URLs are confirmed.
 */

const AFFILIATE_LINKS = {
  oken:           "https://px.a8.net/svt/ejp?a8mat=4B1XE4+325A0A+1LOO+5Z6WY",
  oken_banner:    "https://px.a8.net/svt/ejp?a8mat=4B1XE4+325A0A+1LOO+6NMJL",
  every_frecious: "https://px.a8.net/svt/ejp?a8mat=4B1XE4+3H144Q+2B8Y+15PEXE",
  every_banner:   "https://px.a8.net/svt/ejp?a8mat=4B1XE4+3H144Q+2B8Y+15Y7A9",
  frecious:       "https://px.a8.net/svt/ejp?a8mat=4B1XE4+3TJ7U2+2B8Y+674EQ",
  frecious_banner: "https://px.a8.net/svt/ejp?a8mat=4B1XE4+3TJ7U2+2B8Y+6N741",
  cosmo:          "https://px.a8.net/svt/ejp?a8mat=4B3G6G+F173ZE+4K9C+NW4IA",
  cosmo_banner:   "https://px.a8.net/svt/ejp?a8mat=4B3G6G+F173ZE+4K9C+NUMHT",
  water_one:      "https://h.accesstrade.net/sp/cc?rk=0100pknn00orwp",
  water_one_banner: "https://h.accesstrade.net/sp/cc?rk=0100pknr00orwp",
  ocean:          "https://h.accesstrade.net/sp/cc?rk=0100o23g00orwp",
  ocean_banner:   "https://h.accesstrade.net/sp/cc?rk=0100o23o00orwp"
};

function a8PixelFromUrl(url) {
  if (!url || url.indexOf("a8mat=") === -1) return "";
  var match = url.match(/[?&]a8mat=([^&]+)/);
  return match ? "https://www10.a8.net/0.gif?a8mat=" + match[1] : "";
}

function syncAffiliateLinkAttributes() {
  var existingPixels = {};
  document.querySelectorAll('img[src*="a8.net/0.gif"]').forEach(function (img) {
    var pixel = a8PixelFromUrl(img.getAttribute("src") || "");
    if (pixel) existingPixels[pixel] = true;
  });

  var pixels = {};
  document.querySelectorAll('a[href*="px.a8.net"]').forEach(function (link) {
    var pixel = a8PixelFromUrl(link.getAttribute("href") || "");
    if (pixel && !existingPixels[pixel]) pixels[pixel] = true;
  });

  document.querySelectorAll('a[href*="h.accesstrade.net/sp/cc"]').forEach(function (link) {
    if (!link.getAttribute("referrerpolicy")) {
      link.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
    }
  });

  var pixelUrls = Object.keys(pixels);
  if (!pixelUrls.length) return;
  var holder = document.createElement("div");
  holder.setAttribute("aria-hidden", "true");
  holder.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);";
  pixelUrls.forEach(function (src) {
    var img = document.createElement("img");
    img.src = src;
    img.alt = "";
    img.width = 1;
    img.height = 1;
    img.loading = "lazy";
    holder.appendChild(img);
  });
  document.body.appendChild(holder);
}

const PROVIDER_META = {
  oken: { provider: "oken", rank: 1 },
  every: { provider: "every_frecious", rank: 2 },
  every_frecious: { provider: "every_frecious", rank: 2 },
  ocean: { provider: "ocean", rank: 3 },
  frecious: { provider: "frecious", rank: 4 },
  water_one: { provider: "water_one", rank: 5 },
  "water-one": { provider: "water_one", rank: 5 },
  cosmo: { provider: "cosmo", rank: null }
};

(function(c, l, a, r, i, t, y) {
  c[a] = c[a] || function() { (c[a].q = c[a].q || []).push(arguments); };
  t = l.createElement(r);
  t.async = 1;
  t.src = "https://www.clarity.ms/tag/" + i;
  y = l.getElementsByTagName(r)[0];
  y.parentNode.insertBefore(t, y);
})(window, document, "clarity", "script", "wt0p3b43o4");

document.documentElement.classList.add("js-ready");

function track(eventName, params) {
  try {
    if (window.dataLayer) window.dataLayer.push({ event: eventName, ...(params || {}) });
    if (typeof gtag === "function") gtag("event", eventName, params || {});
  } catch (_) {}
}

function lpVariant() {
  return window.location.pathname.indexOf("/lp1") >= 0 ? "lp1" : "standard";
}

function normalizeProvider(rawKey) {
  if (!rawKey) return "";
  var cleaned = rawKey
    .replace(/_banner$/, "")
    .replace(/_gallery_\d+$/, "")
    .replace(/-/g, "_");

  if (cleaned.indexOf("every") === 0) return "every_frecious";
  if (cleaned.indexOf("water_one") === 0) return "water_one";
  if (cleaned.indexOf("waterone") === 0) return "water_one";
  if (cleaned.indexOf("oken") === 0) return "oken";
  if (cleaned.indexOf("ocean") === 0) return "ocean";
  if (cleaned.indexOf("frecious") === 0) return "frecious";
  if (cleaned.indexOf("cosmo") === 0) return "cosmo";
  return cleaned;
}

function sectionFromTrack(trackName, el) {
  if (!trackName) return "";
  if (trackName.indexOf("hero") >= 0) return "hero";
  if (trackName.indexOf("top_pick") >= 0) return "top_pick";
  if (trackName.indexOf("table") >= 0) return "comparison_table";
  if (trackName.indexOf("gallery") >= 0) return "gallery";
  if (trackName.indexOf("card") >= 0) return "provider_card";
  if (trackName.indexOf("final") >= 0) return "final";
  if (trackName.indexOf("sticky") >= 0) return "sticky";

  var section = el && el.closest ? el.closest("section[id]") : null;
  return section ? section.id : "";
}

function compactText(text) {
  return (text || "").replace(/\s+/g, " ").trim().slice(0, 80);
}

function buildClickParams(el, affiliateKey, destination) {
  var trackName = el.getAttribute("data-track") || "";
  var provider = normalizeProvider(affiliateKey);
  var meta = PROVIDER_META[provider] || {};

  return {
    track_name: trackName,
    affiliate_key: affiliateKey || "",
    provider: meta.provider || provider || "",
    rank: meta.rank || "",
    section: sectionFromTrack(trackName, el),
    cta_text: compactText(el.textContent),
    lp_variant: lpVariant(),
    page_path: window.location.pathname,
    link_url: destination || "",
    transport_type: "beacon"
  };
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
    if (el.tagName === "A") {
      el.setAttribute("rel", "nofollow sponsored");
      el.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
    }
  });

  // ── CTA click tracking ─────────────────────────────────────────
  document.querySelectorAll("[data-track]").forEach(function (el) {
    el.addEventListener("click", function (event) {
      var affiliateKey = el.getAttribute("data-affiliate") || "";
      var destination = el.getAttribute("href") || "";
      var params = buildClickParams(el, affiliateKey, destination);

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

          track("water_cta_click", params);
          if (params.section === "comparison_table") track("water_table_click", params);
          if (params.section === "sticky") track("water_sticky_click", params);
          track("water_affiliate_click", {
            ...params,
            event_callback: navigate,
            event_timeout: 2000
          });
          window.setTimeout(navigate, 2000);
          return;
        }

        track("water_affiliate_click", params);
        track("water_cta_click", params);
        if (params.section === "comparison_table") track("water_table_click", params);
        if (params.section === "sticky") track("water_sticky_click", params);
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
    '<a href="' + AFFILIATE_LINKS.oken + '" class="sticky-btn btn-attention" data-affiliate="oken" data-track="sticky_oken_cost" rel="nofollow sponsored" referrerpolicy="no-referrer-when-downgrade">月額条件を見る</a>' +
    '<button class="sticky-close" aria-label="閉じる">✕</button>';
  document.body.appendChild(bar);

  var stickyBtn = bar.querySelector("[data-affiliate]");
  var stickyKey = stickyBtn.getAttribute("data-affiliate");
  if (AFFILIATE_LINKS[stickyKey]) stickyBtn.setAttribute("href", AFFILIATE_LINKS[stickyKey]);
  stickyBtn.addEventListener("click", function (event) {
    var destination = stickyBtn.getAttribute("href");
    var params = buildClickParams(stickyBtn, stickyKey, destination);
    if (destination && destination !== "#") {
      event.preventDefault();
      var didNavigate = false;
      var navigate = function () { if (!didNavigate) { didNavigate = true; window.location.href = destination; } };
      track("water_cta_click", params);
      track("water_sticky_click", params);
      track("water_affiliate_click", { ...params, event_callback: navigate, event_timeout: 2000 });
      window.setTimeout(navigate, 2000);
    }
  });

  var dismissed = false;
  bar.querySelector(".sticky-close").addEventListener("click", function () {
    dismissed = true;
    bar.classList.remove("visible");
  });

  var heroEl = document.querySelector(".hero, .lp1-hero");
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

  // ── Scroll depth tracking ─────────────────────────────────────
  var depthMarks = [25, 50, 75, 90];
  var sentDepths = {};
  var depthTimer = null;
  function checkScrollDepth() {
    var doc = document.documentElement;
    var scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
    var depth = Math.round((window.scrollY / scrollable) * 100);

    depthMarks.forEach(function (mark) {
      if (!sentDepths[mark] && depth >= mark) {
        sentDepths[mark] = true;
        track("water_scroll_depth", {
          scroll_percent: mark,
          lp_variant: lpVariant(),
          page_path: window.location.pathname
        });
      }
    });
  }
  window.addEventListener("scroll", function () {
    if (depthTimer) return;
    depthTimer = window.setTimeout(function () {
      depthTimer = null;
      checkScrollDepth();
    }, 250);
  }, { passive: true });
  checkScrollDepth();

  // ── Provider card view tracking ───────────────────────────────
  if ("IntersectionObserver" in window) {
    var viewedProviders = {};
    var providerObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.getAttribute("id") || "";
        if (!id || viewedProviders[id]) return;
        viewedProviders[id] = true;

        var provider = normalizeProvider(id);
        var meta = PROVIDER_META[provider] || {};
        track("water_provider_view", {
          provider: meta.provider || provider,
          rank: meta.rank || "",
          section: "provider_card",
          lp_variant: lpVariant(),
          page_path: window.location.pathname
        });
        providerObserver.unobserve(entry.target);
      });
    }, { threshold: 0.45 });

    document.querySelectorAll(".service-card[id], .lp1-card.service-card[id]").forEach(function (card) {
      providerObserver.observe(card);
    });
  }

  syncAffiliateLinkAttributes();

});
