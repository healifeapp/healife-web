// Kart formu saf yardımcıları (PayTR Direkt API: kart verisi tarayıcıdan
// doğrudan PayTR'ye gider; burada yalnız biçim ve geçerlilik kontrolü).
// Test: node --test test/card.test.js

/** Yalnız rakamlar. */
export const digits = (s) => String(s ?? "").replace(/\D/g, "");

/** Luhn kontrolü; 13–19 hane. */
export function luhnOk(num) {
  const d = digits(num);
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  let dbl = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = d.charCodeAt(i) - 48;
    if (dbl) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

/** "4355084355084358" → "4355 0843 5508 4358" (en çok 19 hane). */
export function formatCardNumber(s) {
  return digits(s).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** Kart markası: PayTR kart görselleri için (visa | mastercard | troy | amex | null). */
export function cardBrand(num) {
  const d = digits(num);
  if (/^4/.test(d)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "mastercard";
  if (/^9792/.test(d)) return "troy";
  if (/^3[47]/.test(d)) return "amex";
  return null;
}

/** "12/30" | "1230" | "12 / 30" → { month: "12", year: "30" } ya da null (geçmiş tarih dahil). */
export function parseExpiry(s, now = new Date()) {
  const d = digits(s);
  if (d.length !== 4) return null;
  const month = Number(d.slice(0, 2));
  const year = Number(d.slice(2));
  if (month < 1 || month > 12) return null;
  const curY = now.getFullYear() % 100;
  const curM = now.getMonth() + 1;
  if (year < curY || (year === curY && month < curM) || year > curY + 20) return null;
  return { month: String(month), year: String(year).padStart(2, "0") };
}

/** "12/30" biçimine getirir (yazarken). */
export function formatExpiry(s) {
  const d = digits(s).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export const validCvv = (s) => /^\d{3,4}$/.test(digits(s));

/** Kart üzerindeki isim: en az 2 kelime, 50 karakter (PayTR cc_owner sınırı). */
export function cardHolder(s) {
  const v = String(s ?? "").trim().replace(/\s+/g, " ").slice(0, 50);
  return v.length >= 5 && v.includes(" ") ? v : null;
}

/** Hepsini bir arada: { ok, errors: {number, expiry, cvv, holder}, card } */
export function validateCard({ number, expiry, cvv, holder }, now = new Date()) {
  const errors = {};
  if (!luhnOk(number)) errors.number = "Kart numarasını kontrol et.";
  const exp = parseExpiry(expiry, now);
  if (!exp) errors.expiry = "Son kullanma tarihi AA/YY biçiminde ve geçerli olmalı.";
  if (!validCvv(cvv)) errors.cvv = "CVV kartın arkasındaki 3 haneli kod.";
  const owner = cardHolder(holder);
  if (!owner) errors.holder = "Kart üzerindeki ad ve soyadı yaz.";
  const ok = Object.keys(errors).length === 0;
  return {
    ok,
    errors,
    card: ok ? { cc_owner: owner, card_number: digits(number), expiry_month: exp.month, expiry_year: exp.year, cvv: digits(cvv) } : null,
  };
}
