import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Mail, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Field, GlassCard, GoldButton, SiteFooter, SiteHeader } from "@/components/ui-kit";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/register")({
  head: () => ({
    meta: [
      { title: "إنشاء حساب | عقاري AI" },
      { name: "description", content: "أنشئ حساباً في عقاري AI لنشر عقاراتك وحفظ مفضلتك ومتابعة الاستفسارات." },
      { property: "og:title", content: "إنشاء حساب | عقاري AI" },
      { property: "og:description", content: "حساب مالك أو وسيط أو مستخدم عادي في دقيقة واحدة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterPage,
});

const ROLES = [
  { value: "owner", label: "مالك عقار" },
  { value: "agent", label: "وسيط عقاري" },
  { value: "user", label: "باحث عن عقار" },
] as const;

function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]["value"]>("owner");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function register() {
    if (!fullName.trim()) return toast.error("أدخل الاسم الكامل");
    if (!email.trim() || password.length < 6)
      return toast.error("أدخل بريداً صحيحاً وكلمة مرور من 6 أحرف على الأقل");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim(), phone: phone.trim(), role },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (!data.session) {
      setSent(true);
      return toast.success("تحقق من بريدك الإلكتروني لتأكيد الحساب");
    }
    toast.success("تم إنشاء الحساب");
    void navigate({ to: "/seller" });
  }

  async function signInWithGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if ("error" in result && result.error) return toast.error("تعذر الدخول عبر Google");
    if ("redirected" in result && result.redirected) return;
    void navigate({ to: "/seller" });
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-14">
        <GlassCard strong className="fade-up space-y-5">
          <div className="text-center">
            <h1 className="text-2xl font-black">إنشاء حساب</h1>
            <p className="mt-1 text-sm text-muted-foreground">انشر عقارك واحفظ مفضلتك في مكان واحد.</p>
          </div>

          {sent ? (
            <p className="rounded-xl border border-secondary/60 bg-secondary/20 px-4 py-3 text-sm font-bold">
              أرسلنا رابط التأكيد إلى {email}. افتح الرابط ثم سجّل الدخول.
            </p>
          ) : null}

          <Field label="الاسم الكامل" value={fullName} onChange={setFullName} placeholder="مثال: أحمد العلي" />
          <Field label="رقم الهاتف" value={phone} onChange={setPhone} placeholder="07XXXXXXXX" />
          <Field label="البريد الإلكتروني" value={email} onChange={setEmail} placeholder="name@example.com" />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-input bg-background/40 px-3 py-2.5 text-sm outline-none transition focus:border-primary/70"
              placeholder="6 أحرف على الأقل"
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">نوع الحساب</p>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setRole(item.value)}
                  className={
                    role === item.value
                      ? "rounded-full bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground"
                      : "rounded-full border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:border-primary hover:text-primary"
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <GoldButton onClick={register} loading={loading} className="w-full justify-center">
            <UserPlus className="size-4" /> إنشاء الحساب
          </GoldButton>
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-bold transition hover:border-primary hover:text-primary"
          >
            <Mail className="size-4" /> المتابعة بحساب Google
          </button>
          <p className="text-center text-xs text-muted-foreground">
            لديك حساب؟{" "}
            <Link to="/auth/login" className="font-bold text-primary hover:underline">
              سجّل الدخول
            </Link>
          </p>
        </GlassCard>
      </main>
      <SiteFooter />
    </div>
  );
}
