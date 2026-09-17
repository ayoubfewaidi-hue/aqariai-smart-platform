import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarCheck,
  Download,
  Earth,
  Layers3,
  Map,
  MapPin,
  MessageCircle,
  Radar,
  RotateCcw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { GlassCard, GoldButton, SiteFooter, SiteHeader, Stat } from "@/components/ui-kit";
import { FEATURED_PLOTS, PROPERTIES, analyze, fmt } from "@/lib/data";

export const Route = createFileRoute("/property/$id")({
  loader: ({ params }) => {
    const plot = FEATURED_PLOTS.find((item) => item.id === params.id);
    const property = PROPERTIES.find((item) => item.id === params.id);
    if (!plot && !property) throw notFound();
    return { plot, property };
  },
  head: ({ loaderData }) => {
    const plot = loaderData?.plot;
    const property = loaderData?.property;
    const title = plot
      ? `تحليل قطعة ${plot.name} ${plot.plot} | عقاري AI`
      : property
        ? `${property.title} | عقاري AI`
        : "تحليل العقار | عقاري AI";
    const description = plot
      ? `تقييم شامل لقطعة ${plot.name}: Smart Score ${plot.score}/100، مقارنة أسعار، مخطط تنظيمي، سيناريوهات استثمار، وتوصية المستشار الذكي.`
      : property
        ? `${property.title} في ${property.village} — ${property.area} م² بسعر ${fmt(property.price)} د.أ مع تحليل سعر عادل ومردود متوقع.`
        : "تحليل عقاري تفصيلي بالذكاء الاصطناعي.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(property
          ? [
              { property: "og:image", content: property.image },
              { name: "twitter:image", content: property.image },
            ]
          : []),
      ],
    };
  },
  component: PropertyDetail,
});

function PropertyDetail() {
  const { plot, property } = Route.useLoaderData();
  if (plot) return <FeaturedPlotDetail plot={plot} />;
  if (property) return <LegacyPropertyDetail property={property} />;
  return null;
}

function FeaturedPlotDetail({ plot }: { plot: (typeof FEATURED_PLOTS)[number] }) {
  const [activeScenario, setActiveScenario] = useState(plot.investmentScenarios[0]?.name ?? "فيلا عائلية");
  const active = useMemo(
    () => plot.investmentScenarios.find((item) => item.name === activeScenario) ?? plot.investmentScenarios[0],
    [activeScenario, plot.investmentScenarios],
  );
  const difference = Math.round(((plot.pricePerM - plot.marketAverage) / plot.marketAverage) * 100);
  const gaugeColor = plot.score > 80 ? "var(--emerald-light)" : plot.score >= 60 ? "var(--gold)" : "var(--destructive)";
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=35.84%2C31.87%2C35.93%2C31.98&layer=mapnik&marker=${encodeURIComponent(plot.coordinates)}`;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <Link to="/buyer" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          <ArrowLeft className="size-4" /> العودة
        </Link>

        <section className="fade-up grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <GlassCard strong className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="relative grid size-52 place-items-center sm:size-64">
              <svg viewBox="0 0 120 120" className="gauge-glow size-full -rotate-90" aria-label={`Smart Score ${plot.score}`}>
                <circle cx="60" cy="60" r="48" fill="none" stroke="var(--muted)" strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke={gaugeColor}
                  strokeLinecap="round"
                  strokeWidth="10"
                  strokeDasharray={`${(plot.score / 100) * 301.6} 301.6`}
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-5xl font-black text-primary">{plot.score}</p>
                <p className="text-sm font-bold text-muted-foreground">/100</p>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-black">التقييم الشامل</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {plot.name} · قطعة {plot.plot} · {plot.areaText}
              </p>
            </div>
            <SourceBadge label="تحليل AqariAi الذكي" icon={<Radar className="size-3.5" />} />
          </GlassCard>

          <GlassCard className="space-y-4">
            <h2 className="text-xl font-black">تفصيل نقاط التقييم</h2>
            <div className="space-y-4">
              {plot.subScores.map((item) => (
                <ProgressRow key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
          </GlassCard>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <GlassCard className="space-y-4">
            <SourceBadge label="دائرة الأراضي والمساحة" icon={<BadgeCheck className="size-3.5" />} />
            <h2 className="text-xl font-black">مقارنة الأسعار</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="متوسط المنطقة" value={`${plot.marketAverage} JOD/m²`} />
              <Stat label="سعرك" value={`${plot.pricePerM} JOD/m²`} />
              <div className="rounded-xl border border-secondary/45 bg-secondary/15 p-4">
                <p className="text-xs text-muted-foreground">الفرق</p>
                <p className="mt-1 text-2xl font-black text-secondary-foreground">{difference}%</p>
              </div>
            </div>
            <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-black text-secondary-foreground">
              فرصة استثمارية
            </span>
          </GlassCard>

          <GlassCard className="space-y-4">
            <SourceBadge label="أمانة عمان الكبرى" icon={<Layers3 className="size-3.5" />} />
            <h2 className="text-xl font-black">المخطط التنظيمي</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {plot.regulatory.map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-background/30 px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-bold">{item.value}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>

        <GlassCard className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <SourceBadge label="دائرة الأراضي والمساحة" icon={<MapPin className="size-3.5" />} />
              <h2 className="text-xl font-black">الصورة الجوية والموقع</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <GoldButton variant="outline" onClick={() => window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent(plot.coordinates)}`, "_blank", "noopener,noreferrer")}>
                <Map className="size-4" /> افتح الخريطة
              </GoldButton>
              <GoldButton variant="outline" onClick={() => window.open(`https://earth.google.com/web/search/${encodeURIComponent(plot.coordinates)}`, "_blank", "noopener,noreferrer")}>
                <Earth className="size-4" /> افتح في Google Earth
              </GoldButton>
            </div>
          </div>
          <iframe title="خريطة موقع العقار" src={mapSrc} className="h-[300px] w-full rounded-xl border border-border" loading="lazy" />
        </GlassCard>

        <GlassCard strong className="space-y-4">
          <h2 className="text-xl font-black">سيناريوهات الاستثمار</h2>
          <div className="flex flex-wrap gap-2">
            {plot.investmentScenarios.map((scenario) => (
              <button
                key={scenario.name}
                type="button"
                onClick={() => setActiveScenario(scenario.name)}
                className={`rounded-full px-4 py-2 text-xs font-black transition ${
                  activeScenario === scenario.name
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                {scenario.name}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {active?.stats.map((item) => <Stat key={item.label} label={item.label} value={item.value} />)}
          </div>
        </GlassCard>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassCard className="space-y-4">
            <SourceBadge label="تحليل AqariAi الذكي" icon={<Radar className="size-3.5" />} />
            <h2 className="text-xl font-black">توصية المستشار الذكي</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{plot.recommendation}</p>
          </GlassCard>
          <div className="grid gap-4">
            <GlassCard className="space-y-3 border-secondary/35 bg-secondary/10">
              <h3 className="text-base font-black text-secondary-foreground">نقاط القوة</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {plot.strengths.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <TrendingUp className="size-4 text-secondary-foreground" /> {item}
                  </li>
                ))}
              </ul>
            </GlassCard>
            <GlassCard className="space-y-3 border-primary/35 bg-primary/10">
              <h3 className="text-base font-black text-primary">نقاط تحتاج مراجعة</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {plot.cautions.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <TrendingDown className="size-4 text-primary" /> {item}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        </section>

        <GlassCard className="space-y-4">
          <SourceBadge label="دائرة الأراضي والمساحة" icon={<BadgeCheck className="size-3.5" />} />
          <h2 className="text-xl font-black">عقارات مشابهة للمقارنة</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {plot.similar.map((item) => (
              <article key={item.name} className="rounded-xl border border-border bg-background/30 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-black">{item.name}</h3>
                  <span className="rounded-full bg-primary/15 px-2 py-1 text-[11px] font-black text-primary">
                    {item.score}/100
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p>المساحة: {item.area}</p>
                  <p>سعر المتر: {item.pricePerM}</p>
                  <p>الإجمالي: {item.total}</p>
                </div>
                <GoldButton variant="outline" className="mt-4 w-full px-3 py-2" onClick={() => toast.info("تمت إضافة العقار للمقارنة")}>قارن</GoldButton>
              </article>
            ))}
          </div>
        </GlassCard>

        <section className="grid gap-3 sm:grid-cols-2">
          <GoldButton className="w-full" onClick={() => toast.success("سيتم تجهيز التقرير الكامل قريباً")}> 
            <Download className="size-4" /> تحميل التقرير الكامل (PDF)
          </GoldButton>
          <GoldButton variant="outline" className="w-full" onClick={() => toast.success("تم تسجيل طلب المعاينة الميدانية")}> 
            <CalendarCheck className="size-4" /> حجز معاينة ميدانية
          </GoldButton>
          <GoldButton variant="outline" className="w-full" onClick={() => window.open("/seller", "_self")}> 
            <RotateCcw className="size-4" /> تحليل قطعة جديدة
          </GoldButton>
          <GoldButton variant="outline" className="w-full" onClick={() => toast.info("رقم المستشار: 0790000000")}> 
            <MessageCircle className="size-4" /> تواصل مع المستشار
          </GoldButton>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function ProgressRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-bold">{label}</span>
        <span className="font-black text-primary">{value}/100</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-background/55">
        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function SourceBadge({ label, icon }: { label: string; icon: ReactNode }) {
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-black text-primary">
      {icon}
      {label}
    </span>
  );
}

function LegacyPropertyDetail({ property: p }: { property: (typeof PROPERTIES)[number] }) {
  const a = analyze(p);
  const [booked, setBooked] = useState(false);
  const similar = PROPERTIES.filter((x) => x.id !== p.id).slice(0, 3);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <Link to="/buyer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="size-4" /> العودة
        </Link>
        <div className="fade-up overflow-hidden rounded-2xl">
          <img src={p.image} alt={p.title} className="h-64 w-full object-cover sm:h-80" />
        </div>
        <GlassCard strong className="fade-up space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black sm:text-3xl">{p.title}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4 text-primary" /> {p.village} — {p.city} · {p.basin} · قطعة {p.plot}
              </p>
            </div>
            <p className="text-2xl font-black text-primary">{fmt(p.price)} د.أ</p>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{p.summary}</p>
        </GlassCard>
        <section className="grid gap-3 sm:grid-cols-3">
          <Stat label="سعر المتر المطلوب" value={`${fmt(p.pricePerM)} د.أ`} />
          <Stat label="سعر المتر العادل" value={`${fmt(a.fairPricePerM)} د.أ`} hint={a.verdict} />
          <Stat label="القيمة العادلة" value={`${fmt(a.fairTotal)} د.أ`} />
          <Stat label="المردود المتوقع" value={`${a.roi}%`} hint="سنوياً" />
          <Stat label="مستوى المخاطرة" value={a.risk} hint={`سيولة ${p.liquidity}/100`} />
          <Stat label="المدة المتوقعة للبيع" value={a.timeToSell} />
        </section>
        <GlassCard className="fade-up space-y-3">
          <h2 className="text-lg font-bold">الخطوة التالية</h2>
          <div className="flex flex-wrap gap-2">
            <GoldButton
              onClick={() => {
                setBooked(true);
                toast.success("تم تسجيل طلب المعاينة، سنتواصل معك لتأكيد الموعد");
              }}
            >
              <CalendarCheck className="size-4" /> احجز معاينة
            </GoldButton>
            <GoldButton variant="outline" onClick={() => toast.info("رقم التواصل: 0790000000")}>
              <MessageCircle className="size-4" /> تواصل مع المالك
            </GoldButton>
          </div>
          {booked ? <p className="rounded-xl border border-secondary/60 bg-secondary/20 px-4 py-3 text-sm font-semibold">✓ طلبك مسجّل — سيصلك تأكيد الموعد قريباً.</p> : null}
        </GlassCard>
        <section className="space-y-4">
          <h2 className="text-xl font-bold">بدائل مشابهة</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {similar.map((s) => (
              <Link key={s.id} to="/property/$id" params={{ id: s.id }} className="group">
                <div className="glass overflow-hidden rounded-2xl transition group-hover:-translate-y-1">
                  <img src={s.image} alt={s.title} loading="lazy" className="h-28 w-full object-cover" />
                  <div className="p-4">
                    <p className="text-sm font-bold">{s.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.area} م² · {fmt(s.price)} د.أ
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}