/* Abonelik yönetimi: e-posta → kod → sipariş listesi / otomatik yenilemeyi kapat.
 * Backend: /api/billing/web/manage/* (bkz. dcp_ai_fitness_backend). Giriş yok;
 * doğrulamadan sonra 20 dakikalık yönetim token'ı sessionStorage'da tutulur. */
(function () {
  "use strict";
  var root = document.getElementById("sub");
  if (!root) return;
  var API = root.getAttribute("data-api") + "/api/billing/web/manage";
  var $ = function (id) { return document.getElementById(id); };
  var stepEmail = $("stepEmail"), stepCode = $("stepCode"), stepList = $("stepList");
  var emailIn = $("email"), codeIn = $("code");
  var state = { email: "", token: "", orders: [] };
  try {
    var saved = JSON.parse(sessionStorage.getItem("hl_manage") || "null");
    if (saved && saved.token && saved.email) state.email = saved.email, state.token = saved.token;
  } catch (e) {}

  var PLAN = { weekly: "Haftalık", monthly: "Aylık", yearly: "Yıllık" };
  var STATUS = { paid: "Ödendi", claimed: "Aktif", review: "İnceleniyor" };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmtDate(iso) { if (!iso) return "—"; var d = new Date(iso); return isNaN(d) ? "—" : d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }); }
  function show(step) { [stepEmail, stepCode, stepList].forEach(function (s) { s.hidden = s !== step; }); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function err(el, msg) { el.textContent = msg || ""; el.hidden = !msg; }
  function busy(btn, on, label) { btn.disabled = on; if (label) btn.textContent = label; }

  function api(path, body, withToken) {
    var headers = { "Content-Type": "application/json" };
    if (withToken) headers.Authorization = "Bearer " + state.token;
    return fetch(API + path, { method: body ? "POST" : "GET", headers: headers, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return null; }).then(function (j) { return { ok: r.ok, status: r.status, data: j }; }); })
      .catch(function () { return { ok: false, status: 0, data: null }; });
  }
  function msgOf(r, fallback) { return (r.data && r.data.message) || (r.status === 0 ? "Bağlantı kurulamadı. İnternetini kontrol et." : fallback); }

  function persist() { try { sessionStorage.setItem("hl_manage", JSON.stringify({ email: state.email, token: state.token })); } catch (e) {} }
  function logout() { state = { email: "", token: "", orders: [] }; try { sessionStorage.removeItem("hl_manage"); } catch (e) {} emailIn.value = ""; codeIn.value = ""; show(stepEmail); }

  function render() {
    $("listEmail").textContent = state.email;
    var box = $("orders");
    if (!state.orders.length) {
      box.innerHTML = '<p class="order__empty">Bu e-postayla hea-life.com üzerinden alınmış bir abonelik bulunamadı. Uygulama mağazasından aldıysan onu uygulamadaki Ayarlar › Abonelik ekranından yönetirsin.</p>';
      return;
    }
    box.innerHTML = state.orders.map(function (o) {
      var active = o.periodEnd && new Date(o.periodEnd) > new Date();
      var pill = o.autoRenew
        ? '<span class="order__pill order__pill--on">Otomatik yenileme açık</span>'
        : (o.renewalCancelledAt ? '<span class="order__pill">Yenileme kapatıldı</span>' : '<span class="order__pill">Otomatik yenilenmez</span>');
      var act = o.autoRenew
        ? '<div class="order__act"><button class="btn btn--ghost" type="button" data-cancel="' + esc(o.merchantOid) + '">Otomatik yenilemeyi kapat</button><span class="sub__note">Erişimin ' + esc(fmtDate(o.periodEnd)) + ' tarihine kadar sürer; sonra ücret alınmaz.</span></div>'
        : '<p class="sub__note">' + (active ? 'Erişimin ' + esc(fmtDate(o.periodEnd)) + ' tarihinde kendiliğinden biter; kartından tekrar çekim yapılmaz. Dilersen o zaman yeniden satın alırsın.' : 'Bu abonelik sona erdi.') + '</p>';
      return '<article class="order">' +
        '<div class="order__top"><b>Healife Premium · ' + esc(PLAN[o.planId] || o.planTitle || o.planId) + '</b>' + pill + (o.testMode ? '<span class="order__pill order__pill--test">Test</span>' : '') + '</div>' +
        '<dl><dt>Durum</dt><dd>' + esc(STATUS[o.status] || o.status) + '</dd>' +
        '<dt>Ödeme</dt><dd>' + esc(fmtDate(o.paidAt)) + '</dd>' +
        '<dt>Erişim bitişi</dt><dd>' + esc(fmtDate(o.periodEnd)) + '</dd>' +
        '<dt>Sipariş no</dt><dd>' + esc(o.merchantOid) + '</dd></dl>' + act + '</article>';
    }).join("");
    box.querySelectorAll("[data-cancel]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (!confirm("Otomatik yenileme kapatılsın mı? Erişimin dönem sonuna kadar sürer, sonra ücret alınmaz.")) return;
        busy(b, true, "Kapatılıyor…");
        api("/cancel", { merchantOid: b.getAttribute("data-cancel") }, true).then(function (r) {
          if (r.status === 401) { alert("Oturum süresi doldu, yeni kod iste."); return logout(); }
          if (!r.ok) { busy(b, false, "Otomatik yenilemeyi kapat"); return alert(msgOf(r, "Kapatılamadı. Tekrar dene.")); }
          var upd = r.data.results.order;
          state.orders = state.orders.map(function (o) { return o.merchantOid === upd.merchantOid ? upd : o; });
          render();
        });
      });
    });
  }

  function loadOrders() {
    api("/orders", null, true).then(function (r) {
      if (r.status === 401) return logout();
      if (!r.ok) { alert(msgOf(r, "Liste alınamadı.")); return logout(); }
      state.orders = r.data.results.orders || [];
      render();
      show(stepList);
    });
  }

  function sendCode(btn) {
    var email = emailIn.value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { err($("emailErr"), "Geçerli bir e-posta adresi gir."); emailIn.focus(); return; }
    err($("emailErr"), "");
    busy(btn, true, "Gönderiliyor…");
    api("/code", { email: email }).then(function (r) {
      busy(btn, false, btn === $("emailBtn") ? "Kod gönder" : "Yeni kod iste");
      if (!r.ok) return err(btn === $("emailBtn") ? $("emailErr") : $("codeErr"), msgOf(r, "Kod gönderilemedi. Biraz sonra tekrar dene."));
      state.email = email;
      $("codeTo").textContent = email;
      codeIn.value = "";
      err($("codeErr"), "");
      show(stepCode);
      codeIn.focus();
    });
  }

  stepEmail.addEventListener("submit", function (e) { e.preventDefault(); sendCode($("emailBtn")); });
  $("resend").addEventListener("click", function () { sendCode($("resend")); });
  stepCode.addEventListener("submit", function (e) {
    e.preventDefault();
    var code = codeIn.value.replace(/\D/g, "");
    if (code.length !== 6) { err($("codeErr"), "6 haneli kodu gir."); codeIn.focus(); return; }
    busy($("codeBtn"), true, "Doğrulanıyor…");
    api("/verify", { email: state.email, code: code }).then(function (r) {
      busy($("codeBtn"), false, "Doğrula");
      if (!r.ok) return err($("codeErr"), msgOf(r, "Doğrulama yapılamadı."));
      state.token = r.data.results.token;
      state.orders = r.data.results.orders || [];
      persist();
      render();
      show(stepList);
    });
  });
  $("logout").addEventListener("click", logout);

  if (state.token) loadOrders(); else show(stepEmail);
})();
