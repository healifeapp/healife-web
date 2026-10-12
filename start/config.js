// Web funnel ayarları. Ödeme ve giriş henüz bağlanmadı: ikisi de "demo"
// kipinde çalışıyor; PayTR anlaşması ve backend uçları hazır olunca
// buradaki iki satırı değiştirmek yeterli (bkz. services.js).

export const CONFIG = {
  apiBase: "https://dcp-humanos-410d767c97ce.herokuapp.com",

  // "demo" → ödeme formu yerine bir yer tutucu + "ödemeyi tamamla" düğmesi.
  // "paytr" → backend'den iFrame token'ı alınır, PayTR formu sayfaya gömülür.
  paymentProvider: "demo",

  // "demo" → giriş düğmeleri sahte bir kullanıcı üretir.
  // "live" → Apple/Google kimlik doğrulaması + backend /login-apple|google.
  authProvider: "demo",

  // Uygulamadaki fiyatlarla aynı (RC offering "healife", 15.09.2026).
  // Web'e özel indirim verilecekse yalnızca bu tabloyu değiştirin.
  currency: "₺",
  plans: [
    {
      id: "yearly",
      title: "Yıllık",
      price: 2899,
      periodLabel: "yıllık",
      weeks: 52,
      badge: "En avantajlı",
      preselected: true,
    },
    { id: "monthly", title: "Aylık", price: 589, periodLabel: "aylık", weeks: 52 / 12 },
    { id: "weekly", title: "Haftalık", price: 349, periodLabel: "haftalık", weeks: 1 },
  ],

  stores: {
    ios: "https://apps.apple.com/app/id6761519395",
    android: "https://play.google.com/store/apps/details?id=com.dcp.humanos",
  },

  legal: {
    terms: "/legal.html#kullanim-kosullari",
    privacy: "/legal.html#gizlilik",
    kvkk: "/legal.html#kvkk",
  },
};
