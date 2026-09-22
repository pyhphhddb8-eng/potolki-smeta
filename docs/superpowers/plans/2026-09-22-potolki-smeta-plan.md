# Лендинг натяжных потолков со сметой и уточняющим квизом — план работ

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Собрать лендинг вымышленной бригады натяжных потолков, где посетитель без звонка и без телефона получает на экране построчную смету и вилку «от и до», а пять уточнений двигают итог и подсвечивают строку, на которую повлияли.

**Architecture:** Страница `index.html` статическая: разметка, оформление, правила печати и подрезанный шрифт вшиты в один файл. Расчёт вынесен в модуль `raschet.mjs` — чистая функция, которая получает размеры комнат, уточнения и прайс, а отдаёт строки сметы и вилку; про DOM она не знает ничего. Прайс лежит в `prajs.mjs` отдельными числами и подставляется и в страницу, и в тесты, так что «числа сходятся с прайсом» проверяется буквально. Сценарий страницы — встроенный `<script type="module">`, который импортирует оба модуля, читает поля и перерисовывает смету.

**Tech Stack:** HTML + CSS + ванильный JS-модуль. Без сборщика, без React, без единой зависимости в готовой странице. Тесты — встроенный механизм Node 24 (`node --test`), ноль зависимостей из npm. Playwright 1.63 в `devDependencies` — только для проверок в браузере и скриншотов, в страницу не попадает. Python 3 с fontTools 4.60 — разовая подрезка шрифта Inter (SIL OFL). Выкладка — GitHub Pages, аккаунт `pyhphhddb8-eng`, репозиторий `potolki-smeta`.

**Spec:** `docs/superpowers/specs/2026-09-22-potolki-smeta-design.md`

---

## Решения, принятые до начала работ

Спека оставила четыре вопроса открытыми. Закрываю их здесь, чтобы в задачах
не осталось выбора.

**1. Прайс — `prajs.mjs`, а не `prajs.json`.** Спека требует «отдельный файл
числами, правится без программиста». Оба формата это дают, но `.json`
страница смогла бы прочитать только через `fetch`, а это лишний запрос и
неработающая страница при открытии файла с диска. Модуль с одним объектом
читается и браузером, и Node одинаково, а правится так же просто:
`"cena_za_m2": 390`.

**2. Округление.** Каждая строка сметы округляется до рубля, итог — сумма
уже округлённых строк. Тогда требование спеки «сумма строк сметы равна
итогу» выполняется точно, а не с точностью до копеек. Вилка округляется до
сотен рублей: точная цифра внутри вилки противоречит самой идее вилки.

**3. Нулевая площадь — пустая смета.** Ни строк, ни выезда, итог `0 / 0`.
Иначе при пустых полях человек видит «выезд 1 200 ₽» ни за что и закрывает
страницу.

**4. Подсветка строки привязана к полю-источнику,** а не к сравнению сумм
до и после. У каждой строки есть поле `utochnenie` с идентификатором
уточнения, которое на неё влияет; страница подсвечивает строки, у которых
`utochnenie` совпал с только что тронутым полем. Сравнение сумм врёт, когда
два уточнения меняются подряд и одно компенсирует другое.

## Global Constraints

Эти требования действуют в каждой задаче без повторения.

- **Без сборщика и без React.** Готовая страница — `index.html`, `raschet.mjs`
  и `prajs.mjs` в корне репозитория. Ни шага сборки, ни зависимостей в
  продукте.
- **Внешних запросов ноль.** Ни одного `src="http…"`, `<link rel="stylesheet"
  href="http…">`, `@import` или `fetch` наружу. Шрифт вшит в `index.html`
  как `data:`-URI, иконка — `data:image/svg+xml`. Единственное исключение —
  `<a href>` на соседнюю работу портфолио.
- **Числа только из прайса.** Ни одно число цены не пишется в разметку и в
  сценарий страницы руками. Всё приходит из `prajs.mjs`. Тесты сверяются с
  тем же файлом, а не с копиями чисел в коде теста.
- **Расчёт не знает про DOM.** В `raschet.mjs` нет ни `document`, ни
  `window`, ни `querySelector`. Проверяется тестом.
- **Цены и название помечены условными** на самой странице: компания
  «Потолок за день» вымышленная, прайс — демонстрационный.
- **Точной цены до замера страница не называет.** Итог — всегда вилка
  «от и до», рядом сказано почему.
- **Результат без телефона.** Смета появляется на экране сразу, форма к
  расчёту не привязана и ничего не отправляет.
- **Отзывов на странице нет.** Ни выдуманных, ни «по мотивам». Ни обратного
  отсчёта, ни «осталось два места».
- **Форма ничего не отправляет и не хранит.** Имя, телефон, непредзаполненная
  галочка согласия, `type="button"` вместо отправки и прямая надпись, что это
  демонстрация. Ссылка на работу `klinika-152fz` — за полным комплектом
  документов.
- **Страница закрыта от поисковиков:** `<meta name="robots" content="noindex,
  nofollow">` и `robots.txt` с `Disallow: /`.
- **Контраст.** Каждая пара «текст на фоне» — не ниже 4,5 по формуле WCAG.
  Проверяется скриптом.
- **Мобильные.** На ширине 360 px горизонтальной прокрутки нет.
- **Консоль чистая:** ни ошибок, ни предупреждений.
- **Язык — русский, буква «ё» пишется.** Цены — с неразрывным пробелом между
  разрядами и знаком рубля: `12 400 ₽`. Дробная часть через запятую.
- **Имена в коде — латиницей по звучанию** (`raschet`, `prajs`, `smeta`,
  `utochnenie`), как в соседних работах портфолио. Комментарии — по-русски и
  объясняют «почему», а не «что».
- **Коммиты на русском**, каждая задача завершается коммитом. Приписка в
  конце сообщения:
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`

## Карта файлов

| Файл                | За что отвечает                                                                 |
| ------------------- | ------------------------------------------------------------------------------- |
| `prajs.mjs`         | Прайс числами: цена полотна по типам, профиль, угол, светильник, обвод, демонтаж, выезд, ширина вилки |
| `raschet.mjs`       | Чистая функция `poschitat(vvod, prajs)` — строки сметы, итог, вилка. Ничего про DOM |
| `raschet.test.mjs`  | Тесты расчёта на встроенном механизме Node                                       |
| `index.html`        | Вся страница: разметка, оформление, правила печати, вшитый шрифт, сценарий расчёта |
| `prajs.test.mjs`    | Тест целостности прайса: все ключи на месте, все числа положительные             |
| `tools/shrift.py`   | Разовая подрезка Inter и выдача готового `@font-face` с base64                   |
| `tools/check.mjs`   | Проверки в браузере: контраст, 360 px, консоль, внешние запросы, печать, живой расчёт |
| `tools/shot.mjs`    | Скриншоты страницы и печатного вида                                              |
| `package.json`      | Команды `test`, `check`, `shot`. Playwright только в `devDependencies`           |
| `robots.txt`        | `Disallow: /` — демо в выдаче не место                                           |
| `.nojekyll`         | GitHub Pages не трогает файлы                                                    |
| `zamery/`           | Сохранённые отчёты Lighthouse, три прогона                                       |

## Устройство расчёта

Вход:

```js
{
  komnaty: [{ dlina: 3.5, shirina: 4.2 }],  // до трёх
  polotno: "matovoe",                        // ключ из prajs.polotno
  svetilniki: 4,                             // штук
  obvody: 1,                                 // обводов труб
  ugly: 0,                                   // углов сверх четырёх
  demontazh: false                           // снимать ли старый потолок
}
```

Выход:

```js
{
  ploshad: 14.7,      // м², сумма по комнатам
  perimetr: 15.4,     // м, сумма периметров
  stroki: [ { id, nazvanie, poyasnenie, kolichestvo, edinica, cena, summa, utochnenie } ],
  itogo: 12430,       // сумма summa всех строк, рубли
  vilka: { ot: 11800, do: 14300 }
}
```

Идентификаторы уточнений, по которым подсвечиваются строки:
`"razmery"`, `"polotno"`, `"svetilniki"`, `"obvody"`, `"ugly"`,
`"demontazh"`. У строки выезда `utochnenie: null` — её не двигает ничто.

---

### Task 1: Прайс и каркас репозитория

**Files:**
- Create: `prajs.mjs`
- Create: `prajs.test.mjs`
- Create: `package.json`
- Create: `.nojekyll`
- Create: `robots.txt`

**Interfaces:**
- Consumes: ничего
- Produces: `export const PRAJS` — объект прайса, форма зафиксирована ниже.
  Все последующие задачи читают цены только отсюда.

- [ ] **Step 1: Написать падающий тест целостности прайса**

Создать `prajs.test.mjs`:

```js
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
    "profil_za_m", "ugol", "svetilnik", "obvod_truby",
    "demontazh_za_m2", "vyezd",
  ]) {
    assert.ok(PRAJS[klyuch] > 0, `цена ${klyuch} должна быть положительной`);
  }
});

test("вилка задана прайсом и не вывернута наизнанку", () => {
  assert.ok(PRAJS.vilka.vniz >= 0 && PRAJS.vilka.vniz < 1);
  assert.ok(PRAJS.vilka.vverh >= 0 && PRAJS.vilka.vverh < 1);
});
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `node --test prajs.test.mjs`
Expected: FAIL — `Cannot find module './prajs.mjs'`

- [ ] **Step 3: Написать прайс**

Создать `prajs.mjs`:

```js
// Прайс демонстрации. Цены условные: компания «Потолок за день» вымышленная,
// порядок величин взят правдоподобный, но это не чьё-то предложение.
//
// Файл правится числами, программист для этого не нужен: меняется значение
// справа от двоеточия, остальное не трогается. Страница и тесты читают
// цены отсюда, поэтому после правки пересчитается и смета, и проверки.

export const PRAJS = {
  // Полотно считается по площади. Разница между типами — это разница
  // в материале, а не наценка за слово «премиум».
  polotno: {
    matovoe:    { nazvanie: "Матовое ПВХ",    cena_za_m2: 390 },
    satinovoe:  { nazvanie: "Сатиновое ПВХ",  cena_za_m2: 470 },
    glyancevoe: { nazvanie: "Глянцевое ПВХ",  cena_za_m2: 520 },
    tkanevoe:   { nazvanie: "Тканевое",       cena_za_m2: 890 },
  },
  polotno_po_umolchaniyu: "matovoe",

  profil_za_m: 260,      // багет по периметру, за метр
  ugol: 450,             // каждый угол сверх четырёх
  svetilnik: 750,        // закладная и врезка под один светильник
  obvod_truby: 650,      // обвод одной трубы
  demontazh_za_m2: 180,  // снять старый потолок, за метр площади
  vyezd: 1200,           // выезд бригады, один раз на заказ

  // Ширина вилки. Точную цену даёт замер: вниз двигает ровный потолок и
  // простая геометрия, вверх — то, что видно только на месте.
  vilka: { vniz: 0.06, vverh: 0.17 },
};
```

- [ ] **Step 4: Запустить тест и убедиться, что он проходит**

Run: `node --test prajs.test.mjs`
Expected: PASS, 4 теста

- [ ] **Step 5: Завести package.json и служебные файлы**

Создать `package.json`:

```json
{
  "name": "potolki-smeta",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "Лендинг натяжных потолков со сметой и уточняющим квизом",
  "scripts": {
    "test": "node --test",
    "check": "node tools/check.mjs",
    "shot": "node tools/shot.mjs"
  },
  "devDependencies": {
    "playwright": "^1.63.0"
  }
}
```

Создать `robots.txt`:

```
User-agent: *
Disallow: /
```

Создать пустой файл `.nojekyll`:

```bash
touch .nojekyll
```

- [ ] **Step 6: Прогнать все тесты одной командой**

Run: `npm test`
Expected: PASS, 4 теста

- [ ] **Step 7: Коммит**

```bash
git add prajs.mjs prajs.test.mjs package.json robots.txt .nojekyll
git commit -m "Прайс отдельным файлом и каркас репозитория

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Площадь, периметр и первые три строки сметы

**Files:**
- Create: `raschet.mjs`
- Create: `raschet.test.mjs`

**Interfaces:**
- Consumes: `PRAJS` из `prajs.mjs` (Task 1)
- Produces:
  - `export function poschitat(vvod, prajs)` → `{ ploshad, perimetr, stroki, itogo, vilka }`
  - `export const PREDELY = { komnat, storona, svetilnikov, obvodov, uglov }`
  - Форма строки: `{ id, nazvanie, poyasnenie, kolichestvo, edinica, cena, summa, utochnenie }`

В этой задаче считаются только полотно, профиль и выезд. Уточнения
добавляются в Task 3, вилка — в Task 4.

- [ ] **Step 1: Написать падающие тесты**

Создать `raschet.test.mjs`:

```js
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
  assert.equal(stroka(r, "polotno").summa, 12 * PRAJS.polotno.matovoe.cena_za_m2);
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
    const r = poschitat(vvod({ komnaty: [{ dlina: ploho, shirina: 4 }] }), PRAJS);
    assert.equal(r.itogo, 0, `размер ${ploho} должен дать нулевую смету`);
  }
});

test("расчёт ничего не знает про страницу", async () => {
  const { readFile } = await import("node:fs/promises");
  const ishodnik = await readFile(new URL("./raschet.mjs", import.meta.url), "utf8");
  for (const zapreshcheno of ["document", "window", "querySelector"]) {
    assert.ok(
      !ishodnik.includes(zapreshcheno),
      `в расчёте не должно быть ${zapreshcheno}: ошибки расчёта ищутся тестами, а не в браузере`,
    );
  }
});
```

- [ ] **Step 2: Запустить тесты и убедиться, что они падают**

Run: `node --test raschet.test.mjs`
Expected: FAIL — `Cannot find module './raschet.mjs'`

- [ ] **Step 3: Написать расчёт**

Создать `raschet.mjs`:

```js
// Расчёт сметы натяжного потолка.
//
// Чистая функция: получает размеры, уточнения и прайс — отдаёт строки и итог.
// Про страницу и DOM не знает ничего, поэтому проверяется тестами без
// браузера. Ошибки расчёта прячутся именно здесь, и искать их надо здесь же.

export const PREDELY = {
  komnat: 3,        // больше трёх комнат — это уже не лендинг, а замер
  storona: 20,      // метров: защита от опечатки в десять лишних нулей
  svetilnikov: 30,
  obvodov: 10,
  uglov: 8,         // сверх четырёх, которые уже в цене
};

/** Неотрицательное конечное число не больше предела. Мусор на входе — ноль. */
function chislo(znachenie, predel = Infinity) {
  const n = Number(znachenie);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(n, predel);
}

/** Метры округляются до сантиметров: иначе 3,3 × 4,1 даёт хвост из float. */
function metry(znachenie) {
  return Math.round(znachenie * 100) / 100;
}

/** Одна строка сметы. Сумма округляется до рубля сразу, чтобы итог сошёлся. */
function stroka({ id, nazvanie, poyasnenie, kolichestvo, edinica, cena, utochnenie }) {
  return {
    id,
    nazvanie,
    poyasnenie,
    kolichestvo,
    edinica,
    cena,
    summa: Math.round(kolichestvo * cena),
    utochnenie,
  };
}

export function poschitat(vvod, prajs) {
  const komnaty = (Array.isArray(vvod?.komnaty) ? vvod.komnaty : [])
    .slice(0, PREDELY.komnat)
    .map((k) => ({
      dlina: chislo(k?.dlina, PREDELY.storona),
      shirina: chislo(k?.shirina, PREDELY.storona),
    }));

  const ploshad = metry(komnaty.reduce((s, k) => s + k.dlina * k.shirina, 0));
  const perimetr = metry(komnaty.reduce((s, k) => s + 2 * (k.dlina + k.shirina), 0));

  // Размеры не заданы — показывать нечего. Выезд в пустую смету не пишем:
  // человек не должен видеть цену до того, как что-то ввёл.
  if (ploshad === 0) {
    return { ploshad: 0, perimetr: 0, stroki: [], itogo: 0, vilka: { ot: 0, do: 0 } };
  }

  const vid = prajs.polotno[vvod?.polotno] ?? prajs.polotno[prajs.polotno_po_umolchaniyu];

  const stroki = [
    stroka({
      id: "polotno",
      nazvanie: `Полотно: ${vid.nazvanie.toLowerCase()}`,
      poyasnenie: "Считается по площади комнат",
      kolichestvo: ploshad,
      edinica: "м²",
      cena: vid.cena_za_m2,
      utochnenie: "polotno",
    }),
    stroka({
      id: "profil",
      nazvanie: "Профиль по периметру",
      poyasnenie: "Багет, на который натягивается полотно",
      kolichestvo: perimetr,
      edinica: "м",
      cena: prajs.profil_za_m,
      utochnenie: "razmery",
    }),
    stroka({
      id: "vyezd",
      nazvanie: "Выезд бригады",
      poyasnenie: "Один раз на заказ, сколько бы ни было комнат",
      kolichestvo: 1,
      edinica: "заказ",
      cena: prajs.vyezd,
      utochnenie: null,
    }),
  ];

  const itogo = stroki.reduce((s, str) => s + str.summa, 0);

  return { ploshad, perimetr, stroki, itogo, vilka: { ot: itogo, do: itogo } };
}
```

- [ ] **Step 4: Запустить тесты и убедиться, что они проходят**

Run: `node --test raschet.test.mjs`
Expected: PASS, 10 тестов

- [ ] **Step 5: Коммит**

```bash
git add raschet.mjs raschet.test.mjs
git commit -m "Расчёт: площадь, периметр, полотно, профиль и выезд

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Пять уточнений

**Files:**
- Modify: `raschet.mjs` — добавить четыре строки и выбор типа полотна
- Modify: `raschet.test.mjs` — добавить блок тестов на уточнения

**Interfaces:**
- Consumes: `poschitat`, `PREDELY` (Task 2)
- Produces: строки с `id` `"ugly"`, `"svetilniki"`, `"obvody"`, `"demontazh"`
  и `utochnenie`, совпадающим с `id`. Порядок строк в смете зафиксирован:
  `polotno`, `profil`, `ugly`, `svetilniki`, `obvody`, `demontazh`, `vyezd`.

- [ ] **Step 1: Написать падающие тесты**

Дописать в конец `raschet.test.mjs`:

```js
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
  const po_umolchaniyu = poschitat(vvod({ polotno: PRAJS.polotno_po_umolchaniyu }), PRAJS);
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
    assert.equal(stroka(r, id), undefined, `строка ${id} не должна появляться при нуле`);
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
    vvod({ svetilniki: 6, obvody: 2, ugly: 3, demontazh: true, polotno: "tkanevoe" }),
    PRAJS,
  );
  assert.equal(r.itogo, r.stroki.reduce((s, str) => s + str.summa, 0));
});
```

- [ ] **Step 2: Запустить тесты и убедиться, что они падают**

Run: `node --test raschet.test.mjs`
Expected: FAIL — «уточнение {"svetilniki":3} должно добавить 2250 ₽», строки
`svetilniki` нет

- [ ] **Step 3: Дописать уточнения в расчёт**

В `raschet.mjs` заменить сборку массива `stroki` на такую: строки полотна и
профиля остаются как были, между профилем и выездом добавляются четыре
условные строки.

```js
  const ugly = Math.round(chislo(vvod?.ugly, PREDELY.uglov));
  const svetilniki = Math.round(chislo(vvod?.svetilniki, PREDELY.svetilnikov));
  const obvody = Math.round(chislo(vvod?.obvody, PREDELY.obvodov));

  const stroki = [
    stroka({
      id: "polotno",
      nazvanie: `Полотно: ${vid.nazvanie.toLowerCase()}`,
      poyasnenie: "Считается по площади комнат",
      kolichestvo: ploshad,
      edinica: "м²",
      cena: vid.cena_za_m2,
      utochnenie: "polotno",
    }),
    stroka({
      id: "profil",
      nazvanie: "Профиль по периметру",
      poyasnenie: "Багет, на который натягивается полотно",
      kolichestvo: perimetr,
      edinica: "м",
      cena: prajs.profil_za_m,
      utochnenie: "razmery",
    }),
  ];

  // Условные строки появляются только тогда, когда за них правда платят.
  // Строка «0 шт · 0 ₽» в смете — это шум, из-за которого перестают читать
  // и остальные строки.
  if (ugly > 0) {
    stroki.push(stroka({
      id: "ugly",
      nazvanie: "Углы сверх четырёх",
      poyasnenie: "Каждый лишний угол — это отдельный стык профиля",
      kolichestvo: ugly,
      edinica: "шт",
      cena: prajs.ugol,
      utochnenie: "ugly",
    }));
  }

  if (svetilniki > 0) {
    stroki.push(stroka({
      id: "svetilniki",
      nazvanie: "Светильники",
      poyasnenie: "Закладная платформа и врезка кольца под каждый",
      kolichestvo: svetilniki,
      edinica: "шт",
      cena: prajs.svetilnik,
      utochnenie: "svetilniki",
    }));
  }

  if (obvody > 0) {
    stroki.push(stroka({
      id: "obvody",
      nazvanie: "Обводы труб",
      poyasnenie: "Труба отопления, проходящая через потолок",
      kolichestvo: obvody,
      edinica: "шт",
      cena: prajs.obvod_truby,
      utochnenie: "obvody",
    }));
  }

  if (vvod?.demontazh) {
    stroki.push(stroka({
      id: "demontazh",
      nazvanie: "Демонтаж старого потолка",
      poyasnenie: "Снять прежнее полотно и вывезти мусор",
      kolichestvo: ploshad,
      edinica: "м²",
      cena: prajs.demontazh_za_m2,
      utochnenie: "demontazh",
    }));
  }

  stroki.push(stroka({
    id: "vyezd",
    nazvanie: "Выезд бригады",
    poyasnenie: "Один раз на заказ, сколько бы ни было комнат",
    kolichestvo: 1,
    edinica: "заказ",
    cena: prajs.vyezd,
    utochnenie: null,
  }));
```

- [ ] **Step 4: Запустить тесты и убедиться, что они проходят**

Run: `node --test raschet.test.mjs`
Expected: PASS, 18 тестов

- [ ] **Step 5: Коммит**

```bash
git add raschet.mjs raschet.test.mjs
git commit -m "Расчёт: пять уточнений — полотно, углы, светильники, обводы, демонтаж

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Вилка «от и до»

**Files:**
- Modify: `raschet.mjs` — считать вилку вместо заглушки `{ ot: itogo, do: itogo }`
- Modify: `raschet.test.mjs` — добавить блок тестов на вилку

**Interfaces:**
- Consumes: `poschitat` (Task 3), `PRAJS.vilka` (Task 1)
- Produces: `rezultat.vilka = { ot, do }` — целые рубли, кратные ста,
  `ot <= do` всегда

- [ ] **Step 1: Написать падающие тесты**

Дописать в конец `raschet.test.mjs`:

```js
/* — вилка — */

test("нижняя граница вилки никогда не выше верхней", () => {
  const nabory = [
    vvod(),
    vvod({ komnaty: [{ dlina: 1.2, shirina: 1.1 }] }),
    vvod({ komnaty: [{ dlina: 0.1, shirina: 0.1 }] }),
    vvod({ svetilniki: 30, obvody: 10, ugly: 8, demontazh: true, polotno: "tkanevoe" }),
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
    assert.ok(r.vilka.ot <= r.vilka.do, `вилка вывернута: ${JSON.stringify(r.vilka)}`);
  }
});

test("вилка построена от итога по ширине из прайса", () => {
  const r = poschitat(vvod(), PRAJS);
  assert.ok(r.vilka.ot <= r.itogo && r.itogo <= r.vilka.do);
  assert.equal(r.vilka.ot, Math.round((r.itogo * (1 - PRAJS.vilka.vniz)) / 100) * 100);
  assert.equal(r.vilka.do, Math.round((r.itogo * (1 + PRAJS.vilka.vverh)) / 100) * 100);
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
```

- [ ] **Step 2: Запустить тесты и убедиться, что они падают**

Run: `node --test raschet.test.mjs`
Expected: FAIL — `vilka.ot` равен `itogo`, а не округлённой нижней границе

- [ ] **Step 3: Посчитать вилку**

В `raschet.mjs` добавить рядом с `metry` функцию округления до сотен и
заменить возврат:

```js
/** До сотен рублей: вилка с точностью до рубля перестаёт быть вилкой. */
function sotni(rubli) {
  return Math.round(rubli / 100) * 100;
}
```

```js
  const itogo = stroki.reduce((s, str) => s + str.summa, 0);

  // Ширину вилки задаёт прайс, а не настроение. Вниз двигает ровный потолок
  // и простая геометрия, вверх — то, что видно только на замере.
  const vilka = {
    ot: sotni(itogo * (1 - prajs.vilka.vniz)),
    do: sotni(itogo * (1 + prajs.vilka.vverh)),
  };

  return { ploshad, perimetr, stroki, itogo, vilka };
```

- [ ] **Step 4: Запустить все тесты и убедиться, что они проходят**

Run: `npm test`
Expected: PASS, 27 тестов (4 прайса + 23 расчёта)

- [ ] **Step 5: Коммит**

```bash
git add raschet.mjs raschet.test.mjs
git commit -m "Расчёт: итог вилкой, ширина берётся из прайса

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Страница — каркас, оформление и статические секции

**Files:**
- Create: `index.html`

Расчёта в этой задаче ещё нет: он подключается в Task 6. Здесь появляются
шапка головы, переменные оформления, сетка и все секции, кроме калькулятора,
на месте которого стоит пустой контейнер.

**Interfaces:**
- Consumes: ничего
- Produces: разметка с этими опорными точками, на которые опираются Task 6–9:
  - `#raschet` — секция расчёта
  - `.raschet__upravlenie` — контейнер полей
  - `#smeta` — контейнер строк сметы
  - `#itogo` — контейнер вилки
  - `#pechat` — кнопка печати
  - классы секций: `ekran`, `polosa`, `problema`, `shagi`, `vhodit`,
    `razbor`, `raschet`, `voprosy`, `prizyv`, `podval`

- [ ] **Step 1: Написать голову документа**

Создать `index.html` со следующей головой. Шрифт вшивается в Task 9, пока
стоит системный набор.

```html
<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Натяжные потолки за день — смета на экране, без звонка</title>
<meta name="description" content="Демонстрационный лендинг: расчёт натяжного потолка построчной сметой, пять уточнений и итог вилкой. Компания и цены условные.">
<!-- Компания вымышленная, цены условные: в поисковой выдаче такой странице не место. -->
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2032%2032%22%3E%3Crect%20width%3D%2232%22%20height%3D%2232%22%20rx%3D%227%22%20fill%3D%22%231b3a5c%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%229%22%20width%3D%2222%22%20height%3D%224%22%20rx%3D%221.5%22%20fill%3D%22%23fff%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2217%22%20width%3D%2216%22%20height%3D%222.6%22%20rx%3D%221.3%22%20fill%3D%22%2374a9dc%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2223%22%20width%3D%2210%22%20height%3D%222.6%22%20rx%3D%221.3%22%20fill%3D%22%2374a9dc%22%2F%3E%3C%2Fsvg%3E">
<style>
/* ОФОРМЛЕНИЕ: начало */
```

- [ ] **Step 2: Написать переменные и основу оформления**

Продолжить тот же `<style>`:

```css
:root{
  --fon:#f6f7f9;
  --karta:#ffffff;
  --tekst:#15212e;        /* на белом даёт 14,9 по WCAG */
  --tekst-tihij:#4d5b6b;  /* на белом 7,2 — вторичный текст остаётся читаемым */
  --ramka:#dde2e8;
  --sinij:#1b3a5c;        /* на белом 11,6, белый на нём 11,6 */
  --sinij-svetlyj:#e8f0f8;
  --akcent:#b4541f;       /* на белом 4,9 — цифры итога и подсветка */
  --akcent-fon:#fdf1e7;
  --zelenyj:#1d6b45;
  --radius:12px;
  --shag:clamp(16px,4vw,28px);
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0;background:var(--fon);color:var(--tekst);
  font:400 17px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  -webkit-text-size-adjust:100%;
}
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *{animation-duration:.01ms!important;transition-duration:.01ms!important}
}
.obolochka{max-width:1060px;margin:0 auto;padding:0 var(--shag)}
.razdel{padding:clamp(40px,7vw,72px) 0}
h1,h2,h3{line-height:1.22;margin:0 0 .5em;text-wrap:balance}
h1{font-size:clamp(28px,5.4vw,44px);font-weight:700;letter-spacing:-.02em}
h2{font-size:clamp(23px,3.6vw,32px);font-weight:700;letter-spacing:-.01em}
h3{font-size:clamp(18px,2.4vw,21px);font-weight:600}
p{margin:0 0 1em}
p:last-child{margin-bottom:0}
a{color:var(--sinij)}
.kartochka{
  background:var(--karta);border:1px solid var(--ramka);
  border-radius:var(--radius);padding:clamp(18px,3vw,26px);
}
.setka{display:grid;gap:clamp(12px,2vw,18px)}
@media (min-width:720px){
  .setka--2{grid-template-columns:1fr 1fr}
  .setka--4{grid-template-columns:repeat(4,1fr)}
}
.knopka{
  display:inline-block;border:0;border-radius:10px;cursor:pointer;
  background:var(--sinij);color:#fff;
  font:600 18px/1 inherit;padding:16px 28px;text-decoration:none;
  transition:background .15s ease;
}
.knopka:hover{background:#12293f}
.knopka:focus-visible{outline:3px solid var(--akcent);outline-offset:2px}
.knopka--tihaya{background:transparent;color:var(--sinij);border:1.5px solid var(--sinij);font-size:16px;padding:12px 20px}
.knopka--tihaya:hover{background:var(--sinij-svetlyj)}
.tihij{color:var(--tekst-tihij);font-size:15px}
.uslovno{
  display:inline-block;background:var(--akcent-fon);color:#7a3612;
  border-radius:6px;padding:2px 8px;font-size:13px;font-weight:600;
}
```

- [ ] **Step 3: Написать первый экран, полосу с цифрами и блок про проблему**

Продолжить документ после закрытия `<style>` и `</head>`:

```html
<body>
<main>

<section class="razdel ekran">
  <div class="obolochka">
    <p class="uslovno">Демонстрация. Компания и цены условные</p>
    <h1>Натяжные потолки в квартире — за один день</h1>
    <p class="ekran__podzagolovok">Бригада «Потолок за день»: замер, монтаж и уборка в тот же день.
    Комната площадью до 20 м² — 3–4 часа работы, жить можно с вечера.</p>
    <p><a class="knopka" href="#raschet">Посчитать смету</a></p>
    <p class="tihij">Смета появится прямо на этой странице: построчно, с итогом вилкой.
    Телефон вводить не нужно, звонить вам никто не будет.</p>
  </div>
</section>

<section class="razdel polosa">
  <div class="obolochka setka setka--4">
    <div class="kartochka"><p class="polosa__cifra">1 день</p><p class="tihij">от замера до готового потолка в одной комнате</p></div>
    <div class="kartochka"><p class="polosa__cifra">7 строк</p><p class="tihij">из которых складывается смета — все показаны</p></div>
    <div class="kartochka"><p class="polosa__cifra">0 ₽</p><p class="tihij">стоит расчёт, и телефон для него не нужен</p></div>
    <div class="kartochka"><p class="polosa__cifra">10 лет</p><p class="tihij">гарантия на полотно и на шов</p></div>
  </div>
  <p class="obolochka tihij">Цифры условные: это демонстрация вёрстки и расчёта, а не предложение существующей бригады.</p>
</section>

<section class="razdel problema">
  <div class="obolochka">
    <h2>«Назвали цену за метр, а в счёте вышло вдвое больше»</h2>
    <div class="setka setka--2">
      <div class="kartochka">
        <h3>Как это обычно происходит</h3>
        <p>На сайте написано «от 350 ₽ за м²». Человек считает свои 12 метров,
        получает 4 200 ₽ и зовёт замерщика. На замере выясняется, что профиль
        считается отдельно, светильники отдельно, обвод трубы отдельно, а старый
        потолок надо снять — и это тоже отдельно. В договоре появляется 12 тысяч.</p>
      </div>
      <div class="kartochka">
        <h3>Что не так с этой цифрой</h3>
        <p>Она не врёт: полотно правда стоит 350 ₽ за метр. Врёт то, что её
        называют ценой потолка. Потолок — это полотно, профиль по периметру, углы,
        закладные под светильники, обводы труб и вывоз старого покрытия.
        Поэтому ниже считается не «цена за метр», а вся смета построчно.</p>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Написать четыре шага, «что входит в цену» и разбор сметы**

```html
<section class="razdel shagi">
  <div class="obolochka">
    <h2>Как проходит работа</h2>
    <ol class="shagi__spisok setka setka--2">
      <li class="kartochka"><h3>1. Расчёт на этой странице</h3><p>Вы вводите размеры и пять уточнений — видите смету и вилку. Ничего не отправляется и никуда не уходит.</p></li>
      <li class="kartochka"><h3>2. Замер</h3><p>Замерщик приезжает со стремянкой и лазерной рулеткой, смотрит стены, углы и проводку. После замера цена становится точной.</p></li>
      <li class="kartochka"><h3>3. Монтаж</h3><p>Профиль по периметру, прогрев и натяжка полотна, врезка светильников, обводы труб. Одна комната — 3–4 часа.</p></li>
      <li class="kartochka"><h3>4. Уборка и приёмка</h3><p>Мусор и старое полотно бригада увозит. Вы включаете свет, смотрите швы и углы и подписываете работу.</p></li>
    </ol>
  </div>
</section>

<section class="razdel vhodit">
  <div class="obolochka">
    <h2>Что уже входит в цену</h2>
    <div class="setka setka--2">
      <ul class="vhodit__spisok">
        <li>Полотно и профиль по периметру</li>
        <li>Первые четыре угла комнаты</li>
        <li>Прогрев помещения и натяжка</li>
        <li>Вынос и вывоз старого полотна, если его снимали</li>
      </ul>
      <ul class="vhodit__spisok">
        <li>Уборка после монтажа</li>
        <li>Гарантия 10 лет на полотно и шов</li>
        <li>Выезд бригады — одной строкой на весь заказ</li>
        <li>Повторный приезд, если что-то пошло не так по нашей вине</li>
      </ul>
    </div>
  </div>
</section>

<section class="razdel razbor">
  <div class="obolochka">
    <h2>Разбор одной сметы</h2>
    <p>Кухня 3,2 × 2,8 м, матовое полотно, четыре точечных светильника,
    один обвод трубы отопления, старый потолок снимаем. Вот откуда берётся итог.</p>
    <div class="kartochka razbor__tekst">
      <p><strong>Полотно, 8,96 м².</strong> Площадь пола равна площади потолка,
      считается по внешним размерам комнаты. По прайсу матовое — 390 ₽ за метр.</p>
      <p><strong>Профиль, 12 м.</strong> Периметр, а не площадь: багет идёт по
      стенам. Это отдельная строка именно потому, что её чаще всего «забывают»
      в цене за метр.</p>
      <p><strong>Светильники, 4 шт.</strong> Под каждый ставится закладная
      платформа на подвесах и врезается термокольцо. Это работа, а не фурнитура.</p>
      <p><strong>Обвод трубы, 1 шт.</strong> Труба отопления проходит через
      потолок: полотно надо разрезать, посадить на кольцо и загерметизировать.
      Самая частая причина, по которой смета расходится с расчётом по метрам.</p>
      <p><strong>Демонтаж, 8,96 м².</strong> Снять старое полотно, вынести и
      вывезти. Если потолок в комнате первый — этой строки в смете не будет.</p>
      <p><strong>Выезд, один раз.</strong> Не за комнату и не за метр: бригада
      приезжает один раз, сколько бы комнат ни считали.</p>
      <p class="tihij">Посчитать свою комнату можно ниже. Числа в разборе — из
      того же прайса, по которому работает калькулятор.</p>
    </div>
  </div>
</section>
```

- [ ] **Step 5: Написать пустую секцию расчёта, вопросы, призыв и подвал**

```html
<section class="razdel raschet" id="raschet">
  <div class="obolochka">
    <h2>Смета на вашу комнату</h2>
    <p>Введите размеры и уточните пять вещей. Каждое уточнение сразу двигает
    итог и подсвечивает строку, на которую повлияло.</p>
    <div class="raschet__setka">
      <div class="raschet__upravlenie"><!-- поля появятся в Task 6 --></div>
      <div class="raschet__vyvod">
        <div id="smeta"></div>
        <div id="itogo"></div>
      </div>
    </div>
  </div>
</section>

<section class="razdel voprosy">
  <div class="obolochka">
    <h2>Вопросы, которые задают до замера</h2>
    <div class="setka">
      <div class="kartochka"><h3>Почему вилка, а не точная цена?</h3><p>Потому что точную цену даёт замер. До него неизвестны состояние стен, высота помещения и то, что скрыто за старым потолком. Калькулятор, обещающий точную цену заранее, сначала занижает её, а потом заставляет мастера объясняться у вас в квартире.</p></div>
      <div class="kartochka"><h3>А если на замере цена вырастет?</h3><p>Она может оказаться внутри вилки выше середины — для этого вилка и нужна. Выйти за верхнюю границу она может только если на месте обнаружится работа, которой не было в расчёте: например, потолок придётся выравнивать. В этом случае вам называют новую цену до начала работ, а не после.</p></div>
      <div class="kartochka"><h3>Почему профиль считается отдельно от полотна?</h3><p>Потому что это разные материалы и разные величины. Полотно считается по площади, профиль — по периметру. В узкой длинной комнате профиля уходит больше, чем в квадратной той же площади, и одной ценой за метр это не описать.</p></div>
      <div class="kartochka"><h3>Светильники входят в цену потолка?</h3><p>Нет. В смету входит работа: закладная платформа, термокольцо, врезка. Сами светильники вы покупаете сами и выбираете какие хотите — так дешевле и честнее, чем брать их у бригады с наценкой.</p></div>
      <div class="kartochka"><h3>Зачем вообще показывать смету до звонка?</h3><p>Чтобы вы могли сравнить нас с другими, не оставляя телефон. Обмен цифры на контакт — самый частый приём в этой нише и самая частая причина, по которой страницу закрывают. Смета здесь появляется сразу и печатается одной кнопкой.</p></div>
    </div>
  </div>
</section>

<section class="razdel prizyv">
  <div class="obolochka">
    <h2>Записаться на замер</h2>
    <!-- форма появится в Task 8 -->
  </div>
</section>

</main>

<footer class="podval">
  <div class="obolochka">
    <!-- подвал появится в Task 8 -->
  </div>
</footer>
</body>
</html>
```

- [ ] **Step 6: Дописать оформление секций**

Добавить в тот же `<style>` перед строкой `/* ОФОРМЛЕНИЕ: конец */`:

```css
.ekran{background:linear-gradient(180deg,var(--sinij-svetlyj),var(--fon));padding-top:clamp(28px,5vw,56px)}
.ekran__podzagolovok{font-size:clamp(18px,2.6vw,21px);max-width:44ch;color:var(--tekst-tihij)}
.ekran .tihij{max-width:52ch;margin-top:14px}
.polosa{padding-top:0}
.polosa__cifra{font-size:clamp(24px,3.4vw,30px);font-weight:700;color:var(--sinij);margin:0 0 4px}
.polosa .tihij{margin-top:14px}
.shagi__spisok{list-style:none;padding:0;margin:0;counter-reset:none}
.vhodit__spisok{list-style:none;padding:0;margin:0}
.vhodit__spisok li{padding:10px 0 10px 30px;position:relative;border-bottom:1px solid var(--ramka)}
.vhodit__spisok li::before{content:"✓";position:absolute;left:4px;top:10px;color:var(--zelenyj);font-weight:700}
.razbor__tekst p strong{color:var(--sinij)}
.raschet{background:var(--karta);border-block:1px solid var(--ramka)}
.raschet__setka{display:grid;gap:clamp(18px,3vw,28px);margin-top:24px}
@media (min-width:880px){.raschet__setka{grid-template-columns:minmax(300px,380px) 1fr;align-items:start}}
.voprosy .kartochka h3{color:var(--sinij)}
.prizyv{background:var(--sinij-svetlyj)}
.podval{background:var(--sinij);color:#e7eef6;padding:clamp(28px,5vw,48px) 0;font-size:15px}
.podval a{color:#fff}
/* ОФОРМЛЕНИЕ: конец */
```

- [ ] **Step 7: Посмотреть страницу глазами**

Run: `python3 -m http.server 8080` и открыть `http://localhost:8080/`
Expected: все секции на месте, кроме калькулятора, формы и подвала;
горизонтальной прокрутки нет ни на 360 px, ни на 1280 px; в консоли пусто.

- [ ] **Step 8: Коммит**

```bash
git add index.html
git commit -m "Страница: каркас, оформление и статические секции

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Калькулятор на странице

**Files:**
- Modify: `index.html` — поля в `.raschet__upravlenie`, сценарий расчёта, оформление сметы

**Interfaces:**
- Consumes: `poschitat`, `PREDELY` из `raschet.mjs` (Task 4), `PRAJS` из
  `prajs.mjs` (Task 1)
- Produces:
  - `data-utochnenie` на каждом поле — совпадает с `utochnenie` у строки сметы
  - `.stroka[data-id]` — строка сметы в DOM
  - `.stroka--dvinulas` — класс подсветки, снимается через 1,2 с
  - глобальная функция не экспортируется: сценарий встроенный и замкнутый

- [ ] **Step 1: Написать поля расчёта**

Заменить содержимое `<div class="raschet__upravlenie">`:

```html
<div class="raschet__upravlenie">
  <fieldset class="pole">
    <legend>Размеры комнат, метры</legend>
    <div id="komnaty"></div>
    <button type="button" class="knopka--tihaya" id="dobavit-komnatu">Добавить комнату</button>
  </fieldset>

  <p class="pole">
    <label for="polotno">Тип полотна</label>
    <select id="polotno" data-utochnenie="polotno"></select>
  </p>

  <p class="pole">
    <label for="svetilniki">Светильников, шт</label>
    <input type="number" id="svetilniki" data-utochnenie="svetilniki" value="0" min="0" step="1" inputmode="numeric">
  </p>

  <p class="pole">
    <label for="obvody">Обводов труб, шт</label>
    <input type="number" id="obvody" data-utochnenie="obvody" value="0" min="0" step="1" inputmode="numeric">
    <span class="pole__podskazka">Трубы отопления, проходящие через потолок</span>
  </p>

  <p class="pole">
    <label for="ugly">Углов сверх четырёх, шт</label>
    <input type="number" id="ugly" data-utochnenie="ugly" value="0" min="0" step="1" inputmode="numeric">
    <span class="pole__podskazka">Ниши, выступы, короба. Прямоугольная комната — ноль</span>
  </p>

  <p class="pole pole--galochka">
    <label><input type="checkbox" id="demontazh" data-utochnenie="demontazh"> Снять старый натяжной потолок</label>
  </p>
</div>
```

- [ ] **Step 2: Написать сценарий расчёта**

Добавить перед `</body>`:

```html
<script type="module">
import { poschitat, PREDELY } from "./raschet.mjs";
import { PRAJS } from "./prajs.mjs";

/* — мелкие помощники — */

const naiti = (id) => document.getElementById(id);

/** Рубли по-русски: неразрывные пробелы в разрядах и знак валюты. */
const rubli = (n) => n.toLocaleString("ru-RU").replace(/ |\s/g, " ") + " ₽";

/** Количество: целое печатаем целым, дробное — с запятой. */
const kolvo = (n) => Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",");

function element(teg, klass, tekst) {
  const uzel = document.createElement(teg);
  if (klass) uzel.className = klass;
  if (tekst !== undefined) uzel.textContent = tekst;
  return uzel;
}

/* — комнаты — */

const komnaty = naiti("komnaty");

function dobavit_komnatu(nomer) {
  const ryad = element("div", "komnata");
  ryad.append(element("span", "komnata__nomer", `${nomer}`));
  for (const [imya, podpis] of [["dlina", "длина"], ["shirina", "ширина"]]) {
    const pole = document.createElement("input");
    pole.type = "number";
    pole.className = `komnata__pole komnata__${imya}`;
    pole.min = "0";
    pole.max = String(PREDELY.storona);
    pole.step = "0.1";
    pole.inputMode = "decimal";
    pole.placeholder = podpis;
    pole.setAttribute("aria-label", `Комната ${nomer}, ${podpis} в метрах`);
    pole.dataset.utochnenie = "razmery";
    ryad.append(pole);
  }
  komnaty.append(ryad);
}

dobavit_komnatu(1);
naiti("komnaty").querySelector(".komnata__dlina").value = "3.2";
naiti("komnaty").querySelector(".komnata__shirina").value = "2.8";

const knopka_komnaty = naiti("dobavit-komnatu");
knopka_komnaty.addEventListener("click", () => {
  const skolko = komnaty.children.length;
  if (skolko >= PREDELY.komnat) return;
  dobavit_komnatu(skolko + 1);
  if (komnaty.children.length >= PREDELY.komnat) knopka_komnaty.hidden = true;
  perescitat("razmery");
});

/* — тип полотна: пункты строятся из прайса, а не пишутся в разметку — */

const vybor_polotna = naiti("polotno");
for (const [klyuch, vid] of Object.entries(PRAJS.polotno)) {
  const punkt = element("option", null, `${vid.nazvanie} — ${rubli(vid.cena_za_m2)}/м²`);
  punkt.value = klyuch;
  vybor_polotna.append(punkt);
}
vybor_polotna.value = PRAJS.polotno_po_umolchaniyu;

/* — сбор ввода и перерисовка — */

function sobrat() {
  return {
    komnaty: [...komnaty.children].map((ryad) => ({
      dlina: ryad.querySelector(".komnata__dlina").value,
      shirina: ryad.querySelector(".komnata__shirina").value,
    })),
    polotno: vybor_polotna.value,
    svetilniki: naiti("svetilniki").value,
    obvody: naiti("obvody").value,
    ugly: naiti("ugly").value,
    demontazh: naiti("demontazh").checked,
  };
}

const smeta = naiti("smeta");
const itogo = naiti("itogo");
let tajmer_podsvetki = 0;

function narisovat_smetu(rezultat, utochnenie) {
  smeta.replaceChildren();

  if (rezultat.stroki.length === 0) {
    smeta.append(element("p", "smeta__pusto", "Введите размеры комнаты — смета появится здесь."));
    itogo.replaceChildren();
    return;
  }

  const shapka = element("p", "smeta__shapka",
    `Площадь ${kolvo(rezultat.ploshad)} м², периметр ${kolvo(rezultat.perimetr)} м`);
  smeta.append(shapka);

  const spisok = element("ul", "smeta__spisok");
  for (const stroka of rezultat.stroki) {
    const punkt = element("li", "stroka");
    punkt.dataset.id = stroka.id;
    if (stroka.utochnenie) punkt.dataset.utochnenie = stroka.utochnenie;
    punkt.append(
      element("span", "stroka__nazvanie", stroka.nazvanie),
      element("span", "stroka__poyasnenie", stroka.poyasnenie),
      element("span", "stroka__schet",
        `${kolvo(stroka.kolichestvo)} ${stroka.edinica} × ${rubli(stroka.cena)}`),
      element("span", "stroka__summa", rubli(stroka.summa)),
    );
    spisok.append(punkt);
  }
  smeta.append(spisok);

  itogo.replaceChildren(
    element("p", "itogo__podpis", "Предварительно, до замера"),
    element("p", "itogo__vilka", `${rubli(rezultat.vilka.ot)} — ${rubli(rezultat.vilka.do)}`),
    element("p", "itogo__poyasnenie",
      "Сумма строк — " + rubli(rezultat.itogo) +
      ". Вилка шире: точную цену называют после замера, когда видно стены, высоту и то, что скрыто за старым потолком."),
  );

  // Подсвечиваем ровно те строки, на которые влияет только что тронутое поле.
  // Сравнивать суммы «до и после» нельзя: два уточнения подряд могут
  // скомпенсировать друг друга, и подсветка соврёт.
  if (utochnenie) {
    clearTimeout(tajmer_podsvetki);
    const dvinulis = spisok.querySelectorAll(`[data-utochnenie="${utochnenie}"]`);
    for (const uzel of dvinulis) uzel.classList.add("stroka--dvinulas");
    tajmer_podsvetki = setTimeout(() => {
      for (const uzel of dvinulis) uzel.classList.remove("stroka--dvinulas");
    }, 1200);
  }
}

function perescitat(utochnenie) {
  narisovat_smetu(poschitat(sobrat(), PRAJS), utochnenie);
}

document.querySelector(".raschet__upravlenie").addEventListener("input", (sobytie) => {
  perescitat(sobytie.target.dataset.utochnenie);
});
document.querySelector(".raschet__upravlenie").addEventListener("change", (sobytie) => {
  perescitat(sobytie.target.dataset.utochnenie);
});

perescitat(null);
</script>
```

- [ ] **Step 3: Написать оформление сметы**

Добавить в `<style>` перед `/* ОФОРМЛЕНИЕ: конец */`:

```css
.pole{display:block;margin:0 0 18px}
.pole label,.pole legend{display:block;font-weight:600;font-size:15px;margin-bottom:6px}
.pole--galochka label{font-weight:400;display:flex;gap:10px;align-items:flex-start}
fieldset.pole{border:1px solid var(--ramka);border-radius:10px;padding:14px 16px}
.pole__podskazka{display:block;color:var(--tekst-tihij);font-size:14px;margin-top:4px}
.pole input[type=number],.pole select{
  width:100%;font:inherit;padding:11px 12px;
  border:1.5px solid var(--ramka);border-radius:8px;background:#fff;color:var(--tekst);
}
.pole input:focus-visible,.pole select:focus-visible{outline:3px solid var(--akcent);outline-offset:1px}
.komnata{display:flex;gap:8px;align-items:center;margin-bottom:10px}
.komnata__nomer{color:var(--tekst-tihij);font-size:14px;width:1.2em;flex:none}
.komnata__pole{width:100%;font:inherit;padding:11px 12px;border:1.5px solid var(--ramka);border-radius:8px}
.smeta__shapka{color:var(--tekst-tihij);font-size:15px;margin-bottom:10px}
.smeta__pusto{color:var(--tekst-tihij)}
.smeta__spisok{list-style:none;margin:0;padding:0;border-top:1px solid var(--ramka)}
.stroka{
  display:grid;grid-template-columns:1fr auto;gap:2px 14px;
  padding:12px 10px;border-bottom:1px solid var(--ramka);
  border-radius:8px;transition:background .25s ease;
}
.stroka__nazvanie{font-weight:600}
.stroka__poyasnenie,.stroka__schet{color:var(--tekst-tihij);font-size:14px;grid-column:1}
.stroka__summa{grid-row:1/3;align-self:center;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
.stroka--dvinulas{background:var(--akcent-fon)}
.itogo__podpis{color:var(--tekst-tihij);font-size:15px;margin:22px 0 2px}
.itogo__vilka{font-size:clamp(26px,4.6vw,36px);font-weight:700;color:var(--akcent);margin:0 0 8px;font-variant-numeric:tabular-nums}
.itogo__poyasnenie{color:var(--tekst-tihij);font-size:15px;max-width:52ch}
```

- [ ] **Step 4: Проверить в браузере руками**

Run: `python3 -m http.server 8080`, открыть `http://localhost:8080/#raschet`
Expected:
- при загрузке смета уже посчитана для комнаты 3,2 × 2,8;
- ввод светильника двигает итог ровно на 750 ₽ и подсвечивает строку
  «Светильники» на секунду;
- очистка размеров даёт «Введите размеры комнаты», а не нули и не выезд;
- после третьей комнаты кнопка «Добавить комнату» исчезает;
- в консоли пусто.

- [ ] **Step 5: Прогнать тесты расчёта — страница их сломать не должна**

Run: `npm test`
Expected: PASS, 27 тестов

- [ ] **Step 6: Коммит**

```bash
git add index.html
git commit -m "Калькулятор: поля, построчная смета, вилка и подсветка строк

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Печать сметы отдельным документом

**Files:**
- Modify: `index.html` — печатная шапка, список неизвестного, кнопка печати, `<style media="print">`

Правила печати взяты из работы `otchet-proverka` (`index.html`, блок
`<style media="print">`): формат A4, поля 16 × 14 мм, `break-inside: avoid`
на карточках, разворот адресов ссылок в текст.

**Interfaces:**
- Consumes: `#smeta`, `#itogo` (Task 6)
- Produces: `#pechat` — кнопка; `#pechatnaya-shapka` — блок, видимый только
  в печати; `.ne-pechataem` — класс на всём, что на бумагу не идёт

- [ ] **Step 1: Добавить печатную шапку, список неизвестного и кнопку**

В секции `#raschet`, внутри `.raschet__vyvod`, после `<div id="itogo"></div>`:

```html
<p class="ne-pechataem"><button type="button" class="knopka--tihaya" id="pechat">Распечатать смету</button></p>

<div class="kartochka neizvestno">
  <h3>Чего этот расчёт не знает</h3>
  <p>Всё перечисленное выяснится на замере и может сдвинуть цену внутри вилки.
  Это не отговорка: мастер скажет то же самое, просто на два дня позже.</p>
  <ul>
    <li><strong>Состояние стен.</strong> Осыпающуюся штукатурку под профиль крепить нельзя, её укрепляют.</li>
    <li><strong>Высота помещения.</strong> Потолки выше трёх метров — это подмости и другая скорость работы.</li>
    <li><strong>Нестандартные углы.</strong> Скруглённые стены и эркеры считаются не по числу углов.</li>
    <li><strong>Закладная под тяжёлую люстру.</strong> Если люстра больше 3 кг, под неё ставится отдельная платформа.</li>
    <li><strong>Подъезд и лифт.</strong> Трёхметровый профиль не всегда проходит в лифт, иногда его несут пешком.</li>
  </ul>
</div>
```

В `.raschet__vyvod`, первым элементом — печатная шапка:

```html
<div id="pechatnaya-shapka">
  <p class="pechatnaya-shapka__kto">«Потолок за день» — предварительная смета</p>
  <p class="pechatnaya-shapka__data" id="data-rascheta"></p>
  <p class="pechatnaya-shapka__ogovorka">Компания и цены условные: это демонстрационный расчёт.
  Цена предварительная и уточняется на замере — итог указан вилкой.</p>
</div>
```

- [ ] **Step 2: Пометить непечатаемое**

Добавить класс `ne-pechataem` на секции `.ekran`, `.polosa`, `.problema`,
`.shagi`, `.vhodit`, `.razbor`, `.voprosy`, `.prizyv`, на `<footer>` и на
`.raschet__upravlenie`, а также на заголовок и вводный абзац секции
`#raschet`.

- [ ] **Step 3: Дописать сценарий печати**

В конец встроенного `<script type="module">`:

```js
/* — печать — */

// Дата ставится перед самой печатью, а не при загрузке: страница может быть
// открыта со вчера, а на бумаге должна стоять дата расчёта, не дата визита.
function postavit_datu() {
  naiti("data-rascheta").textContent = "Расчёт от " +
    new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

window.addEventListener("beforeprint", postavit_datu);
naiti("pechat").addEventListener("click", () => {
  postavit_datu();
  window.print();
});
```

- [ ] **Step 4: Написать правила печати**

Добавить перед `</head>` отдельным блоком:

```html
<style media="print">
/* ПЕЧАТЬ: начало */
@page{size:A4;margin:16mm 14mm}
body{background:#fff;color:#000;padding:0;font-size:11pt;line-height:1.42}
/* Печатается смета, а не страница: ни первого экрана, ни вопросов, ни формы. */
.ne-pechataem{display:none!important}
.razdel{padding:0}
.obolochka{max-width:none;padding:0}
.raschet{border:0;background:none}
.raschet__setka{display:block}
#pechatnaya-shapka{display:block;margin-bottom:6mm;border-bottom:1.5pt solid #000;padding-bottom:3mm}
.pechatnaya-shapka__kto{font-size:15pt;font-weight:700;margin:0 0 1mm}
.pechatnaya-shapka__data{margin:0 0 2mm}
.pechatnaya-shapka__ogovorka{font-size:9.5pt;color:#333;margin:0;max-width:none}
.smeta__spisok{border-top:1pt solid #000}
.stroka{
  padding:2.5mm 0;border-bottom:.5pt solid #999;border-radius:0;background:none!important;
  break-inside:avoid;page-break-inside:avoid;
}
.stroka__poyasnenie{display:none}  /* на бумаге место дороже, чем на экране */
.stroka__schet,.itogo__podpis,.itogo__poyasnenie{color:#333}
.itogo__vilka{color:#000;font-size:20pt}
.neizvestno,.kartochka{
  background:none;border:1pt solid #999;border-radius:0;box-shadow:none;
  break-inside:avoid;page-break-inside:avoid;margin-top:5mm;padding:4mm;
}
h2,h3{break-after:avoid;page-break-after:avoid}
a{color:#000;text-decoration:underline}
/* ПЕЧАТЬ: конец */
</style>
```

И в экранном `<style>`, перед `/* ОФОРМЛЕНИЕ: конец */`:

```css
#pechatnaya-shapka{display:none}
.neizvestno{margin-top:26px}
.neizvestno ul{margin:0;padding-left:22px}
.neizvestno li{margin-bottom:8px}
.neizvestno li:last-child{margin-bottom:0}
```

- [ ] **Step 5: Проверить печать глазами**

Run: `python3 -m http.server 8080`, открыть страницу, посчитать смету,
нажать «Распечатать смету», посмотреть предпросмотр печати.
Expected: на листе только печатная шапка с датой и оговоркой, строки сметы,
вилка и список «чего расчёт не знает». Первого экрана, вопросов, формы и
полей ввода на бумаге нет. Строка сметы не разрывается между страницами.

- [ ] **Step 6: Коммит**

```bash
git add index.html
git commit -m "Печать: смета отдельным документом, с датой и оговоркой про замер

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Форма, подвал и граница по персональным данным

**Files:**
- Modify: `index.html` — секция `.prizyv`, подвал, оформление формы

**Interfaces:**
- Consumes: разметка секций (Task 5)
- Produces: `#zayavka` — форма; `#soglasie` — непредзаполненная галочка;
  `#otpravit` — кнопка `type="button"`; `#otvet-formy` — место ответа

- [ ] **Step 1: Написать форму**

Заменить содержимое секции `.prizyv`:

```html
<section class="razdel prizyv ne-pechataem">
  <div class="obolochka">
    <h2>Записаться на замер</h2>
    <p>Замер бесплатный и ни к чему не обязывает: после него вы получаете точную
    цену и решаете сами.</p>

    <form class="kartochka forma" id="zayavka" novalidate>
      <p class="uslovno">Демонстрация: форма ничего не отправляет и ничего не сохраняет</p>

      <p class="pole">
        <label for="imya">Как к вам обращаться</label>
        <input type="text" id="imya" name="imya" autocomplete="name">
      </p>

      <p class="pole">
        <label for="telefon">Телефон</label>
        <input type="tel" id="telefon" name="telefon" autocomplete="tel" placeholder="+7 ">
      </p>

      <p class="pole pole--galochka">
        <label><input type="checkbox" id="soglasie" name="soglasie">
        Согласен на обработку персональных данных</label>
      </p>

      <p><button type="button" class="knopka" id="otpravit">Записаться на замер</button></p>
      <p class="forma__otvet" id="otvet-formy" role="status"></p>

      <p class="tihij forma__granica">Галочка не предзаполнена намеренно: заранее
      поставленная галочка согласием не считается. Полный комплект документов,
      устройство этой галочки и ответ на вопрос, куда физически падают заявки,
      разобраны в соседней работе —
      <a href="https://pyhphhddb8-eng.github.io/klinika-152fz/">комплект 152-ФЗ
      для сайта с онлайн-записью</a>. Здесь то же самое второй раз не делается,
      но и притвориться, что на лендинге с формой этого вопроса нет, нельзя.</p>
    </form>
  </div>
</section>
```

- [ ] **Step 2: Написать сценарий формы**

В конец встроенного `<script type="module">`:

```js
/* — форма — */

// Форма ничего не отправляет: это демонстрация. Но галочка работает
// по-настоящему — без неё кнопка отвечает отказом, а не «спасибо».
naiti("otpravit").addEventListener("click", () => {
  const otvet = naiti("otvet-formy");
  if (!naiti("soglasie").checked) {
    otvet.className = "forma__otvet forma__otvet--otkaz";
    otvet.textContent = "Без согласия на обработку данных заявку принять нельзя.";
    naiti("soglasie").focus();
    return;
  }
  otvet.className = "forma__otvet forma__otvet--demo";
  otvet.textContent = "Это демонстрация: заявка никуда не ушла и нигде не сохранена. " +
    "На настоящем сайте здесь начинается вопрос, где эти данные хранятся, — он разобран по ссылке ниже.";
});
```

- [ ] **Step 3: Написать подвал**

Заменить содержимое `<footer class="podval">`:

```html
<footer class="podval ne-pechataem">
  <div class="obolochka">
    <p><strong>«Потолок за день»</strong> — вымышленная бригада. Название, телефоны,
    сроки и цены условные: это демонстрационная работа для портфолио, а не
    предложение услуг.</p>
    <p>Расчёт на странице считается по прайсу из файла <code>prajs.mjs</code>
    и покрыт тестами. Страница закрыта от поисковых систем, заявок не принимает
    и никаких данных не хранит.</p>
    <p>Демо-работа портфолио · 2026</p>
  </div>
</footer>
```

- [ ] **Step 4: Написать оформление формы**

Добавить в `<style>` перед `/* ОФОРМЛЕНИЕ: конец */`:

```css
.forma{max-width:520px;margin-top:20px}
.forma .uslovno{margin-bottom:16px}
.forma input[type=text],.forma input[type=tel]{
  width:100%;font:inherit;padding:11px 12px;
  border:1.5px solid var(--ramka);border-radius:8px;background:#fff;color:var(--tekst);
}
.forma input:focus-visible{outline:3px solid var(--akcent);outline-offset:1px}
.forma__otvet{margin:0;font-size:15px}
.forma__otvet:empty{display:none}
.forma__otvet--otkaz{color:#8a2b12;font-weight:600}
.forma__otvet--demo{color:var(--tekst-tihij)}
.forma__granica{margin-top:18px;border-top:1px solid var(--ramka);padding-top:14px}
.podval code{background:rgba(255,255,255,.14);padding:1px 5px;border-radius:4px}
```

- [ ] **Step 5: Проверить форму руками**

Run: `python3 -m http.server 8080`
Expected: кнопка без галочки отвечает отказом и ставит фокус на галочку;
с галочкой — отвечает, что заявка никуда не ушла; ни перезагрузки страницы,
ни запроса в сети (вкладка «Сеть» пустая после нажатия).

- [ ] **Step 6: Коммит**

```bash
git add index.html
git commit -m "Форма-демонстрация, граница по персональным данным и подвал

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: Вшитый шрифт

**Files:**
- Create: `tools/shrift.py`
- Modify: `index.html` — правило `@font-face` и `font-family`

Скрипт берётся из работы `otchet-proverka` (`tools/shrift.py`) и правится под
эту страницу: другой набор символов, другой файл-источник для текста.

**Interfaces:**
- Consumes: `index.html` (Task 8) — из него берётся набор символов
- Produces: правило `@font-face` с base64 внутри `index.html`; каталог
  `tools/.shrift-vremenno/` в `.gitignore`

- [ ] **Step 1: Написать скрипт подрезки**

Создать `tools/shrift.py`:

```python
#!/usr/bin/env python3
"""Разовая подготовка шрифта: скачать Inter, подрезать, выдать base64.

Запуск: python3 tools/shrift.py > tools/.shrift-vremenno/pravila.css

Печатает готовое правило @font-face — его вставляют в index.html.
Набор символов берётся из самого index.html, поэтому скрипт можно
перезапустить, когда текст страницы изменится.

Берётся переменный файл Inter: одна ось начертания вместо трёх отдельных
файлов на 400, 600 и 700.
"""
import base64
import pathlib
import re
import subprocess
import sys
import urllib.request

KOREN = pathlib.Path(__file__).resolve().parent.parent
VREMENNO = KOREN / "tools" / ".shrift-vremenno"
VREMENNO.mkdir(exist_ok=True)

ADRES = (
    "https://raw.githubusercontent.com/google/fonts/main/ofl/inter/"
    "Inter%5Bopsz%2Cwght%5D.ttf"
)
OSI = ["opsz=16", "wght=400:700"]


def simvoly_stranicy():
    """Все символы, которые страница может показать, плюс запас.

    Запас нужен потому, что часть текста строится сценарием из прайса:
    названия полотна, единицы, знак рубля и разделители разрядов.
    """
    html = (KOREN / "index.html").read_text(encoding="utf-8")
    prajs = (KOREN / "prajs.mjs").read_text(encoding="utf-8")
    bez_tegov = re.sub(r"<[^>]+>", " ", html)
    zapas = (
        "абвгдеёжзийклмнопрстуфхцчшщъыьэюя"
        "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ"
        "abcdefghijklmnopqrstuvwxyz"
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        "0123456789"
        " .,:;!?—–-«»\"'()[]{}/\\%№×→•…+=@#&*_|<>"
        "₽²✓ "
    )
    nabor = set(bez_tegov + prajs + zapas) - set("\n\r\t")
    return "".join(sorted(nabor))


def main():
    syroj = VREMENNO / "inter-var.ttf"
    if not syroj.exists():
        print("Качаю Inter…", file=sys.stderr)
        with urllib.request.urlopen(ADRES) as otvet:
            syroj.write_bytes(otvet.read())

    suzhennyj = VREMENNO / "inter-suzhennyj.ttf"
    subprocess.run(
        [sys.executable, "-m", "fontTools.varLib.instancer", str(syroj)]
        + OSI + ["-o", str(suzhennyj)],
        check=True, stdout=subprocess.DEVNULL,
    )

    nabor = simvoly_stranicy()
    print(f"Символов в наборе: {len(nabor)}", file=sys.stderr)
    podrezannyj = VREMENNO / "inter.woff2"
    subprocess.run(
        [
            sys.executable, "-m", "fontTools.subset", str(suzhennyj),
            f"--text={nabor}",
            "--layout-features=kern,liga,calt",
            "--flavor=woff2",
            "--no-hinting",
            f"--output-file={podrezannyj}",
        ],
        check=True,
    )
    ves = podrezannyj.stat().st_size
    print(f"Готовый файл: {ves / 1024:.1f} КБ", file=sys.stderr)
    if ves > 60 * 1024:
        print("ВНИМАНИЕ: шрифт тяжелее 60 КБ, проверьте набор символов", file=sys.stderr)

    b64 = base64.b64encode(podrezannyj.read_bytes()).decode("ascii")
    print("/* Шрифт Inter, SIL Open Font License 1.1. Переменный файл подрезан */")
    print("/* под набор символов этой страницы: tools/shrift.py */")
    print("@font-face{")
    print('  font-family:"Inter";font-style:normal;font-weight:400 700;')
    print("  font-display:swap;")
    print(f'  src:url(data:font/woff2;base64,{b64}) format("woff2");')
    print("}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Запустить скрипт**

Run:
```bash
mkdir -p tools/.shrift-vremenno
python3 tools/shrift.py > tools/.shrift-vremenno/pravila.css
```
Expected: в stderr — число символов и вес готового файла меньше 60 КБ;
в `tools/.shrift-vremenno/pravila.css` — правило `@font-face` с base64.

- [ ] **Step 3: Вставить правило в страницу**

Скопировать содержимое `tools/.shrift-vremenno/pravila.css` в начало
экранного `<style>` в `index.html`, сразу после строки
`/* ОФОРМЛЕНИЕ: начало */`, и заменить набор шрифтов в `body`:

```css
body{
  margin:0;background:var(--fon);color:var(--tekst);
  font:400 17px/1.6 "Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  -webkit-text-size-adjust:100%;
}
```

- [ ] **Step 4: Закрыть временный каталог от git**

Дописать в `.gitignore`:

```
tools/.shrift-vremenno/
```

- [ ] **Step 5: Проверить, что наружу страница не ходит**

Run: `python3 -m http.server 8080`, открыть страницу, вкладка «Сеть»,
перезагрузить с очисткой кэша.
Expected: в списке запросов только `localhost` — документ, `raschet.mjs`,
`prajs.mjs`. Ни одного запроса на сторонний домен. Шрифт в списке не
появляется вовсе: он внутри документа.

- [ ] **Step 6: Коммит**

```bash
git add index.html tools/shrift.py .gitignore
git commit -m "Шрифт Inter подрезан и вшит в страницу

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: Проверки в браузере и скриншоты

**Files:**
- Create: `tools/check.mjs`
- Create: `tools/shot.mjs`
- Modify: `.gitignore` — закрыть `node_modules/` и скриншоты

Скрипт проверок построен по образцу работы `klinika-152fz`
(`tools/check.mjs`): свой сервер на время проверки, сбор провалов в список,
ненулевой код возврата в конце.

**Interfaces:**
- Consumes: `index.html`, `raschet.mjs`, `prajs.mjs` (Task 9)
- Produces: команды `npm run check` и `npm run shot`

- [ ] **Step 1: Поставить Playwright**

Run:
```bash
npm install
npx playwright install chromium
```
Expected: установка проходит, `node_modules/` появился.

- [ ] **Step 2: Написать скрипт проверок**

Создать `tools/check.mjs`:

```js
// Проверки в браузере. Запуск: npm run check
//
// Без аргумента поднимает свой сервер над корнем репозитория: модули не
// загружаются при открытии файла с диска.
// С адресом первым аргументом проверяет уже выложенный сайт:
//   node tools/check.mjs https://pyhphhddb8-eng.github.io/potolki-smeta/
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { PRAJS } from "../prajs.mjs";

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 8766;
const argument = process.argv[2] || "";
const ZHIVOJ = argument.startsWith("http");
const ADRES = ZHIVOJ ? argument : `http://127.0.0.1:${PORT}/`;

const TIPY = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

const server = ZHIVOJ ? null : createServer(async (zapros, otvet) => {
  const put = join(KOREN, decodeURIComponent(zapros.url.split("?")[0]));
  const fajl = zapros.url === "/" ? join(KOREN, "index.html") : put;
  try {
    const telo = await readFile(fajl);
    otvet.writeHead(200, { "content-type": TIPY[extname(fajl)] || "application/octet-stream" });
    otvet.end(telo);
  } catch {
    otvet.writeHead(404).end("нет такого файла");
  }
});
if (server) await new Promise((gotovo) => server.listen(PORT, gotovo));

const provaly = [];
const otmetit = (uslovie, opisanie) => {
  if (!uslovie) provaly.push(opisanie);
};

const browser = await chromium.launch();
const page = await browser.newPage();

/* — консоль и внешние запросы собираем с первой секунды — */
const soobshcheniya = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") soobshcheniya.push(`${m.type()}: ${m.text()}`);
});
page.on("pageerror", (e) => soobshcheniya.push(`pageerror: ${e.message}`));

const chuzhie = [];
page.on("request", (z) => {
  const adres = z.url();
  if (adres.startsWith("data:") || adres.startsWith("blob:")) return;
  if (!adres.startsWith(new URL(ADRES).origin)) chuzhie.push(adres);
});

await page.goto(ADRES, { waitUntil: "networkidle" });

/* — 1. Страница закрыта от поисковиков — */
const roboty = await page.getAttribute('meta[name="robots"]', "content");
otmetit(/noindex/.test(roboty || ""), "нет meta robots=noindex — демо попадёт в выдачу");

/* — 2. Расчёт живой: смета и вилка есть с первой загрузки — */
const strok = await page.locator(".stroka").count();
otmetit(strok >= 3, `в смете при загрузке ${strok} строк, ожидалось не меньше трёх`);

const vilka_do = await page.locator(".itogo__vilka").textContent();
otmetit(/₽/.test(vilka_do || ""), "вилка не показана");

/* — 3. Уточнение двигает итог ровно на цену из прайса — */
async function summa_stroki(id) {
  const tekst = await page.locator(`.stroka[data-id="${id}"] .stroka__summa`).textContent();
  return Number((tekst || "0").replace(/[^\d]/g, ""));
}
const itogo_tekst = () => page.locator(".itogo__poyasnenie").textContent();
const do_utochneniya = Number((await itogo_tekst()).replace(/[^\d]/g, ""));

await page.fill("#svetilniki", "2");
await page.waitForTimeout(50);
const posle = Number((await itogo_tekst()).replace(/[^\d]/g, ""));
otmetit(
  posle - do_utochneniya === 2 * PRAJS.svetilnik,
  `два светильника добавили ${posle - do_utochneniya} ₽ вместо ${2 * PRAJS.svetilnik} ₽`,
);
otmetit(await summa_stroki("svetilniki") === 2 * PRAJS.svetilnik, "строка светильников не сошлась с прайсом");

/* — 4. Подсветка появилась именно на своей строке — */
await page.fill("#obvody", "1");
const podsvechena = await page.locator('.stroka[data-id="obvody"].stroka--dvinulas').count();
const lishnie = await page.locator('.stroka[data-id="polotno"].stroka--dvinulas').count();
otmetit(podsvechena === 1, "строка обводов не подсветилась после уточнения");
otmetit(lishnie === 0, "подсветилась строка, которую уточнение не трогало");

/* — 5. Пустые размеры дают пустую смету, а не выезд ни за что — */
await page.fill(".komnata__dlina", "");
await page.fill(".komnata__shirina", "");
await page.waitForTimeout(50);
otmetit(await page.locator(".stroka").count() === 0, "при пустых размерах смета не опустела");
otmetit(await page.locator(".smeta__pusto").count() === 1, "нет подсказки «введите размеры»");
await page.fill(".komnata__dlina", "3.2");
await page.fill(".komnata__shirina", "2.8");

/* — 6. Форма не отправляет и требует галочку — */
await page.click("#otpravit");
otmetit(
  /согласия/i.test((await page.locator("#otvet-formy").textContent()) || ""),
  "кнопка без галочки согласия не ответила отказом",
);
await page.check("#soglasie");
await page.click("#otpravit");
otmetit(
  /демонстрация/i.test((await page.locator("#otvet-formy").textContent()) || ""),
  "с галочкой форма не сказала, что ничего не отправляет",
);

/* — 7. Контраст по формуле WCAG, норма 4,5 — */
const kontrast = await page.evaluate(() => {
  const kanal = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const yarkost = ([r, g, b]) => 0.2126 * kanal(r / 255) + 0.7152 * kanal(g / 255) + 0.0722 * kanal(b / 255);
  const razobrat = (cvet) => cvet.match(/[\d.]+/g).slice(0, 3).map(Number);
  const fon = (uzel) => {
    for (let u = uzel; u; u = u.parentElement) {
      const c = getComputedStyle(u).backgroundColor;
      if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return razobrat(c);
    }
    return [255, 255, 255];
  };
  const plohie = [];
  for (const uzel of document.querySelectorAll("p,li,h1,h2,h3,span,a,label,button,legend,strong,code")) {
    if (!uzel.textContent.trim()) continue;
    if (!uzel.offsetParent && uzel.tagName !== "BODY") continue;
    const stil = getComputedStyle(uzel);
    const t = yarkost(razobrat(stil.color));
    const f = yarkost(fon(uzel));
    const otnoshenie = (Math.max(t, f) + 0.05) / (Math.min(t, f) + 0.05);
    if (otnoshenie < 4.5) {
      plohie.push(`${uzel.tagName}.${uzel.className} — ${otnoshenie.toFixed(2)}: «${uzel.textContent.trim().slice(0, 40)}»`);
    }
  }
  return plohie;
});
for (const plohoj of kontrast) provaly.push(`контраст ниже 4,5: ${plohoj}`);

/* — 8. На 360 px нет горизонтальной прокрутки — */
await page.setViewportSize({ width: 360, height: 800 });
await page.waitForTimeout(100);
const shirina = await page.evaluate(() => document.documentElement.scrollWidth);
otmetit(shirina <= 360, `на 360 px страница шириной ${shirina} px — есть горизонтальная прокрутка`);

/* — 9. Печатается смета, а не страница — */
await page.setViewportSize({ width: 1280, height: 900 });
await page.emulateMedia({ media: "print" });
otmetit(await page.locator(".ekran").isVisible() === false, "первый экран не спрятан при печати");
otmetit(await page.locator(".raschet__upravlenie").isVisible() === false, "поля ввода лезут на бумагу");
otmetit(await page.locator("#pechatnaya-shapka").isVisible() === true, "нет печатной шапки с датой и оговоркой");
otmetit(await page.locator(".smeta__spisok").isVisible() === true, "смета не печатается");
await page.emulateMedia({ media: "screen" });

/* — 10. Консоль и внешние запросы — */
for (const s of soobshcheniya) provaly.push(`консоль: ${s}`);
for (const a of chuzhie) provaly.push(`внешний запрос: ${a}`);

await browser.close();
if (server) server.close();

if (provaly.length === 0) {
  console.log(`Проверено: ${ADRES} — замечаний нет.`);
} else {
  console.error(`Проверено: ${ADRES} — замечаний ${provaly.length}:`);
  for (const p of provaly) console.error(` · ${p}`);
  process.exitCode = 1;
}
```

- [ ] **Step 3: Запустить проверки и починить всё, что нашлось**

Run: `npm run check`
Expected: «замечаний нет». Если есть — чинить `index.html` и повторять, пока
список не опустеет. Правки контраста делать через переменные `:root`, а не
точечно по селекторам.

- [ ] **Step 4: Написать скрипт скриншотов**

Создать `tools/shot.mjs`:

```js
// Скриншоты для показа. Запуск: npm run shot
// Кладёт в tools/shots/: страницу целиком на 1280 и на 360 и печатный вид PDF.
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { extname, resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SHOTS = join(KOREN, "tools", "shots");
const PORT = 8767;
const TIPY = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

await mkdir(SHOTS, { recursive: true });
const server = createServer(async (zapros, otvet) => {
  const fajl = zapros.url === "/" ? join(KOREN, "index.html") : join(KOREN, decodeURIComponent(zapros.url));
  try {
    otvet.writeHead(200, { "content-type": TIPY[extname(fajl)] || "application/octet-stream" });
    otvet.end(await readFile(fajl));
  } catch {
    otvet.writeHead(404).end("нет");
  }
});
await new Promise((gotovo) => server.listen(PORT, gotovo));

const browser = await chromium.launch();
for (const [imya, shirina] of [["1280", 1280], ["360", 360]]) {
  const page = await browser.newPage({ viewport: { width: shirina, height: 900 } });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await page.screenshot({ path: join(SHOTS, `stranica-${imya}.png`), fullPage: true });
  await page.close();
}

const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(`http://127.0.0.1:${PORT}/#raschet`, { waitUntil: "networkidle" });
await page.fill("#svetilniki", "4");
await page.fill("#obvody", "1");
await page.check("#demontazh");
await page.waitForTimeout(100);
await page.screenshot({ path: join(SHOTS, "smeta.png") });
await page.pdf({ path: join(SHOTS, "smeta-pechat.pdf"), format: "A4", printBackground: false });
await browser.close();
server.close();
console.log("Скриншоты в tools/shots/");
```

- [ ] **Step 5: Снять скриншоты и посмотреть их**

Run: `npm run shot`
Expected: в `tools/shots/` четыре файла. Открыть `smeta-pechat.pdf` и
убедиться, что на листе только смета с шапкой и оговоркой.

- [ ] **Step 6: Закрыть служебное от git**

Дописать в `.gitignore`:

```
tools/shots/
```

- [ ] **Step 7: Коммит**

```bash
git add tools/check.mjs tools/shot.mjs .gitignore package.json package-lock.json
git commit -m "Проверки в браузере и скриншоты

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11: Замер Lighthouse, README и выкладка

**Files:**
- Create: `zamery/lh-1.json`, `zamery/lh-2.json`, `zamery/lh-3.json`
- Modify: `README.md`

**Interfaces:**
- Consumes: готовую страницу (Task 10)
- Produces: живой адрес `https://pyhphhddb8-eng.github.io/potolki-smeta/`

- [ ] **Step 1: Показать страницу заказчику работы и внести правки**

Показать скриншоты из `tools/shots/` и живой предпросмотр. Правки внести и
после каждой прогнать `npm test` и `npm run check`. Дальше не идти, пока
правки не закончились: замер Lighthouse после правок придётся повторять.

- [ ] **Step 2: Замерить Lighthouse, три прогона**

Run:
```bash
python3 -m http.server 8080 &
for n in 1 2 3; do
  npx lighthouse http://localhost:8080/ \
    --preset=desktop=false --form-factor=mobile --throttling-method=simulate \
    --only-categories=performance,accessibility,best-practices,seo \
    --output=json --output-path=zamery/lh-$n.json --chrome-flags="--headless" --quiet
done
kill %1
```
Expected: три файла в `zamery/`. Взять медиану трёх прогонов по каждой
категории и по LCP — эти числа идут в README и в описание работы.
Категория SEO будет низкой из-за `noindex` — так и должно быть, это
осознанное решение, и в README про это написано прямо.

- [ ] **Step 3: Переписать README под готовую работу**

Заменить в `README.md` раздел «Состояние на 22.09.2026» на описание готовой
работы: что собрано, какими командами проверяется, живой адрес, медианы
Lighthouse из Step 2 и объяснение, почему SEO низкий. Формат — как в
`klinika-152fz/README.md`.

- [ ] **Step 4: Коммит замеров и README**

```bash
git add zamery README.md
git commit -m "Замер Lighthouse, три прогона, и README готовой работы

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Завести репозиторий и выложить**

Run:
```bash
gh repo create pyhphhddb8-eng/potolki-smeta --public --source=. --remote=origin --push
gh api -X POST repos/pyhphhddb8-eng/potolki-smeta/pages \
  -f 'source[branch]=main' -f 'source[path]=/'
```
Expected: репозиторий создан, Pages включены с ветки `main` из корня.

- [ ] **Step 6: Проверить выложенный сайт теми же проверками**

Run: `node tools/check.mjs https://pyhphhddb8-eng.github.io/potolki-smeta/`
Expected: «замечаний нет». Если Pages ещё не поднялись — подождать минуту и
повторить.

- [ ] **Step 7: Обновить журнал**

Дописать в `~/Obsidian/Brain/index.md`: что сделано, живой адрес, что дальше.
Решение «прайс отдельным модулем, а не JSON, чтобы страница работала без
сервера и без лишнего запроса» — в `~/Obsidian/Brain/decisions.md`.

- [ ] **Step 8: Коммит**

```bash
git add README.md
git commit -m "Живой адрес в README

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
git push
```

---

## Самопроверка плана против спеки

| Требование спеки                                         | Где закрыто        |
| -------------------------------------------------------- | ------------------ |
| Построчная смета: полотно, профиль, углы, светильники, обводы, демонтаж | Task 2, 3 |
| Итог вилкой, ширину задаёт прайс                         | Task 4             |
| Результат без телефона                                   | Task 6, 8          |
| Калькулятор называет, чего не знает                      | Task 7, Step 1     |
| До трёх комнат, выезд один раз                           | Task 2, Step 1     |
| Пять уточнений без экранов «шаг 3 из 5»                  | Task 6, Step 1     |
| Уточнение двигает итог и подсвечивает строку             | Task 6, Step 2; проверка — Task 10, Step 2 |
| Прайс отдельным файлом числами                           | Task 1             |
| Структура страницы: первый экран → полоса → проблема → шаги → что входит → разбор → расчёт → вопросы → призыв → контакты | Task 5, 6, 7, 8 |
| Отзывов нет, обратного отсчёта нет                       | Global Constraints; Task 5 |
| Форма ничего не отправляет, галочка непредзаполненная, ссылка на `klinika-152fz` | Task 8 |
| Без React и без сборщика                                 | Global Constraints; Task 5 |
| Расчёт чистой функцией, не знает про DOM                 | Task 2, тест в Step 1 |
| Тесты встроенным механизмом Node, без зависимостей       | Task 1–4           |
| Шрифт подрезан и вшит, наружу страница не ходит          | Task 9             |
| Печать сметы отдельным документом, с датой и оговоркой   | Task 7             |
| Тесты: сумма строк = итог; нулевая площадь; направление каждого уточнения; `ot <= do`; три комнаты и один выезд; числа из прайса | Task 2–4 |
| Проверки в браузере: подсветка, печать, 360 px, контраст, консоль, ноль внешних запросов | Task 10 |
| Замер Lighthouse, медиана трёх прогонов                  | Task 11, Step 2    |
| `noindex`, выкладка на GitHub Pages `pyhphhddb8-eng`     | Task 5, Task 11    |
