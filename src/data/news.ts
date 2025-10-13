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
}

export const rawNewsData: Record<string, NewsArticle[]> = {
  zdravi: [
    // Dezinformativní + manipulatívní
    {
      id: "z1",
      title: "Farmaceutické firmy tají zázračný lék proti rakovině",
      perex:
        "Podle anonymních zdrojů existuje lék, který dokáže vyléčit všechny typy rakoviny během několika dnů. Mocné farmaceutické koncerny jej však záměrně ukrývají, protože by přišly o miliardové zisky. Každý rok tak zbytečně umírají tisíce lidí, jen aby farmacie dál vydělávala. Lidé by se měli spojit a žádat pravdu o skutečných léčebných možnostech. Podle anonymních zdrojů existuje lék, který dokáže vyléčit všechny typy rakoviny během několika dnů. Mocné farmaceutické koncerny jej však záměrně ukrývají, protože by přišly o miliardové zisky. Každý rok tak zbytečně umírají tisíce lidí, jen aby farmacie dál vydělávala. Lidé by se měli spojit a žádat pravdu o skutečných léčebných možnostech. Podle anonymních zdrojů existuje lék, který dokáže vyléčit všechny typy rakoviny během několika dnů. Mocné farmaceutické koncerny jej však záměrně ukrývají, protože by přišly o miliardové zisky. Každý rok tak zbytečně umírají tisíce lidí, jen aby farmacie dál vydělávala. Lidé by se měli spojit a žádat pravdu o skutečných léčebných možnostech.",
      category: "zdravi",
      published: "09:30",
      author: "Redakce Pravda24",
      dezinformative: true,
      manipulative: true,
    },
    // Dezinformativní + normální
    {
      id: "z2",
      title: "Pití citronové šťávy údajně zcela předchází rakovině",
      perex:
        "Na sociálních sítích se šíří tvrzení, že denní konzumace citronové šťávy spolehlivě brání vzniku rakoviny. Sdílené příspěvky uvádějí, že stačí sklenice ráno nalačno a člověk má být odolný vůči všem nádorovým onemocněním. Odborné zdroje k této informaci chybí a tvrzení není vědecky potvrzené. Přesto si tento trend získává stále více příznivců.",
      category: "zdravi",
      published: "10:00",
      author: "Internetový portál ZdravíPlus",
      dezinformative: true,
      manipulative: false,
    },
    // Pravda + manipulatívní
    {
      id: "z3",
      title: "Lékaři varují: sedavý životní styl doslova zabíjí",
      perex:
        "Podle nové studie WHO může dlouhé sezení u počítače zkrátit život až o několik let. Každý den strávený bez pohybu postupně oslabuje srdce, cévy i metabolismus. Pokud lidé nezačnou okamžitě měnit své návyky, hrozí společnosti vlna předčasných úmrtí. Odborníci bijí na poplach: zvedněte se ze židle, než bude pozdě.",
      category: "zdravi",
      published: "11:45",
      author: "MUDr. Petr Varovný",
      dezinformative: false,
      manipulative: true,
    },
    // Pravda + normální
    {
      id: "z4",
      title: "Odborníci doporučují 30 minut pohybu denně pro zdravé srdce",
      perex:
        "Kardiologové připomínají, že pravidelná fyzická aktivita snižuje riziko srdečních onemocnění. Postačí i půlhodina rychlé chůze denně, která podporuje kardiovaskulární systém a metabolismus. I malé změny v každodenních návycích mohou mít dlouhodobý pozitivní efekt. Doporučuje se začít pozvolna a vytrvale.",
      category: "zdravi",
      published: "12:15",
      author: "Doc. Jana Krátká",
      dezinformative: false,
      manipulative: false,
    },
  ],

  priroda: [
    // Dezinformativní + manipulatívní
    {
      id: "p1",
      title: "Vláda prý plánuje vybetonovat národní parky kvůli developerům",
      perex:
        "Interní plán má údajně počítat s rozsáhlou zástavbou národních parků luxusními resorty. Ochrana přírody má být jen zástěrkou, jak vyhnat místní a uvolnit území pro bohaté. Zvířata podle aktivistů nemají šanci přežít blížící se betonovou apokalypsu. Občané by prý měli okamžitě vyjít do ulic, než bude navždy pozdě.",
      category: "priroda",
      published: "08:20",
      author: "EkoAlarm News",
      dezinformative: true,
      manipulative: true,
    },
    // Dezinformativní + normální
    {
      id: "p2",
      title: "Satelity údajně prokázaly, že 5G zastavuje fotosyntézu stromů",
      perex:
        "Na internetových fórech se objevilo tvrzení, že signál 5G sítí brání stromům ve fotosyntéze. Příspěvky odkazují na nepublikovanou analýzu satelitních snímků, která má ukazovat pokles vitality lesů poblíž vysílačů. Odborné instituce se k tomu nevyjádřily a studie není dohledatelná v recenzovaných databázích. Přesto je téma široce sdílené.",
      category: "priroda",
      published: "09:05",
      author: "Red. Volná Zóna",
      dezinformative: true,
      manipulative: false,
    },
    // Pravda + manipulatívní
    {
      id: "p3",
      title: "Rekordní sucho žene české řeky na kolena",
      perex:
        "Hydrologové potvrzují kriticky nízké průtoky na mnoha tocích a varují před kolapsem vodních ekosystémů. Každý den bez deště znamená další tisíce utonulých organismů a vyhasínající krajinu. Pokud nezměníme spotřebu a nebudeme vodu chránit, čeká nás vyprahlá budoucnost. Je čas šetřit každou kapku.",
      category: "priroda",
      published: "12:40",
      author: "RNDr. Eva Suchá",
      dezinformative: false,
      manipulative: true,
    },
    // Pravda + normální
    {
      id: "p4",
      title: "Program obnovy mokřadů zvyšuje biodiverzitu a zadržuje vodu",
      perex:
        "Ekologické projekty zaměřené na obnovu mokřadů prokazatelně zlepšují podmínky pro obojživelníky a ptactvo. Revitalizace navíc pomáhá zadržovat vodu v krajině a zmírňovat dopady sucha. Odborníci doporučují kombinovat výsadbu stromů a péči o retenční plochy. Obce díky tomu získávají stabilnější mikroklima.",
      category: "priroda",
      published: "15:10",
      author: "Ing. Petra Zelená",
      dezinformative: false,
      manipulative: false,
    },
  ],

  "ceska-politika": [
    // Dezinformativní + manipulatívní
    {
      id: "cp1",
      title: "Nový zákon má prý legalizovat tajné sledování všech občanů",
      perex:
        "Podle kolujících zpráv chce vláda umožnit plošné odposlechy bez soudního povolení. Úřady si mají údajně kdykoli číst soukromé zprávy a sledovat polohu lidí. Jde o bezprecedentní útok na svobodu, který promění zemi v orwellovský stát. Občané jsou vyzýváni k okamžitému odporu proti „totalitnímu“ návrhu.",
      category: "ceska-politika",
      published: "07:50",
      author: "List Národní Stráž",
      dezinformative: true,
      manipulative: true,
    },
    // Dezinformativní + normální
    {
      id: "cp2",
      title: "Nezdaněný základní příjem údajně startuje už letos",
      perex:
        "Na sítích se objevila informace, že vláda zavádí univerzální nezdaněný základní příjem pro všechny občany. Tvrdí se, že vyplácení začne ještě letos a nahradí většinu sociálních dávek. Ministerstva však tento plán oficiálně neohlásila a detaily nejsou k dispozici. Přesto zpráva vyvolává debatu o sociální politice.",
      category: "ceska-politika",
      published: "11:10",
      author: "Portál PolitikaBezCenzury",
      dezinformative: true,
      manipulative: false,
    },
    // Pravda + manipulatívní
    {
      id: "cp3",
      title: "Digitalizace úřadů se vleče a občané dál trpí frontami",
      perex:
        "Poslanci projednávají novelu, která má urychlit zavádění online služeb. Roky slibů ale zanechaly veřejnost ve frustraci z nekonečných čekacích lhůt a razítek. Pokud se systém konečně nepohne, zůstaneme uvězněni v papírové minulosti. Lidé mají právo žádat okamžitou změnu.",
      category: "ceska-politika",
      published: "13:25",
      author: "Mgr. Karel Politický",
      dezinformative: false,
      manipulative: true,
    },
    // Pravda + normální
    {
      id: "cp4",
      title: "Novela o e-Governmentu cílí na rychlejší vyřizování žádostí",
      perex:
        "Návrh počítá s povinným zavedením digitálních služeb do stanoveného termínu. Očekává se zkrácení administrativních procesů a lepší dostupnost agend na dálku. Součástí jsou i standardy pro bezpečnou identifikaci a sdílení dat mezi úřady. Změny mají snížit zátěž občanů i firem.",
      category: "ceska-politika",
      published: "16:05",
      author: "PhDr. Anna Reportérová",
      dezinformative: false,
      manipulative: false,
    },
  ],

  "zahranicni-politika": [
    // Dezinformativní + manipulatívní
    {
      id: "zp1",
      title: "EU chystá zákaz hotovosti a úplnou kontrolu obyvatel",
      perex:
        "Podle některých blogerů má EU už letos zrušit hotovost a zavést povinné digitální peníze. Tím má prý získat plnou kontrolu nad nákupy občanů a možnost je kdykoli zablokovat. Kritici varují, že svoboda skončí jedním hlasováním v Bruselu. Lidé se mají připravit na éru totálního dohledu.",
      category: "zahranicni-politika",
      published: "08:10",
      author: "EuroSkep CZ",
      dezinformative: true,
      manipulative: true,
    },
    // Dezinformativní + normální
    {
      id: "zp2",
      title: "Tajná aliance prý ruší hranice mezi několika státy",
      perex:
        "Na platformách se šíří tvrzení, že skupina zemí podepsala neveřejnou dohodu o okamžitém zrušení hranic. Má jít o krok, který zásadně změní geopolitickou mapu bez účasti parlamentů. Dokumenty k dohodě však nejsou k dispozici a žádná vláda změnu nepotvrdila. Přesto spekulace získávají pozornost.",
      category: "zahranicni-politika",
      published: "10:30",
      author: "GlobalLeaks",
      dezinformative: true,
      manipulative: false,
    },
    // Pravda + manipulatívní
    {
      id: "zp3",
      title: "Nové sankce EU zasáhnou autoritáře – a svět to musí slyšet",
      perex:
        "Evropská rada rozšiřuje sankce proti osobám spojeným s porušováním práv. Je to jasný vzkaz režimům, které kradou lidem svobodu a trestají nevinné. Pokud Evropa nepřitvrdí, budou diktátoři dál beztrestně pošlapávat lidskou důstojnost. Nastal čas ukázat pevné hodnoty v praxi.",
      category: "zahranicni-politika",
      published: "14:55",
      author: "Bc. Jiří Evropský",
      dezinformative: false,
      manipulative: true,
    },
    // Pravda + normální
    {
      id: "zp4",
      title: "Česko rozšiřuje spolupráci s partnery v Indo-Pacifiku",
      perex:
        "Zástupci České republiky podepsali memoranda o technologické a investiční spolupráci s Austrálií a Japonskem. Cílem je posílit ekonomické vazby a rozvoj čistých technologií. Dokumenty zahrnují výměnu know-how a podporu společných projektů. Diplomacie tím reaguje na rostoucí význam regionu pro obchod i bezpečnost.",
      category: "zahranicni-politika",
      published: "17:40",
      author: "Mgr. Světlana Diplomática",
      dezinformative: false,
      manipulative: false,
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
      dezinformative: false,
      manipulative: false,
    },
  ],
};

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const newsData: Record<string, NewsArticle[]> = {
  zdravi: shuffleArray(rawNewsData.zdravi),
  priroda: shuffleArray(rawNewsData.priroda),
  "ceska-politika": shuffleArray(rawNewsData["ceska-politika"]),
  "zahranicni-politika": shuffleArray(rawNewsData["zahranicni-politika"]),
  pohady: shuffleArray(rawNewsData.pohady),
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
    dezinformative: false,
    manipulative: false,
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
