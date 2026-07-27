export interface BrandCategoryDecisionPoint {
  title: string;
  text: string;
}

export interface BrandCategoryBuyingGuide {
  singular: string;
  headlineNoun: string;
  intro: string;
  points: BrandCategoryDecisionPoint[];
}

export interface BrandCategoryPresentation {
  brandSearchName: string;
  headline: string;
  seoTitle: string;
  seoDescription: string;
  searchPhrases: string[];
}

/**
 * Editorial order based on three signals: Israeli search wording, commercial
 * intent, and enough real models in the current Hadad catalog to compare.
 * Keeping this an allow-list prevents scaled, low-value doorway pages.
 */
export const BRAND_CATEGORY_PRIORITY_KEYS = [
  "electra:air-conditioners",
  "tadiran:air-conditioners",
  "dreame:robot-vacuums",
  "dyson:vacuum-cleaners",
  "bosch:dishwashers",
  "bosch:washing-machines",
  "electrolux:ovens",
  "delonghi:coffee-machines",
  "lg:tvs",
  "samsung:tvs",
  "tcl:tvs",
  "sharp:refrigerators",
  "samsung:refrigerators",
  "electrolux:washing-machines",
  "samsung:washing-machines",
  "midea:cooktops",
  "electrolux:cooktops",
  "samsung:microwaves",
  "sharp:microwaves",
  "midea:microwaves",
  "tefal:irons",
  "ninja:grill-pans",
  "braun:blenders",
  "bosch:blenders",
  "midea:ovens",
  "hisense:refrigerators",
  "premier:refrigerators",
] as const;

const BRAND_SEARCH_NAMES: Record<string, string> = {
  lg: "LG",
  samsung: "סמסונג",
  midea: "Midea (מידאה)",
  electra: "אלקטרה",
  tadiran: "תדיראן",
  electrolux: "אלקטרולוקס",
  sharp: "שארפ",
  hisense: "Hisense (הייסנס)",
  premier: "Premier",
  bosch: "בוש",
  tcl: "TCL",
  dreame: "Dreame (דרימי)",
  dyson: "Dyson (דייסון)",
  delonghi: "DeLonghi (דלונגי)",
  tefal: "Tefal (טפאל)",
  ninja: "Ninja (נינג׳ה)",
  braun: "Braun (בראון)",
};

const CATEGORY_GUIDES: Record<string, BrandCategoryBuyingGuide> = {
  "air-conditioners": {
    singular: "מזגן",
    headlineNoun: "מזגני",
    intro: "בחירת מזגן מתחילה בעומס החום של החדר ולא רק במספר כוחות הסוס. שטח, קומה, כיווני שמש, בידוד וגודל פתחים משפיעים על ההספק ועל צריכת החשמל לאורך זמן.",
    points: [
      { title: "התאמת תפוקה", text: "מודדים את החלל ומביאים בחשבון קומה אחרונה, חלונות גדולים וחלל פתוח למטבח." },
      { title: "אינוורטר ושקט", text: "בחדר שינה חשוב לבדוק נתוני רעש; בשימוש ממושך כדאי להשוות יעילות אנרגטית ובקרת אינוורטר." },
      { title: "התקנה ותשתית", text: "אורך צנרת, ניקוז, נקודת חשמל ומיקום היחידה החיצונית משפיעים על ההצעה הסופית." },
    ],
  },
  tvs: {
    singular: "טלוויזיה",
    headlineNoun: "טלוויזיות",
    intro: "המסך הנכון נקבע לפי מרחק הצפייה, האור בחדר והתוכן שרואים. גודל, סוג הפאנל וקצב הרענון חשובים יותר מרשימת תכונות ארוכה שלא בהכרח תשמש אתכם.",
    points: [
      { title: "גודל מול מרחק", text: "מודדים מהמסך למקום הישיבה ובודקים גם את רוחב הקיר או הנישה." },
      { title: "תאורה ותמונה", text: "לסלון מואר בודקים בהירות והשתקפויות; לצפייה בערב נותנים משקל לניגודיות ולשחור." },
      { title: "ספורט וגיימינג", text: "לשימוש מהיר בודקים קצב רענון, השהיית קלט וחיבורי HDMI בדגם המדויק." },
    ],
  },
  refrigerators: {
    singular: "מקרר",
    headlineNoun: "מקררי",
    intro: "במקרר אין תחליף למדידה מוקדמת. רוחב וגובה הנישה, עומק, כיוון פתיחת הדלת והמעבר עד המטבח חשובים לא פחות מהנפח הרשום במפרט.",
    points: [
      { title: "נישה ומעברים", text: "מודדים את הנישה, הדלתות, המעלית והפינות במסלול ההכנסה לבית." },
      { title: "מבנה פנימי", text: "בוחרים מקפיא עליון, תחתון או ארבע דלתות לפי הרגלי קנייה וגובה המשתמשים." },
      { title: "נפח אמיתי", text: "משווים את חלוקת המדפים והמגירות ולא רק את מספר הליטרים הכולל." },
    ],
  },
  "washing-machines": {
    singular: "מכונת כביסה",
    headlineNoun: "מכונות כביסה",
    intro: "קיבולת היא רק חלק מהבחירה. עומק המכונה, כיוון פתיחת הדלת, סוג הפתח והיכולת להעמיד מייבש מעליה קובעים אם הדגם באמת מתאים לחדר הכביסה.",
    points: [
      { title: "קיבולת", text: "6–8 ק״ג מתאימים לשימוש קל עד בינוני; משפחה או כביסת מצעים תכופה עשויות להצדיק 9 ק״ג ומעלה." },
      { title: "מידות בפועל", text: "בודקים עומק כולל דלת וחיבורים, ולא מסתפקים ברוחב הסטנדרטי." },
      { title: "תוכניות שימושיות", text: "נותנים עדיפות לתוכנית קצרה, עדינה או היגיינית רק אם היא מתאימה להרגלי הכביסה בבית." },
    ],
  },
  dishwashers: {
    singular: "מדיח כלים",
    headlineNoun: "מדיחי כלים",
    intro: "הבחירה הראשונה במדיח היא סוג ההתקנה: רגיל, חצי אינטגרלי או אינטגרלי מלא. אחר כך בודקים רוחב, סידור סלסלות, רמת רעש ותוכניות שמשרתות את השימוש היומיומי.",
    points: [
      { title: "סוג חזית", text: "מדיח אינטגרלי דורש חזית נגרות מתאימה; מדיח רגיל מגיע עם חזית מוכנה." },
      { title: "סלסלות וקיבולת", text: "בודקים מקום לסירים, כוסות גבוהות וסכו״ם לפי הכלים שבאמת משתמשים בהם." },
      { title: "חיבורים ורעש", text: "מאמתים נקודות מים וניקוז; במטבח פתוח נותנים משקל גם לנתון הרעש." },
    ],
  },
  ovens: {
    singular: "תנור בנוי",
    headlineNoun: "תנורי",
    intro: "תנור בנוי צריך להתאים לנישה, לתשתית החשמל ולסגנון האפייה. נפח התא, טורבו, מסילות וניקוי עצמי משפיעים יותר ממספר התוכניות לבדו.",
    points: [
      { title: "מידות ואוורור", text: "בודקים מידות נישה ודרישות אוורור בשרטוט ההתקנה של הדגם." },
      { title: "אפייה וניקוי", text: "למאפים בכמה מפלסים בודקים פיזור אוויר; לשימוש תכוף שוקלים ניקוי פירוליטי או קטליטי." },
      { title: "נוחות ובטיחות", text: "מסילות טלסקופיות, דלת קרה וממשק ברור חשובים יותר בבית שמבשל הרבה." },
    ],
  },
  cooktops: {
    singular: "כיריים",
    headlineNoun: "כיריים",
    intro: "כיריים נבחרות לפי תשתית, מידת החיתוך והרגלי הבישול. בגז נדרשת התקנת טכנאי מוסמך; באינדוקציה צריך לבדוק את אספקת החשמל ואת התאמת הסירים.",
    points: [
      { title: "חיתוך בשיש", text: "המידה החיצונית אינה מספיקה — משווים את מידת החיתוך לדגם הקיים." },
      { title: "חשמל או גז", text: "בודקים חיבור חד-פאזי או תלת-פאזי באינדוקציה, ותשתית גז תקנית בכיריים גז." },
      { title: "מרווח לסירים", text: "מי שמבשל בכמה סירים יחד צריך לבחון רוחב ופריסת אזורי הבישול." },
    ],
  },
  microwaves: {
    singular: "מיקרוגל",
    headlineNoun: "מיקרוגלים",
    intro: "במיקרוגל בודקים קודם את המידות החיצוניות ואת הכלי הגדול ביותר שצריך להיכנס. נפח, צלחת מסתובבת, תא שטוח וגריל משפיעים על השימוש יותר ממספר התוכניות.",
    points: [
      { title: "נפח ומידות", text: "משווים גם את רוחב ועומק התא, במיוחד אם משתמשים בצלחות גדולות או כלים מרובעים." },
      { title: "רגיל או גריל", text: "גריל מוסיף השחמה; לחימום והפשרה בלבד אין צורך לשלם עליו בהכרח." },
      { title: "מיקום ואוורור", text: "משאירים מרווחים לפי הוראות היצרן ולא מכניסים דגם שולחני לנישה סגורה שלא תוכננה עבורו." },
    ],
  },
  blenders: {
    singular: "בלנדר",
    headlineNoun: "בלנדרים",
    intro: "בלנדר מוט ובלנדר על כן פותרים צרכים שונים. בוחרים לפי מרקם המזון, גודל המנה, הספק, נוחות הניקוי והאביזרים שמגיעים בערכה.",
    points: [
      { title: "סוג המכשיר", text: "מוט מתאים לעבודה בסיר ולמנות קטנות; בלנדר על כן מתאים לכמויות ולשייקים." },
      { title: "הספק ולהבים", text: "מרכיבים קשים דורשים יותר כוח, אך גם מבנה הלהב והכלי משפיעים על התוצאה." },
      { title: "אביזרים", text: "קוצץ, מטרפה וכוס מדידה יכולים להפוך ערכה אחת לשימושית יותר מדגם חזק אך בסיסי." },
    ],
  },
  "robot-vacuums": {
    singular: "שואב רובוטי",
    headlineNoun: "שואבים רובוטיים",
    intro: "בשואב רובוטי חשוב לבחון את הבית כמערכת: סוג רצפה, שטיחים, שיער בעלי חיים, כבלים וספים. ניווט, תחנה ותחזוקה חשובים לא פחות מעוצמת השאיבה.",
    points: [
      { title: "שאיבה ושטיפה", text: "בודקים הרמת מטליות על שטיח, טיפול בקצוות ושיטת ניקוי המטליות בתחנה." },
      { title: "ניווט ומכשולים", text: "בבית עמוס חפצים נותנים משקל לזיהוי כבלים, צעצועים ורהיטים נמוכים." },
      { title: "תחזוקה", text: "משווים ריקון אבק, מילוי מים, ייבוש מטליות ועלות חלקים מתכלים לאורך זמן." },
    ],
  },
  "vacuum-cleaners": {
    singular: "שואב אבק",
    headlineNoun: "שואבי אבק",
    intro: "בשואב אלחוטי הנוחות היומיומית חשובה כמו העוצמה. משקל ביד, זמן עבודה, ראשי ניקוי ותחזוקת המסננים קובעים אם המכשיר ישמש אתכם באופן קבוע.",
    points: [
      { title: "סוגי רצפה", text: "בודקים התאמה לפרקט, שטיחים ושיער בעלי חיים ואת האביזרים שמגיעים בערכה." },
      { title: "סוללה ומשקל", text: "משווים זמן עבודה במצב הרגיל ואת משקל היחידה בזמן ניקוי ממושך." },
      { title: "שאיבה או שטיפה", text: "ראש שטיפה מוסיף יכולת, אבל גם ניקוי ותחזוקה; לא כל בית זקוק לכך." },
    ],
  },
  "coffee-machines": {
    singular: "מכונת קפה",
    headlineNoun: "מכונות קפה",
    intro: "סוג הקפה קובע את המכונה: קפסולות לנוחות ועקביות, פולים לשליטה וטריות, ומערכת חלב למי שמכין קפוצ׳ינו ומשקאות חלב לעיתים קרובות.",
    points: [
      { title: "קפסולות או פולים", text: "משווים נוחות ועלות שוטפת מול שליטה בטחינה ובטעם." },
      { title: "חלב", text: "מקציף נפרד פשוט לניקוי; מערכת משולבת נוחה יותר להכנת משקאות בלחיצה." },
      { title: "מקום ותחזוקה", text: "בודקים רוחב, גובה, גישה למיכל מים ותדירות ניקוי והסרת אבנית." },
    ],
  },
  irons: {
    singular: "מגהץ",
    headlineNoun: "מגהצי",
    intro: "סוג המגהץ צריך להתאים לכמות ולסוג הבגדים. מגהץ רגיל קומפקטי, מחולל קיטור מיועד לרצף עבודה ארוך, ומגהץ אנכי מתאים לריענון בגדים תלויים.",
    points: [
      { title: "כמות גיהוץ", text: "לערימות גדולות בודקים מיכל ורצף אדים; לשימוש קצר מעדיפים חימום מהיר ואחסון קל." },
      { title: "לחץ ורצף אדים", text: "במחולל קיטור משווים לחץ באר ורצף אדים, לא רק הספק חשמלי." },
      { title: "אבנית ובטיחות", text: "מנגנון ניקוי אבנית וכיבוי אוטומטי מקלים על תחזוקה ושימוש יומיומי." },
    ],
  },
  "grill-pans": {
    singular: "מכשיר גריל",
    headlineNoun: "מכשירי גריל",
    intro: "בגריל חשמלי בוחרים לפי כמות הסועדים, שטח העבודה, סוגי התוכניות ומקום השימוש. דגם גדול יותר דורש גם יותר מקום על השיש ובאחסון.",
    points: [
      { title: "גודל וקיבולת", text: "משווים את שטח הצלייה בפועל למספר המנות שמכינים בדרך כלל." },
      { title: "פנים או חוץ", text: "פועלים לפי הוראות הדגם; פונקציית עישון עשויה לחייב שימוש חיצוני מאוורר." },
      { title: "ניקוי ואחסון", text: "חלקים נשלפים, מגש שומן ומידות אחסון משפיעים על הנוחות אחרי הארוחה." },
    ],
  },
};

const SEARCH_PHRASE_OVERRIDES: Record<string, string[]> = {
  "electra:air-conditioners": ["מזגן אלקטרה", "מזגני אלקטרה", "מזגן אלקטרה אינוורטר", "מזגן אלקטרה 1 כ״ס"],
  "tadiran:air-conditioners": ["מזגן תדיראן", "מזגני תדיראן", "מזגן תדיראן אינוורטר", "מזגן תדיראן מומלץ"],
  "dreame:robot-vacuums": ["שואב רובוטי דרימי", "שואב שוטף Dreame", "Dreame X50", "Dreame X60"],
  "dyson:vacuum-cleaners": ["שואב אבק דייסון", "שואב Dyson אלחוטי", "Dyson V15", "שואב דייסון מומלץ"],
  "bosch:dishwashers": ["מדיח כלים בוש", "מדיח Bosch אינטגרלי", "מדיח בוש סדרה 4", "מדיח כלים בוש מומלץ"],
  "bosch:washing-machines": ["מכונת כביסה בוש", "מכונת כביסה Bosch 8 ק״ג", "מכונת כביסה בוש 9 ק״ג", "מכונת כביסה בוש מומלצת"],
  "samsung:washing-machines": ["מכונת כביסה סמסונג", "מכונת כביסה Samsung", "מכונת כביסה סמסונג 9 ק״ג", "מכונת כביסה סמסונג מומלצת"],
  "electrolux:ovens": ["תנור בנוי אלקטרולוקס", "תנור Electrolux פירוליטי", "תנור אלקטרולוקס שחור", "תנורי אלקטרולוקס"],
  "delonghi:coffee-machines": ["מכונת קפה דלונגי", "מכונת קפה DeLonghi", "דלונגי Lattissima", "מכונת נספרסו דלונגי"],
  "lg:tvs": ["טלוויזיה LG", "טלוויזיית LG 65 אינץ׳", "LG OLED", "טלוויזיות LG"],
  "samsung:tvs": ["טלוויזיה סמסונג", "טלוויזיית Samsung 65", "Samsung QLED", "טלוויזיות סמסונג"],
  "tcl:tvs": ["טלוויזיה TCL", "טלוויזיית TCL 65", "TCL QLED", "טלוויזיה TCL חוות דעת"],
  "sharp:refrigerators": ["מקרר שארפ", "מקרר Sharp 4 דלתות", "מקרר שארפ מקפיא תחתון", "מקררי שארפ"],
  "samsung:refrigerators": ["מקרר סמסונג", "מקרר Samsung 4 דלתות", "מקרר סמסונג מקפיא תחתון", "מקררי סמסונג"],
  "tefal:irons": ["מגהץ טפאל", "מגהץ קיטור Tefal", "מגהץ אדים טפאל", "מגהץ קיטור טפאל מומלץ"],
  "ninja:grill-pans": ["נינג׳ה גריל", "Ninja Grill Max", "נינג׳ה גריל XL", "נינג׳ה גריל מומלץ"],
  "samsung:microwaves": ["מיקרוגל סמסונג", "מיקרוגל Samsung 23 ליטר", "מיקרוגלים סמסונג", "מיקרוגל דיגיטלי סמסונג"],
  "sharp:microwaves": ["מיקרוגל שארפ", "מיקרוגל Sharp עם גריל", "מיקרוגל שארפ ללא צלחת", "מיקרוגלים שארפ"],
  "braun:blenders": ["בלנדר מוט בראון", "Braun MultiQuick", "Braun Minipimer", "בלנדר בראון מומלץ"],
};

export function brandCategoryKey(brandSlug: string, categorySlug: string): string {
  return `${brandSlug}:${categorySlug}`;
}

export function getBrandCategoryPriority(brandSlug: string, categorySlug: string): number {
  const index = BRAND_CATEGORY_PRIORITY_KEYS.indexOf(
    brandCategoryKey(brandSlug, categorySlug) as (typeof BRAND_CATEGORY_PRIORITY_KEYS)[number]
  );
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export function getBrandCategoryBuyingGuide(categorySlug: string): BrandCategoryBuyingGuide | null {
  return CATEGORY_GUIDES[categorySlug] ?? null;
}

export function buildBrandCategoryPresentation(params: {
  brand: string;
  brandSlug: string;
  category: string;
  categorySlug: string;
  productCount: number;
}): BrandCategoryPresentation {
  const guide = getBrandCategoryBuyingGuide(params.categorySlug);
  const brandSearchName = BRAND_SEARCH_NAMES[params.brandSlug] ?? params.brand;
  const headlineNoun = guide?.headlineNoun ?? params.category;
  const singular = guide?.singular ?? params.category;
  const headline = `${headlineNoun} ${brandSearchName}`;
  const key = brandCategoryKey(params.brandSlug, params.categorySlug);
  const searchPhrases = SEARCH_PHRASE_OVERRIDES[key] ?? [
    `${singular} ${brandSearchName}`,
    `${headline}`,
    `כל דגמי ${singular} ${brandSearchName}`,
    `${singular} ${brandSearchName} מומלץ`,
  ];

  return {
    brandSearchName,
    headline,
    seoTitle: `${headline} — דגמים, השוואה והצעת מחיר`,
    seoDescription: `השוו בין ${params.productCount} דגמי ${headline} בקטלוג חדד יובל אלקטריק: מפרטים, זמינות, מדריך בחירה, ייעוץ והצעת מחיר עם משלוח והתקנה בצפון.`,
    searchPhrases,
  };
}
