import { test } from "node:test";
import assert from "node:assert/strict";
import { poschitat, PREDELY } from "./raschet.mjs";
import { PRAJS } from "./prajs.mjs";

/** Ввод по умолчанию: одна комната 3 × 4, никаких уточнений. */
function vvod(izmeneniya = {}) {
  return {
    komnaty: [{ dlina: 3, shirina: 4 }],
    polotno: "matovoe",
    svetilniki: 0,
    obvody: 0,
    ugly: 0,
    demontazh: false,
    ...izmeneniya,
  };
}

/** Строка сметы по идентификатору или undefined. */
function stroka(rezultat, id) {
  return rezultat.stroki.find((s) => s.id === id);
}

test("площадь и периметр считаются из размеров комнаты", () => {
  const r = poschitat(vvod(), PRAJS);
  assert.equal(r.ploshad, 12);
  assert.equal(r.perimetr, 14);
});

test("полотно считается по площади и цене из прайса", () => {
  const r = poschitat(vvod(), PRAJS);
  assert.equal(
    stroka(r, "polotno").summa,
    12 * PRAJS.polotno.matovoe.cena_za_m2,
  );
});

test("профиль считается по периметру и цене из прайса", () => {
  const r = poschitat(vvod(), PRAJS);
  assert.equal(stroka(r, "profil").summa, 14 * PRAJS.profil_za_m);
});

test("выезд берётся из прайса и добавляется один раз", () => {
  const r = poschitat(vvod(), PRAJS);
  const vyezdy = r.stroki.filter((s) => s.id === "vyezd");
  assert.equal(vyezdy.length, 1);
  assert.equal(vyezdy[0].summa, PRAJS.vyezd);
});

test("итог равен сумме строк — это главное свойство построчной сметы", () => {
  const r = poschitat(vvod(), PRAJS);
  const summa = r.stroki.reduce((s, stroka) => s + stroka.summa, 0);
  assert.equal(r.itogo, summa);
});

test("три комнаты считаются как сумма трёх, а выезд остаётся один", () => {
  const odna = poschitat(vvod(), PRAJS);
  const tri = poschitat(
    vvod({
      komnaty: [
        { dlina: 3, shirina: 4 },
        { dlina: 3, shirina: 4 },
        { dlina: 3, shirina: 4 },
      ],
    }),
    PRAJS,
  );
  assert.equal(tri.ploshad, odna.ploshad * 3);
  assert.equal(stroka(tri, "polotno").summa, stroka(odna, "polotno").summa * 3);
  assert.equal(stroka(tri, "vyezd").summa, PRAJS.vyezd);
});

test("комнаты сверх предела отбрасываются, а не считаются", () => {
  const komnata = { dlina: 3, shirina: 4 };
  const r = poschitat(vvod({ komnaty: Array(10).fill(komnata) }), PRAJS);
  assert.equal(r.ploshad, 12 * PREDELY.komnat);
});

test("нулевая площадь даёт пустую смету и нулевой итог, а не выезд ни за что", () => {
  const r = poschitat(vvod({ komnaty: [{ dlina: 0, shirina: 0 }] }), PRAJS);
  assert.deepEqual(r.stroki, []);
  assert.equal(r.itogo, 0);
});

test("отрицательные и нечисловые размеры считаются нулём, а не уводят смету в минус", () => {
  for (const ploho of [-5, "abc", null, undefined, NaN, Infinity]) {
    const r = poschitat(
      vvod({ komnaty: [{ dlina: ploho, shirina: 4 }] }),
      PRAJS,
    );
    assert.equal(r.itogo, 0, `размер ${ploho} должен дать нулевую смету`);
  }
});

test("расчёт ничего не знает про страницу", async () => {
  const { readFile } = await import("node:fs/promises");
  const ishodnik = await readFile(
    new URL("./raschet.mjs", import.meta.url),
    "utf8",
  );
  for (const zapreshcheno of ["document", "window", "querySelector"]) {
    assert.ok(
      !ishodnik.includes(zapreshcheno),
      `в расчёте не должно быть ${zapreshcheno}: ошибки расчёта ищутся тестами, а не в браузере`,
    );
  }
});
