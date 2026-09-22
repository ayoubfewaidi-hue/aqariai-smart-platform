import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogIn, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Field, GlassCard, GoldButton, SiteFooter, SiteHeader } from "@/components/ui-kit";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | عقاري AI" },
      { name: "description", content: "سجّل الدخول إلى حسابك في عقاري AI لإدارة عقاراتك ومفضلتك واستفساراتك." },
      { property: "og:title", content: "تسجيل الدخول | عقاري AI" },
      { property: "og:description", content: "دخول آمن بالبريد الإلكتروني أو حساب Google." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn() {
    if (!email.trim() || !password) { toast.error("أدخل البريد الإلكتروني وكلمة المرور"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("مرحباً بك مجدداً");
    void navigate({ to: "/seller" });
  }

  async function signInWithGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) { toast.error("تعذر الدخول عبر Google"); return; }
    if (result.redirected) return;
    void navigate({ to: "/seller" });
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-14">
        <GlassCard strong className="fade-up space-y-5">
          <div className="text-center">
            <h1 className="text-2xl font-black">تسجيل الدخول</h1>
            <p className="mt-1 text-sm text-muted-foreground">أدخل بياناتك للوصول إلى حسابك.</p>
          </div>
          <Field label="البريد الإلكتروني" value={email} onChange={setEmail} placeholder="name@example.com" />
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && void signIn()}
              className="w-full rounded-xl border border-border bg-background/40 px-3 py-2.5 text-sm outline-none transition focus:border-primary"
              placeholder="••••••••"
            />
          </div>
          <GoldButton onClick={signIn} loading={loading} className="w-full justify-center">
            <LogIn className="size-4" /> دخول
          </GoldButton>
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-bold transition hover:border-primary hover:text-primary"
          >
            <Mail className="size-4" /> الدخول بحساب Google
          </button>
          <p className="text-center text-xs text-muted-foreground">
            لا تملك حساباً؟{" "}
            <Link to="/auth/register" className="font-bold text-primary hover:underline">
              أنشئ حساباً جديداً
            </Link>
          </p>
        </GlassCard>
      </main>
      <SiteFooter />
    </div>
  );
}
