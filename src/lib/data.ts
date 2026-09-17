export type Property = {
  id: string;
  title: string;
  village: string;
  city: string;
  basin: string;
  plot: string;
  area: number;
  pricePerM: number;
  price: number;
  zoning: string;
  type: "أرض" | "فيلا" | "شقة" | "مشروع";
  image: string;
  features: string[];
  growth: number;
  liquidity: number;
  services: number;
  summary: string;
  coordinates: string;
};

export const PROPERTIES: Property[] = [
  {
    id: "abdoun-villa",
    title: "فيلا مستقلة – عبدون",
    village: "عبدون",
    city: "عمّان",
    basin: "حوض 12 أم أذينة الغربي",
    plot: "482",
    area: 620,
    pricePerM: 1450,
    price: 899000,
    zoning: "سكن أ",
    type: "فيلا",
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
    features: ["تشطيب سوبر ديلوكس", "مسبح خارجي", "حديقة 180م²", "مصعد داخلي"],
    growth: 12,
    liquidity: 86,
    services: 94,
    summary: "أصل سكني راقٍ في أعلى مناطق الطلب بعمّان، مناسب للسكن العائلي أو التأجير الفاخر.",
    coordinates: "31.9454, 35.8965",
  },
  {
    id: "dabouq-land",
    title: "أرض سكنية – دابوق",
    village: "دابوق",
    city: "عمّان",
    basin: "حوض 4 الرونق",
    plot: "1178",
    area: 1000,
    pricePerM: 520,
    price: 520000,
    zoning: "سكن ب خاص",
    type: "أرض",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    features: ["شارعان", "إطلالة مفتوحة", "خدمات واصلة", "قابلة للتقسيم"],
    growth: 17,
    liquidity: 72,
    services: 81,
    summary: "فرصة استثمارية للتطوير السكني منخفض الكثافة مع نمو سعري متوقع خلال 24 شهراً.",
    coordinates: "31.9899, 35.8074",
  },
  {
    id: "zarqa-apartment",
    title: "شقة استثمارية – الزرقاء الجديدة",
    village: "الزرقاء الجديدة",
    city: "الزرقاء",
    basin: "حوض 7 الحلابات",
    plot: "233",
    area: 165,
    pricePerM: 430,
    price: 71000,
    zoning: "سكن ج",
    type: "شقة",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    features: ["3 غرف نوم", "طابق ثاني", "قرب الخدمات", "مردود إيجاري 8%"],
    growth: 9,
    liquidity: 68,
    services: 76,
    summary: "أفضل مردود إيجاري في المحفظة، مناسبة للمستثمر الباحث عن دخل شهري ثابت.",
    coordinates: "32.0728, 36.0876",
  },
  {
    id: "irbid-project",
    title: "مشروع تجاري – إربد وسط",
    village: "إربد الوسط",
    city: "إربد",
    basin: "حوض 2 البارحة",
    plot: "96",
    area: 480,
    pricePerM: 980,
    price: 470000,
    zoning: "تجاري محلي",
    type: "مشروع",
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    features: ["واجهة تجارية 22م", "3 طوابق مرخصة", "موقف سيارات", "عقود تأجير جاهزة"],
    growth: 14,
    liquidity: 61,
    services: 88,
    summary: "أصل مُدرّ للدخل في قلب إربد التجاري مع ترخيص بناء ساري وإمكانية توسعة طابقية.",
    coordinates: "32.5486, 35.8519",
  },
];

export type FeaturedPlot = {
  id: string;
  name: string;
  plot: string;
  area: number;
  areaText: string;
  slope: string;
  score: number;
  cardScenarios: string[];
  coordinates: string;
  pricePerM: number;
  marketAverage: number;
  total: number;
  zoning: string;
  subScores: { label: string; value: number }[];
  regulatory: { label: string; value: string }[];
  investmentScenarios: {
    name: string;
    stats: { label: string; value: string }[];
  }[];
  recommendation: string;
  strengths: string[];
  cautions: string[];
  similar: { name: string; area: string; pricePerM: string; total: string; score: number }[];
};

const DEFAULT_SUB_SCORES = [
  { label: "الموقع والإمكانية الجغرافية", value: 92 },
  { label: "مؤشرات التطوير العمراني", value: 85 },
  { label: "الجدوى الاستثمارية", value: 84 },
  { label: "النمو العمراني المتوقع", value: 92 },
  { label: "قرب الخدمات والمرافق", value: 78 },
];

const DEFAULT_REGULATORY = [
  { label: "نوع التنظيم", value: "سكن أخضر - أحكام خاصة" },
  { label: "نسبة البناء", value: "40%" },
  { label: "معامل الاستغلال (FAR)", value: "80%" },
  { label: "عدد الأدوار المسموحة", value: "2" },
  { label: "الارتفاع الأقصى", value: "9 م" },
  { label: "الارتداد الأمامي", value: "5 م" },
  { label: "الارتداد الجانبي", value: "3 م" },
  { label: "الارتداد الخلفي", value: "4 م" },
  { label: "الحد الأدنى للفرز", value: "1,200 م²" },
  { label: "الحد الأدنى للمسطح الأخضر", value: "35%" },
];

const DEFAULT_INVESTMENT_SCENARIOS = [
  {
    name: "فيلا عائلية",
    stats: [
      { label: "مساحة البناء المتوقعة", value: "340 م²" },
      { label: "تكلفة الإنشاء", value: "119,000 JOD" },
      { label: "الإيرادات السنوية", value: "32,640 JOD" },
      { label: "التكلفة الإجمالية", value: "221,000 JOD" },
      { label: "العائد على الاستثمار", value: "14.8%" },
      { label: "الجدول الزمني", value: "18-24 شهراً" },
    ],
  },
  {
    name: "مشروع استثماري",
    stats: [
      { label: "مساحة البناء المتوقعة", value: "760 م²" },
      { label: "تكلفة الإنشاء", value: "266,000 JOD" },
      { label: "الإيرادات السنوية", value: "48,000 JOD" },
      { label: "التكلفة الإجمالية", value: "381,000 JOD" },
      { label: "العائد على الاستثمار", value: "12.6%" },
      { label: "الجدول الزمني", value: "24-30 شهراً" },
    ],
  },
  {
    name: "منتجع سياحي",
    stats: [
      { label: "مساحة البناء المتوقعة", value: "620 م²" },
      { label: "تكلفة الإنشاء", value: "248,000 JOD" },
      { label: "الإيرادات السنوية", value: "54,400 JOD" },
      { label: "التكلفة الإجمالية", value: "396,000 JOD" },
      { label: "العائد على الاستثمار", value: "13.7%" },
      { label: "الجدول الزمني", value: "20-28 شهراً" },
    ],
  },
];

export const FEATURED_PLOTS: FeaturedPlot[] = [
  {
    id: "101",
    name: "الحديب",
    plot: "101",
    area: 3105.6,
    areaText: "3,105.6 م²",
    slope: "انحدار 24م",
    score: 86,
    cardScenarios: ["فيلا سكنية", "مشروع تجاري", "منتجع سياحي"],
    coordinates: "31.9364, 35.8898",
    pricePerM: 120,
    marketAverage: 140,
    total: 372672,
    zoning: "سكن أخضر - أحكام خاصة",
    subScores: DEFAULT_SUB_SCORES,
    regulatory: DEFAULT_REGULATORY,
    investmentScenarios: DEFAULT_INVESTMENT_SCENARIOS,
    recommendation:
      "تحصل قطعة الحديب على تقييم قوي بفضل موقعها المرتفع ومساحتها القابلة للتطوير، مع سعر أقل من متوسط المنطقة بنسبة واضحة. أفضل استخدام مبدئي هو فيلا عائلية عالية الخصوصية أو مشروع ضيافة صغير بعد التحقق الميداني من الخدمات.",
    strengths: ["موقع استراتيجي متميز 92/100", "جدوى استثمارية عالية 84/100", "مؤشرات تطوير قوية 85/100"],
    cautions: ["يُنصح بالتحقق الميداني من شبكات البنية التحتية"],
    similar: [
      { name: "السويسة", area: "9,600 م²", pricePerM: "132 JOD", total: "1,267,200 JOD", score: 90 },
      { name: "أم الأسود", area: "8,600 م²", pricePerM: "118 JOD", total: "1,014,800 JOD", score: 85 },
      { name: "البصّة", area: "1,288 م²", pricePerM: "105 JOD", total: "135,240 JOD", score: 78 },
    ],
  },
  {
    id: "392",
    name: "السويسة",
    plot: "392",
    area: 9600,
    areaText: "9,600 م²",
    slope: "انحدار 4م",
    score: 90,
    cardScenarios: ["مجمع سكني", "مشروع استثماري", "فندق"],
    coordinates: "31.9615, 35.8529",
    pricePerM: 132,
    marketAverage: 150,
    total: 1267200,
    zoning: "سكن أخضر - أحكام خاصة",
    subScores: DEFAULT_SUB_SCORES.map((s) => ({ ...s, value: Math.min(96, s.value + 3) })),
    regulatory: DEFAULT_REGULATORY,
    investmentScenarios: DEFAULT_INVESTMENT_SCENARIOS,
    recommendation:
      "السويسة هي أعلى القطع تقييماً في المجموعة بسبب المساحة الكبيرة والانحدار المحدود، ما يرفع مرونة التخطيط لمجمع سكني أو مشروع استثماري متوسط الحجم.",
    strengths: ["مساحة تطوير كبيرة 94/100", "انحدار منخفض يدعم كلفة إنشائية أفضل", "جدوى استثمارية عالية 87/100"],
    cautions: ["يفضل تدقيق حدود التنظيم قبل اعتماد تصميم متعدد الوحدات"],
    similar: [
      { name: "الحديب", area: "3,105.6 م²", pricePerM: "120 JOD", total: "372,672 JOD", score: 86 },
      { name: "أم الأسود", area: "8,600 م²", pricePerM: "118 JOD", total: "1,014,800 JOD", score: 85 },
      { name: "البصّة", area: "1,288 م²", pricePerM: "105 JOD", total: "135,240 JOD", score: 78 },
    ],
  },
  {
    id: "166",
    name: "أم الأسود",
    plot: "166",
    area: 8600,
    areaText: "8,600 م²",
    slope: "انحدار 11م",
    score: 85,
    cardScenarios: ["فيلا عائلية", "مشروع استثماري", "مزرعة سياحية"],
    coordinates: "31.9148, 35.8347",
    pricePerM: 118,
    marketAverage: 136,
    total: 1014800,
    zoning: "سكن أخضر - أحكام خاصة",
    subScores: DEFAULT_SUB_SCORES,
    regulatory: DEFAULT_REGULATORY,
    investmentScenarios: DEFAULT_INVESTMENT_SCENARIOS,
    recommendation:
      "أم الأسود مناسبة للمستثمر الذي يوازن بين المساحة والسعر، وتظهر مؤشرات جيدة لمشروع منخفض الكثافة مع قابلية تحسين القيمة عبر تصميم يستفيد من طبيعة الأرض.",
    strengths: ["مساحة كبيرة قابلة للتقسيم", "سعر متر منافس", "قرب مقبول من الخدمات الرئيسية"],
    cautions: ["تحتاج مراجعة تفصيلية للانحدار قبل تقدير كلف التسوية"],
    similar: [
      { name: "السويسة", area: "9,600 م²", pricePerM: "132 JOD", total: "1,267,200 JOD", score: 90 },
      { name: "الحديب", area: "3,105.6 م²", pricePerM: "120 JOD", total: "372,672 JOD", score: 86 },
      { name: "البصّة", area: "1,288 م²", pricePerM: "105 JOD", total: "135,240 JOD", score: 78 },
    ],
  },
  {
    id: "528",
    name: "البصّة",
    plot: "528",
    area: 1288,
    areaText: "1,288 م²",
    slope: "انحدار 8م",
    score: 78,
    cardScenarios: ["فيلا عائلية", "شاليه خاص", "استثمار قصير"],
    coordinates: "31.8896, 35.8714",
    pricePerM: 105,
    marketAverage: 122,
    total: 135240,
    zoning: "سكن أخضر - أحكام خاصة",
    subScores: DEFAULT_SUB_SCORES.map((s) => ({ ...s, value: Math.max(70, s.value - 7) })),
    regulatory: DEFAULT_REGULATORY,
    investmentScenarios: DEFAULT_INVESTMENT_SCENARIOS,
    recommendation:
      "البصّة خيار أصغر وأكثر مرونة للدخول الاستثماري، وتناسب بناء فيلا أو شاليه خاص مع عائد جيد إذا تم ضبط كلفة الإنشاء ومراجعة توفر الخدمات.",
    strengths: ["سعر إجمالي منخفض نسبياً", "مناسبة لبناء خاص سريع", "فرصة تحسين بالقيمة بعد التطوير"],
    cautions: ["درجة القرب من الخدمات أقل من القطع الأكبر ويجب التحقق منها ميدانياً"],
    similar: [
      { name: "الحديب", area: "3,105.6 م²", pricePerM: "120 JOD", total: "372,672 JOD", score: 86 },
      { name: "أم الأسود", area: "8,600 م²", pricePerM: "118 JOD", total: "1,014,800 JOD", score: 85 },
      { name: "السويسة", area: "9,600 م²", pricePerM: "132 JOD", total: "1,267,200 JOD", score: 90 },
    ],
  },
];

export type BuyerProfile = {
  budget: number;
  areas: string[];
  familySize: number;
  goal: "سكن" | "استثمار" | "تطوير";
  favorites: string[];
  searches: string[];
};

export const DEFAULT_BUYER: BuyerProfile = {
  budget: 600000,
  areas: [],
  familySize: 4,
  goal: "سكن",
  favorites: [],
  searches: [],
};

export function matchScore(p: Property, profile: BuyerProfile) {
  let score = 42;
  const ratio = p.price / Math.max(profile.budget, 1);
  if (ratio <= 1) score += 26 - Math.round(Math.abs(1 - ratio) * 10);
  else score -= Math.min(30, Math.round((ratio - 1) * 40));

  if (profile.areas.length === 0 || profile.areas.some((a) => p.village.includes(a) || p.city.includes(a)))
    score += 12;

  if (profile.goal === "استثمار") score += Math.round(p.growth * 0.9 + p.liquidity * 0.12);
  if (profile.goal === "سكن") score += Math.round(p.services * 0.18 + (p.type === "فيلا" || p.type === "شقة" ? 8 : 0));
  if (profile.goal === "تطوير") score += Math.round(p.area / 60) + (p.type === "أرض" ? 10 : 0);

  if (profile.familySize >= 5 && p.area >= 500) score += 6;
  if (profile.familySize <= 3 && p.area <= 200) score += 5;
  if (profile.favorites.includes(p.id)) score += 5;
  if (profile.searches.some((s) => s && (p.title.includes(s) || p.village.includes(s)))) score += 4;

  return Math.max(18, Math.min(99, score));
}

export function matchReasons(p: Property, profile: BuyerProfile) {
  const out: string[] = [];
  if (p.price <= profile.budget) out.push("داخل حدود ميزانيتك");
  else out.push(`أعلى من ميزانيتك بـ ${fmt(p.price - profile.budget)} د.أ`);
  if (profile.goal === "استثمار") out.push(`نمو سنوي متوقع ${p.growth}%`);
  if (profile.goal === "سكن") out.push(`مؤشر خدمات ${p.services}/100`);
  if (profile.goal === "تطوير") out.push(`مساحة قابلة للتطوير ${p.area}م²`);
  if (profile.familySize >= 5 && p.area >= 500) out.push("مساحة مناسبة لعائلة كبيرة");
  if (profile.areas.some((a) => p.village.includes(a) || p.city.includes(a)))
    out.push("في منطقة تفضيلك");
  return out.slice(0, 4);
}

export function fmt(n: number) {
  return new Intl.NumberFormat("ar-JO", { maximumFractionDigits: 0 }).format(n);
}

export function analyze(p: Property) {
  const fair = Math.round(p.pricePerM * (1 + p.growth / 120));
  const verdict = p.pricePerM <= fair ? "سعر عادل أو أقل من السوق" : "أعلى قليلاً من التقدير العادل";
  return {
    fairPricePerM: fair,
    fairTotal: fair * p.area,
    verdict,
    roi: Number((p.growth * 0.72 + p.liquidity * 0.04).toFixed(1)),
    holdYears: p.type === "أرض" ? 3 : 5,
    risk: p.liquidity > 75 ? "منخفض" : p.liquidity > 65 ? "متوسط" : "مرتفع",
    timeToSell: p.liquidity > 80 ? "‏4-6 أسابيع" : p.liquidity > 68 ? "‏2-3 أشهر" : "‏4-6 أشهر",
  };
}
