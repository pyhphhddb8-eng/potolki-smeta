import { test } from "node:test";
import assert from "node:assert/strict";
import { PRAJS } from "./prajs.mjs";

test("в прайсе есть все четыре типа полотна и у каждого цена за метр", () => {
  const tipy = ["matovoe", "satinovoe", "glyancevoe", "tkanevoe"];
  for (const tip of tipy) {
    const vid = PRAJS.polotno[tip];
    assert.ok(vid, `нет типа полотна ${tip}`);
    assert.equal(typeof vid.nazvanie, "string");
    assert.ok(vid.cena_za_m2 > 0, `цена ${tip} должна быть положительной`);
  }
});

test("тип полотна по умолчанию существует в прайсе", () => {
  assert.ok(PRAJS.polotno[PRAJS.polotno_po_umolchaniyu]);
});

test("все поштучные цены положительные", () => {
  for (const klyuch of [
    "profil_za_m",
    "ugol",
    "svetilnik",
    "obvod_truby",
    "demontazh_za_m2",
    "vyezd",
  ]) {
    assert.ok(PRAJS[klyuch] > 0, `цена ${klyuch} должна быть положительной`);
  }
});

test("вилка задана прайсом и не вывернута наизнанку", () => {
  assert.ok(PRAJS.vilka.vniz >= 0 && PRAJS.vilka.vniz < 1);
  assert.ok(PRAJS.vilka.vverh >= 0 && PRAJS.vilka.vverh < 1);
});
