import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, BrainCircuit, Building2, LineChart, ScanLine, ShieldCheck, Sparkles } from "lucide-react";

import { GlassCard, SectionTitle, SiteFooter, SiteHeader } from "@/components/ui-kit";
import { PROPERTIES, fmt } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "عقاري AI | تحليل وتسويق العقارات بالذكاء الاصطناعي" },
      {
        name: "description",
        content:
          "اختر بوابتك: بائع لرفع مخطط أرضك واستخراج بياناته آلياً، أو مشتري للبحث بمستشار ذكي ودرجة مطابقة لكل عقار.",
      },
      { property: "og:title", content: "عقاري AI | منصة عقارية ذكية" },
      {
        property: "og:description",
        content: "استخراج بيانات المخططات، تحليل الأسعار، وتسويق تلقائي للعقارات في الأردن.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-6xl space-y-16 px-4 py-12">
        <section className="fade-up grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles className="size-3.5" /> مدعوم بالذكاء الاصطناعي
            </span>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl">
              منصة <span className="text-gradient-gold">عقاري AI</span>
              <br />
              قرار عقاري أذكى في الأردن
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              ارفع صورة مخطط أرضك فنستخرج المساحة ورقم القطعة والحوض والقرية والتنظيم تلقائياً، ونولّد
              لك حزمة تسويقية كاملة. وللمشتري: مستشار ذكي ودرجة مطابقة لكل عقار بدون أي نماذج تعبئة.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/seller"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.98]"
              >
                <Building2 className="size-4" /> أنا بائع
              </Link>
              <Link
                to="/buyer"
                className="inline-flex items-center gap-2 rounded-xl border border-primary/45 px-6 py-3 text-sm font-bold text-primary transition hover:bg-primary/10 active:scale-[0.98]"
              >
                <BrainCircuit className="size-4" /> أنا مشتري
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { k: `${PROPERTIES.length}`, v: "عقارات محللة" },
                { k: `${fmt(PROPERTIES.reduce((s, p) => s + p.price, 0))}`, v: "قيمة المحفظة (د.أ)" },
                { k: "6", v: "مخرجات تسويقية آلية" },
              ].map((s) => (
                <div key={s.v} className="glass rounded-xl px-3 py-3 text-center">
                  <p className="text-lg font-black text-primary">{s.k}</p>
                  <p className="text-[11px] text-muted-foreground">{s.v}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <PortalCard
              to="/seller"
              icon={<ScanLine className="size-5" />}
              title="بوابة البائع"
              lines={["ارفع مخطط الأرض → استخراج آلي", "مرفقات موثّقة", "تسويق ونشر بضغطة واحدة"]}
            />
            <PortalCard
              to="/buyer"
              icon={<LineChart className="size-5" />}
              title="بوابة المشتري"
              lines={["بحث ومستشار ذكي", "درجة مطابقة 0-100", "تحليل كامل وحجز معاينة"]}
            />
          </div>
        </section>

        <section className="space-y-6">
          <SectionTitle
            eyebrow="كيف تعمل المنصة"
            title="رحلة واحدة واضحة لكل طرف"
            desc="بدون تعقيد وبدون خطوات مكررة: البائع يرفع، المشتري يستكشف."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <GlassCard>
              <h3 className="mb-3 text-base font-bold text-primary">رحلة البائع</h3>
              <Steps
                items={[
                  "اختر بوابة البائع",
                  "ارفع المخطط أو أدخل البيانات",
                  "الذكاء يستخرج ويحلل تلقائياً",
                  "راجع النتائج",
                  "ولّد التسويق بضغطة",
                  "انشر بضغطة",
                ]}
              />
            </GlassCard>
            <GlassCard>
              <h3 className="mb-3 text-base font-bold text-primary">رحلة المشتري</h3>
              <Steps
                items={[
                  "اختر بوابة المشتري",
                  "ابحث أو حاور المستشار الذكي",
                  "شاهد العقارات بدرجة المطابقة",
                  "اضغط العقار للتحليل الكامل",
                  "احجز معاينة أو تواصل",
                ]}
              />
              <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 text-primary" /> لا توجد نماذج إدخال عقار في بوابة
                المشتري إطلاقاً.
              </p>
            </GlassCard>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2.5">
      {items.map((t, i) => (
        <li key={t} className="flex items-center gap-3 text-sm">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            {i + 1}
          </span>
          <span className="text-muted-foreground">{t}</span>
        </li>
      ))}
    </ol>
  );
}

function PortalCard({
  to,
  icon,
  title,
  lines,
}: {
  to: "/seller" | "/buyer";
  icon: React.ReactNode;
  title: string;
  lines: string[];
}) {
  return (
    <Link to={to} className="group block">
      <div className="glass-strong rounded-2xl p-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
              {icon}
            </span>
            <h3 className="text-lg font-bold">{title}</h3>
          </div>
          <ArrowLeft className="size-5 text-primary transition-transform group-hover:-translate-x-1" />
        </div>
        <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
          {lines.map((l) => (
            <li key={l}>• {l}</li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
