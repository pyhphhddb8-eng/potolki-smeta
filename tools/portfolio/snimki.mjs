// Снимки для витрины портфолио. Запуск: node tools/portfolio/snimki.mjs
//
// Кладёт сырые PNG в tools/portfolio/syroe/. Дальше их собирает
// sobrat.py — он режет под размеры FL.ru и сохраняет в JPEG.
//
// Снимки делаются с локальной сборки, а не с живого адреса: так картинка
// и код заведомо из одного состояния.
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
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

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SYROE = join(KOREN, "tools", "portfolio", "syroe");
const PORT = 8768;

const TIPY = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

/** Путь не должен уводить за пределы репозитория. */
function vnutri_kornya(fajl) {
  const put = relative(KOREN, fajl);
  return put !== "" && !put.startsWith("..") && !isAbsolute(put);
}

await mkdir(SYROE, { recursive: true });

const server = createServer(async (zapros, otvet) => {
  const adres = decodeURIComponent(zapros.url.split("?")[0]);
  const fajl = resolve(
    adres === "/" ? join(KOREN, "index.html") : join(KOREN, adres),
  );
  if (!vnutri_kornya(fajl)) {
    otvet.writeHead(404).end("нет такого файла");
    return;
  }
  try {
    otvet.writeHead(200, {
      "content-type": TIPY[extname(fajl)] || "application/octet-stream",
    });
    otvet.end(await readFile(fajl));
  } catch {
    otvet.writeHead(404).end("нет такого файла");
  }
});
await new Promise((gotovo) => server.listen(PORT, "127.0.0.1", gotovo));
const ADRES = `http://127.0.0.1:${PORT}/`;

const browser = await chromium.launch();

/** Страница с выключенной плавной прокруткой.
 *
 * На живой странице прокрутка плавная, и это правильно для человека. Но
 * для съёмки это источник смазанных кадров: координаты меряются раньше,
 * чем прокрутка доезжает, и кадр режется не там. Выключаем на время
 * съёмки — на саму страницу это не влияет.
 */
async function otkryt_stranicu(viewport) {
  const page = await browser.newPage({ viewport });
  await page.goto(ADRES, { waitUntil: "networkidle" });
  await page.addStyleTag({
    content: "html{scroll-behavior:auto !important}",
  });
  return page;
}

/** Комната из «Разбора одной сметы» — на странице она же стоит по умолчанию. */
async function zapolnit(
  page,
  { svetilniki = 4, obvody = 1, demontazh = true } = {},
) {
  await page.fill("#svetilniki", String(svetilniki));
  await page.fill("#obvody", String(obvody));
  if (demontazh) await page.check("#demontazh");
  // Подсветка живёт 1,2 с. Здесь её ждём до конца: подсвеченная строка —
  // предмет отдельного снимка, на общем плане она читается как случайность.
  await page.waitForTimeout(1500);
}

/* — 1. Расчёт целиком: поля слева, смета справа — */
{
  const page = await otkryt_stranicu({ width: 1280, height: 900 });
  await zapolnit(page);
  // Ведём кадр по смете, а не по секции: в 900 пикселей секция целиком не
  // влезает, и выбирать приходится между заголовком и итогом. Итог важнее.
  await page.evaluate(() => {
    document.querySelector("#smeta").scrollIntoView({ block: "start" });
    window.scrollBy(0, -215);
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: join(SYROE, "1-raschet.png") });
  await page.close();
}

/* — 2. Что делает уточнение: два кадра одной области, до и после — */
{
  const page = await otkryt_stranicu({ width: 1280, height: 900 });
  await page.fill("#obvody", "1");
  await page.check("#demontazh");
  await page.waitForTimeout(1500);

  // Режем кадр ровно от начала сметы до последней строки пояснения под
  // вилкой. Кнопка печати и карточка «чего расчёт не знает» в сравнении
  // только мешают: сравнивать надо строки и итог.
  // Кадр режется по видимой области, поэтому смету сначала уводим в экран
  // целиком. Прокрутка на странице плавная: меряем только после того, как
  // она доехала, иначе координаты окажутся от прошлого положения.
  async function podvesti() {
    await page.evaluate(() => {
      document.querySelector("#smeta").scrollIntoView({ block: "start" });
      window.scrollBy(0, -40);
    });
    await page.waitForTimeout(600);
  }

  async function do_itoga(imya) {
    await podvesti();
    const ramka = await page.evaluate(() => {
      const verh = document.querySelector("#smeta").getBoundingClientRect();
      const niz = document
        .querySelector(".itogo__poyasnenie")
        .getBoundingClientRect();
      return {
        x: Math.floor(verh.x),
        y: Math.floor(verh.y),
        width: Math.ceil(verh.width),
        height: Math.ceil(niz.bottom - verh.y),
      };
    });
    await page.screenshot({ path: join(SYROE, imya), clip: ramka });
  }

  await do_itoga("2-do.png");

  // Одно уточнение — четыре светильника. Снимаем сразу, пока держится
  // подсветка: она живёт 1,2 с, и она здесь главное.
  await page.fill("#svetilniki", "4");
  await page.waitForTimeout(250);
  await do_itoga("2-posle.png");
  await page.close();
}

/* — 3. Печатный лист — */
{
  // Ширина листа A4 при 96 точках на дюйм — 794 px. Высота с запасом:
  // лишнее обрежем по содержимому.
  const page = await otkryt_stranicu({ width: 794, height: 1400 });
  await zapolnit(page);
  await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
  await page.emulateMedia({ media: "print" });
  await page.waitForTimeout(200);
  await page.screenshot({ path: join(SYROE, "3-pechat.png"), fullPage: true });
  await page.close();
}

/* — 4. На телефоне — */
{
  const page = await otkryt_stranicu({ width: 360, height: 900 });
  await zapolnit(page);
  // Ведём кадр по итогу, а не по началу сметы: на узком экране строки выше,
  // и список целиком в 900 пикселей всё равно не влезает. Вилка важнее
  // верхних строк — их показывает первая иллюстрация.
  await page.evaluate(() => {
    document
      .querySelector(".itogo__poyasnenie")
      .scrollIntoView({ block: "end" });
    window.scrollBy(0, 30);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(SYROE, "4-mobile.png") });
  await page.close();
}

/* — 5. Полоса для обложки: смета крупно, с подсвеченной строкой — */
{
  const page = await otkryt_stranicu({ width: 1280, height: 900 });
  await page.fill("#obvody", "1");
  await page.check("#demontazh");
  await page.waitForTimeout(400);
  await page.fill("#svetilniki", "4");
  await page.waitForTimeout(300);
  await page
    .locator(".smeta__spisok")
    .screenshot({ path: join(SYROE, "5-polosa.png") });
  await page.close();
}

await browser.close();
server.close();
console.log("Сырые снимки в tools/portfolio/syroe/");
