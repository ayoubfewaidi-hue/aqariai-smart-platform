import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, MapPin, Phone, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { GlassCard, GoldButton, SiteFooter, SiteHeader, Stat } from "@/components/ui-kit";
import { PROPERTIES, analyze, fmt } from "@/lib/data";

export const Route = createFileRoute("/property/$id")({
  loader: ({ params }) => {
    const property = PROPERTIES.find((p) => p.id === params.id);
    if (!property) throw notFound();
    return { property };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.property;
    const title = p ? `${p.title} | عقاري AI` : "تحليل العقار | عقاري AI";
    const description = p
      ? `${p.title} في ${p.village} — ${p.area} م² بسعر ${fmt(p.price)} د.أ مع تحليل سعر عادل ومردود متوقع.`
      : "تحليل عقاري تفصيلي بالذكاء الاصطناعي.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(p ? [{ property: "og:image", content: p.image }, { name: "twitter:image", content: p.image }] : []),
      ],
    };
  },
  component: PropertyDetail,
});

function PropertyDetail() {
  const { property: p } = Route.useLoaderData();
  const a = analyze(p);
  const [booked, setBooked] = useState(false);

  const similar = PROPERTIES.filter((x) => x.id !== p.id).slice(0, 3);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <Link
          to="/buyer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowRight className="size-4" /> رجوع إلى العقارات
        </Link>

        <div className="fade-up overflow-hidden rounded-2xl">
          <img src={p.image} alt={p.title} className="h-64 w-full object-cover sm:h-80" />
        </div>

        <GlassCard strong className="fade-up space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black sm:text-3xl">{p.title}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4 text-primary" /> {p.village} — {p.city} · {p.basin} · قطعة{" "}
                {p.plot}
              </p>
            </div>
            <p className="text-2xl font-black text-primary">{fmt(p.price)} د.أ</p>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{p.summary}</p>
          <div className="flex flex-wrap gap-2">
            {p.features.map((f) => (
              <span key={f} className="rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold text-primary">
                {f}
              </span>
            ))}
          </div>
        </GlassCard>

        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <TrendingUp className="size-5 text-primary" /> التحليل الكامل
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="سعر المتر المطلوب" value={`${fmt(p.pricePerM)} د.أ`} />
            <Stat label="سعر المتر العادل" value={`${fmt(a.fairPricePerM)} د.أ`} hint={a.verdict} />
            <Stat label="القيمة العادلة" value={`${fmt(a.fairTotal)} د.أ`} />
            <Stat label="المردود المتوقع" value={`${a.roi}%`} hint="سنوياً" />
            <Stat label="مستوى المخاطرة" value={a.risk} hint={`سيولة ${p.liquidity}/100`} />
            <Stat label="المدة المتوقعة للبيع" value={a.timeToSell} />
            <Stat label="نمو المنطقة" value={`${p.growth}%`} />
            <Stat label="مؤشر الخدمات" value={`${p.services}/100`} />
            <Stat label="الإحداثيات" value={p.coordinates} hint={`تنظيم ${p.zoning}`} />
          </div>
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
              <Phone className="size-4" /> تواصل مع المالك
            </GoldButton>
          </div>
          {booked ? (
            <p className="rounded-xl border border-secondary/60 bg-secondary/20 px-4 py-3 text-sm font-semibold">
              ✓ طلبك مسجّل — سيصلك تأكيد الموعد قريباً.
            </p>
          ) : null}
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
