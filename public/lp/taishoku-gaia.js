const AFFILIATE_LINKS = {
  gaia_line: "https://must-link.jp/XXX_GAIA_LINE", // もしもアフィリリンクに差し替え
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
  if (typeof gtag === "function") gtag("event", "affiliate_click", { event_label: name });
  if (window.dataLayer) window.dataLayer.push({ event: "affiliate_click", label: name });
  if (typeof ttq !== "undefined") ttq.track("ClickButton", { content_name: name });
}
