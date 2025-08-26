export interface NewsArticle {
  id: string;
  title: string;
  perex: string;
  category:
    | "zdravi"
    | "priroda"
    | "ceska-politika"
    | "zahranicni-politika"
    | "pohady";
  published: string;
  author: string;
}

export const newsData: Record<string, NewsArticle[]> = {
  zdravi: [
    {
      id: "1",
      title: "Nová studie odhalila účinky pravidelného cvičení na dlouhověkost",
      perex:
        "Vědci z Univerzity Karlovy publikovali rozsáhlou studii, která prokazuje přímou souvislost mezi pravidelnou fyzickou aktivitou a prodloužením života. Výsledky ukazují až 15% snížení mortality u aktivních jedinců. Studie zároveň naznačuje, že i mírné cvičení několikrát týdně přináší měřitelné benefity. Odborníci proto doporučují začlenit pohyb do každodenní rutiny a podporovat zdravý životní styl už od mládí.",
      category: "zdravi",
      published: "15:30",
      author: "MUDr. Jana Nováková",
    },
    {
      id: "2",
      title:
        "Ministerstvo zdravotnictví spouští novou kampaň prevence cukrovky",
      perex:
        "Od příštího týdne začíná celonárodní kampaň zaměřená na prevenci diabetu 2. typu. Kampaň zahrnuje bezplatná vyšetření v ambulancích praktických lékařů po celé České republice. Součástí akce budou také informační semináře o zdravé výživě a životním stylu. Ministerstvo si od projektu slibuje zvýšení povědomí o rizikových faktorech a včasnější diagnostiku onemocnění.",
      category: "zdravi",
      published: "14:45",
      author: "Tomáš Svoboda",
    },
  ],
  priroda: [
    {
      id: "3",
      title: "Česká republika zavádí nová opatření na ochranu biodiverzity",
      perex:
        "Vláda schválila balíček opatření na podporu místních ekosystémů a ochranu ohrožených druhů. Plán počítá s investicí 2,5 miliardy korun do příštího roku na obnovu přírodních stanovišť. Program se zaměří především na revitalizaci mokřadů, výsadbu stromů a podporu ohrožených živočichů. Podle odborníků jde o největší krok v oblasti ochrany přírody za poslední dekádu.",
      category: "priroda",
      published: "16:20",
      author: "Ing. Petra Zelená",
    },
    {
      id: "4",
      title: "Rekordní úhyn ryb v řece Moravě vyvolává obavy ekologů",
      perex:
        "V posledních dnech bylo v řece Moravě nalezeno více než 10 tisíc uhynulých ryb. Příčiny úhynu zatím nejsou známy, probíhá rozsáhlé vyšetřování kvality vody a možných zdrojů znečištění. Ekologické organizace upozorňují na možné důsledky pro místní ekosystém a rybářství. Situaci sleduje také Česká inspekce životního prostředí, která zvažuje zavedení mimořádných opatření.",
      category: "priroda",
      published: "13:15",
      author: "RNDr. Martin Vodník",
    },
  ],
  "ceska-politika": [
    {
      id: "5",
      title: "Sněmovna projednává novelu zákona o digitalizaci veřejné správy",
      perex:
        "Poslanci dnes v prvním čtení projednávají klíčovou novelu, která má zjednodušit komunikaci občanů s úřady. Návrh počítá s povinným zavedením digitálních služeb do konce roku 2025. Novela má přinést rychlejší vyřizování žádostí a snížit administrativní zátěž občanů i firem. Pokud bude návrh schválen, očekává se výrazná modernizace státní správy a posun směrem k e-governmentu.",
      category: "ceska-politika",
      published: "17:10",
      author: "Mgr. Karel Politický",
    },
    {
      id: "6",
      title: "Premiér představil novou energetickou strategii České republiky",
      perex:
        "Vláda dnes oficiálně představila dlouhodobou energetickou strategii do roku 2040. Plán počítá s masivními investicemi do obnovitelných zdrojů a postupným útlumem uhelných elektráren. Cílem je snížit závislost na fosilních palivech a posílit energetickou bezpečnost země. Strategie zahrnuje také podporu inovací v oblasti čistých technologií a rozvoj jaderné energetiky.",
      category: "ceska-politika",
      published: "12:30",
      author: "PhDr. Anna Reportérová",
    },
  ],
  "zahranicni-politika": [
    {
      id: "7",
      title: "EU schvaluje nové sankce proti autoritářským režimům",
      perex:
        "Evropská rada dnes jednomyslně schválila rozšíření sankčního seznamu o další osoby a entity spojené s porušováním lidských práv. České předsednictví iniciativu aktivně podporovalo. Sankce zahrnují zmrazení majetku, zákaz cestování a omezení obchodních vztahů. Podle diplomatů jde o jasný signál, že EU nebude tolerovat systematické potlačování občanských svobod.",
      category: "zahranicni-politika",
      published: "18:45",
      author: "Bc. Jiří Evropský",
    },
    {
      id: "8",
      title: "Česko posiluje spolupráci s Indo-pacifickými partnery",
      perex:
        "Ministr zahraničních věcí dnes podepsal memoranda o porozumění s představiteli Austrálie a Japonska. Dohody se zaměřují na technologickou spolupráci a společné investice do čistých technologií. Spolupráce má přispět k posílení ekonomických vztahů a diverzifikaci obchodních partnerů. Česká diplomacie tak reaguje na rostoucí význam Indo-pacifického regionu pro světovou politiku i ekonomiku.",
      category: "zahranicni-politika",
      published: "11:20",
      author: "Mgr. Světlana Diplomática",
    },
  ],
  pohady: [
    {
      id: "9",
      title: "Malý princ",
      perex:
        "Potom si ještě řekl: Myslil jsem, že jsem bohatý, že mám jedinečnou květinu, a zatím mám jen obyčejnou růži. Ta růže a mé tři sopky, které mi sahají po kolena a z nichž jedna je možná navždy vyhaslá, nedělají ze mne moc velikého prince… A lehl si do trávy a plakal",
      category: "pohady",
      published: "19:30",
      author: "Antoine de Saint-Exupéry",
    },
  ],
};

// Empty/meaningless filler content for slow news days
export const emptyFillerArticles: NewsArticle[] = [
  {
    id: "e1",
    title: "Dnes se vlastně nic nestalo",
    perex:
      "Dnešní den proběhl bez větších událostí. Úřady hlásí běžný provoz, doprava bez komplikací, počasí bez extrémů.",
    category: "ceska-politika",
    published: "16:00",
    author: "Redakce",
  },
  {
    id: "e2",
    title: "V přírodě žádné změny",
    perex:
      "Dnešek se obešel bez přírodních anomálií či zásadních změn. Podmínky v krajině zůstávají klidné.",
    category: "priroda",
    published: "16:20",
    author: "Redakce",
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
