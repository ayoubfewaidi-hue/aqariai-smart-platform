import { redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

export const GUARD_MESSAGE_KEY = "aqari-guard-message";
function notify(msg: string) {
  sessionStorage.setItem(GUARD_MESSAGE_KEY, msg);
  window.dispatchEvent(new Event(GUARD_MESSAGE_KEY));
}

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
    notify("يجب تسجيل الدخول للمتابعة");
    throw redirect({ to: "/" });
  }
  if (role) {
    const roles = await fetchMyRoles();
    if (!roles.includes(role)) {
      notify("لا تملك صلاحية الوصول لهذه الصفحة");
      throw redirect({ to: "/" });
    }
  }
  return { user: data.user };
}
