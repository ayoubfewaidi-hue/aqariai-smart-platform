import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  strong,
}: {
  children: ReactNode;
  className?: string;
  strong?: boolean;
}) {
  return (
    <div className={cn(strong ? "glass-strong" : "glass", "rounded-2xl p-5 sm:p-6", className)}>
      {children}
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  desc,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="fade-up space-y-2">
      {eyebrow ? (
        <span className="inline-block rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
      {desc ? <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{desc}</p> : null}
    </div>
  );
}

export function GoldButton({
  children,
  onClick,
  type = "button",
  loading,
  disabled,
  className,
  variant = "gold",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: "gold" | "outline" | "emerald";
}) {
  const styles = {
    gold: "bg-primary text-primary-foreground hover:brightness-110",
    emerald: "bg-secondary text-secondary-foreground hover:brightness-125",
    outline: "border border-primary/45 text-primary hover:bg-primary/10",
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55",
        styles,
        className,
      )}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={focused ? "" : placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-input bg-background/40 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary/70 focus:ring-2 focus:ring-primary/25"
      />
    </label>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/30 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-bold text-primary",
          value.length > 26 ? "text-[13px] leading-relaxed" : "text-lg",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-xl", className)} />;
}

export function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon?: ReactNode;
  title: string;
  desc: string;
  action?: ReactNode;
}) {
  return (
    <div className="fade-up flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-background/25 p-10 text-center">
      <div className="text-primary">{icon}</div>
      <h3 className="text-base font-bold">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{desc}</p>
      {action}
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
      {message}
    </p>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-[color-mix(in_oklab,var(--navy-deep)_82%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-2 px-4 py-3 md:flex-nowrap md:py-3.5">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-base font-black text-primary-foreground">
            ع
          </span>
          <span className="text-lg font-extrabold">
            عقاري<span className="text-primary"> AI</span>
          </span>
        </Link>
        <nav className="order-3 -mx-1 flex w-full min-w-0 items-center gap-1 overflow-x-auto whitespace-nowrap px-1 text-sm font-semibold [scrollbar-width:none] md:order-none md:mx-0 md:w-auto md:gap-1.5 md:overflow-visible md:px-0">
          <Link
            to="/buyer"
            className="shrink-0 rounded-lg px-2.5 py-2 md:px-3 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            activeProps={{ className: "rounded-lg px-3 py-2 bg-primary/15 text-primary" }}
          >
            مشتري
          </Link>
          <Link
            to="/seller"
            className="shrink-0 rounded-lg px-2.5 py-2 md:px-3 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            activeProps={{ className: "rounded-lg px-3 py-2 bg-primary/15 text-primary" }}
          >
            بائع
          </Link>
          <Link
            to="/pricing"
            className="shrink-0 rounded-lg px-2.5 py-2 md:px-3 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            activeProps={{ className: "rounded-lg px-3 py-2 bg-primary/15 text-primary" }}
          >
            الأسعار
          </Link>
          <Link
            to="/about"
            className="shrink-0 rounded-lg px-2.5 py-2 md:px-3 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            activeProps={{ className: "rounded-lg px-3 py-2 bg-primary/15 text-primary" }}
          >
            من نحن
          </Link>
          <Link
            to="/contact"
            className="shrink-0 rounded-lg px-2.5 py-2 md:px-3 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            activeProps={{ className: "rounded-lg px-3 py-2 bg-primary/15 text-primary" }}
          >
            تواصل
          </Link>
          <AuthNav />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/70 py-8 text-center text-xs text-muted-foreground">
      عقاري AI — منصة عقارية ذكية للسوق الأردني · {new Date().getFullYear()}
    </footer>
  );
}

export function AuthNav() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (loading) return null;

  if (!user) {
    return (
      <Link
        to="/auth/login"
        className="rounded-lg border border-primary/45 px-3 py-2 text-primary transition hover:bg-primary/10"
        activeProps={{ className: "rounded-lg bg-primary/15 px-3 py-2 text-primary" }}
      >
        دخول
      </Link>
    );
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth/login", replace: true });
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="hidden max-w-[10rem] truncate rounded-lg bg-primary/12 px-3 py-2 text-xs font-bold text-primary sm:inline">
        {(user.user_metadata?.["full_name"] as string) || user.email}
      </span>
      <button
        type="button"
        onClick={() => void signOut()}
        className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-muted-foreground transition hover:border-primary hover:text-primary"
      >
        خروج
      </button>
    </div>
  );
}
