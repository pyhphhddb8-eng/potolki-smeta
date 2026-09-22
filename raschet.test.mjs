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

/* — пять уточнений — */

test("тип полотна двигает цену вверх по прайсу, а не произвольно", () => {
  const matovoe = poschitat(vvod({ polotno: "matovoe" }), PRAJS);
  const tkanevoe = poschitat(vvod({ polotno: "tkanevoe" }), PRAJS);
  assert.ok(tkanevoe.itogo > matovoe.itogo);
  assert.equal(
    stroka(tkanevoe, "polotno").summa,
    12 * PRAJS.polotno.tkanevoe.cena_za_m2,
  );
});

test("неизвестный тип полотна не ломает расчёт, а берётся по умолчанию", () => {
  const chush = poschitat(vvod({ polotno: "zolotoe" }), PRAJS);
  const po_umolchaniyu = poschitat(
    vvod({ polotno: PRAJS.polotno_po_umolchaniyu }),
    PRAJS,
  );
  assert.equal(chush.itogo, po_umolchaniyu.itogo);
});

test("каждое уточнение двигает итог вверх и ровно на цену из прайса", () => {
  const bazovyj = poschitat(vvod(), PRAJS).itogo;
  const proverki = [
    [{ svetilniki: 3 }, 3 * PRAJS.svetilnik],
    [{ obvody: 2 }, 2 * PRAJS.obvod_truby],
    [{ ugly: 2 }, 2 * PRAJS.ugol],
    [{ demontazh: true }, 12 * PRAJS.demontazh_za_m2],
  ];
  for (const [izmenenie, nadbavka] of proverki) {
    const r = poschitat(vvod(izmenenie), PRAJS);
    assert.equal(
      r.itogo,
      bazovyj + nadbavka,
      `уточнение ${JSON.stringify(izmenenie)} должно добавить ${nadbavka} ₽`,
    );
  }
});

test("нулевые уточнения не создают строк на ноль рублей", () => {
  const r = poschitat(vvod(), PRAJS);
  for (const id of ["ugly", "svetilniki", "obvody", "demontazh"]) {
    assert.equal(
      stroka(r, id),
      undefined,
      `строка ${id} не должна появляться при нуле`,
    );
  }
});

test("уточнения сверх предела отбрасываются", () => {
  const r = poschitat(vvod({ svetilniki: 999, obvody: 999, ugly: 999 }), PRAJS);
  assert.equal(stroka(r, "svetilniki").kolichestvo, PREDELY.svetilnikov);
  assert.equal(stroka(r, "obvody").kolichestvo, PREDELY.obvodov);
  assert.equal(stroka(r, "ugly").kolichestvo, PREDELY.uglov);
});

test("у каждой строки есть уточнение, по которому её подсвечивать", () => {
  const r = poschitat(
    vvod({ svetilniki: 2, obvody: 1, ugly: 1, demontazh: true }),
    PRAJS,
  );
  const ozhidaem = {
    polotno: "polotno",
    profil: "razmery",
    ugly: "ugly",
    svetilniki: "svetilniki",
    obvody: "obvody",
    demontazh: "demontazh",
    vyezd: null,
  };
  for (const [id, utochnenie] of Object.entries(ozhidaem)) {
    assert.equal(stroka(r, id).utochnenie, utochnenie);
  }
});

test("порядок строк в смете читается сверху вниз и не зависит от ввода", () => {
  const r = poschitat(
    vvod({ demontazh: true, ugly: 1, obvody: 1, svetilniki: 1 }),
    PRAJS,
  );
  assert.deepEqual(
    r.stroki.map((s) => s.id),
    ["polotno", "profil", "ugly", "svetilniki", "obvody", "demontazh", "vyezd"],
  );
});

test("итог по-прежнему равен сумме строк, когда включены все уточнения", () => {
  const r = poschitat(
    vvod({
      svetilniki: 6,
      obvody: 2,
      ugly: 3,
      demontazh: true,
      polotno: "tkanevoe",
    }),
    PRAJS,
  );
  assert.equal(
    r.itogo,
    r.stroki.reduce((s, str) => s + str.summa, 0),
  );
});

/* — вилка — */

test("нижняя граница вилки никогда не выше верхней", () => {
  const nabory = [
    vvod(),
    vvod({ komnaty: [{ dlina: 1.2, shirina: 1.1 }] }),
    vvod({ komnaty: [{ dlina: 0.1, shirina: 0.1 }] }),
    vvod({
      svetilniki: 30,
      obvody: 10,
      ugly: 8,
      demontazh: true,
      polotno: "tkanevoe",
    }),
    vvod({
      komnaty: [
        { dlina: 20, shirina: 20 },
        { dlina: 20, shirina: 20 },
        { dlina: 20, shirina: 20 },
      ],
    }),
  ];
  for (const nabor of nabory) {
    const r = poschitat(nabor, PRAJS);
    assert.ok(
      r.vilka.ot <= r.vilka.do,
      `вилка вывернута: ${JSON.stringify(r.vilka)}`,
    );
  }
});

test("вилка построена от итога по ширине из прайса", () => {
  const r = poschitat(vvod(), PRAJS);
  assert.ok(r.vilka.ot <= r.itogo && r.itogo <= r.vilka.do);
  assert.equal(
    r.vilka.ot,
    Math.round((r.itogo * (1 - PRAJS.vilka.vniz)) / 100) * 100,
  );
  assert.equal(
    r.vilka.do,
    Math.round((r.itogo * (1 + PRAJS.vilka.vverh)) / 100) * 100,
  );
});

test("вилка округлена до сотен: точная цифра внутри вилки — обман", () => {
  const r = poschitat(vvod({ svetilniki: 3, obvody: 1 }), PRAJS);
  assert.equal(r.vilka.ot % 100, 0);
  assert.equal(r.vilka.do % 100, 0);
});

test("нулевая площадь даёт нулевую вилку, а не вилку от выезда", () => {
  const r = poschitat(vvod({ komnaty: [] }), PRAJS);
  assert.deepEqual(r.vilka, { ot: 0, do: 0 });
});

test("вилка двигается вместе с итогом при каждом уточнении", () => {
  const bazovaya = poschitat(vvod(), PRAJS).vilka;
  const s_demontazhem = poschitat(vvod({ demontazh: true }), PRAJS).vilka;
  assert.ok(s_demontazhem.ot > bazovaya.ot);
  assert.ok(s_demontazhem.do > bazovaya.do);
});
