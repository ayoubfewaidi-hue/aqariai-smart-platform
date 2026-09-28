import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { GlassCard, SiteFooter, SiteHeader } from "@/components/ui-kit";
import { isVerifiedBroker } from "@/lib/subscriptions";

export const Route = createFileRoute("/verify/$brokerId")({
  head: () => ({
    meta: [
      { title: "التحقق من وسيط | عقاري AI" },
      { name: "description", content: "تحقق من أن شارة «موثّق» صادرة فعلاً عن منصة عقاري AI." },
      { property: "og:title", content: "التحقق من وسيط | عقاري AI" },
      { property: "og:description", content: "تحقق فوري من صحة شارة التوثيق." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  component: VerifyPage,
});

function VerifyPage() {
  const { brokerId } = Route.useParams();
  const [state, setState] = useState<"loading" | "yes" | "no">("loading");

  useEffect(() => {
    const valid = /^[0-9a-f-]{36}$/i.test(brokerId);
    if (!valid) return setState("no");
    isVerifiedBroker(brokerId).then((v) => setState(v ? "yes" : "no")).catch(() => setState("no"));
  }, [brokerId]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-16">
        <GlassCard strong className="space-y-4 text-center">
          {state === "loading" && <p className="text-sm text-muted-foreground">جارٍ التحقق…</p>}
          {state === "yes" && (
            <>
              <BadgeCheck className="mx-auto size-14 text-primary" />
              <h1 className="text-2xl font-black">وسيط موثّق</h1>
              <p className="text-sm text-muted-foreground">هذا الوسيط يملك اشتراكاً فعّالاً وموثّقاً لدى عقاري AI حتى هذه اللحظة.</p>
            </>
          )}
          {state === "no" && (
            <>
              <ShieldAlert className="mx-auto size-14 text-destructive" />
              <h1 className="text-2xl font-black">غير موثّق</h1>
              <p className="text-sm text-muted-foreground">لا يوجد اشتراك فعّال لهذا الحساب. أي شارة تظهر خارج المنصة غير صالحة.</p>
            </>
          )}
          <Link to="/buyer" className="inline-block text-sm font-bold text-primary underline">تصفّح العقارات</Link>
        </GlassCard>
      </main>
      <SiteFooter />
    </div>
  );
}
