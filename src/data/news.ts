export interface NewsArticle {
  id: string;
  title: string;
  perex: string;
  category: 'zdravi' | 'priroda' | 'ceska-politika' | 'zahranicni-politika';
  published: string;
  author: string;
}

export const newsData: Record<string, NewsArticle[]> = {
  'zdravi': [
    {
      id: '1',
      title: 'Nová studie odhalila účinky pravidelného cvičení na dlouhověkost',
      perex: 'Vědci z Univerzity Karlovy publikovali rozsáhlou studii, která prokazuje přímou souvislost mezi pravidelnou fyzickou aktivitou a prodloužením života. Výsledky ukazují až 15% snížení mortality u aktivních jedinců.',
      category: 'zdravi',
      published: '15:30',
      author: 'MUDr. Jana Nováková',
    },
    {
      id: '2', 
      title: 'Ministerstvo zdravotnictví spouští novou kampaň prevence cukrovky',
      perex: 'Od příštího týdne začíná celonárodní kampaň zaměřená na prevenci diabetu 2. typu. Kampaň zahrnuje bezplatná vyšetření v ambulancích praktických lékařů po celé České republice.',
      category: 'zdravi',
      published: '14:45',
      author: 'Tomáš Svoboda',
    }
  ],
  'priroda': [
    {
      id: '3',
      title: 'Česká republika zavádí nová opatření na ochranu biodiverzity',
      perex: 'Vláda schválila balíček opatření na podporu místních ekosystémů a ochranu ohrožených druhů. Plán počítá s investicí 2,5 miliardy korun do příštího roku na obnovu přírodních stanovišť.',
      category: 'priroda',
      published: '16:20',
      author: 'Ing. Petra Zelená',
    },
    {
      id: '4',
      title: 'Rekordní úhyn ryb v řece Moravě vyvolává obavy ekologů',
      perex: 'V posledních dnech bylo v řece Moravě nalezeno více než 10 tisíc uhynulých ryb. Příčiny úhynu zatím nejsou známy, probíhá rozsáhlé vyšetřování kvality vody a možných zdrojů znečištění.',
      category: 'priroda',
      published: '13:15',
      author: 'RNDr. Martin Vodník',
    }
  ],
  'ceska-politika': [
    {
      id: '5',
      title: 'Sněmovna projednává novelu zákona o digitalizaci veřejné správy',
      perex: 'Poslanci dnes v prvním čtení projednávají klíčovou novelu, která má zjednodušit komunikaci občanů s úřady. Návrh počítá s povinným zavedením digitálních služeb do konce roku 2025.',
      category: 'ceska-politika',
      published: '17:10',
      author: 'Mgr. Karel Politický',
    },
    {
      id: '6',
      title: 'Premiér představil novou energetickou strategii České republiky',
      perex: 'Vláda dnes oficiálně představila dlouhodobou energetickou strategii do roku 2040. Plán počítá s masivními investicemi do obnovitelných zdrojů a postupným útlumem uhelných elektráren.',
      category: 'ceska-politika',
      published: '12:30',
      author: 'PhDr. Anna Reportérová',
    }
  ],
  'zahranicni-politika': [
    {
      id: '7',
      title: 'EU schvaluje nové sankce proti autoritářským režimům',
      perex: 'Evropská rada dnes jednomyslně schválila rozšíření sankčního seznamu o další osoby a entity spojené s porušováním lidských práv. České předsednictví iniciativu aktivně podporovalo.',
      category: 'zahranicni-politika',
      published: '18:45',
      author: 'Bc. Jiří Evropský',
    },
    {
      id: '8',
      title: 'Česko posiluje spolupráci s Indo-pacifickými partnery',
      perex: 'Ministr zahraničních věcí dnes podepsal memoranda o porozumění s představiteli Austrálie a Japonska. Dohody se zaměřují na technologickou spolupráci a společné investice do čistých technologií.',
      category: 'zahranicni-politika',
      published: '11:20',
      author: 'Mgr. Světlana Diplomática',
    }
  ]
};

export const fillerArticles: NewsArticle[] = [
  {
    id: 'f1',
    title: 'Pražský dopravní podnik testuje nové elektrobusy',
    perex: 'Hlavní město Praha zahájilo pilotní testování moderních elektrických autobusů na vybraných linkách.',
    category: 'ceska-politika',
    published: '10:15',
    author: 'Redakce',
  },
  {
    id: 'f2',
    title: 'Nárůst počtu turistů v českých horách',
    perex: 'Statistiky ukazují rekordní návštěvnost národních parků během letní sezóny.',
    category: 'priroda',
    published: '09:30',
    author: 'Redakce',
  },
  {
    id: 'f3',
    title: 'Odborníci varují před rizikem chřipkové epidemie',
    perex: 'Zdravotničtí experti doporučují včasné očkování proti chřipce před nástupem podzimní sezóny.',
    category: 'zdravi',
    published: '08:45',
    author: 'Redakce',
  },
  {
    id: 'f4',
    title: 'Americký prezident navštíví příští měsíc Evropu',
    perex: 'Plánovaná návštěva zahrnuje jednání s evropskými lídry o bezpečnostní spolupráci.',
    category: 'zahranicni-politika',
    published: '07:20',
    author: 'Redakce',
  },
  {
    id: 'f5',
    title: 'Český tým vyhrál mezinárodní soutěž v robotice',
    perex: 'Studenti z VUT v Brně získali první místo na prestižní technologické soutěži.',
    category: 'ceska-politika',
    published: '19:10',
    author: 'Redakce',
  }
];

// Empty/meaningless filler content for slow news days
export const emptyFillerArticles: NewsArticle[] = [
  {
    id: 'e1',
    title: 'Dnes se vlastně nic nestalo',
    perex: 'Dnešní den proběhl bez větších událostí. Úřady hlásí běžný provoz, doprava bez komplikací, počasí bez extrémů.',
    category: 'ceska-politika',
    published: '16:00',
    author: 'Redakce',
  },
  {
    id: 'e2',
    title: 'Situace zůstává beze změn',
    perex: 'Ministerstvo potvrdilo, že současný stav se nijak nezměnil oproti včerejšku. Žádné nové rozvojové plány nejsou v současnosti připravovány.',
    category: 'ceska-politika',
    published: '15:30',
    author: 'Redakce',
  },
  {
    id: 'e3',
    title: 'Běžný den na úřadech',
    perex: 'Městské úřady hlásí standardní provoz. Žádné mimořádné události se nekonaly, fronty běžné délky.',
    category: 'ceska-politika',
    published: '14:45',
    author: 'Redakce',
  },
  {
    id: 'e4',
    title: 'Poklidné ráno v českých městech',
    perex: 'Ranní hodiny proběhly v naprostém klidu. Doprava plynulá, žádné mimořádné události nebyly zaznamenány.',
    category: 'ceska-politika',
    published: '11:20',
    author: 'Redakce',
  },
  {
    id: 'e5',
    title: 'Žádné novinky z parlamentu',
    perex: 'Poslanci dnes neprojednávali žádné zásadní body. Běžný provoz bez mimořádných rozhodnutí.',
    category: 'ceska-politika',
    published: '13:10',
    author: 'Redakce',
  },
  {
    id: 'e6',
    title: 'Klidný víkend bez komplikací',
    perex: 'Víkendové dny proběhly bez větších problémů. Policie nezaznamenala žádné mimořádné události.',
    category: 'ceska-politika', 
    published: '12:00',
    author: 'Redakce',
  }
];

export function getNewsForCategory(category: string): NewsArticle[] {
  return newsData[category] || [];
}

export function getMainArticle(category: string): NewsArticle | null {
  const articles = getNewsForCategory(category);
  return articles.length > 0 ? articles[0] : null;
}

export function getFillerArticles(excludeCategory?: string): NewsArticle[] {
  return fillerArticles.filter(article => 
    !excludeCategory || article.category !== excludeCategory
  );
}

export function getEmptyFillerArticles(): NewsArticle[] {
  return emptyFillerArticles;
}