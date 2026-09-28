import { supabase } from "@/integrations/supabase/client";
import { emitEvent } from "@/lib/events";

export type Plan = "free" | "pro" | "business";
export type BillingPeriod = "monthly" | "yearly";

export const PLAN_PRICES: Record<Plan, number> = { free: 0, pro: 25, business: 100 };
export const YEARLY_DISCOUNT = 0.2;
export const yearlyPrice = (plan: Plan) => Math.round(PLAN_PRICES[plan] * 12 * (1 - YEARLY_DISCOUNT));

export type BrokerRank = { verified: boolean; weight: number };

/** Verified flag + ranking weight per owner (plan itself is never exposed). */
export async function fetchBrokerRanks(ids: string[]): Promise<Map<string, BrokerRank>> {
  const map = new Map<string, BrokerRank>();
  const unique = [...new Set(ids)].filter(Boolean);
  if (!unique.length) return map;
  try {
    const { data, error } = await supabase.rpc("broker_ranks", { _user_ids: unique });
    if (error) throw error;
    for (const r of data ?? []) map.set(r.user_id, { verified: !!r.verified, weight: r.rank_weight ?? 0 });
  } catch (err) {
    console.warn("[subscriptions] ranks failed:", err);
  }
  return map;
}

export async function isVerifiedBroker(id: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_verified_broker", { _user_id: id });
  if (error) throw error;
  return !!data;
}

export type MySubscription = {
  plan: Plan;
  status: string;
  billing_period: string;
  expires_at: string | null;
  scheduled_plan: string | null;
};

/** Current effective subscription; expired => free. */
export async function fetchMySubscription(): Promise<MySubscription> {
  const { data: auth } = await supabase.auth.getUser();
  const free: MySubscription = { plan: "free", status: "active", billing_period: "monthly", expires_at: null, scheduled_plan: null };
  if (!auth.user) return free;
  const { data } = await supabase
    .from("subscriptions")
    .select("plan,status,billing_period,expires_at,scheduled_plan")
    .eq("user_id", auth.user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!data) return free;
  if (data.expires_at && new Date(data.expires_at) <= new Date()) return free;
  return data as MySubscription;
}

export async function scheduleDowngrade(plan: "free" | "pro") {
  const { error } = await supabase.rpc("schedule_downgrade", { _plan: plan });
  if (error) throw error;
}

export async function cancelMySubscription() {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.rpc("cancel_my_subscription");
  if (error) throw error;
  await emitEvent({ eventType: "subscription.cancelled", entityType: "user", entityId: auth.user?.id, userId: auth.user?.id });
}

const RANK: Record<Plan, number> = { free: 0, pro: 1, business: 2 };

/** Admin-only (enforced in the database). */
export async function adminGrantSubscription(userId: string, plan: Plan, period: BillingPeriod) {
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase.rpc("admin_grant_subscription", { _user_id: userId, _plan: plan, _period: period });
  if (error) throw error;
  const res = data as { id: string; previous_plan: Plan | null; plan: Plan; expires_at: string | null };
  const payload = { plan, period, previous_plan: res.previous_plan, expires_at: res.expires_at, subscriber_id: userId };
  await emitEvent({ eventType: "subscription.granted_by_admin", entityType: "subscription", entityId: res.id, payload, userId: auth.user?.id });
  const upgraded = res.previous_plan && RANK[plan] > RANK[res.previous_plan];
  await emitEvent({
    eventType: upgraded ? "subscription.upgraded" : "subscription.created",
    entityType: "subscription",
    entityId: res.id,
    payload,
    userId: auth.user?.id,
  });
  return res;
}

/** Order a paid service (price is set server-side from the services table). */
export async function orderService(serviceId: string, source = "direct") {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("يجب تسجيل الدخول");
  const { data, error } = await supabase
    .from("service_orders")
    .insert({ user_id: auth.user.id, service_id: serviceId, source })
    .select("id,price")
    .single();
  if (error) throw error;
  await emitEvent({
    eventType: "service.ordered",
    entityType: "service_order",
    entityId: data.id,
    payload: { service_id: serviceId, price: data.price, source },
    userId: auth.user.id,
  });
  return data;
}
