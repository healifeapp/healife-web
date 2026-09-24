/* Healife — çerez onayı ve Google Tag Manager yükleyicisi.

   Kural: ziyaretçi "Kabul et" demeden Google Tag Manager YÜKLENMEZ, dolayısıyla
   hiçbir analitik çerezi yazılmaz. Tercih, tarayıcının yerel depolamasında
   "hl-consent" anahtarıyla saklanır (zorunlu kayıt; kişiyi tanımlamaz).

   Kullanım:
     <script src="scripts/consent.js" defer></script>
       -> tercih yoksa bandı gösterir, onay varsa GTM'yi yükler.
     <script src="scripts/consent.js" data-passive defer></script>
       -> bandı kendiliğinden göstermez, GTM yüklemez (legal.html: uygulama
          içinden açılıyor). Yalnızca "Çerez tercihleri" düğmesi çalışır.
     Herhangi bir öğeye data-consent-open eklenirse tıklanınca bant açılır.

   Politika metni değişip yeniden onay gerekirse VERSION artırılır. */
(function () {
  "use strict";

  var GTM_ID = "GTM-PLC3D8TR";
  var KEY = "hl-consent";
  var VERSION = 1;
  var passive = document.currentScript && document.currentScript.hasAttribute("data-passive");
  var gtmLoaded = false;
  var banner = null;
  var lastFocus = null;

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY));
      return v && v.v === VERSION ? v : null;
    } catch (e) {
      return null;
    }
  }
  function write(analytics) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: VERSION, analytics: analytics, t: new Date().toISOString() }));
    } catch (e) {}
  }

  function loadGtm() {
    if (gtmLoaded || passive) return;
    gtmLoaded = true;
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    /* Yalnızca analitik izni verilir; reklam sinyalleri kapalı kalır. */
    gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
    window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtm.js?id=" + GTM_ID;
    document.head.appendChild(s);
  }

  /* Onay geri alınınca Google Analytics çerezlerini sil. */
  function clearAnalyticsCookies() {
    var host = location.hostname;
    var domains = ["", host, "." + host, "." + host.split(".").slice(-2).join(".")];
    document.cookie.split(";").forEach(function (c) {
      var name = c.split("=")[0].trim();
      if (!/^(_ga|_gid|_gat|_gcl)/.test(name)) return;
      domains.forEach(function (d) {
        document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + (d ? "; domain=" + d : "");
      });
    });
  }

  function close() {
    if (!banner) return;
    banner.remove();
    banner = null;
    document.documentElement.classList.remove("has-consent-banner");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
  }

  function decide(analytics) {
    var before = read();
    write(analytics);
    close();
    if (analytics) {
      loadGtm();
    } else if (before && before.analytics) {
      /* Çalışmakta olan etiketleri durdurmanın güvenilir yolu sayfayı
         GTM'siz yeniden yüklemektir. */
      clearAnalyticsCookies();
      location.reload();
    }
  }

  function open(fromUser) {
    if (banner) return;
    var legalHref = /legal\.html$/.test(location.pathname) ? "#cerez" : "legal.html#cerez";
    banner = document.createElement("section");
    banner.className = "consent";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-live", "polite");
    banner.setAttribute("aria-label", "Çerez tercihleri");
    banner.innerHTML =
      '<div class="consent__text">' +
      '<p class="consent__title">Çerez tercihin</p>' +
      "<p>Siteyi geliştirmek için ziyaret istatistiklerini Google Analytics ile ölçmek istiyoruz. " +
      "Bu çerezler yalnızca sen kabul edersen kullanılır; reddedersen site aynı şekilde çalışır. " +
      '<a href="' + legalHref + '">Çerez Politikası</a></p>' +
      "</div>" +
      '<div class="consent__actions">' +
      '<button type="button" class="consent__btn" data-consent="no">Reddet</button>' +
      '<button type="button" class="consent__btn consent__btn--yes" data-consent="yes">Kabul et</button>' +
      "</div>";
    banner.addEventListener("click", function (e) {
      var b = e.target.closest("[data-consent]");
      if (b) decide(b.getAttribute("data-consent") === "yes");
    });
    banner.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && read()) close();
    });
    document.body.appendChild(banner);
    document.documentElement.classList.add("has-consent-banner");
    if (fromUser) {
      lastFocus = document.activeElement;
      banner.querySelector("[data-consent]").focus();
    }
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-consent-open]");
    if (!t) return;
    e.preventDefault();
    open(true);
  });

  function init() {
    var c = read();
    if (c && c.analytics) loadGtm();
    else if (!c && !passive) open(false);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
