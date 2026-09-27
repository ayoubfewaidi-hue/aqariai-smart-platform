import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type EmitEventInput = {
  eventType: string;
  entityType?: "property" | "user" | "inquiry" | string;
  entityId?: string | null;
  payload?: Record<string, unknown>;
  userId?: string | null;
};

/**
 * Records an event in the events table.
 * Never throws: a logging failure must not fail the main operation.
 */
export async function emitEvent(input: EmitEventInput): Promise<void> {
  try {
    const { error } = await supabase.from("events").insert({
      event_type: input.eventType,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      user_id: input.userId ?? null,
      payload: (input.payload ?? {}) as Json,
    });
    if (error) console.warn("[events] insert failed:", error.message);
  } catch (err) {
    console.warn("[events] emit failed:", err);
  }
}

export type EventRow = {
  id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  user_id: string | null;
  payload: Json;
  processed: boolean;
  created_at: string;
  processed_at: string | null;
};

/** Fetches the most recent events (newest first). */
export async function fetchRecentEvents(limit = 10): Promise<EventRow[]> {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.warn("[events] fetch failed:", error.message);
      return [];
    }
    return (data ?? []) as EventRow[];
  } catch (err) {
    console.warn("[events] fetch failed:", err);
    return [];
  }
}

/** Counts unprocessed events. */
export async function countUnprocessedEvents(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("processed", false);
    if (error) {
      console.warn("[events] count failed:", error.message);
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    console.warn("[events] count failed:", err);
    return 0;
  }
}

/**
 * Processes the latest 20 unprocessed events: logs each event_type,
 * then marks it processed with processed_at = now().
 * Never throws; returns { processed, failed }.
 */
export async function processUnprocessedEvents(): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;
  try {
    const { data, error } = await supabase
      .from("events")
      .select("id, event_type")
      .eq("processed", false)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) {
      console.warn("[events] read unprocessed failed:", error.message);
      return { processed, failed: 1 };
    }
    for (const row of (data ?? []) as { id: string; event_type: string }[]) {
      console.log("[events] processing:", row.event_type);
      const { error: updateError } = await supabase
        .from("events")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq("id", row.id);
      if (updateError) {
        console.warn("[events] mark processed failed:", updateError.message);
        failed += 1;
      } else {
        processed += 1;
      }
    }
  } catch (err) {
    console.warn("[events] processing failed:", err);
    failed += 1;
  }
  return { processed, failed };
}
