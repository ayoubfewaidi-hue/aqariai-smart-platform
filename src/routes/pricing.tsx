import { createFileRoute } from "@tanstack/react-router";
import { Check, Crown, Sparkles, TrendingUp, Users, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { GlassCard, GoldButton, SectionTitle, SiteFooter, SiteHeader } from "@/components/ui-kit";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "الأسعار | عقاري AI" },
      { name: "description", content: "خطط مرنة: مجانية، احترافية، مكاتب، مطورين." },
      { property: "og:title", content: "الأسعار | عقاري AI" },
      { property: "og:description", content: "خطط مرنة: مجانية، احترافية، مكاتب، مطورين." },
    ],
  }),
  component: PricingPage,
});

type Plan = {
  name: string;
  icon: ReactNode;
  price: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  highlighted: boolean;
};

const PLANS: Plan[] = [
  {
    name: "مجاني",
    icon: <Zap className="size-6" />,
    price: "0",
    period: "للبداية",
    desc: "ابدأ رحلتك",
    features: ["3 عقارات", "Smart Score أساسي", "بحث متقدم", "مستشار ذكي (محدود)"],
    cta: "ابدأ مجاناً",
    highlighted: false,
  },
  {
    name: "العارض المحترف",
    icon: <Crown className="size-6" />,
    price: "25",
    period: "د.أ / شهرياً",
    desc: "لعارضين جادين",
    features: ["عقارات غير محدودة", "توليد تسويق", "فيديو شهري", "أولوية النتائج", "إحصائيات"],
    cta: "جرّب مجاناً",
    highlighted: true,
  },
  {
    name: "المكتب العقاري",
    icon: <Users className="size-6" />,
    price: "150",
    period: "د.أ / شهرياً",
    desc: "لمكاتب الوكلاء",
    features: ["5 حسابات", "لوحة فريق", "توزيع Leads", "تقارير", "دعم أولوية"],
    cta: "تواصل",
    highlighted: false,
  },
  {
    name: "المطور العقاري",
    icon: <TrendingUp className="size-6" />,
    price: "500",
    period: "د.أ / شهرياً",
    desc: "للمشاريع الكبرى",
    features: ["كل مزايا المكتب", "إدارة مشاريع", "بيع على الخارطة", "جولات VR", "حملات"],
    cta: "تحدث معنا",
    highlighted: false,
  },
];

function PricingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-12 px-4 py-12">
        <SectionTitle
          eyebrow="الأسعار"
          title="خطط مرنة تناسب الجميع"
          desc="من البائع الفرد إلى المطور العقاري — اختر الخطة المناسبة لأعمالك."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <GlassCard
              key={plan.name}
              strong={plan.highlighted}
              className={`fade-up relative flex flex-col gap-4 ${
                plan.highlighted ? "border-primary/60 ring-2 ring-primary/25" : ""
              }`}
            >
              {plan.highlighted ? (
                <span className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground">
                  الأكثر طلباً
                </span>
              ) : null}
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
                  {plan.icon}
                </span>
                <h3 className="text-base font-bold">{plan.name}</h3>
              </div>
              <div>
                <p className="text-3xl font-black text-primary">
                  {plan.price}
                  <span className="text-base font-bold"> د.أ</span>
                </p>
                <p className="text-xs text-muted-foreground">{plan.period}</p>
              </div>
              <p className="text-sm text-muted-foreground">{plan.desc}</p>
              <ul className="flex-1 space-y-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="size-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <GoldButton
                variant={plan.highlighted ? "gold" : "outline"}
                className="w-full"
                onClick={() => {}}
              >
                {plan.cta}
              </GoldButton>
            </GlassCard>
          ))}
        </div>

        <div className="space-y-5">
          <SectionTitle eyebrow="إضافات" title="الخدمات الإضافية" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { t: "تقرير شامل", p: "25 د.أ" },
              { t: "تقرير استثماري", p: "75 د.أ" },
              { t: "فيديو تسويقي", p: "300 د.أ" },
              { t: "جولة 360°", p: "250 د.أ" },
            ].map((s) => (
              <GlassCard key={s.t} className="fade-up flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="size-4 text-primary" />
                  {s.t}
                </span>
                <span className="text-sm font-bold text-primary">{s.p}</span>
              </GlassCard>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
