/* ══════════════════════════════════════════════════
   中の人ナビ — ナーチャリングJS
   - localStorageベースの「閲覧履歴」「しおり」
   - プライバシー配慮の案内バナー（初回訪問時）
   - 履歴に残さない設計（cookieは使用しない）
   ══════════════════════════════════════════════════ */
(function() {
  'use strict';

  const STORAGE_KEY = 'nakanohito_v1';
  const PRIVACY_DISMISS_KEY = 'nakanohito_privacy_dismissed';
  const MAX_HISTORY = 20;

  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { history: [], lastRead: null, scroll: {} };
    } catch (e) {
      return { history: [], lastRead: null, scroll: {} };
    }
  }

  function writeState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  /* ── 記事閲覧トラッキング ───────────────── */
  function trackColumnView(slug, title, category) {
    if (!slug) return;
    const state = readState();
    state.history = state.history.filter(h => h.slug !== slug);
    state.history.unshift({ slug, title, category, ts: Date.now() });
    if (state.history.length > MAX_HISTORY) state.history = state.history.slice(0, MAX_HISTORY);
    state.lastRead = { slug, title, category, ts: Date.now() };
    writeState(state);
  }

  /* ── スクロール位置の保存・復元 ───────── */
  function saveScrollPosition(slug) {
    const state = readState();
    state.scroll[slug] = Math.round(window.scrollY);
    writeState(state);
  }

  function getScrollPosition(slug) {
    const state = readState();
    return state.scroll[slug] || 0;
  }

  /* ── 「前回の続き」カードを描画 ───────── */
  function renderResumeCard(containerEl) {
    if (!containerEl) return;
    const state = readState();
    if (!state.lastRead || !state.lastRead.slug) return;
    const { slug, title } = state.lastRead;
    const html = `
      <div class="nurture-resume" role="region" aria-label="前回読んだ記事">
        <div class="nurture-resume-icon">📖</div>
        <div class="nurture-resume-body">
          <span class="nurture-resume-label">前回読んだ記事の続き</span>
          <a href="/detective/column/${slug}/" class="nurture-resume-link">${title} →</a>
        </div>
        <button class="nurture-resume-close" aria-label="閉じる" data-nurture-close-resume>✕</button>
      </div>
    `;
    containerEl.insertAdjacentHTML('afterbegin', html);
    const closeBtn = containerEl.querySelector('[data-nurture-close-resume]');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        const card = containerEl.querySelector('.nurture-resume');
        if (card) card.remove();
      });
    }
  }

  /* ── プライバシー配慮バナー ──────────────
     初回訪問時のみ表示。明示的に閉じるまで残る。
     家族と端末を共有している可能性のあるユーザーへの配慮。
  */
  function renderPrivacyBanner() {
    if (localStorage.getItem(PRIVACY_DISMISS_KEY) === '1') return;
    const isMobile = window.innerWidth < 720;
    const banner = document.createElement('div');
    banner.className = 'nurture-privacy-banner';
    banner.innerHTML = `
      <div class="nurture-privacy-inner">
        <span class="nurture-privacy-icon" aria-hidden="true">🔒</span>
        <span class="nurture-privacy-text">${isMobile ? '誰にも知られず読みたい方は<strong>シークレット/プライベートモード</strong>でのご利用をおすすめします。' : '誰にも知られず読みたい方は、ブラウザの<strong>シークレット/プライベートモード</strong>でのご利用をおすすめします。閲覧履歴が残りません。'}</span>
        <button class="nurture-privacy-close" aria-label="このメッセージを閉じる" data-nurture-privacy-close>OK</button>
      </div>
    `;
    document.body.appendChild(banner);
    banner.querySelector('[data-nurture-privacy-close]').addEventListener('click', function() {
      localStorage.setItem(PRIVACY_DISMISS_KEY, '1');
      banner.classList.add('nurture-privacy-hide');
      setTimeout(() => banner.remove(), 300);
    });
    setTimeout(() => banner.classList.add('nurture-privacy-show'), 50);
  }

  /* ── public API ────────────────────────── */
  window.NakanohitoNurture = {
    trackColumnView: trackColumnView,
    saveScrollPosition: saveScrollPosition,
    getScrollPosition: getScrollPosition,
    renderResumeCard: renderResumeCard,
    renderPrivacyBanner: renderPrivacyBanner,
    readState: readState
  };

  /* ── 自動初期化 ────────────────────────── */
  document.addEventListener('DOMContentLoaded', function() {
    renderPrivacyBanner();

    const slot = document.querySelector('[data-nurture-resume-slot]');
    if (slot) renderResumeCard(slot);

    const articleMeta = document.querySelector('[data-nurture-article]');
    if (articleMeta) {
      const slug = articleMeta.getAttribute('data-slug');
      const title = articleMeta.getAttribute('data-title');
      const category = articleMeta.getAttribute('data-category');
      if (slug && title) trackColumnView(slug, title, category);

      let scrollSaveTimer = null;
      window.addEventListener('scroll', function() {
        if (scrollSaveTimer) clearTimeout(scrollSaveTimer);
        scrollSaveTimer = setTimeout(() => saveScrollPosition(slug), 400);
      }, { passive: true });
    }
  });
})();
