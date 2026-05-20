/* ====================================================
   taishoku.js — 退職代行LP アフィリリンク管理
   data-affiliate="<key>" に自動注入
   data-track="<name>" で GA4/dataLayer イベント送信
   ==================================================== */

const AFFILIATE_LINKS = {
  momuri:    "https://px.a8.net/svt/ejp?a8mat=XXXX_MOMURI",   // モームリ ← ASP登録後に差し替え
  exit:      "https://px.a8.net/svt/ejp?a8mat=XXXX_EXIT",     // EXIT ← バリューコマースで取得
  guardian:  "https://px.a8.net/svt/ejp?a8mat=XXXX_GUARDIAN", // ガーディアン
  miyabi:    "https://px.a8.net/svt/ejp?a8mat=XXXX_MIYABI",   // 弁護士法人みやび
};

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-affiliate]").forEach(el => {
    const key = el.dataset.affiliate;
    if (AFFILIATE_LINKS[key]) {
      el.href = AFFILIATE_LINKS[key];
      el.target = "_blank";
      el.rel = "noopener noreferrer sponsored";
    }
  });

  document.querySelectorAll("[data-track]").forEach(el => {
    el.addEventListener("click", () => track(el.dataset.track));
  });
});

function track(name) {
  if (typeof gtag === "function") {
    gtag("event", "affiliate_click", { event_label: name });
  }
  if (window.dataLayer) {
    window.dataLayer.push({ event: "affiliate_click", label: name });
  }
  if (typeof ttq !== "undefined") {
    ttq.track("ClickButton", { content_name: name });
  }
}
