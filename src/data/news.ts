export interface Answer {
  text: string;
  is_correct: boolean;
}

export interface QA {
  question: string;
  answers: Answer[];
}

export interface NewsArticle {
  id: string;
  title: string;
  perex: string;
  content?: string;
  category:
    | "zdravi"
    | "priroda"
    | "ceska-politika"
    | "zahranicni-politika"
    | "pohady";
  published: string;
  author: string;
  dezinformative: boolean;
  manipulative: boolean;
  // Added per request: question objects with answers and correctness flags
  question: QA[];
}

export const defaultNewsData: Record<string, NewsArticle[]> = {
  zdravi: [
    // 1/n — včelí jed (manip + dezinfo)
    {
      id: "z1",
      title: "Včelí jed zabíjí rakovinu a Big Pharma to tají",
      perex:
        "Včelí jed zabíjí nádorové buňky! To je jedna z mála věcí, které Big Pharma skrývá před lidmi, aby nepřišla o svůj multimiliardový byznys Včelí jed může rychle zabít agresivní buňky rakoviny prsu..!! Vědci zjistili, že jed byl extrémně účinný při snižování růstu nádoru na zvířecích modelech. Jed dokázal zabít rakovinné buňky, aniž by poškodil normální zdravé buňky.",
      category: "zdravi",
      published: "09:15",
      author: "DEZIPER",
      dezinformative: true,
      manipulative: true,
      question: [
        {
          question:
            "Na čem byly podle textu prováděny pokusy s účinky včelího jedu?",
          answers: [
            { text: "Na zvířecích modelech", is_correct: true },
            { text: "Na lidech", is_correct: false },
          ],
        },
      ],
    },
    // 8/n — „šarže“ vakcín (manip + dezinfo)
    {
      id: "z2",
      title: "Zjistěte nebezpečnost své šarže vakcíny – ruská ruleta",
      perex:
        'Jste očkovaní? Nebezpečnost právě "vaší" šarže vakcíny zjistíte zde.\n\nDostali Vás propagandou a nechali jste se "naočkovat"? Ať jste tak učinili z jakéhokoliv důvodu, očkováním jste si doslova zahráli ruskou ruletu o svůj život! Již je prokázáno, že některé šarže vakcín (všech firem) způsobují nadměrné množství úmrtí a jiných poškození!',
      content:
        "Číslo šarže vakcíny naleznete na \n\nCertifikátu EU Covid19, který jste obdrželi po provedené vakcinaci. Na odkaze howbad.info zjistíte, podle čísla šarže vakcíny jakou jste dostali, jaké jsou vaše šance na přežití",
      category: "zdravi",
      published: "10:40",
      author: "DEZIPER",
      dezinformative: true,
      manipulative: true,
      question: [
        {
          question: "Jsou podle textu nebezpečné vakcíny všech firem?",
          answers: [
            { text: "Ano", is_correct: true },
            { text: "Ne", is_correct: false },
          ],
        },
        {
          question: "Kde podle textu najdete číslo šarže vakcíny?",
          answers: [
            { text: "Na certifikátu EU Covid19", is_correct: true },
            { text: "Na občanském průkazu", is_correct: false },
          ],
        },
      ],
    },
    // 9/n — Bovaer-10 (manip + dezinfo)
    {
      id: "z3",
      title:
        "Británie nařídí toxickou látku kravám do roku 2030; poškodí plodnost",
      perex:
        "Britská vláda chce nařídit podávání toxické látky na redukci metanu do roku 2030 pro všechny krávy. I když se hovoří především o přidávání Bovaer-10 do krmiv ve Velké Británii, kde se snaží tuto substanci používat co nejvíc, podařilo se mi zjistit, že EU tuto látku, která má mít zejména negativní vliv na plodnost, schválila již v roce 2022.\n\nJe tedy více než pravděpodobné, že ji již používají někteří zemědělci i v zemích EU, aniž by se to jakkoli medializovalo.",
      content:
        "Praktická lékařka v důchodu Jennine Morganová poukazuje na to, že krávy ve Velké Británii jsou zodpovědné za 0,38 procenta emisí metanu. „Je jasné, že „léčba“ krav chemickou látkou ke snížení emisí metanu o 23 procent je naprostý nesmysl. Lék pravděpodobně poškozuje mikrobiom krav a možná i náš,“ varuje Morganová. Podle bývalé praktické lékařky to nemá nic společného s klimatem, ale vše souvisí s válkou proti masu, mléčným výrobkům a zemědělcům.",
      category: "zdravi",
      published: "12:25",
      author: "DEZIPER",
      dezinformative: true,
      manipulative: true,
      question: [
        {
          question:
            "Chce podle textu britská vláda nařídit podávání látky Bovaer-10 kravám od roku 2030?",
          answers: [
            { text: "Ano", is_correct: true },
            { text: "Ne", is_correct: false },
          ],
        },
        {
          question:
            "Je hlavním účelem látky Bovaer-10 podle textu zvýšení produkce mléka?",
          answers: [
            { text: "Ano", is_correct: false },
            { text: "Ne", is_correct: true },
          ],
        },
      ],
    },
  ],

  priroda: [
    // 2/n — Curryová (manipulativní, ne-dezinformační)
    {
      id: "p1",
      title:
        "Klimatoložka Curryová: konsensus je vykonstruovaný, média nás ženou",
      perex:
        "Je to vykonstruovaný konsensus,“ říká mi klimatoložka Judith Curryová. Vědci jsou podle ní motivováni zveličovat rizika, aby dosáhli „slávy a bohatství“. Média ji milovala, když zveřejnila studii, která zdánlivě ukazovala na dramatický nárůst intenzity hurikánů. „Zjistili jsme, že  procento hurikánů kategorie 4 a 5 se zdvojnásobilo,“ říká Curryová.",
      content:
        "Byla jsem přijata skupinami ochránců životního prostředí a alarmisty a byla jsem považován za rockovou hvězdu,“ vypráví Curryová. Někteří vědci však poukázali na mezery v jejím výzkumu. „Částečně to byla špatná data. Část z toho je přirozená proměnlivost klimatu.“ Pak ji skandál Climategate poučil, že ostatní klimatologové nejsou tak otevření. Agresivní pokusy alarmistických vědců skrývat data byly odhaleny v uniklých e-mailech",
      category: "priroda",
      published: "11:00",
      author: "DEZIPER",
      dezinformative: false,
      manipulative: true,
      question: [
        {
          question: "Co se podle Curryové zdvojnásobilo?",
          answers: [
            { text: "Podíl hurikánů kategorie 4 a 5", is_correct: true },
            { text: "Počet zemětřesení", is_correct: false },
          ],
        },
        {
          question: "Byl podle textu celý výzkum Curryové chybný?",
          answers: [
            { text: "Ano", is_correct: false },
            { text: "Ne", is_correct: true },
          ],
        },
      ],
    },
    // 6/n — „fotovoltaiky způsobují oteplování“ (manip + dezinfo)
    {
      id: "p2",
      title:
        "Nadměrné oteplování způsobují solární panely – zakazují o tom psát",
      perex:
        "Zakazují o tom informovat a psát, ale vědci už ví co způsobuje nadměrné oteplování posledních let. Správně jsou to fotovoltaické elektrárny. Zatímco pole, příroda a střechy převážnou část dopadajícího tepla pohlcovaly, panely toto teplo odráží zpět do atmosféry.",
      category: "priroda",
      published: "13:40",
      author: "DEZIPER",
      dezinformative: true,
      manipulative: true,
      question: [
        {
          question:
            "Co podle textu způsobuje nadměrné oteplování posledních let?",
          answers: [
            { text: "Fotovoltaické elektrárny", is_correct: true },
            { text: "Automobilová doprava", is_correct: false },
          ],
        },
      ],
    },
  ],

  "zahranicni-politika": [
    // 3/n — Bandera (manip + dezinfo)
    {
      id: "zp1",
      title:
        "CIA věděla, že Bandera byl Hitlerův špión a budovala na tom ideologii",
      perex:
        "Odtajněné dokumenty CIA popisují, kdo vlastně Stepan Bandera byl.\n\nUkrajinský hrdina Stepan Bandera byl „Hitlerův profesionální špión, známý jako konzul II“. Byl zodpovědný za smrt tisíců Rusů, Židů, Ukrajinců a Poláků..!! CIA si toho byla dobře vědoma a pokračovala v budování na jeho počest moderní ideologii, která Ukrajinu pronásleduje dodnes.",
      category: "zahranicni-politika",
      published: "08:50",
      author: "DEZIPER",
      dezinformative: true,
      manipulative: true,
      question: [
        {
          question: "Jak CIA podle textu popisovala Stepana Banderu?",
          answers: [
            { text: "Jako Hitlerova špióna", is_correct: true },
            { text: "Jako ruského diplomata", is_correct: false },
          ],
        },
      ],
    },
    // 4/n — „UA demonstrace v ČR“ (manip + dezinfo)
    {
      id: "zp2",
      title:
        "Ukrajinci v ČR chtějí pokračovat ve válce a chystají mohutné demonstrace",
      perex:
        "Už to chystáme. Na UA sociálních sítích kolují výzvy k mohutným demonstracím v Praze, Brně a Plzni. Podle průzkumu 84% Ukrajinců žijících na Ukrajině si přejí ukončení bojů i za cenu územních ústupků. V podstatě ať si Rusko nechá co má, ale ať už je hlavně klid. Oproti tomu 92% Ukrajinců v ČR je pro pokračování bojů. Mír až poté co Ukrajina vyhraje.",
      content:
        "Moji milí Ukrajinci žijící v ČR, z gauče a při pití vodky se vám to bojuje. Musím uznat že nás svým způsobem živíte. Nebýt vás, výrobci alkoholu by asi splakali nad výdělkem. Takhle ten chlast nestačíme doplňovat... No a vy váleční hrdinové tu chcete protestovat? Bojíte se míru? Že by jste přišli o svůj ráj tady v ČR? 9 z 10 Ukrajinců v ČR chce bojovat, tak běžte.",
      category: "zahranicni-politika",
      published: "12:05",
      author: "DEZIPER",
      dezinformative: true,
      manipulative: true,
      question: [
        {
          question: "Kde se mají podle textu konat demonstrace?",
          answers: [
            { text: "Praha (také Brno a Plzeň)", is_correct: true },
            { text: "Ostrava", is_correct: false },
          ],
        },
        {
          question:
            "Válku podle textu podporují zejména Ukrajinci žijící na Ukrajině.",
          answers: [
            { text: "Ano", is_correct: false },
            { text: "Ne", is_correct: true },
          ],
        },
      ],
    },
    // 5/n — „Francie uvedla nemocnice do válečného stavu“ (manip + dezinfo)
    {
      id: "zp3",
      title:
        "Francie uvádí nemocnice do válečného stavu kvůli konfliktu NATO–Rusko",
      perex:
        "Francie uvedla nemocnice do válečného stavu. Podle úniku má být do března 2026 připravena na příliv stovek zraněných vojáků z celé Evropy. Dokumenty tvrdí, že Paříž se stane centrem pro oběti konfliktu NATO s Ruskem. Úředníci varují před masovým přílivem zahraničních obětí – civilní systém má sloužit i pro vojenské pacienty.",
      content:
        "Generál Breuer varuje, že ruské cvičení Zapad 2025 může být zástěrkou útoku, NATO je v pohotovosti. Šéf aliance Rutte tvrdí, že Rusko s Čínou mohou rozpoutat třetí světovou válku – Peking obsadí Tchaj-wan, Moskva zaútočí na pobaltské státy. Mezitím probíhají branná cvičení, evakuace a stavba bunkrů, zatímco Británie a Francie posilují\n\njadernou dohodu.",
      category: "zahranicni-politika",
      published: "14:15",
      author: "DEZIPER",
      dezinformative: true,
      manipulative: true,
      question: [
        {
          question:
            "Na kdy mají být podle textu francouzské nemocnice připravené?",
          answers: [
            { text: "Do března 2026", is_correct: true },
            { text: "Do prosince 2025", is_correct: false },
          ],
        },
        {
          question:
            "Bude podle textu 3. světová válka způsobena Ruskem a Čínou?",
          answers: [
            { text: "Ano", is_correct: true },
            { text: "Ne", is_correct: false },
          ],
        },
      ],
    },
    // 7/n — „Koruptistán padl“ (manip + dezinfo)
    {
      id: "zp4",
      title: "Koruptistán padl: USA posílají auditory do Kyjeva, EU čeká",
      perex:
        "Koruptistán padl. Nejhorší noční můra vůdce junty Zelenského a jeho nejbližšího okolí se stala skutečností. V Kyjevě přistáli největší nepřátelé organizovaného zločinu a kleptokratické třídy – auditoři – aby zahájili rozsáhlý audit využívání americké pomoci. Zatímco evropská válečná fronta dál tlačí miliardy a miliardy z peněz daňových poplatníků do svých loutek – zatím přes 200 miliard z Evropy a 240 miliard z USA – odtékají a mizí, USA pod vedením nové Trumpovy administrativy nyní ukončují zábavu.",
      content:
        "Ministr zahraničí Rubio dal jasně najevo, že USA chtějí vidět zdůvodnění „každého centu, který jsme převedli z peněz daňových poplatníků“, a je samozřejmě čirou náhodou, že první příslušník kleptokratické třídy, který chtěl z Kleptokratistánu odjet do Evropy, byl zatčen na rumunských hranicích. Kdy sakra Evropská unie udělá totéž? Do nejzkorumpovanější země Evropy bylo napumpováno obrovské množství peněz. A samozřejmě máme také právo vědět, co přesně se s těmi penězi stalo. Na co tedy dámy a pánové v Radě čekají? Je nejvyšší čas.",
      category: "zahranicni-politika",
      published: "17:30",
      author: "DEZIPER",
      dezinformative: true,
      manipulative: true,
      question: [
        {
          question: "Kdo podle textu přistál v Kyjevě?",
          answers: [
            { text: "Auditoři", is_correct: true },
            { text: "Vojáci", is_correct: false },
          ],
        },
      ],
    },
  ],

  "ceska-politika": [
    // 10/n — „hybridní demokracie“ (manip + dezinfo flags unspecified in notes; nastavíme obě ANO dle tónu)
    {
      id: "cp1",
      title:
        "Prezident chce snížit věk voličů a sebrat právo starším? Čtyři cesty",
      perex:
        "Při své návštěvě Pardubic všemi milovaný prezident oznámil, že je potřeba udělat cokoliv, aby v ČR nezvítězily ve volbách populistické a proruské strany. Jedná se nejspíše o nějakou hybridní demokracii, jestli se pak o nějaké dá vůbec mluvit. Zašel až tak daleko, že oznámil \n\njak na to. Především by se měl snížit věk, odkdy by měly mít děti volební právo: od 16-ti let. Prý jsou dnes děti vyspělejší a politice rozumí.",
      content:
        "Druhým způsobem je naopak zbavit volebního práva a teď citace: „Někteří, především ti starší občané, by již volební právo mít neměli. Věková hranice by měla být mezi 16-70 lety“. Třetí variantou je udělit občanství všem ukrajinským uprchlíkům a umožnit jim spolurozhodovat o vedení země, ve které žijí. A tou poslední a nejradikálnější je pomocí soudů rovnou některé strany a hnutí zakázat.",
      category: "ceska-politika",
      published: "08:30",
      author: "DEZIPER",
      dezinformative: true,
      manipulative: true,
      question: [
        {
          question: "Zmiňuje text pojem „hybridní demokracie“?",
          answers: [
            { text: "Ano", is_correct: true },
            { text: "Ne", is_correct: false },
          ],
        },
        {
          question: "Kolik možností ovlivnění voleb příspěvek vyjmenovává?",
          answers: [
            { text: "Čtyři", is_correct: true },
            { text: "Jednu", is_correct: false },
          ],
        },
      ],
    },
    // 11/n — krajané, korespondenční volba (manip + dezinfo)
    {
      id: "cp2",
      title: "1,4 mil. Čechů v USA získá občanství a převálcuje volby poštou",
      perex:
        "Tak to je pecka, ale pořádná! V USA žije cca 1,4 mil českých občanů. V USA je zcela běžné, že na provedení srdečního bypassu si Američané musí brát druhou hypotéku na dům, stejně tak na léčbu onkologických nemocí a další náročné zákroky. Proto je zcela možné, že desítky a možná stovky tisíc krajanů z USA začnou využívat tuto nabídku na občanství a budou do ČR cestovat za zdravotní a medicínskou turistikou do českých nemocnic a českých ordinací.",
      content:
        "Každý krajan, i ten, který se vůbec v ČR, v ČSFR, v ČSSR, ani v ČSR nenarodil, bude moci získat české občanství, pokud v prohlášení uvede, že jeho rodič, prarodič, nebo pra-prarodič měl občanství v minulosti. Krajané, kteří třeba ani jednou nebyli v ČR, kteří třeba ani neumí česky. Budou moci volit a rozhodovat o tom, kdo bude v ČR vládnout, přičemž jako občané ČR budou moci čerpat zdravotní péči v ČR naproti cenově dostupnému zdravotnímu pojištění v ČR, což pro mnoho krajanů v USA lákavá nabídka. \n\nA to především pro starší krajany. Poštovní volba tak má z těchto krajanů udělat armádu voličů Pětikoalice a voliči za to dostanou českou zdravotní péči, což osloví především těch 1,4 milionu českých krajanů v USA. Pokud korespondenční volba projde spolu s novelou o občanství, tak Pětikoalice bude vládnout navždy.",
      category: "ceska-politika",
      published: "12:55",
      author: "DEZIPER",
      dezinformative: true,
      manipulative: true,
      question: [
        {
          question: "Stačí podle textu pro uznání občanství pouhé prohlášení?",
          answers: [
            { text: "Ano", is_correct: true },
            { text: "Ne", is_correct: false },
          ],
        },
        {
          question: "Tvrdí text, že v USA žije 1 milion Čechů?",
          answers: [
            { text: "Ano", is_correct: false },
            { text: "Ne", is_correct: true },
          ],
        },
      ],
    },
  ],

  pohady: [
    // ponecháno z dřívějška pro úplnost kategorie
    {
      id: "9",
      title: "Malý princ",
      perex:
        "Potom si ještě řekl: Myslil jsem, že jsem bohatý, že mám jedinečnou květinu, a zatím mám jen obyčejnou růži. Ta růže a mé tři sopky, které mi sahají po kolena a z nichž jedna je možná navždy vyhaslá, nedělají ze mne moc velikého prince… A lehl si do trávy a plakal",
      category: "pohady",
      published: "19:30",
      author: "Antoine de Saint-Exupéry",
      dezinformative: false,
      manipulative: false,
      question: [],
    },
  ],
};

type CsvRow = {
  index: string;
  pseudotitle?: string;
  title?: string;
  source?: string;
  content?: string;
  question?: string;
  answer?: string;
  theme?: string;
  manip?: string;
  dezinfo?: string;
  is_invalid?: string;
};

const parseBoolean = (value?: string): boolean =>
  typeof value === "string" &&
  ["true", "1", "yes", "ano"].includes(value.trim().toLowerCase());

const CATEGORY_MAP: Record<string, NewsArticle["category"]> = {
  priroda: "priroda",
  zdravi: "zdravi",
  "domaci-politika": "ceska-politika",
  "ceska-politika": "ceska-politika",
  "svetova-politika": "zahranicni-politika",
  "zahranicni-politika": "zahranicni-politika",
};

const normalizeCategory = (category?: string): NewsArticle["category"] =>
  CATEGORY_MAP[category?.trim().toLowerCase() ?? ""] ?? "pohady";

const randomTimestamp = (): string => {
  const hour = Math.floor(Math.random() * 24);
  const minute = Math.floor(Math.random() * 60);
  return `${hour}:${minute.toString().padStart(2, "0")}`;
};

const AUTHORS = ["DEZIPER", "Redakce", "Anonymní zdroj", "Externí autor"];
const pickRandomAuthor = (): string =>
  AUTHORS[Math.floor(Math.random() * AUTHORS.length)];

const parseCsv = (csvText: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = "";
  let inQuotes = false;

  const pushValue = () => {
    currentRow.push(currentValue);
    currentValue = "";
  };

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];

    if (inQuotes) {
      if (char === '"') {
        if (csvText[i + 1] === '"') {
          currentValue += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentValue += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      pushValue();
    } else if (char === "\n") {
      pushValue();
      rows.push(currentRow);
      currentRow = [];
    } else if (char !== "\r") {
      currentValue += char;
    }
  }

  // Push the last value/row if necessary
  if (inQuotes === false && (currentValue || currentRow.length > 0)) {
    pushValue();
    rows.push(currentRow);
  }

  // Remove trailing empty row if present
  if (
    rows.length &&
    rows[rows.length - 1].length === 1 &&
    rows[rows.length - 1][0].trim() === ""
  ) {
    rows.pop();
  }

  return rows;
};

const csvToRows = (csvText?: string): CsvRow[] => {
  if (!csvText) return [];
  const table = parseCsv(csvText);
  if (!table.length) return [];

  const header = table[0].map((h) => h.trim().toLowerCase());
  const getIdx = (name: string) => header.indexOf(name);

  const idxIndex = getIdx("index");
  const idxPseudotitle = getIdx("pseudotitle");
  const idxTitle = getIdx("title");
  const idxSource = getIdx("source");
  const idxContent = getIdx("content");
  const idxQuestion = getIdx("question");
  const idxAnswer = getIdx("answer");
  const idxTheme = getIdx("theme");
  const idxManip = getIdx("manip");
  const idxDezinfo = getIdx("dezinfo");
  const idxInvalid = getIdx("is_invalid");

  return table.slice(1).map((row) => ({
    index: row[idxIndex] ?? "",
    pseudotitle: idxPseudotitle === -1 ? undefined : row[idxPseudotitle],
    title: idxTitle === -1 ? undefined : row[idxTitle],
    source: idxSource === -1 ? undefined : row[idxSource],
    content: idxContent === -1 ? undefined : row[idxContent],
    question: idxQuestion === -1 ? undefined : row[idxQuestion],
    answer: idxAnswer === -1 ? undefined : row[idxAnswer],
    theme: idxTheme === -1 ? undefined : row[idxTheme],
    manip: idxManip === -1 ? undefined : row[idxManip],
    dezinfo: idxDezinfo === -1 ? undefined : row[idxDezinfo],
    is_invalid: idxInvalid === -1 ? undefined : row[idxInvalid],
  }));
};

const mapCsvToArticles = (rows: CsvRow[]): NewsArticle[] =>
  rows.map((row, idx) => {
    const yesIsCorrect = parseBoolean(row.answer);

    return {
      id: row.index || `${idx + 1}`,
      title: row.title?.trim() || row.pseudotitle?.trim() || "Bez názvu",
      perex: "Klikněte pro zobrazení článku...",
      content: row.content ?? "",
      category: normalizeCategory(row.theme),
      published: randomTimestamp(),
      author: pickRandomAuthor(),
      dezinformative: parseBoolean(row.dezinfo),
      manipulative: parseBoolean(row.manip),
      question: row.question
        ? [
            {
              question: row.question,
              answers: [
                { text: "Ano", is_correct: yesIsCorrect },
                { text: "Ne", is_correct: !yesIsCorrect },
              ],
            },
          ]
        : [],
    };
  });

// Load articles from the CSV if available
const deziperCsvModules = import.meta.glob("../../data/deziper-texts.csv", {
  as: "raw",
  eager: true,
});
const deziperCsvRaw = Object.values(deziperCsvModules)[0] as string | undefined;

const loadedArticles: NewsArticle[] | null = deziperCsvRaw
  ? mapCsvToArticles(csvToRows(deziperCsvRaw))
  : null;

const groupArticles = (
  articles: NewsArticle[],
): Record<string, NewsArticle[]> => {
  const grouped: Record<string, NewsArticle[]> = {
    zdravi: [],
    priroda: [],
    "ceska-politika": [],
    "zahranicni-politika": [],
    pohady: [],
  };

  for (const article of articles) {
    if (grouped[article.category]) {
      grouped[article.category].push(article);
    } else {
      // Fallback for unknown categories or just add them
      if (!grouped[article.category]) {
        grouped[article.category] = [];
      }
      grouped[article.category].push(article);
    }
  }
  return grouped;
};

export const rawNewsData: Record<string, NewsArticle[]> =
  loadedArticles && loadedArticles.length > 0
    ? groupArticles(loadedArticles)
    : defaultNewsData;

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const isScreenshotModeBootstrap =
  (typeof window !== "undefined" &&
    typeof window.location?.search === "string" &&
    new URLSearchParams(window.location.search).get("screenshot") !== null &&
    new URLSearchParams(window.location.search)
      .get("screenshot")
      ?.toLowerCase() !== "false" &&
    new URLSearchParams(window.location.search)
      .get("screenshot")
      ?.toLowerCase() !== "0") ||
  (typeof import.meta !== "undefined" &&
    typeof import.meta.env?.VITE_SCREENSHOT_MODE === "string" &&
    import.meta.env.VITE_SCREENSHOT_MODE.toLowerCase() === "true");

const stabilizeArray = <T>(array: T[]): T[] =>
  isScreenshotModeBootstrap ? [...array] : shuffleArray(array);

export const newsData: Record<string, NewsArticle[]> = {
  zdravi: stabilizeArray(rawNewsData.zdravi),
  priroda: stabilizeArray(rawNewsData.priroda),
  "ceska-politika": stabilizeArray(rawNewsData["ceska-politika"]),
  "zahranicni-politika": stabilizeArray(rawNewsData["zahranicni-politika"]),
  pohady: stabilizeArray(rawNewsData.pohady),
};

// Empty/meaningless filler content for slow news days (no questions)
export const emptyFillerArticles: NewsArticle[] = [
  {
    id: "e1",
    title: "Dnes se vlastně nic nestalo",
    perex:
      "Dnešní den proběhl bez větších událostí. Úřady hlásí běžný provoz, doprava bez komplikací, počasí bez extrémů.",
    category: "ceska-politika",
    published: "16:00",
    author: "Redakce",
    dezinformative: false,
    manipulative: false,
    question: [],
  },
  {
    id: "e2",
    title: "V přírodě žádné změny",
    perex:
      "Dnešek se obešel bez přírodních anomálií či zásadních změn. Podmínky v krajině zůstávají klidné.",
    category: "priroda",
    published: "16:20",
    author: "Redakce",
    dezinformative: false,
    manipulative: false,
    question: [],
  },
];

export function getNewsForCategory(category: string): NewsArticle[] {
  return newsData[category] || [];
}

export function getMainArticle(category: string): NewsArticle | null {
  const articles = getNewsForCategory(category);
  return articles.length > 0 ? articles[0] : null;
}

export function getEmptyFillerArticles(): NewsArticle[] {
  return emptyFillerArticles;
}
