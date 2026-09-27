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
