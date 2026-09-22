import { createServerFn } from "@tanstack/react-start";

import { SEARCH_AREAS, normalizeArabic } from "@/lib/data";

/**
 * Seeds the hierarchical areas table (country → governorate → district)
 * from the bundled Jordan area dataset. Idempotent.
 */
export const syncAreas = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const countryName = "الأردن";
  await supabaseAdmin
    .from("areas")
    .upsert(
      { name_ar: countryName, name_normalized: normalizeArabic(countryName), level: "country" },
      { onConflict: "name_normalized,level" },
    );
  const { data: country } = await supabaseAdmin
    .from("areas")
    .select("id")
    .eq("level", "country")
    .eq("name_normalized", normalizeArabic(countryName))
    .maybeSingle();
  const countryId = (country as { id: string } | null)?.id ?? null;

  const cities = Array.from(new Set(SEARCH_AREAS.map((area) => area.city)));
  await supabaseAdmin.from("areas").upsert(
    cities.map((city) => ({
      name_ar: city,
      name_normalized: normalizeArabic(city),
      level: "governorate" as const,
      parent_id: countryId,
    })),
    { onConflict: "name_normalized,level" },
  );

  const { data: governorates } = await supabaseAdmin
    .from("areas")
    .select("id, name_normalized")
    .eq("level", "governorate");
  const govByName = new Map(
    ((governorates ?? []) as { id: string; name_normalized: string }[]).map((row) => [
      row.name_normalized,
      row.id,
    ]),
  );

  const districts = SEARCH_AREAS.map((area) => ({
    name_ar: area.name,
    name_normalized: normalizeArabic(area.name),
    level: "district" as const,
    parent_id: govByName.get(normalizeArabic(area.city)) ?? countryId,
    lat: area.lat,
    lng: area.lng,
  }));

  // de-duplicate normalized names inside the batch
  const seen = new Set<string>();
  const uniqueDistricts = districts.filter((row) => {
    if (seen.has(row.name_normalized)) return false;
    seen.add(row.name_normalized);
    return true;
  });

  const { error } = await supabaseAdmin
    .from("areas")
    .upsert(uniqueDistricts, { onConflict: "name_normalized,level" });
  if (error) throw error;

  return { countries: 1, governorates: cities.length, districts: uniqueDistricts.length };
});
