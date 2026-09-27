import { Link } from "@tanstack/react-router";
import { Lock, LogIn, UserPlus, X } from "lucide-react";

export function AuthRequiredModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="تسجيل الدخول مطلوب"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-strong fade-up w-full max-w-sm space-y-4 rounded-2xl border border-primary/40 p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} aria-label="إغلاق" className="float-left text-muted-foreground hover:text-primary">
          <X className="size-4" />
        </button>
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Lock className="size-5" />
        </div>
        <h2 className="text-lg font-black">تسجيل الدخول مطلوب</h2>
        <p className="text-sm text-muted-foreground">يجب تسجيل الدخول للمتابعة.</p>
        <div className="flex gap-2">
          <Link to="/auth/login" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-black text-primary-foreground">
            <LogIn className="size-4" /> دخول
          </Link>
          <Link to="/auth/register" className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary px-3 py-2.5 text-sm font-bold text-primary">
            <UserPlus className="size-4" /> إنشاء حساب
          </Link>
        </div>
      </div>
    </div>
  );
}
