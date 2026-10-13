// Web funnel ayarları. Ödeme ve giriş henüz bağlanmadı: ikisi de "demo"
// kipinde çalışıyor; PayTR anlaşması ve backend uçları hazır olunca
// buradaki iki satırı değiştirmek yeterli (bkz. services.js).

export const CONFIG = {
  apiBase: "https://dcp-humanos-410d767c97ce.herokuapp.com",

  // "demo"    → yer tutucu form + "öde" düğmesi başarı ekranına geçer (yalnız önizleme).
  // "pending" → form + onaylar görünür ama ödeme alınmaz; "çok yakında" uyarısı.
  //             Canlı sitede (hea-life.com) PayTR bağlanana dek bu kip: gerçek
  //             ziyaretçi sahte "Premium'un aktif" ekranı görmesin.
  // "paytr"   → backend'den iFrame token'ı alınır, PayTR formu sayfaya gömülür.
  paymentProvider: /(^|\.)hea-life\.com$/.test(location.hostname) ? "pending" : "demo",

  // "demo"    → giriş düğmeleri sahte bir kullanıcı üretir (yalnız önizleme).
  // "pending" → hesap adımı atlanır; canlı sitede gerçek ziyaretçiye sahte
  //             "Google hesabın bağlandı" gösterilmesin (backend uçları yok).
  // "live"    → Apple/Google kimlik doğrulaması + backend /api/user/login-apple|google.
  authProvider: /(^|\.)hea-life\.com$/.test(location.hostname) ? "pending" : "demo",

  // Backend'e aday (e-posta + cevaplar + pazarlama izni) gönderme ucu henüz yok.
  // false iken pazarlama izni kutusu gösterilmez: kaydedilmeyen bir izin
  // toplamak İYS/KVKK açısından yanıltıcı olur.
  collectLeads: false,

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
    preInfo: "/legal.html#on-bilgilendirme",
    distanceSale: "/legal.html#mesafeli-satis",
  },

  // Satıcı bilgileri (legal.html "Hizmet sağlayıcı bilgileri" ile aynı).
  seller: {
    name: "Healife Sağlık Ürünleri Pazarlama Sanayi İç ve Dış Ticaret Limited Şirketi",
    address: "Atakent Mah. Haldun Taner Sk. No: 1 Ümraniye/İstanbul",
    tax: "Alemdağ V.D. · 4610896992",
    mersis: "0461089699200001",
    registry: "236743-5",
    phone: "+90 850 305 76 78",
    email: "info@hea-life.com",
  },
};
