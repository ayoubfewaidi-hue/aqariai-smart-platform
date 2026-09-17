import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bot, BadgeCheck, Heart, MapPin, Mountain, Ruler, Search, SearchX, Send, Share2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
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
  fmt,
  matchReasons,
  matchScore,
  recommendAreas,
  smartPropertyScore,
  type BuyerProfile,
  type Property,
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

const GOALS: BuyerProfile["goal"][] = ["سكن", "استثمار", "تطوير"];

type Msg = { role: "user" | "assistant"; text: string };

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

  const conversationText = useMemo(
    () => `${query} ${input} ${messages.map((m) => m.text).join(" ")}`,
    [input, messages, query],
  );

  const recommendedAreas = useMemo(() => recommendAreas(profile, conversationText), [conversationText, profile]);

  const ranked = useMemo(() => {
    const q = query.trim();
    return PROPERTIES.filter(
      (p) =>
        !q ||
        `${p.title} ${p.village} ${p.city} ${p.type} ${p.zoning} ${p.basin}`.includes(q),
    )
      .map((p) => ({ p, score: matchScore(p, { ...profile, searches: [q] }) }))
      .sort((a, b) => b.score - a.score);
  }, [profile, query]);

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
      const { reply } = await advisor({
        data: {
          message: text,
          history,
          catalog: PROPERTIES.map(
            (p) =>
              `${p.title} | ${p.village}-${p.city} | ${p.type} | ${p.area}م² | ${p.price} د.أ | تنظيم ${p.zoning} | نمو ${p.growth}%`,
          ).join("\n"),
          profile: `الميزانية: ${profile.budget} د.أ | المناطق: ${
            profile.areas.join("، ") || "غير محددة"
          } | أفراد العائلة: ${profile.familySize} | الهدف: ${profile.goal} | المفضلة: ${
            profile.favorites.join("، ") || "لا شيء"
          }`,
        },
      });
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
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث: دابوق، فيلا، أرض، تجاري…"
              className="w-full rounded-xl border border-input bg-background/40 px-4 py-3 pe-10 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/25"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">
                الميزانية: {fmt(profile.budget)} د.أ
              </span>
              <input
                type="range"
                min={50000}
                max={1200000}
                step={10000}
                value={profile.budget}
                onChange={(e) => setProfile((p) => ({ ...p, budget: Number(e.target.value) }))}
                className="w-full accent-[var(--gold)]"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">
                أفراد العائلة: {profile.familySize}
              </span>
              <input
                type="range"
                min={1}
                max={8}
                value={profile.familySize}
                onChange={(e) => setProfile((p) => ({ ...p, familySize: Number(e.target.value) }))}
                className="w-full accent-[var(--gold)]"
              />
            </label>
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">الهدف</span>
              <div className="flex gap-1.5">
                {GOALS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setProfile((p) => ({ ...p, goal: g }))}
                    className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold transition ${
                      profile.goal === g
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
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
              <article
                key={area.name}
                className={`glass fade-up rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 ${index === 0 ? "gold-pulse border-primary/45" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-black">{area.name}</p>
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
              </article>
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
            <EmptyState
              icon={<SearchX className="size-8" />}
              title="لا نتائج مطابقة لبحثك"
              desc="جرّب كلمة أوسع مثل «أرض» أو «عمّان»، أو ارفع سقف الميزانية."
              action={<GoldButton variant="outline" onClick={() => setQuery("")}>مسح البحث</GoldButton>}
            />
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

        <GlassCard strong className="fade-up space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Bot className="size-5 text-primary" /> المستشار العقاري الذكي
          </h2>
          <div className="max-h-80 space-y-3 overflow-y-auto pe-1">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ms-auto border border-primary/35 bg-primary/15 text-foreground"
                    : "border border-border bg-background/35"
                }`}
              >
                {m.text}
              </div>
            ))}
            {thinking ? <Skeleton className="h-14 w-2/3" /> : null}
          </div>
          {chatError ? <ErrorNote message={chatError} /> : null}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void send();
              }}
              placeholder="مثال: ميزانيتي 500 ألف وأبحث عن أرض للاستثمار"
              className="flex-1 rounded-xl border border-input bg-background/40 px-4 py-3 text-sm outline-none focus:border-primary/70"
            />
            <GoldButton onClick={() => void send()} loading={thinking}>
              <Send className="size-4" /> إرسال
            </GoldButton>
          </div>
        </GlassCard>
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
          target="_blank"
          rel="noreferrer"
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
            target="_blank"
            rel="noreferrer"
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
