import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpLeft, BadgeCheck, Heart, MapPin, Mountain, Ruler, Search, SearchX, Send, Share2, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  EmptyState,
  ErrorNote,
  GlassCard,
  GoldButton,
  SectionTitle,
  SiteFooter,
  SiteHeader,
  Skeleton,
} from "@/components/ui-kit";
import { askAdvisor } from "@/lib/ai.functions";
import {
  DEFAULT_BUYER,
  FEATURED_PLOTS,
  PROPERTIES,
  SELLER_DRAFT_STORAGE_KEY,
  areaListingCount,
  areaMatchPercent,
  findSearchAreas,
  getSearchArea,
  fmt,
  matchReasons,
  matchScore,
  nearbyAlternatives,
  normalizeArabic,
  recommendAreas,
  smartPropertyScore,
  type BuyerProfile,
  type Property,
  type SellerDraftProperty,
} from "@/lib/data";

export const Route = createFileRoute("/buyer")({
  head: () => ({
    meta: [
      { title: "بوابة المشتري | عقاري AI" },
      {
        name: "description",
        content:
          "ابحث أو حاور المستشار العقاري الذكي، وشاهد العقارات مرتبة بدرجة مطابقة تناسب ميزانيتك ومنطقتك وهدفك.",
      },
      { property: "og:title", content: "بوابة المشتري | عقاري AI" },
      {
        property: "og:description",
        content: "توصيات عقارية مخصصة بدرجة مطابقة 0-100 ومستشار ذكي بدون نماذج تعبئة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BuyerPortal,
});

type Msg = { role: "user" | "assistant"; text: string };

type AreaCard = {
  name: string;
  demand: string;
  activity: string;
  avgPricePerM: number;
  newProjects: string;
  match: number;
  reason: string;
};

function BuyerPortal() {
  const advisor = useServerFn(askAdvisor);
  const [profile, setProfile] = useState<BuyerProfile>(DEFAULT_BUYER);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "مرحباً! أخبرني عن ميزانيتك والمنطقة التي تفضلها وهدفك (سكن أو استثمار) وسأرشّح لك الأنسب من العقارات المتاحة.",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [sellerDraft, setSellerDraft] = useState<SellerDraftProperty | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SELLER_DRAFT_STORAGE_KEY);
      setSellerDraft(raw ? (JSON.parse(raw) as SellerDraftProperty) : null);
    } catch {
      setSellerDraft(null);
    }
  }, []);

  const conversationText = useMemo(
    () => `${query} ${input} ${messages.map((m) => m.text).join(" ")}`,
    [input, messages, query],
  );

  const recommendedAreas = useMemo<AreaCard[]>(() => {
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      const hit = findSearchAreas(trimmed, 1)[0];
      if (hit) {
        const main: AreaCard = {
          name: hit.name,
          demand: hit.demand,
          activity: hit.activity,
          avgPricePerM: hit.avgPricePerM,
          newProjects: hit.newProjects,
          match: areaMatchPercent(hit.name, profile),
          reason: `نتائج البحث: ${hit.note}`,
        };
        const alts: AreaCard[] = nearbyAlternatives(hit.name, profile).map((alt) => {
          const area = getSearchArea(alt.name);
          return {
            name: alt.name,
            demand: area?.demand ?? "طلب متوسط",
            activity: area?.activity ?? "متوسطة",
            avgPricePerM: alt.avgPricePerM,
            newProjects: area?.newProjects ?? "مشاريع متنوعة",
            match: alt.match,
            reason: `منطقة مجاورة: ${alt.why}`,
          };
        });
        return [main, ...alts].slice(0, 4);
      }
    }
    return recommendAreas(profile, conversationText).map((area) => ({
      name: area.name,
      demand: area.demand,
      activity: area.activity,
      avgPricePerM: area.avgPricePerM,
      newProjects: area.newProjects,
      match: area.match,
      reason: area.reason,
    }));
  }, [conversationText, profile, query]);
  const allProperties = useMemo<Property[]>(
    () => (sellerDraft ? [sellerDraft, ...PROPERTIES] : PROPERTIES),
    [sellerDraft],
  );

  const ranked = useMemo(() => {
    const raw = query.trim();
    const q = normalizeArabic(raw);
    return allProperties
      .filter(
        (p) =>
          !q ||
          normalizeArabic(
            `${p.title} ${p.village} ${p.city} ${p.type} ${p.zoning} ${p.basin}`,
          ).includes(q),
      )
      .map((p) => ({ p, score: matchScore(p, { ...profile, searches: [raw] }) }))
      .sort((a, b) => b.score - a.score);
  }, [allProperties, profile, query]);

  const suggestions = useMemo(() => findSearchAreas(query), [query]);
  const searchedArea = useMemo(
    () => findSearchAreas(query, 1)[0]?.name ?? query.trim(),
    [query],
  );
  const alternatives = useMemo(() => nearbyAlternatives(searchedArea, profile), [profile, searchedArea]);

  const toggleFav = (id: string) =>
    setProfile((pr) => ({
      ...pr,
      favorites: pr.favorites.includes(id)
        ? pr.favorites.filter((f) => f !== id)
        : [...pr.favorites, id],
    }));

  const toggleArea = (a: string) =>
    setProfile((pr) => ({
      ...pr,
      areas: pr.areas.includes(a) ? pr.areas.filter((x) => x !== a) : [...pr.areas, a],
    }));

  async function send() {
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");
    setChatError(null);
    const history = messages.slice(-8);
    setMessages((m) => [...m, { role: "user", text }]);
    setThinking(true);
    try {
      const { reply, preferences } = await advisor({
        data: {
          message: text,
          history,
          catalog: [
            ...allProperties.map(
            (p) =>
              `${p.title} | ${p.village}-${p.city} | ${p.type} | ${p.area}م² | ${p.price} د.أ | تنظيم ${p.zoning} | نمو ${p.growth}%`,
            ),
            ...FEATURED_PLOTS.map(
              (p) =>
                `قطعة ${p.name} ${p.plot} | أرض | ${p.areaText} | ${p.total} د.أ | ${p.pricePerM} د.أ/م² | Smart Score ${p.score} | ${p.zoning}`,
            ),
            `مناطق ذكية مقترحة الآن: ${recommendedAreas.map((a) => `${a.name} مطابقة ${a.match}% وسعر ${a.avgPricePerM} د.أ/م²`).join("؛ ")}`,
          ].join("\n"),
          profile: `الميزانية: ${profile.budget} د.أ | المناطق: ${
            profile.areas.join("، ") || "غير محددة"
          } | أفراد العائلة: ${profile.familySize} | الهدف: ${profile.goal} | النوع: ${profile.propertyType || "غير محدد"} | المساحة الدنيا: ${profile.minArea || "غير محددة"} | الغرف: ${profile.rooms || "غير محددة"} | المفضلة: ${
            profile.favorites.join("، ") || "لا شيء"
          }`,
        },
      });
      setProfile((current) => ({
        ...current,
        budget: preferences.budget ?? current.budget,
        areas: preferences.areas.length ? preferences.areas : current.areas,
        familySize: preferences.familySize ?? current.familySize,
        goal: preferences.goal ?? current.goal,
        propertyType: preferences.propertyType ?? current.propertyType,
        minArea: preferences.minArea ?? current.minArea,
        rooms: preferences.rooms ?? current.rooms,
        garden: preferences.garden ?? current.garden,
        balcony: preferences.balcony ?? current.balcony,
        parking: preferences.parking ?? current.parking,
      }));
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (e) {
      setChatError(e instanceof Error ? e.message : "تعذر الاتصال بالمستشار.");
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        <SectionTitle
          eyebrow="بوابة المشتري"
          title="ابحث أو حاور المستشار الذكي"
          desc="نرتّب العقارات حسب درجة مطابقتها لميزانيتك ومنطقتك وهدفك — بدون أي نماذج إدخال."
        />

        <GlassCard className="fade-up space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={(e) => {
                e.currentTarget.placeholder = "";
                setShowSuggestions(true);
              }}
              onBlur={(e) => {
                e.currentTarget.placeholder = "ابحث: عبدون، دابوق، بدر الجديدة، أرض…";
                window.setTimeout(() => setShowSuggestions(false), 150);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") setShowSuggestions(false);
                if (e.key === "Escape") setShowSuggestions(false);
              }}
              placeholder="ابحث: عبدون، دابوق، بدر الجديدة، أرض…"
              className="w-full rounded-xl border border-input bg-background/40 px-4 py-3 pe-10 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/25"
            />
            {showSuggestions && suggestions.length > 0 ? (
              <ul className="glass-strong absolute inset-x-0 top-[calc(100%+0.4rem)] z-30 overflow-hidden rounded-xl border border-primary/30 py-1 text-sm shadow-2xl">
                {suggestions.map((area) => (
                  <li key={area.name}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setQuery(area.name);
                        setProfile((pr) => ({
                          ...pr,
                          areas: pr.areas.includes(area.name) ? pr.areas : [...pr.areas, area.name],
                        }));
                        setShowSuggestions(false);
                      }}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-start transition hover:bg-primary/12"
                    >
                      <span className="flex items-center gap-2 font-bold">
                        <MapPin className="size-3.5 text-primary" /> {area.name}
                        <span className="text-[11px] font-normal text-muted-foreground">{area.city}</span>
                      </span>
                      <span className="text-[11px] font-bold text-primary">
                        {fmt(areaListingCount(area.name))} عقار · {fmt(area.avgPricePerM)} د.أ/م²
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="rounded-xl border border-border bg-background/25 p-4">
            <p className="mb-3 text-xs text-muted-foreground">اذكر ميزانيتك والمنطقة ونوع العقار والمساحة والغرف والحديقة والشرفة والموقف بطريقتك.</p>
            <div className="max-h-64 space-y-3 overflow-y-auto pe-1">
              {messages.map((m, i) => <div key={i} className={`max-w-[88%] rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "ms-auto bg-primary/15" : "bg-background/40"}`}>{m.text}</div>)}
              {thinking ? <Skeleton className="h-12 w-2/3" /> : null}
            </div>
            {chatError ? <ErrorNote message={chatError} /> : null}
            <div className="mt-3 flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void send(); }} placeholder="مثال: أريد فيلا في دابوق بحديقة و4 غرف" className="flex-1 rounded-xl border border-input bg-background/40 px-4 py-3 text-sm outline-none focus:border-primary/70" />
              <GoldButton onClick={() => void send()} loading={thinking}><Send className="size-4" /> إرسال</GoldButton>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[`ميزانية ${fmt(profile.budget)} د.أ`, profile.goal, profile.propertyType, profile.minArea ? `${profile.minArea}م² فأكثر` : "", profile.rooms ? `${profile.rooms} غرف` : "", profile.garden ? "حديقة" : "", profile.balcony ? "شرفة" : "", profile.parking ? "موقف" : "", ...profile.areas].filter(Boolean).map((value) => (
              <span key={String(value)} className="inline-flex items-center gap-1 rounded-full border border-primary/35 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">{value}</span>
            ))}
            <button type="button" onClick={() => setProfile({ ...DEFAULT_BUYER, favorites: profile.favorites })} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground"><X className="size-3" /> مسح التفضيلات</button>
          </div>

          <div className="flex flex-wrap gap-2">
            {recommendedAreas.map((area, index) => (
              <button
                key={area.name}
                onClick={() => toggleArea(area.name)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  index === 0 ? "gold-pulse " : ""
                }${
                  profile.areas.includes(area.name)
                    ? "bg-secondary text-secondary-foreground"
                    : "border border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                {area.name} · {area.match}%
              </button>
            ))}
          </div>
        </GlassCard>

        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <MapPin className="size-5 text-primary" /> مناطق مرشحة لك
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recommendedAreas.map((area, index) => (
              <Link
                key={area.name}
                to="/area/$name"
                params={{ name: area.name }}
                className={`glass fade-up group block rounded-2xl border border-transparent p-4 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-primary/70 ${index === 0 ? "gold-pulse border-primary/45" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-1.5 text-base font-black">
                      {area.name}
                      <ArrowUpLeft className="size-4 text-primary opacity-0 transition group-hover:opacity-100" />
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{area.demand} · حركة {area.activity}</p>
                  </div>
                  <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-black text-primary-foreground">
                    مطابقة {area.match}%
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <p className="rounded-xl border border-border bg-background/30 p-2">متوسط المتر: {fmt(area.avgPricePerM)} د.أ</p>
                  <p className="rounded-xl border border-border bg-background/30 p-2">مشاريع: {area.newProjects}</p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{area.reason}</p>
                <p className="mt-2 text-xs font-bold text-primary">{fmt(areaListingCount(area.name))} عقار متاح · اضغط للتفاصيل</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="size-5 text-primary" /> القطع المميزة
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            {FEATURED_PLOTS.map((plot) => (
              <FeaturedPlotCard key={plot.id} plot={plot} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="size-5 text-primary" /> توصيات مخصصة لك
          </h2>
          {ranked.length === 0 ? (
            <GlassCard className="fade-up space-y-4">
              <EmptyState
                icon={<SearchX className="size-8" />}
                title={query.trim() ? `لا توجد نتائج في ${searchedArea}` : "لا نتائج مطابقة لبحثك"}
                desc="اخترنا لك بدائل قريبة بخصائص مشابهة، أو وسّع البحث."
                action={<GoldButton variant="outline" onClick={() => setQuery("")}>مسح البحث</GoldButton>}
              />
              <div className="grid gap-3 md:grid-cols-3">
                {alternatives.map((alt) => (
                  <Link
                    key={alt.name}
                    to="/area/$name"
                    params={{ name: alt.name }}
                    className="group rounded-2xl border border-border bg-background/30 p-4 transition hover:-translate-y-1 hover:border-primary/70"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-1.5 font-black">
                        {alt.name}
                        <ArrowUpLeft className="size-4 text-primary opacity-0 transition group-hover:opacity-100" />
                      </p>
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-black text-primary-foreground">
                        مطابقة {alt.match}%
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">لماذا نقترحها: {alt.why}</p>
                    <p className="mt-2 text-xs font-bold text-primary">
                      {fmt(alt.count)} عقار متاح · {fmt(alt.avgPricePerM)} د.أ/م²
                    </p>
                  </Link>
                ))}
              </div>
            </GlassCard>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {ranked.map(({ p, score }) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  score={score}
                  reasons={matchReasons(p, profile)}
                  fav={profile.favorites.includes(p.id)}
                  onFav={() => toggleFav(p.id)}
                  budget={profile.budget}
                />
              ))}
            </div>
          )}
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}

function FeaturedPlotCard({ plot }: { plot: (typeof FEATURED_PLOTS)[number] }) {
  return (
    <article className="glass fade-up overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1">
      <div className="aerial-placeholder relative h-44">
        <div className="absolute inset-0 bg-[color-mix(in_oklab,var(--navy-deep)_28%,transparent)]" />
        <span className="absolute end-3 top-3 rounded-full border border-primary/35 bg-primary px-3 py-1 text-xs font-black text-primary-foreground shadow-lg">
          Smart Score: {plot.score}/100
        </span>
        <span className="absolute start-3 top-3 rounded-full border border-border bg-background/55 px-3 py-1 text-xs font-black backdrop-blur">
          أرض
        </span>
        <div className="absolute bottom-4 right-4 left-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-primary">قطعة {plot.plot}</p>
            <h3 className="text-2xl font-black">{plot.name}</h3>
          </div>
          <span className="rounded-full border border-border bg-background/45 px-3 py-1 text-xs font-bold backdrop-blur">
            تحليل AqariAi
          </span>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-primary/35 bg-primary/10 p-3">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <BadgeCheck className="size-3.5 text-primary" /> سعر المتر
            </p>
            <p className="mt-1 text-base font-black text-primary">{fmt(plot.pricePerM)} د.أ/م²</p>
          </div>
          <div className="rounded-xl border border-border bg-background/30 p-3">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" /> الإجمالي
            </p>
            <p className="mt-1 text-sm font-black text-primary">{fmt(plot.total)} د.أ</p>
          </div>
          <div className="rounded-xl border border-border bg-background/30 p-3">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Ruler className="size-3.5 text-primary" /> المساحة
            </p>
            <p className="mt-1 text-sm font-black text-primary">{plot.areaText}</p>
          </div>
          <div className="rounded-xl border border-border bg-background/30 p-3">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Mountain className="size-3.5 text-primary" /> الانحدار
            </p>
            <p className="mt-1 text-sm font-black text-primary">{plot.slope}</p>
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-background/50">
          <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${plot.score}%` }} />
        </div>
        <div className="flex flex-wrap gap-2">
          {plot.cardScenarios.map((scenario) => (
            <span key={scenario} className="rounded-full border border-border bg-background/30 px-3 py-1 text-xs font-bold text-muted-foreground">
              {scenario}
            </span>
          ))}
        </div>
        <Link
          to="/property/$id"
          params={{ id: plot.id }}
          className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
        >
          تحليل العقار
        </Link>
      </div>
    </article>
  );
}

function PropertyCard({
  property: p,
  score,
  reasons,
  fav,
  onFav,
  budget,
}: {
  property: Property;
  score: number;
  reasons: string[];
  fav: boolean;
  onFav: () => void;
  budget: number;
}) {
  const smartScore = smartPropertyScore(p);
  const budgetStatus = p.price <= budget ? "داخل ميزانيتك" : `أعلى من ميزانيتك بـ ${fmt(p.price - budget)} د.أ`;
  return (
    <article className="glass fade-up overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative">
        <img src={p.image} alt={p.title} loading="lazy" className="h-44 w-full object-cover" />
        <span className="absolute end-3 top-3 rounded-full border border-primary/40 bg-primary px-3 py-1 text-xs font-black text-primary-foreground shadow-lg">
          Smart Score {smartScore}/100
        </span>
        <span className="absolute end-3 top-11 rounded-full bg-[color-mix(in_oklab,var(--navy-deep)_75%,transparent)] px-3 py-1 text-xs font-black text-primary backdrop-blur">
          مطابقة {score}%
        </span>
        <span className="absolute start-3 top-3 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-black backdrop-blur">
          {p.type}
        </span>
      </div>
      <div className="space-y-3 p-5">
        <div>
          <h3 className="text-base font-bold">{p.title}</h3>
          <p className="text-xs text-muted-foreground">
            {p.village} — {p.city} · {p.area} م² · {p.zoning}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-primary/35 bg-primary/10 p-3">
            <p className="text-[11px] text-muted-foreground">سعر المتر</p>
            <p className="mt-1 text-lg font-black text-primary">{fmt(p.pricePerM)} د.أ/م²</p>
          </div>
          <div className="rounded-xl border border-border bg-background/30 p-3">
            <p className="text-[11px] text-muted-foreground">السعر الإجمالي</p>
            <p className="mt-1 text-sm font-black text-primary">{fmt(p.price)} د.أ</p>
          </div>
        </div>
        <p className={`rounded-xl px-3 py-2 text-xs font-black ${p.price <= budget ? "bg-secondary/20 text-secondary-foreground" : "bg-primary/12 text-primary"}`}>
          {budgetStatus}
        </p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/50">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${score}%` }}
          />
        </div>
        <ul className="space-y-1 text-xs text-muted-foreground">
          {reasons.map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <Link
            to="/property/$id"
            params={{ id: p.id }}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
          >
            التحليل الكامل
          </Link>
          <button
            onClick={() => {
              onFav();
              toast.success(fav ? "أزلنا العقار من المفضلة" : "أضفنا العقار للمفضلة");
            }}
            aria-label="إضافة للمفضلة"
            className="grid size-10 place-items-center rounded-xl border border-border text-muted-foreground transition hover:bg-accent hover:text-primary"
          >
            <Heart className={`size-4 ${fav ? "fill-primary text-primary" : ""}`} />
          </button>
          <button
            onClick={() => toast.success("تم نسخ رابط العقار للمشاركة")}
            aria-label="مشاركة العقار"
            className="grid size-10 place-items-center rounded-xl border border-border text-muted-foreground transition hover:bg-accent hover:text-primary"
          >
            <Share2 className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
