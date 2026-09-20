import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Field, GlassCard, GoldButton, SectionTitle, SiteFooter, SiteHeader } from "@/components/ui-kit";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا | عقاري AI" },
      { name: "description", content: "تواصل مع فريق عقاري AI — نسعد بخدمتك." },
      { property: "og:title", content: "تواصل معنا | عقاري AI" },
      { property: "og:description", content: "تواصل مع فريق عقاري AI — نسعد بخدمتك." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!name || !email || !message) {
      toast.error("يرجى إكمال جميع الحقول");
      return;
    }
    setSending(true);
    setTimeout(() => {
      toast.success("تم إرسال رسالتك بنجاح — سنرد عليك قريباً");
      setName("");
      setEmail("");
      setMessage("");
      setSending(false);
    }, 1200);
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-10 px-4 py-12">
        <SectionTitle
          eyebrow="تواصل معنا"
          title="يسعدنا سماعك"
          desc="لأي استفسار عن المنصة أو الخطط أو الشراكات — راسلنا وسنرد خلال يوم عمل."
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {[
              { icon: <Mail className="size-5" />, t: "البريد", v: "info@aqariai.com" },
              { icon: <Phone className="size-5" />, t: "الهاتف", v: "+962 798 825 600" },
              { icon: <MapPin className="size-5" />, t: "الموقع", v: "عمّان، الأردن" },
              { icon: <Clock className="size-5" />, t: "ساعات العمل", v: "الأحد - الخميس 9-6" },
            ].map((c) => (
              <GlassCard key={c.t} className="fade-up flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                  {c.icon}
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">{c.t}</p>
                  <p className="text-sm font-bold" dir={c.t === "الهاتف" ? "ltr" : undefined}>
                    {c.v}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>

          <GlassCard strong className="fade-up space-y-4">
            <h3 className="text-lg font-bold">أرسل رسالة</h3>
            <Field label="الاسم الكامل" value={name} onChange={setName} placeholder="اسمك الكريم" />
            <Field
              label="البريد الإلكتروني"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="name@example.com"
            />
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">رسالتك</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="اكتب رسالتك..."
                className="w-full rounded-xl border border-input bg-background/40 px-3 py-2.5 text-sm outline-none transition focus:border-primary/70 focus:ring-2 focus:ring-primary/25"
              />
            </label>
            <GoldButton className="w-full" onClick={submit} loading={sending}>
              {sending ? "جارٍ الإرسال..." : "إرسال الرسالة"}
            </GoldButton>
          </GlassCard>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
