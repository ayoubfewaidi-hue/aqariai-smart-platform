import { createFileRoute } from "@tanstack/react-router";
import { Award, Heart, Lightbulb, ShieldCheck, Target, Users } from "lucide-react";
import { GlassCard, SectionTitle, SiteFooter, SiteHeader } from "@/components/ui-kit";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن | عقاري AI" },
      {
        name: "description",
        content: "منصة عقاري AI — نستخدم الذكاء الاصطناعي لتحويل قرار العقار في الأردن.",
      },
      { property: "og:title", content: "من نحن | عقاري AI" },
      {
        property: "og:description",
        content: "منصة عقاري AI — نستخدم الذكاء الاصطناعي لتحويل قرار العقار في الأردن.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-12 px-4 py-12">
        <SectionTitle
          eyebrow="من نحن"
          title="نحوّل قرار العقار إلى قرار ذكي"
          desc="عقاري AI منصة أردنية تستخدم الذكاء الاصطناعي والبيانات الرسمية لتقدير العقارات وتحليلها وتسويقها."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <GlassCard className="fade-up space-y-3">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
                <Target className="size-6" />
              </span>
              <h3 className="text-lg font-bold">رسالتنا</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              أن نكون المستشار العقاري الذكي الأول في الأردن والمنطقة العربية.
            </p>
          </GlassCard>
          <GlassCard className="fade-up space-y-3">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
                <Users className="size-6" />
              </span>
              <h3 className="text-lg font-bold">رؤيتنا</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              تحويل سوق العقار التقليدي إلى سوق ذكي يعتمد على التحليل والبيانات.
            </p>
          </GlassCard>
        </div>

        <div className="space-y-5">
          <SectionTitle eyebrow="قيمنا" title="قيمنا الأساسية" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <ShieldCheck className="size-6" />, title: "الشفافية", desc: "تقديرات واضحة مبنية على بيانات رسمية." },
              { icon: <Lightbulb className="size-6" />, title: "الابتكار", desc: "أحدث تقنيات الذكاء الاصطناعي." },
              { icon: <Heart className="size-6" />, title: "الثقة", desc: "حماية البيانات ومنع الاحتيال." },
              { icon: <Award className="size-6" />, title: "الاحترافية", desc: "أعلى المعايير العالمية." },
            ].map((v) => (
              <GlassCard key={v.title} className="fade-up space-y-2 text-center">
                <div className="mx-auto grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
                  {v.icon}
                </div>
                <h4 className="text-base font-bold">{v.title}</h4>
                <p className="text-xs leading-relaxed text-muted-foreground">{v.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>

        <GlassCard strong className="fade-up text-center">
          <h3 className="text-lg font-bold">تواصل معنا</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            عمّان، الأردن
            <br />
            info@aqariai.com
            <br />
            <span dir="ltr">+962 798 825 600</span>
          </p>
        </GlassCard>
      </main>
      <SiteFooter />
    </div>
  );
}
