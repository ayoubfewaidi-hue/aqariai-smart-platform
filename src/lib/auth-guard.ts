import { redirect } from "@tanstack/react-router";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export type AppRole = "buyer" | "seller" | "admin";

export async function fetchMyRoles(): Promise<AppRole[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", auth.user.id);
  return (data ?? []).map((r) => r.role as AppRole);
}

/** Client-only route guard: redirects to home when signed out (or missing role). */
export async function requireAuth(role?: AppRole) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    setTimeout(() => toast.error("يجب تسجيل الدخول للمتابعة"), 400);
    throw redirect({ to: "/" });
  }
  if (role) {
    const roles = await fetchMyRoles();
    if (!roles.includes(role)) {
      setTimeout(() => toast.error("لا تملك صلاحية الوصول لهذه الصفحة"), 400);
      throw redirect({ to: "/" });
    }
  }
  return { user: data.user };
}
