import { Link, createFileRoute } from "@tanstack/react-router";
import { BrainCircuit, Building2, Sparkles } from "lucide-react";

import { SiteFooter, SiteHeader } from "@/components/ui-kit";
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

      <main className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
        <section className="fade-up mx-auto max-w-3xl space-y-7 text-center">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles className="size-3.5" /> مدعوم بالذكاء الاصطناعي
            </span>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl">
              منصة <span className="text-gradient-gold">عقاري AI</span>
              <br />
              قرار عقاري أذكى في الأردن
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              ارفع صورة مخطط أرضك فنستخرج المساحة ورقم القطعة والحوض والقرية والتنظيم تلقائياً، ونولّد
              لك حزمة تسويقية كاملة. وللمشتري: مستشار ذكي ودرجة مطابقة لكل عقار بدون أي نماذج تعبئة.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
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
            <div className="mx-auto grid max-w-2xl grid-cols-3 gap-3 pt-3">
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
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
