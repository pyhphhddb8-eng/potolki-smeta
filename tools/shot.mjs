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
  const fajl =
    zapros.url === "/"
      ? join(KOREN, "index.html")
      : join(KOREN, decodeURIComponent(zapros.url));
  try {
    otvet.writeHead(200, {
      "content-type": TIPY[extname(fajl)] || "application/octet-stream",
    });
    otvet.end(await readFile(fajl));
  } catch {
    otvet.writeHead(404).end("нет");
  }
});
await new Promise((gotovo) => server.listen(PORT, gotovo));

const browser = await chromium.launch();
for (const [imya, shirina] of [
  ["1280", 1280],
  ["360", 360],
]) {
  const page = await browser.newPage({
    viewport: { width: shirina, height: 900 },
  });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await page.screenshot({
    path: join(SHOTS, `stranica-${imya}.png`),
    fullPage: true,
  });
  await page.close();
}

const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(`http://127.0.0.1:${PORT}/#raschet`, {
  waitUntil: "networkidle",
});
await page.fill("#svetilniki", "4");
await page.fill("#obvody", "1");
await page.check("#demontazh");
await page.waitForTimeout(100);
await page.screenshot({ path: join(SHOTS, "smeta.png") });
await page.pdf({
  path: join(SHOTS, "smeta-pechat.pdf"),
  format: "A4",
  printBackground: false,
});
await browser.close();
server.close();
console.log("Скриншоты в tools/shots/");
