/* ============================================================
   害獣駆除 PPC比較記事LP 共通スクリプト
   対象: /gaiju/nezumi/ , /gaiju/koumori/ , /gaiju/hakubishin/

   役割:
   1. アフィリエイトCTAクリックを affiliate_click として dataLayer へ送る
   2. Google広告から受け取ったUTMをsessionStorageで保持する
   3. FAQ開閉 / スクロール到達を補助イベントとして送る
   4. アフィリエイトURL未設定のCTAは遷移させず、明示的にエラーを出す

   ※GA4 / Google Ads の測定IDは未提供のため、このファイルには入れていない。
     GTMまたはgtagを読み込めば、そのまま dataLayer 経由でイベントを受け取れる。
   ============================================================ */
(function () {
  'use strict';

  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid'];
  var UTM_STORAGE_KEY = 'gaiju_lp_utm';

  /**
   * アフィリエイトURLへUTMを引き継ぐかどうか。
   * ASPによっては未知のクエリを付けると計測が壊れるため、既定ではfalse。
   * ASPへ確認が取れたらtrueにすると、保持したUTMを遷移先へ付与する。
   */
  var APPEND_UTM_TO_AFFILIATE_URL = false;

  // ── UTM保持 ────────────────────────────────────────────
  function readUtm() {
    var params = new URLSearchParams(window.location.search);
    var found = {};
    var hasNew = false;

    UTM_KEYS.forEach(function (key) {
      var value = params.get(key);
      if (value) {
        found[key] = value;
        hasNew = true;
      }
    });

    if (hasNew) {
      try {
        window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(found));
      } catch (e) {
        /* sessionStorageが使えない環境では保持しない */
      }
      return found;
    }

    try {
      var stored = window.sessionStorage.getItem(UTM_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  }

  var utm = readUtm();

  function appendUtm(url) {
    if (!APPEND_UTM_TO_AFFILIATE_URL) return url;
    var keys = Object.keys(utm);
    if (keys.length === 0) return url;
    try {
      var parsed = new URL(url, window.location.href);
      keys.forEach(function (key) {
        if (!parsed.searchParams.has(key)) parsed.searchParams.set(key, utm[key]);
      });
      return parsed.toString();
    } catch (e) {
      return url;
    }
  }

  // ── 計測 ───────────────────────────────────────────────
  function push(payload) {
    window.dataLayer = window.dataLayer || [];
    try {
      window.dataLayer.push(payload);
    } catch (e) {
      /* 計測失敗でユーザー導線を止めない */
    }
  }

  function trackAffiliateClick(detail) {
    var payload = {
      event: 'affiliate_click',
      animal: detail.animal,
      position: detail.position,
      provider: detail.provider,
    };
    Object.keys(utm).forEach(function (key) {
      payload[key] = utm[key];
    });
    push(payload);

    // 既存 /gaiju/ 側のGA4設定と揃えるための互換イベント
    push({
      event: 'gaiju_affiliate_click',
      track_name: detail.animal + '_' + detail.position,
      affiliate_key: detail.provider,
      link_url: detail.url || '',
    });

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'affiliate_click', {
        animal: detail.animal,
        position: detail.position,
        provider: detail.provider,
      });
    }
  }

  // ── CTA ────────────────────────────────────────────────
  function showUnsetMessage(el) {
    var wrap = el.closest('.gj-cta-wrap') || el.parentNode;
    if (!wrap || wrap.querySelector('.gj-cta-unset-msg')) return;
    var msg = document.createElement('p');
    msg.className = 'gj-cta-unset-msg';
    msg.setAttribute('role', 'alert');
    msg.textContent =
      'アフィリエイトURLが未設定です。src/data/gaiju-providers.ts の affiliateUrl を設定してください（未設定のまま本番公開しないこと）。';
    wrap.appendChild(msg);
  }

  function bindCtas() {
    var ctas = document.querySelectorAll('[data-gj-cta]');

    Array.prototype.forEach.call(ctas, function (el) {
      el.addEventListener('click', function (event) {
        var detail = {
          animal: el.getAttribute('data-animal') || '',
          position: el.getAttribute('data-position') || '',
          provider: el.getAttribute('data-provider') || '',
          url: el.getAttribute('href') || '',
        };

        // URL未設定: 遷移させず、計測だけ確認できるようにする
        if (el.hasAttribute('data-cta-unset')) {
          event.preventDefault();
          trackAffiliateClick(detail);
          showUnsetMessage(el);
          if (window.console && console.error) {
            console.error(
              '[gaiju-lp] affiliateUrl 未設定のためリンク遷移を停止しました:',
              detail.provider
            );
          }
          return;
        }

        // 新規タブ・別クリックはブラウザ既定に任せ、計測だけ行う
        var isPlainClick =
          event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

        if (!isPlainClick) {
          trackAffiliateClick(detail);
          return;
        }

        // 通常クリック: イベント送信を確実にしてから遷移する
        event.preventDefault();
        var destination = appendUtm(detail.url);
        detail.url = destination;
        trackAffiliateClick(detail);

        var moved = false;
        var go = function () {
          if (moved) return;
          moved = true;
          window.location.href = destination;
        };
        // dataLayer.push は同期だが、GTMのタグ送信を待つため僅かに遅延させる
        window.setTimeout(go, 120);
      });
    });
  }

  // ── 補助イベント ───────────────────────────────────────
  function bindFaq() {
    var items = document.querySelectorAll('[data-gj-faq]');
    Array.prototype.forEach.call(items, function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        var summary = item.querySelector('summary');
        push({
          event: 'faq_open',
          animal: (window.GAIJU_LP && window.GAIJU_LP.animal) || '',
          faq_question: summary ? summary.textContent.trim() : '',
        });
      });
    });
  }

  function bindScrollDepth() {
    var sent = {};
    var thresholds = [50, 90];

    function onScroll() {
      var doc = document.documentElement;
      var scrolled = window.scrollY + window.innerHeight;
      var height = Math.max(doc.scrollHeight, document.body.scrollHeight);
      if (height <= 0) return;
      var percent = (scrolled / height) * 100;

      thresholds.forEach(function (t) {
        if (percent >= t && !sent[t]) {
          sent[t] = true;
          push({
            event: 'scroll_' + t,
            animal: (window.GAIJU_LP && window.GAIJU_LP.animal) || '',
          });
        }
      });

      if (sent[50] && sent[90]) window.removeEventListener('scroll', onScroll);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function bindSectionViews() {
    if (!('IntersectionObserver' in window)) return;
    var targets = [
      { selector: '#comparison', event: 'comparison_view' },
      { selector: '#ranking', event: 'rank1_view' },
    ];

    targets.forEach(function (target) {
      var el = document.querySelector(target.selector);
      if (!el) return;
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            push({
              event: target.event,
              animal: (window.GAIJU_LP && window.GAIJU_LP.animal) || '',
            });
            observer.disconnect();
          });
        },
        { threshold: 0.3 }
      );
      observer.observe(el);
    });
  }

  function init() {
    bindCtas();
    bindFaq();
    bindScrollDepth();
    bindSectionViews();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
