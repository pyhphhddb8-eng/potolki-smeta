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

# Страница обязана возить шрифт с собой, поэтому он не может быть
# безразмерным — бюджет веса задан одной константой.
MAKS_VES_BAJT = 60 * 1024


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
    if ves > MAKS_VES_BAJT:
        print(
            "ВНИМАНИЕ: шрифт тяжелее 60 КБ, проверьте набор символов — "
            "правило не выведено",
            file=sys.stderr,
        )
        sys.exit(1)

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
