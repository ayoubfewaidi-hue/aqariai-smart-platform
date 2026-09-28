import { createFileRoute, redirect } from "@tanstack/react-router";
import { BadgeCheck, Check, Clock, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { GlassCard, SiteFooter, SiteHeader } from "@/components/ui-kit";
import { GUARD_MESSAGE_KEY, fetchMyRoles, requireAuth } from "@/lib/auth-guard";
import {
  PLAN_PRICES,
  cancelMySubscription,
  fetchMySubscription,
  scheduleDowngrade,
  yearlyPrice,
  type MySubscription,
  type Plan,
} from "@/lib/subscriptions";

export const Route = createFileRoute("/broker/subscription")({
  head: () => ({
    meta: [
      { title: "اشتراكات الوسطاء | عقاري AI" },
      { name: "description", content: "خطط اشتراك الوسطاء في عقاري AI: مجاني، Pro، Business مع شارة التوثيق الذهبية." },
      { property: "og:title", content: "اشتراكات الوسطاء | عقاري AI" },
      { property: "og:description", content: "احصل على شارة موثّق وأولوية الظهور في نتائج البحث." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  beforeLoad: async () => {
    await requireAuth();
    const roles = await fetchMyRoles();
    if (!roles.includes("seller") && !roles.includes("admin")) {
      sessionStorage.setItem(GUARD_MESSAGE_KEY, "صفحة الاشتراكات مخصصة للبائعين والوسطاء");
      window.dispatchEvent(new Event(GUARD_MESSAGE_KEY));
      throw redirect({ to: "/" });
    }
  },
  component: SubscriptionPage,
});

const PLANS: { id: Plan; name: string; perks: string[] }[] = [
  { id: "free", name: "مجاني", perks: ["نشر العقارات", "ظهور عادي في البحث"] },
  { id: "pro", name: "Pro", perks: ["شارة موثّق ذهبية", "أولوية متوسطة في النتائج", "تحليلات أساسية"] },
  { id: "business", name: "Business", perks: ["شارة موثّق ذهبية", "أعلى النتائج دائماً", "تحليلات متقدمة وأولوية دعم"] },
];
const RANK: Record<Plan, number> = { free: 0, pro: 1, business: 2 };

function SubscriptionPage() {
  const [sub, setSub] = useState<MySubscription | null>(null);
  const [yearly, setYearly] = useState(false);
  const [soon, setSoon] = useState<Plan | null>(null);

  const load = () => void fetchMySubscription().then(setSub);
  useEffect(load, []);

  const current = sub?.plan ?? "free";

  const onAction = async (plan: Plan) => {
    if (RANK[plan] > RANK[current]) return setSoon(plan); // upgrade: payment coming soon
    try {
      await scheduleDowngrade(plan as "free" | "pro");
      toast.success("سيتم التخفيض بنهاية المدة الحالية");
      load();
    } catch {
      toast.error("تعذّر جدولة التخفيض");
    }
  };

  const onCancel = async () => {
    try {
      await cancelMySubscription();
      toast.success("تم الإلغاء — يبقى اشتراكك فعّالاً حتى نهاية المدة");
      load();
    } catch {
      toast.error("تعذّر الإلغاء");
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
        <div className="text-center">
          <h1 className="text-3xl font-black">اشتراكات الوسطاء</h1>
          <p className="mt-2 text-sm text-muted-foreground">شارة «موثّق» الذهبية وأولوية الظهور في نتائج البحث.</p>
          {sub && current !== "free" && sub.expires_at && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/40 px-3 py-1 text-xs text-primary">
              <Clock className="size-3.5" /> خطتك الحالية فعّالة حتى {new Date(sub.expires_at).toLocaleDateString("ar-JO")}
              {sub.scheduled_plan && ` · ستتحول إلى ${PLANS.find((p) => p.id === sub.scheduled_plan)?.name}`}
            </p>
          )}
        </div>

        <div className="mx-auto flex w-fit gap-1 rounded-full border border-primary/40 p-1">
          {[false, true].map((y) => (
            <button
              key={String(y)}
              type="button"
              onClick={() => setYearly(y)}
              className={`rounded-full px-4 py-1.5 text-sm font-bold ${yearly === y ? "bg-primary text-primary-foreground" : "text-primary"}`}
            >
              {y ? "سنوي (خصم 20%)" : "شهري"}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === current;
            const price = yearly ? yearlyPrice(plan.id) : PLAN_PRICES[plan.id];
            return (
              <GlassCard key={plan.id} strong={plan.id === "business"} className={`space-y-4 ${isCurrent ? "border-primary" : ""}`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black">{plan.name}</h2>
                  {plan.id !== "free" && <BadgeCheck className="size-5 text-primary" />}
                </div>
                <p className="text-3xl font-black text-primary">
                  {price} <span className="text-sm text-muted-foreground">د.أ / {yearly ? "سنة" : "شهر"}</span>
                </p>
                <ul className="space-y-2 text-sm">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-2"><Check className="size-4 text-primary" /> {perk}</li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="rounded-xl border border-primary/40 py-2.5 text-center text-sm font-bold text-primary">خطتك الحالية</div>
                ) : (
                  <button
                    type="button"
                    onClick={() => void onAction(plan.id)}
                    className={`w-full rounded-xl py-2.5 text-sm font-black ${RANK[plan.id] > RANK[current] ? "bg-primary text-primary-foreground" : "border border-primary text-primary"}`}
                  >
                    {RANK[plan.id] > RANK[current] ? "ترقية" : "تخفيض بنهاية المدة"}
                  </button>
                )}
              </GlassCard>
            );
          })}
        </div>

        {current !== "free" && !sub?.scheduled_plan && (
          <div className="text-center">
            <button type="button" onClick={() => void onCancel()} className="text-sm text-muted-foreground underline hover:text-primary">
              إلغاء الاشتراك (بدون تجديد تلقائي)
            </button>
          </div>
        )}
      </main>

      {soon && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm" onClick={() => setSoon(null)}>
          <div className="glass-strong fade-up w-full max-w-sm space-y-4 rounded-2xl border border-primary/40 p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setSoon(null)} aria-label="إغلاق" className="float-left text-muted-foreground hover:text-primary">
              <X className="size-4" />
            </button>
            <BadgeCheck className="mx-auto size-10 text-primary" />
            <h2 className="text-lg font-black">قريباً</h2>
            <p className="text-sm text-muted-foreground">
              الدفع الإلكتروني لخطة {PLANS.find((p) => p.id === soon)?.name} سيتوفر قريباً. تواصل معنا لتفعيلها يدوياً.
            </p>
          </div>
        </div>
      )}
      <SiteFooter />
    </div>
  );
}
