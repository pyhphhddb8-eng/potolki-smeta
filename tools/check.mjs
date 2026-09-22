// Проверки в браузере. Запуск: npm run check
//
// Без аргумента поднимает свой сервер над корнем репозитория: модули не
// загружаются при открытии файла с диска.
// С адресом первым аргументом проверяет уже выложенный сайт:
//   node tools/check.mjs https://pyhphhddb8-eng.github.io/potolki-smeta/
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import {
  extname,
  resolve,
  dirname,
  join,
  relative,
  isAbsolute,
} from "node:path";
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

/* — путь остаётся внутри репозитория: без этого «../../../etc/passwd» уводит наружу — */
const vnutri_kornya = (fajl) => {
  const otnositelnyj = relative(KOREN, fajl);
  return (
    otnositelnyj === "" ||
    (!otnositelnyj.startsWith("..") && !isAbsolute(otnositelnyj))
  );
};

const server = ZHIVOJ
  ? null
  : createServer(async (zapros, otvet) => {
      const put =
        zapros.url === "/"
          ? join(KOREN, "index.html")
          : join(KOREN, decodeURIComponent(zapros.url.split("?")[0]));
      const fajl = resolve(put);
      if (!vnutri_kornya(fajl)) {
        otvet.writeHead(404).end("нет такого файла");
        return;
      }
      try {
        const telo = await readFile(fajl);
        otvet.writeHead(200, {
          "content-type": TIPY[extname(fajl)] || "application/octet-stream",
        });
        otvet.end(telo);
      } catch {
        otvet.writeHead(404).end("нет такого файла");
      }
    });
if (server)
  await new Promise((gotovo) => server.listen(PORT, "127.0.0.1", gotovo));

const provaly = [];
const otmetit = (uslovie, opisanie) => {
  if (!uslovie) provaly.push(opisanie);
};

const browser = await chromium.launch();
const page = await browser.newPage();

/* — консоль и внешние запросы собираем с первой секунды — */
const soobshcheniya = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning")
    soobshcheniya.push(`${m.type()}: ${m.text()}`);
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
otmetit(
  /noindex/.test(roboty || ""),
  "нет meta robots=noindex — демо попадёт в выдачу",
);

/* — 2. Расчёт живой: смета и вилка есть с первой загрузки — */
const strok = await page.locator(".stroka").count();
otmetit(
  strok >= 3,
  `в смете при загрузке ${strok} строк, ожидалось не меньше трёх`,
);

const vilka_do = await page.locator(".itogo__vilka").textContent();
otmetit(/₽/.test(vilka_do || ""), "вилка не показана");

/* — 3. Уточнение двигает итог ровно на цену из прайса — */
async function summa_stroki(id) {
  const tekst = await page
    .locator(`.stroka[data-id="${id}"] .stroka__summa`)
    .textContent();
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
otmetit(
  (await summa_stroki("svetilniki")) === 2 * PRAJS.svetilnik,
  "строка светильников не сошлась с прайсом",
);

/* — 4. Подсветка появилась именно на своей строке — */
await page.fill("#obvody", "1");
const podsvechena = await page
  .locator('.stroka[data-id="obvody"].stroka--dvinulas')
  .count();
const lishnie = await page
  .locator('.stroka[data-id="polotno"].stroka--dvinulas')
  .count();
otmetit(podsvechena === 1, "строка обводов не подсветилась после уточнения");
otmetit(lishnie === 0, "подсветилась строка, которую уточнение не трогало");

/* — 5. Пустые размеры дают пустую смету, а не выезд ни за что — */
await page.fill(".komnata__dlina", "");
await page.fill(".komnata__shirina", "");
await page.waitForTimeout(50);
otmetit(
  (await page.locator(".stroka").count()) === 0,
  "при пустых размерах смета не опустела",
);
otmetit(
  (await page.locator(".smeta__pusto").count()) === 1,
  "нет подсказки «введите размеры»",
);
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
  /демонстрация/i.test(
    (await page.locator("#otvet-formy").textContent()) || "",
  ),
  "с галочкой форма не сказала, что ничего не отправляет",
);

/* — 7. Контраст по формуле WCAG, норма 4,5 — */
const kontrast = await page.evaluate(() => {
  const kanal = (c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  const yarkost = ([r, g, b]) =>
    0.2126 * kanal(r / 255) + 0.7152 * kanal(g / 255) + 0.0722 * kanal(b / 255);
  /* — цвет со своей прозрачностью: rgb(...) без альфы читается как a=1 — */
  const razobrat = (cvet) => {
    const [r, g, b, a = 1] = (cvet.match(/[\d.]+/g) || [0, 0, 0, 0]).map(
      Number,
    );
    return [r, g, b, a];
  };
  /* — верхний слой [r,g,b,a] поверх непрозрачной подложки [r,g,b] — */
  const smeshat = (verhnij, nizhnij) => {
    const a = verhnij[3];
    return [
      verhnij[0] * a + nizhnij[0] * (1 - a),
      verhnij[1] * a + nizhnij[1] * (1 - a),
      verhnij[2] * a + nizhnij[2] * (1 - a),
    ];
  };
  /* — фон элемента: копим все фоны от него самого до корня страницы и
     смешиваем по порядку снизу вверх, а не берём первый попавшийся —
     полупрозрачный фон иначе считается по буквальным rgb без учёта того,
     что под ним, и результат может быть как ложным провалом, так и
     ложным пропуском — */
  const fon = (uzel) => {
    const sloi = [];
    for (let u = uzel; u; u = u.parentElement) {
      const cvet = razobrat(getComputedStyle(u).backgroundColor);
      if (cvet[3] > 0) sloi.push(cvet);
    }
    let itog = [255, 255, 255]; // подложка страницы по умолчанию, если фонов вообще нет
    for (let i = sloi.length - 1; i >= 0; i--) itog = smeshat(sloi[i], itog);
    return itog;
  };
  const plohie = [];
  for (const uzel of document.querySelectorAll(
    "p,li,h1,h2,h3,span,a,label,button,legend,strong,code",
  )) {
    if (!uzel.textContent.trim()) continue;
    if (!uzel.offsetParent && uzel.tagName !== "BODY") continue;
    const stil = getComputedStyle(uzel);
    const fon_uzla = fon(uzel);
    const cvet_teksta = razobrat(stil.color);
    const t = yarkost(
      cvet_teksta[3] < 1 ? smeshat(cvet_teksta, fon_uzla) : cvet_teksta,
    );
    const f = yarkost(fon_uzla);
    const otnoshenie = (Math.max(t, f) + 0.05) / (Math.min(t, f) + 0.05);
    if (otnoshenie < 4.5) {
      plohie.push(
        `${uzel.tagName}.${uzel.className} — ${otnoshenie.toFixed(2)}: «${uzel.textContent.trim().slice(0, 40)}»`,
      );
    }
  }
  return plohie;
});
for (const plohoj of kontrast) provaly.push(`контраст ниже 4,5: ${plohoj}`);

/* — 8. На 360 px нет горизонтальной прокрутки — */
await page.setViewportSize({ width: 360, height: 800 });
await page.waitForTimeout(100);
const shirina = await page.evaluate(() => document.documentElement.scrollWidth);
otmetit(
  shirina <= 360,
  `на 360 px страница шириной ${shirina} px — есть горизонтальная прокрутка`,
);

/* — 9. Печатается смета, а не страница — */
await page.setViewportSize({ width: 1280, height: 900 });
await page.emulateMedia({ media: "print" });
otmetit(
  (await page.locator(".ekran").isVisible()) === false,
  "первый экран не спрятан при печати",
);
otmetit(
  (await page.locator(".raschet__upravlenie").isVisible()) === false,
  "поля ввода лезут на бумагу",
);
otmetit(
  (await page.locator("#pechatnaya-shapka").isVisible()) === true,
  "нет печатной шапки с датой и оговоркой",
);
otmetit(
  (await page.locator(".smeta__spisok").isVisible()) === true,
  "смета не печатается",
);
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
