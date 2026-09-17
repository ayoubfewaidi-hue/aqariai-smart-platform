import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Building2, Map as MapIcon, Sparkles, TrendingUp } from "lucide-react";

import { EmptyState, GlassCard, SectionTitle, SiteFooter, SiteHeader, Stat } from "@/components/ui-kit";
import {
  DEFAULT_BUYER,
  areaMatchPercent,
  fmt,
  getSearchArea,
  nearbyAlternatives,
  plotsInArea,
  propertiesInArea,
  smartPropertyScore,
} from "@/lib/data";

export const Route = createFileRoute("/area/$name")({
  loader: ({ params }) => ({ name: decodeURIComponent(params.name) }),
  head: ({ loaderData }) => {
    const name = loaderData?.name ?? "منطقة";
    const title = `${name} — تحليل المنطقة | عقاري AI`;
    const description = `متوسط سعر المتر، مستوى الطلب، النمو المتوقع والعقارات المتاحة في ${name}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: AreaPage,
});

function AreaPage() {
  const { name } = Route.useLoaderData();
  const area = getSearchArea(name);
  const match = areaMatchPercent(name, DEFAULT_BUYER);
  const props = propertiesInArea(name);
  const plots = plotsInArea(name);
  const alternatives = nearbyAlternatives(name, DEFAULT_BUYER);

  if (!area) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-4xl px-4 py-16">
          <EmptyState
            icon={<MapIcon className="size-8" />}
            title={`لا توجد بيانات عن ${name}`}
            desc="اختر منطقة من قائمة البحث في بوابة المشتري."
            action={
              <Link to="/buyer" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">
                العودة للبحث
              </Link>
            }
          />
        </main>
        <SiteFooter />
      </div>
    );
  }

  const bbox = `${area.lng - 0.02},${area.lat - 0.015},${area.lng + 0.02},${area.lat + 0.015}`;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <Link to="/buyer" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          <ArrowRight className="size-4" /> العودة للبحث
        </Link>

        <GlassCard strong className="fade-up overflow-hidden p-0">
          <div className="aerial-placeholder relative h-52 sm:h-64">
            <div className="absolute inset-0 bg-[color-mix(in_oklab,var(--navy-deep)_35%,transparent)]" />
            <span className="absolute end-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-black text-primary-foreground shadow-lg">
              مطابقة {match}%
            </span>
            <div className="absolute bottom-5 start-5">
              <p className="text-xs font-bold text-primary">{area.city}</p>
              <h1 className="text-3xl font-black sm:text-4xl">{area.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{area.demand} · حركة {area.activity}</p>
            </div>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-3">
            <Stat label="متوسط سعر المتر" value={`${fmt(area.avgPricePerM)} د.أ/م²`} />
            <Stat label="مستوى الطلب" value={"⭐".repeat(area.demandStars)} hint={area.demand} />
            <Stat label="النمو السنوي المتوقع" value={`${area.growth}%`} hint={area.newProjects} />
          </div>
        </GlassCard>

        <GlassCard className="fade-up space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <MapIcon className="size-5 text-primary" /> الموقع على الخريطة
          </h2>
          <p className="text-xs text-muted-foreground">الإحداثيات: {area.lat.toFixed(4)}, {area.lng.toFixed(4)}</p>
          <iframe
            title={`خريطة ${area.name}`}
            className="h-72 w-full rounded-xl border border-border"
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${area.lat},${area.lng}`}
          />
          <a
            href={`https://www.openstreetmap.org/?mlat=${area.lat}&mlon=${area.lng}#map=15/${area.lat}/${area.lng}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-xl border border-primary/40 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary/10"
          >
            افتح الخريطة
          </a>
        </GlassCard>

        <section className="space-y-4">
          <SectionTitle eyebrow="عقارات المنطقة" title={`المتاح الآن في ${area.name}`} desc={area.note} />
          {props.length === 0 && plots.length === 0 ? (
            <GlassCard className="space-y-4">
              <p className="text-sm font-black">لا توجد نتائج في {area.name}</p>
              <p className="text-xs text-muted-foreground">اخترنا لك 3 مناطق مجاورة بخصائص قريبة:</p>
              <div className="grid gap-3 md:grid-cols-3">
                {alternatives.map((alt) => (
                  <Link
                    key={alt.name}
                    to="/area/$name"
                    params={{ name: alt.name }}
                    className="group rounded-2xl border border-border bg-background/30 p-4 transition hover:-translate-y-1 hover:border-primary/60"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-black">{alt.name}</p>
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-black text-primary-foreground">
                        {alt.match}%
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">لماذا نقترحها: {alt.why}</p>
                    <p className="mt-2 text-xs font-bold text-primary">
                      {alt.count} عقار متاح · {fmt(alt.avgPricePerM)} د.أ/م²
                    </p>
                  </Link>
                ))}
              </div>
            </GlassCard>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {plots.map((plot) => (
                <article key={plot.id} className="glass fade-up rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold text-primary">قطعة {plot.plot}</p>
                      <h3 className="text-xl font-black">{plot.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{plot.areaText} · {plot.slope}</p>
                    </div>
                    <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-black text-primary-foreground">
                      Smart Score {plot.score}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-black text-primary">
                    {fmt(plot.pricePerM)} د.أ/م² · الإجمالي {fmt(plot.total)} د.أ
                  </p>
                  <Link
                    to="/property/$id"
                    params={{ id: plot.id }}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
                  >
                    التحليل الكامل
                  </Link>
                </article>
              ))}
              {props.map((p) => (
                <article key={p.id} className="glass fade-up overflow-hidden rounded-2xl">
                  <img src={p.image} alt={p.title} loading="lazy" className="h-40 w-full object-cover" />
                  <div className="space-y-2 p-5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-bold">{p.title}</h3>
                      <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-black text-primary-foreground">
                        {smartPropertyScore(p)}/100
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {p.village} — {p.city} · {p.area} م² · {p.type}
                    </p>
                    <p className="text-sm font-black text-primary">{fmt(p.pricePerM)} د.أ/م²</p>
                    <p className="text-xs text-muted-foreground">الإجمالي: {fmt(p.price)} د.أ</p>
                    <Link
                      to="/property/$id"
                      params={{ id: p.id }}
                      className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
                    >
                      التحليل الكامل
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <GlassCard className="fade-up space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Sparkles className="size-5 text-primary" /> مناطق مجاورة قد تناسبك
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            {alternatives.map((alt) => (
              <Link
                key={alt.name}
                to="/area/$name"
                params={{ name: alt.name }}
                className="rounded-2xl border border-border bg-background/30 p-4 transition hover:-translate-y-1 hover:border-primary/60"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black">{alt.name}</p>
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-black text-primary-foreground">
                    {alt.match}%
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="size-3.5 text-primary" /> {alt.count} عقار · {fmt(alt.avgPricePerM)} د.أ/م²
                </p>
                <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-primary" /> {alt.why}
                </p>
              </Link>
            ))}
          </div>
          <Link
            to="/buyer"
            className="inline-flex items-center gap-2 rounded-xl border border-primary/40 px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/10"
          >
            <ArrowRight className="size-4" /> العودة للبحث
          </Link>
        </GlassCard>
      </main>
      <SiteFooter />
    </div>
  );
}
