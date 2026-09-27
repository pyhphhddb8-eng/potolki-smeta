#!/usr/bin/env python3
"""Сборка иллюстраций для витрины FL.ru из сырых снимков.

Запуск: /usr/bin/python3 tools/portfolio/sobrat.py
Перед этим: node tools/portfolio/snimki.mjs

Путь к питону указан полным намеренно: Pillow на этой машине стоит только
у системного python3, а в PATH первым идёт другой, без него.

Кладёт четыре JPEG в ~/Progects/portfolio-assets/ — туда же, где лежат
картинки предыдущих работ. Размеры те же, что у них: 1280×900 для
широких и 360×900 для телефона.

Три картинки из четырёх — чистые снимки экрана, как в предыдущих
работах. Собирается только одна, «до и после»: показать, что делает
одно уточнение, одним кадром нельзя.
"""
import pathlib
import sys

from PIL import Image, ImageDraw, ImageFont

KOREN = pathlib.Path(__file__).resolve().parent.parent.parent
SYROE = KOREN / "tools" / "portfolio" / "syroe"
VYVOD = pathlib.Path.home() / "Progects" / "portfolio-assets"

# Шрифт берём тот же, что вшит в страницу: подписи на картинках не должны
# выглядеть чужими. Файл остаётся от подрезки шрифта (tools/shrift.py).
SHRIFT = KOREN / "tools" / ".shrift-vremenno" / "inter-var.ttf"

BELYJ = (255, 255, 255)
RAMKA = (221, 226, 232)  # --ramka со страницы
TIHIJ = (77, 91, 107)  # --tekst-tihij со страницы

KACHESTVO = dict(quality=88, optimize=True, subsampling=1)


def shrift(razmer):
    if not SHRIFT.exists():
        sys.exit(
            f"Нет файла шрифта {SHRIFT}.\n"
            "Сначала: python3 tools/shrift.py > /dev/null"
        )
    return ImageFont.truetype(str(SHRIFT), razmer)


def otkryt(imya):
    put = SYROE / imya
    if not put.exists():
        sys.exit(f"Нет снимка {put}. Сначала: node tools/portfolio/snimki.mjs")
    return Image.open(put).convert("RGB")


def obrezat_pustotu(im, zapas=24):
    """Отрезать белое поле снизу, оставив небольшой запас.

    Снимок печатного листа делается с запасом по высоте, и низ у него
    пустой. Резать по содержимому надёжнее, чем по заранее вписанному
    числу: текст сметы меняется вместе с прайсом.
    """
    seryj = im.convert("L")
    shirina, vysota = seryj.size
    niz = vysota
    for y in range(vysota - 1, -1, -1):
        stroka = seryj.crop((0, y, shirina, y + 1)).getextrema()
        if stroka[0] < 250:  # нашли не-белое
            niz = min(vysota, y + zapas)
            break
    return im.crop((0, 0, shirina, niz))


def sohranit(im, imya):
    VYVOD.mkdir(parents=True, exist_ok=True)
    put = VYVOD / imya
    im.save(put, "JPEG", **KACHESTVO)
    print(f"{imya}: {im.size[0]}×{im.size[1]}, {put.stat().st_size // 1024} КБ")


# — 1. Расчёт целиком: снимок как есть —
sohranit(otkryt("1-raschet.png"), "potolki-1-raschet.jpg")


# — 2. Что делает одно уточнение: два кадра, выровненные по итогу —
def sravnenie():
    do = otkryt("2-do.png")
    posle = otkryt("2-posle.png")

    holst = Image.new("RGB", (1280, 900), BELYJ)
    ris = ImageDraw.Draw(holst)
    podpis = shrift(21)

    # Масштаб один на оба кадра: разный масштаб превратил бы сравнение
    # в фокус. Подбираем так, чтобы пара влезла по ширине с полями.
    pole, zazor = 52, 68
    mashtab = (1280 - 2 * pole - zazor) / (do.width * 2)
    razmer = lambda im: (round(im.width * mashtab), round(im.height * mashtab))

    do_m = do.resize(razmer(do), Image.LANCZOS)
    posle_m = posle.resize(razmer(posle), Image.LANCZOS)

    # Выравниваем по низу: итог у обоих кадров встаёт на одну линию, и
    # глаз сравнивает два числа, а не ищет их по картинке.
    niz = 858
    x_do = pole
    x_posle = pole + do_m.width + zazor
    holst.paste(do_m, (x_do, niz - do_m.height))
    holst.paste(posle_m, (x_posle, niz - posle_m.height))

    # Тонкая рамка отделяет снимок от белого холста: без неё два кадра
    # на белом сливаются в один.
    for x, im in ((x_do, do_m), (x_posle, posle_m)):
        ris.rectangle([x - 1, niz - im.height - 1, x + im.width, niz], outline=RAMKA)

    # Подпись стоит над своим кадром, а не по общей линии: кадры разной
    # высоты, и общая линия оставляет над низким из них пустое поле.
    for x, im, tekst in (
        (x_do, do_m, "до уточнения"),
        (x_posle, posle_m, "после: четыре светильника"),
    ):
        ris.text((x, niz - im.height - 40), tekst, font=podpis, fill=TIHIJ)
    return holst


sohranit(sravnenie(), "potolki-2-utochnenie.jpg")


# — 3. Печатный лист —
def pechat():
    list_ = obrezat_pustotu(otkryt("3-pechat.png"))
    holst = Image.new("RGB", (1280, 900), BELYJ)
    ris = ImageDraw.Draw(holst)

    vysota = 836
    mashtab = vysota / list_.height
    list_m = list_.resize((round(list_.width * mashtab), vysota), Image.LANCZOS)

    x = (1280 - list_m.width) // 2
    y = (900 - vysota) // 2
    holst.paste(list_m, (x, y))
    # Край бумаги: без рамки белый лист на белом холсте не виден вовсе.
    ris.rectangle([x - 1, y - 1, x + list_m.width, y + vysota], outline=RAMKA)
    return holst


sohranit(pechat(), "potolki-3-pechat.jpg")


# — 4. На телефоне: снимок как есть —
sohranit(otkryt("4-mobile.png"), "potolki-4-mobile.jpg")


# — 5. Полоса для обложки —
def polosa():
    """Подсвеченная строка сметы крупным планом.

    В полосу обложки идёт не общий вид страницы, а предмет работы — так же
    сделано у работы про клинику, где в полосе галочка, а не красивый
    экран. Здесь предмет — строка, которую только что двинуло уточнение.
    """
    spisok = otkryt("5-polosa.png")
    # Полоса на обложке вытянутая: 520×118. Берём кусок той же пропорции,
    # иначе обложка покажет верхний край картинки вместо нужной строки.
    vysota = round(spisok.width * 118 / 520)
    # Светильники — третья строка из шести.
    verh = round(spisok.height / 6 * 2) - 18
    return spisok.crop((0, verh, spisok.width, verh + vysota))


VITRINA = pathlib.Path.home() / "Progects" / "fl-portfolio-perenos" / "vitrina"
VITRINA.mkdir(parents=True, exist_ok=True)
_p = polosa()
_p.save(VITRINA / "potolki-stroka.png")
print(f"potolki-stroka.png: {_p.size[0]}×{_p.size[1]} → {VITRINA}")
