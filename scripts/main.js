/* Healife landing — etkileşim.
   Tek dosya, bağımlılık yok. Her davranış kendi başına başarısız olabilir;
   biri çalışmazsa diğerleri etkilenmez. */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, root) {
    return (root || document).querySelector(sel);
  };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* ── Yıl ────────────────────────────────────────────── */
  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ── Mağaza yönlendirmesi (B-14 / B-15) ─────────────
     Genel "indir" bağlantıları HTML'de indir.html'e gider (JS yoksa da
     çalışır). Burada cihaza göre düzeltilir:
       iPhone/iPad → App Store, Android → Google Play,
       masaüstü    → sayfanın altındaki rozet + QR bloğu (#indir).
     UTM parametreleri Google Play'e referrer olarak taşınır (G-62). */
  var STORE = {
    ios: "https://apps.apple.com/app/id6761519395",
    android: "https://play.google.com/store/apps/details?id=com.dcp.humanos",
  };
  var ua = navigator.userAgent || "";
  var isIOS =
    /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/.test(ua);
  var platform = isIOS ? "ios" : isAndroid ? "android" : "desktop";
  document.documentElement.setAttribute("data-platform", platform);

  var utm = (function () {
    var out = [];
    try {
      var q = new URLSearchParams(window.location.search);
      q.forEach(function (v, k) {
        if (/^utm_/i.test(k)) out.push(k + "=" + v);
      });
    } catch (e) {}
    return out.join("&");
  })();

  var storeUrl = function (store) {
    var url = STORE[store];
    if (store === "android" && utm) {
      url += "&referrer=" + encodeURIComponent(utm);
    }
    return url;
  };

  $$("[data-store]").forEach(function (a) {
    a.href = storeUrl(a.getAttribute("data-store"));
  });

  $$(".js-store").forEach(function (a) {
    if (platform === "desktop") {
      a.href = "#indir";
    } else {
      a.href = storeUrl(platform);
    }
  });

  /* ── E-posta adresi (I-82) ──────────────────────────
     HTML'de düz mailto yok; adres burada birleştirilir. */
  $$("[data-mail]").forEach(function (a) {
    var addr = a.getAttribute("data-mail") + "@" + "hea-life" + ".com";
    a.href = "mailto:" + addr;
    a.textContent = addr;
  });

  /* ── Footer'dan SSS maddesine atlama (A-13) ─────────── */
  $$("[data-faq]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var item = document.getElementById(a.getAttribute("data-faq"));
      if (!item) return;
      e.preventDefault();
      var q = item.querySelector(".faq__q");
      if (q && q.getAttribute("aria-expanded") !== "true") q.click();
      item.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    });
  });

  /* ── Egzersiz kartlarında kısa video (E-54) ──────────
     Cloudinary poster'ının 2 saniyelik sessiz döngüsü; ilk hover/dokunmada
     yüklenir, ekrandan çıkınca durur. Hareket azaltma açıksa hiç yüklenmez. */
  if (!reduced) {
    var attachVideo = function (fig) {
      if (fig.querySelector("video")) return fig.querySelector("video");
      var v = document.createElement("video");
      v.src = fig.getAttribute("data-video");
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.setAttribute("aria-hidden", "true");
      v.preload = "none";
      fig.appendChild(v);
      return v;
    };
    var play = function (fig) {
      var v = attachVideo(fig);
      var p = v.play();
      if (p && p.then) p.catch(function () {});
      fig.classList.add("is-playing");
    };
    var stop = function (fig) {
      var v = fig.querySelector("video");
      if (v) v.pause();
      fig.classList.remove("is-playing");
    };
    var figs = $$(".exwall__grid figure[data-video]");
    figs.forEach(function (fig) {
      fig.addEventListener("pointerenter", function (e) {
        if (e.pointerType === "mouse") play(fig);
      });
      fig.addEventListener("pointerleave", function () {
        stop(fig);
      });
      fig.addEventListener("click", function () {
        if (fig.classList.contains("is-playing")) stop(fig);
        else {
          figs.forEach(stop);
          play(fig);
        }
      });
    });
    if ("IntersectionObserver" in window && figs.length) {
      var vio = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) stop(en.target);
          });
        },
        { threshold: 0 }
      );
      figs.forEach(function (f) {
        vio.observe(f);
      });
    }
  }

  /* ── Hero girişi ────────────────────────────────────── */
  var hero = $("#hero");
  if (hero) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        hero.classList.add("is-loaded");
      });
    });
  }

  /* ── Sayfa başı şeridi + yüzen dock ─────────────────
     Dock hero geçilince belirir. Aşağı kaydırırken kenara çekilir,
     yukarı kaydırınca hemen geri gelir — okurken yoldan çekilsin diye. */
  var topbar = $("#topbar");
  var dock = $("#dock");
  var dockLinks = $("#dockLinks");
  var pill = $(".dock__pill");

  if (dock && dockLinks) {
    var links = $$("a", dockLinks);
    var sections = links
      .map(function (a) {
        var id = a.getAttribute("href");
        return id && id.charAt(0) === "#" ? document.querySelector(id) : null;
      })
      .map(function (el, i) {
        return { el: el, link: links[i] };
      })
      .filter(function (s) {
        return s.el;
      });

    var activeLink = null;

    var movePill = function (link) {
      if (!pill || !link) return;
      pill.style.setProperty("--pill-x", link.offsetLeft + "px");
      pill.style.setProperty("--pill-w", link.offsetWidth + "px");
      pill.classList.add("is-on");
    };

    var setActive = function (link) {
      if (link === activeLink) return;
      links.forEach(function (a) {
        a.classList.toggle("is-active", a === link);
      });
      activeLink = link;
      movePill(link);
    };

    /* Fareyle üzerine gelince hap oraya kayar, çıkınca aktif bölüme döner */
    links.forEach(function (a) {
      a.addEventListener("pointerenter", function () {
        movePill(a);
      });
    });
    dockLinks.addEventListener("pointerleave", function () {
      if (activeLink) movePill(activeLink);
      else if (pill) pill.classList.remove("is-on");
    });

    var lastY = window.scrollY;
    var ticking = false;

    var update = function () {
      ticking = false;
      var y = window.scrollY;
      var heroEl = $("#hero");
      var threshold = heroEl ? heroEl.offsetHeight * 0.62 : 400;
      var past = y > threshold;

      dock.classList.toggle("is-in", past);
      if (topbar) topbar.classList.toggle("is-gone", past);

      /* Aşağı kaydırırken gizle, yukarı kaydırırken göster.
         12px'lik ölü bölge, dokunmatik ekranlardaki mikro titremelerin
         dock'u sürekli açıp kapatmasını engelliyor. */
      if (past) {
        var delta = y - lastY;
        if (delta > 12) dock.classList.add("is-hidden");
        else if (delta < -12) dock.classList.remove("is-hidden");
      } else {
        dock.classList.remove("is-hidden");
      }
      lastY = y;

      /* Ekranın üst üçte birini geçen son bölüm aktiftir */
      var marker = y + window.innerHeight * 0.34;
      var current = null;
      sections.forEach(function (s) {
        if (s.el.offsetTop <= marker) current = s.link;
      });
      /* Son bölümdeysek listedeki sonuncuyu seç — kısa bölümler
         sayfanın dibinde asla aktif olmayabiliyor. */
      if (y + window.innerHeight >= document.body.scrollHeight - 4) {
        current = sections.length ? sections[sections.length - 1].link : current;
      }
      setActive(current);
    };

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    window.addEventListener("resize", function () {
      activeLink = null;
      update();
    });
    update();
  }

  /* ── Reveal + sayaçlar ──────────────────────────────── */
  var revealTargets = $$(".reveal, .tile, .macros");

  var runCounter = function (el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(target)) return;
    if (reduced) {
      el.textContent = String(target);
      return;
    }
    var duration = 1400;
    var start = null;
    var step = function (now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / duration, 1);
      // easeOutExpo
      var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          $$("[data-count]", entry.target).forEach(runCounter);
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 }
    );
    revealTargets.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealTargets.forEach(function (el) {
      el.classList.add("is-visible");
    });
    $$("[data-count]").forEach(function (el) {
      el.textContent = el.getAttribute("data-count");
    });
  }

  /* ── Nasıl çalışır: adım ↔ ekran senkronu ───────────
     Bölüm hem geniş hem dar ekranda sabitleniyor ve adım, KAYDIRMA
     MESAFESİNE göre ilerliyor. Geçişin yavaş hissettirmesinin sebebi
     budur; animasyon süresi değil, adım başına düşen kaydırma yolu
     (CSS'te .how__track yüksekliği). Değişen tek şey düzen: geniş ekranda
     dört adım yan yana durur, telefonda telefon ortada sabit kalır ve
     altındaki tek adım değişir. */
  var howDevice = $("#howDevice");
  var howTrack = $(".how__track");
  var howRail = $("#howRail");
  var steps = $$(".step[data-step]");

  if (howDevice && steps.length) {
    var shots = $$("img[data-step]", howDevice);
    var currentStep = null;

    var showStep = function (n) {
      if (n === currentStep) return;
      currentStep = n;
      shots.forEach(function (img) {
        img.classList.toggle("is-on", img.getAttribute("data-step") === n);
      });
      steps.forEach(function (st) {
        st.classList.toggle("is-current", st.getAttribute("data-step") === n);
      });
    };

    /* Sabitlenmiş bant: ilerlemeyi kaydırma konumundan hesapla */
    var trackTick = false;
    var onTrackScroll = function () {
      if (!howTrack) return;
      var rect = howTrack.getBoundingClientRect();
      var span = howTrack.offsetHeight - window.innerHeight;
      if (span <= 0) return;
      var p = Math.max(0, Math.min(1, -rect.top / span));

      /* Adımı p'ye böl. 0.999 ile çarpmak, en dipte 5. adıma taşmayı
         önlüyor (floor(1 * 4) = 4 olurdu). */
      var idx = Math.floor(p * 0.999 * steps.length) + 1;
      showStep(String(idx));

      if (howRail) {
        howRail.parentNode.style.setProperty("--rail", (p * 100).toFixed(1) + "%");
      }
    };

    var scrollHandler = function () {
      if (!trackTick) {
        trackTick = true;
        requestAnimationFrame(function () {
          trackTick = false;
          onTrackScroll();
        });
      }
    };

    window.addEventListener("scroll", scrollHandler, { passive: true });
    window.addEventListener("resize", scrollHandler);
    showStep("1");
    onTrackScroll();
  }

  /* ── Ekran turu karuseli ────────────────────────────── */
  var rail = $("#tourRail");
  var prev = $("#tourPrev");
  var next = $("#tourNext");

  if (rail && prev && next) {
    var stepSize = function () {
      var item = rail.querySelector(".tour__item");
      if (!item) return 300;
      var styles = getComputedStyle(rail);
      return item.getBoundingClientRect().width + parseFloat(styles.columnGap || styles.gap || 0);
    };

    var syncButtons = function () {
      var max = rail.scrollWidth - rail.clientWidth - 2;
      prev.disabled = rail.scrollLeft <= 2;
      next.disabled = rail.scrollLeft >= max;
    };

    var scrollBy = function (dir) {
      rail.scrollBy({
        left: dir * stepSize(),
        behavior: reduced ? "auto" : "smooth",
      });
    };

    prev.addEventListener("click", function () {
      scrollBy(-1);
    });
    next.addEventListener("click", function () {
      scrollBy(1);
    });
    rail.addEventListener("scroll", syncButtons, { passive: true });
    window.addEventListener("resize", syncButtons);

    rail.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollBy(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollBy(-1);
      }
    });

    syncButtons();
  }

  /* ── İçerik sekmeleri ───────────────────────────────── */
  var tabRecipes = $("#tabRecipes");
  var tabGuides = $("#tabGuides");

  if (tabRecipes && tabGuides) {
    var tabs = [tabRecipes, tabGuides];

    var select = function (tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        // Roving tabindex: sekme listesi tek Tab durağı olmalı
        t.setAttribute("tabindex", on ? "0" : "-1");
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (!panel) return;
        panel.hidden = !on;
        if (on) {
          // Sekme değişince yeni panelin kartları da açılsın
          $$(".reveal", panel).forEach(function (el) {
            el.classList.add("is-visible");
          });
        }
      });
    };

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        select(tab);
      });
      tab.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        var other = tab === tabRecipes ? tabGuides : tabRecipes;
        select(other);
        other.focus();
      });
    });
  }

  /* ── SSS akordeonu ──────────────────────────────────── */
  $$("#faq .faq__q").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var panel = btn.nextElementSibling;
      if (!panel) return;
      var open = btn.getAttribute("aria-expanded") === "true";

      // Tek seferde bir tane açık kalsın
      $$("#faq .faq__q").forEach(function (other) {
        if (other === btn) return;
        other.setAttribute("aria-expanded", "false");
        if (other.nextElementSibling) {
          other.nextElementSibling.setAttribute("data-open", "false");
        }
      });

      btn.setAttribute("aria-expanded", String(!open));
      panel.setAttribute("data-open", String(!open));
    });
  });
})();
