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
