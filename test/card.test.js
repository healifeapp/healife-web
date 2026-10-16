import test from "node:test";
import assert from "node:assert";
import { luhnOk, formatCardNumber, cardBrand, parseExpiry, formatExpiry, validCvv, cardHolder, validateCard } from "../start/card.js";

const NOW = new Date("2026-10-16T12:00:00Z");

test("luhnOk: PayTR test kartları geçer, bozuk numara geçmez", () => {
  assert.equal(luhnOk("4355 0843 5508 4358"), true);
  assert.equal(luhnOk("5406675406675403"), true);
  assert.equal(luhnOk("9792030394440796"), true);
  assert.equal(luhnOk("4355084355084359"), false);
  assert.equal(luhnOk("1234"), false);
  assert.equal(luhnOk(""), false);
});

test("formatCardNumber dörtlü gruplar, 19 hane", () => {
  assert.equal(formatCardNumber("4355084355084358"), "4355 0843 5508 4358");
  assert.equal(formatCardNumber("4355 08"), "4355 08");
  assert.equal(formatCardNumber("12345678901234567890123"), "1234 5678 9012 3456 789");
});

test("cardBrand", () => {
  assert.equal(cardBrand("4355084355084358"), "visa");
  assert.equal(cardBrand("5406675406675403"), "mastercard");
  assert.equal(cardBrand("2221000000000009"), "mastercard");
  assert.equal(cardBrand("9792030394440796"), "troy");
  assert.equal(cardBrand("378282246310005"), "amex");
  assert.equal(cardBrand("6011"), null);
});

test("parseExpiry: geçerli, geçmiş, bozuk", () => {
  assert.deepEqual(parseExpiry("12/30", NOW), { month: "12", year: "30" });
  assert.deepEqual(parseExpiry("0128", NOW), { month: "01", year: "28" });
  assert.deepEqual(parseExpiry("10/26", NOW), { month: "10", year: "26" });
  assert.equal(parseExpiry("09/26", NOW), null);
  assert.equal(parseExpiry("13/30", NOW), null);
  assert.equal(parseExpiry("00/30", NOW), null);
  assert.equal(parseExpiry("12/3", NOW), null);
  assert.equal(parseExpiry("12/60", NOW), null);
  assert.equal(formatExpiry("1230"), "12/30");
  assert.equal(formatExpiry("12"), "12");
  assert.equal(formatExpiry("1"), "1");
});

test("validCvv, cardHolder", () => {
  assert.equal(validCvv("000"), true);
  assert.equal(validCvv("1234"), true);
  assert.equal(validCvv("12"), false);
  assert.equal(cardHolder("  Mert   Yalçın "), "Mert Yalçın");
  assert.equal(cardHolder("Mert"), null);
  assert.equal(cardHolder("a".repeat(60) + " b"), null); // 50'ye kırpılınca boşluk kalmaz
});

test("validateCard: hepsi geçerli → PayTR alanları; eksikler hata verir", () => {
  const ok = validateCard({ number: "4355 0843 5508 4358", expiry: "12/30", cvv: "000", holder: "PAYTR TEST" }, NOW);
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.card, { cc_owner: "PAYTR TEST", card_number: "4355084355084358", expiry_month: "12", expiry_year: "30", cvv: "000" });
  const bad = validateCard({ number: "1111", expiry: "01/20", cvv: "1", holder: "X" }, NOW);
  assert.equal(bad.ok, false);
  assert.equal(bad.card, null);
  assert.deepEqual(Object.keys(bad.errors).sort(), ["cvv", "expiry", "holder", "number"]);
});
