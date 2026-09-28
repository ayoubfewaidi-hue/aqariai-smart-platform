import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { GlassCard, GoldButton, SiteFooter, SiteHeader } from "@/components/ui-kit";
import { requireAuth } from "@/lib/auth-guard";
import { adminGrantSubscription, type BillingPeriod, type Plan } from "@/lib/subscriptions";

export const Route = createFileRoute("/admin/subscriptions")({
  head: () => ({
    meta: [
      { title: "منح الاشتراكات | عقاري AI" },
      { name: "description", content: "صفحة إدارية لمنح اشتراكات الوسطاء يدوياً." },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  beforeLoad: () => requireAuth("admin"),
  component: AdminSubscriptions,
});

function AdminSubscriptions() {
  const [userId, setUserId] = useState("");
  const [plan, setPlan] = useState<Plan>("pro");
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!/^[0-9a-f-]{36}$/i.test(userId.trim())) { toast.error("معرّف المستخدم غير صالح"); return; }
    setBusy(true);
    try {
      await adminGrantSubscription(userId.trim(), plan, period);
      toast.success("تم منح الاشتراك");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر المنح");
    } finally {
      setBusy(false);
    }
  };

  const field = "w-full rounded-xl border border-border bg-background/40 px-3 py-2.5 text-sm";
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-10">
        <GlassCard strong className="space-y-4">
          <h1 className="text-xl font-black">منح اشتراك يدوياً</h1>
          <input className={field} dir="ltr" placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
          <select className={field} value={plan} onChange={(e) => setPlan(e.target.value as Plan)}>
            <option value="free">مجاني</option>
            <option value="pro">Pro</option>
            <option value="business">Business</option>
          </select>
          <select className={field} value={period} onChange={(e) => setPeriod(e.target.value as BillingPeriod)}>
            <option value="monthly">شهري</option>
            <option value="yearly">سنوي</option>
          </select>
          <GoldButton onClick={() => void submit()} disabled={busy} className="w-full">
            {busy ? "جارٍ المنح…" : "منح الاشتراك"}
          </GoldButton>
        </GlassCard>
      </main>
      <SiteFooter />
    </div>
  );
}
