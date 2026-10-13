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

   İki ayrı izin: analitik (Google Analytics) ve reklam (Meta Pixel + Google
   reklam sinyalleri). Reddet ve Kabul et aynı ağırlıkta; "Tercihleri seç" ile
   yalnız birine izin verilebilir.

   Politika metni değişip yeniden onay gerekirse VERSION artırılır.
   (2: 13.10.2026 reklam izni eklendi — herkese yeniden sorulur.) */
(function () {
  "use strict";

  var GTM_ID = "GTM-PLC3D8TR";
  var GA_ID = "G-1S09MJPFZS";
  /* Meta Events Manager > Veri kaynakları > Piksel kimliği. Boşken piksel
     hiç yüklenmez (reklam izni verilse bile). */
  var META_PIXEL_ID = "1783502096331319";
  var KEY = "hl-consent";
  var VERSION = 2;
  var passive = document.currentScript && document.currentScript.hasAttribute("data-passive");
  var gtmLoaded = false;
  var metaLoaded = false;
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
  function write(analytics, ads) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: VERSION, analytics: analytics, ads: ads, t: new Date().toISOString() }));
    } catch (e) {}
  }

  function adSignals(ads) {
    var v = ads ? "granted" : "denied";
    return { ad_storage: v, ad_user_data: v, ad_personalization: v };
  }

  /* Meta Pixel (resmî yükleyici). fbq kuyruğu hemen kurulur; olaylar betik
     gelince gönderilir. funnel track() Lead/InitiateCheckout/Purchase'ı
     buradan yollar. */
  function loadMeta() {
    if (metaLoaded || passive || !META_PIXEL_ID) return;
    metaLoaded = true;
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,"script","https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */
    window.fbq("init", META_PIXEL_ID);
    window.fbq("track", "PageView");
  }

  function loadGtm(ads) {
    if (passive) return;
    if (gtmLoaded) {
      if (window.gtag) window.gtag("consent", "update", adSignals(ads));
      return;
    }
    gtmLoaded = true;
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    /* Analitik izni verildi; reklam sinyalleri ayrı izne bağlı. */
    var c = adSignals(ads);
    c.analytics_storage = "granted";
    gtag("consent", "default", c);
    window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtm.js?id=" + GTM_ID;
    document.head.appendChild(s);

    /* GA4 etiketi; eskiden <head>'de onaysız yükleniyordu. */
    gtag("js", new Date());
    gtag("config", GA_ID);
    var g = document.createElement("script");
    g.async = true;
    g.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(g);
    window.gtag = gtag;
  }

  /* İndirme tıklaması: platform ve bölüm bazında, yalnızca onay varsa.
     Bu bir tıklamadır, kurulum değil; kurulum ve abonelik mağaza
     tarafındaki ilişkilendirmeyle ayrıca doğrulanmalı. */
  document.addEventListener("click", function (e) {
    if (!gtmLoaded) return;
    var a = e.target.closest("[data-store], .js-store, .js-funnel");
    if (!a) return;
    var section = a.closest("section, header, nav, footer");
    // Funnel'a giden düğme (main.js js-store sınıfını kaldırıyor): mağaza
    // tıklaması değil, testin başlangıcı — ayrı olay.
    if (!a.classList.contains("js-store") && a.classList.contains("js-funnel")) {
      window.gtag("event", "funnel_click", {
        funnel_place: a.getAttribute("data-place") || "unknown"
      });
      return;
    }
    var platform = a.getAttribute("data-store") ||
      document.documentElement.getAttribute("data-platform") || "desktop";
    window.gtag("event", "store_click", {
      store_platform: platform,
      store_place: a.getAttribute("data-place") || (section && (section.id || section.className.split(" ")[0])) || "unknown"
    });
  });

  /* Onay geri alınınca Google Analytics çerezlerini sil. */
  function clearAnalyticsCookies() {
    var host = location.hostname;
    var domains = ["", host, "." + host, "." + host.split(".").slice(-2).join(".")];
    document.cookie.split(";").forEach(function (c) {
      var name = c.split("=")[0].trim();
      if (!/^(_ga|_gid|_gat|_gcl|_fbp|_fbc)/.test(name)) return;
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

  function decide(analytics, ads) {
    var before = read();
    write(analytics, ads);
    close();
    /* Daha önce verilmiş bir izin geri alındıysa: çalışan etiketleri
       durdurmanın güvenilir yolu çerezleri silip sayfayı yeniden yüklemek. */
    if (before && ((before.analytics && !analytics) || (before.ads && !ads))) {
      clearAnalyticsCookies();
      location.reload();
      return;
    }
    if (analytics) loadGtm(ads);
    if (ads) loadMeta();
  }

  function open(fromUser) {
    if (banner) return;
    var cur = read();
    var legalHref = /legal\.html$/.test(location.pathname) ? "#cerez" : "/legal.html#cerez";
    banner = document.createElement("section");
    banner.className = "consent";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-live", "polite");
    banner.setAttribute("aria-label", "Çerez tercihleri");
    banner.innerHTML =
      '<div class="consent__text">' +
      '<p class="consent__title">Çerez tercihin</p>' +
      "<p>Siteyi geliştirmek için ziyaret istatistiklerini (Google Analytics), reklamlarımızın " +
      "etkisini görmek için de reklam ölçümünü (Meta Pixel) kullanmak istiyoruz. Bunlar yalnızca " +
      "sen izin verirsen çalışır; reddedersen site aynı şekilde çalışır. " +
      '<a href="' + legalHref + '">Çerez Politikası</a></p>' +
      '<div class="consent__opts" hidden>' +
      '<label class="consent__opt"><input type="checkbox" data-opt="analytics"' + (cur && cur.analytics ? " checked" : "") + " />" +
      "<span><b>Analitik</b> Ziyaret istatistikleri (Google Analytics)</span></label>" +
      '<label class="consent__opt"><input type="checkbox" data-opt="ads"' + (cur && cur.ads ? " checked" : "") + " />" +
      "<span><b>Reklam</b> Reklam ölçümü ve kişiselleştirme (Meta Pixel, Google)</span></label>" +
      "</div>" +
      '<button type="button" class="consent__more" data-consent="more">Tercihleri seç</button>' +
      "</div>" +
      '<div class="consent__actions">' +
      '<button type="button" class="consent__btn" data-consent="no">Reddet</button>' +
      '<button type="button" class="consent__btn consent__btn--yes" data-consent="yes">Kabul et</button>' +
      "</div>";
    banner.addEventListener("click", function (e) {
      var b = e.target.closest("[data-consent]");
      if (!b) return;
      var k = b.getAttribute("data-consent");
      if (k === "more") {
        /* Seçenekler açılınca "Kabul et" seçimi kaydeder. */
        banner.querySelector(".consent__opts").hidden = false;
        b.hidden = true;
        var yes = banner.querySelector('[data-consent="yes"]');
        yes.setAttribute("data-consent", "save");
        yes.textContent = "Seçimi kaydet";
        return;
      }
      if (k === "save") {
        decide(
          banner.querySelector('[data-opt="analytics"]').checked,
          banner.querySelector('[data-opt="ads"]').checked
        );
        return;
      }
      decide(k === "yes", k === "yes");
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
    if (c && c.analytics) loadGtm(!!c.ads);
    if (c && c.ads) loadMeta();
    if (!c && !passive) open(false);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
