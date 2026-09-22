// Расчёт сметы натяжного потолка.
//
// Чистая функция: получает размеры, уточнения и прайс — отдаёт строки и итог.
// Про страницу и DOM не знает ничего, поэтому проверяется тестами без
// браузера. Ошибки расчёта прячутся именно здесь, и искать их надо здесь же.

export const PREDELY = {
  komnat: 3, // больше трёх комнат — это уже не лендинг, а замер
  storona: 20, // метров: защита от опечатки в десять лишних нулей
  svetilnikov: 30,
  obvodov: 10,
  uglov: 8, // сверх четырёх, которые уже в цене
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
function stroka({
  id,
  nazvanie,
  poyasnenie,
  kolichestvo,
  edinica,
  cena,
  utochnenie,
}) {
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
  const perimetr = metry(
    komnaty.reduce((s, k) => s + 2 * (k.dlina + k.shirina), 0),
  );

  // Размеры не заданы — показывать нечего. Выезд в пустую смету не пишем:
  // человек не должен видеть цену до того, как что-то ввёл.
  if (ploshad === 0) {
    return {
      ploshad: 0,
      perimetr: 0,
      stroki: [],
      itogo: 0,
      vilka: { ot: 0, do: 0 },
    };
  }

  const vid =
    prajs.polotno[vvod?.polotno] ?? prajs.polotno[prajs.polotno_po_umolchaniyu];

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
    stroki.push(
      stroka({
        id: "ugly",
        nazvanie: "Углы сверх четырёх",
        poyasnenie: "Каждый лишний угол — это отдельный стык профиля",
        kolichestvo: ugly,
        edinica: "шт",
        cena: prajs.ugol,
        utochnenie: "ugly",
      }),
    );
  }

  if (svetilniki > 0) {
    stroki.push(
      stroka({
        id: "svetilniki",
        nazvanie: "Светильники",
        poyasnenie: "Закладная платформа и врезка кольца под каждый",
        kolichestvo: svetilniki,
        edinica: "шт",
        cena: prajs.svetilnik,
        utochnenie: "svetilniki",
      }),
    );
  }

  if (obvody > 0) {
    stroki.push(
      stroka({
        id: "obvody",
        nazvanie: "Обводы труб",
        poyasnenie: "Труба отопления, проходящая через потолок",
        kolichestvo: obvody,
        edinica: "шт",
        cena: prajs.obvod_truby,
        utochnenie: "obvody",
      }),
    );
  }

  if (vvod?.demontazh) {
    stroki.push(
      stroka({
        id: "demontazh",
        nazvanie: "Демонтаж старого потолка",
        poyasnenie: "Снять прежнее полотно и вывезти мусор",
        kolichestvo: ploshad,
        edinica: "м²",
        cena: prajs.demontazh_za_m2,
        utochnenie: "demontazh",
      }),
    );
  }

  stroki.push(
    stroka({
      id: "vyezd",
      nazvanie: "Выезд бригады",
      poyasnenie: "Один раз на заказ, сколько бы ни было комнат",
      kolichestvo: 1,
      edinica: "заказ",
      cena: prajs.vyezd,
      utochnenie: null,
    }),
  );

  const itogo = stroki.reduce((s, str) => s + str.summa, 0);

  return { ploshad, perimetr, stroki, itogo, vilka: { ot: itogo, do: itogo } };
}
