import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_REGULATORY_DATA, normalizeArabic, type Property, type RegulatoryData } from "@/lib/data";

export type PropertyRow = {
  id: string;
  owner_id: string;
  title_ar: string;
  desc_ar: string | null;
  type: string;
  deal_type: string;
  price: number | null;
  price_per_m: number | null;
  area_m2: number | null;
  negotiable_min: number | null;
  negotiable_max: number | null;
  governorate: string | null;
  district: string | null;
  basin: string | null;
  plot: string | null;
  zoning: string | null;
  features: string[];
  images: string[];
  coordinates: string | null;
  score: number | null;
  details: Record<string, unknown>;
  status: string;
  views_count: number;
  inquiries_count: number;
  created_at: string;
};

export type DbProperty = Property & {
  ownerId: string;
  regulatory: RegulatoryData;
  score: number;
  publishedAt: string;
  views: number;
  inquiries: number;
  dealType: string;
  negotiableRange: { min: number; max: number } | null;
  images: string[];
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80";

const SAFE_TYPES: Property["type"][] = ["أرض", "فيلا", "شقة", "مشروع"];

export function mapRowToProperty(row: PropertyRow): DbProperty {
  const details = (row.details ?? {}) as { regulatory?: RegulatoryData; summary?: string };
  const score = Math.round(Number(row.score ?? 70));
  return {
    id: row.id,
    title: row.title_ar,
    village: row.district || "غير محدد",
    city: row.governorate || "عمّان",
    basin: row.basin || "غير محدد",
    plot: row.plot || "—",
    area: Number(row.area_m2 ?? 0),
    pricePerM: Number(row.price_per_m ?? 0),
    price: Number(row.price ?? 0),
    zoning: row.zoning || DEFAULT_REGULATORY_DATA.type,
    type: SAFE_TYPES.includes(row.type as Property["type"]) ? (row.type as Property["type"]) : "أرض",
    image: row.images?.[0] || FALLBACK_IMAGE,
    features: row.features ?? [],
    growth: score > 84 ? 16 : 12,
    liquidity: score,
    services: Math.max(70, score - 4),
    summary: row.desc_ar || details.summary || "عقار منشور على منصة عقاري AI.",
    coordinates: row.coordinates || "31.9539, 35.9106",
    ownerId: row.owner_id,
    regulatory: details.regulatory ?? DEFAULT_REGULATORY_DATA,
    score,
    publishedAt: row.created_at,
    views: row.views_count,
    inquiries: row.inquiries_count,
    dealType: row.deal_type,
    negotiableRange:
      row.negotiable_min && row.negotiable_max
        ? { min: Number(row.negotiable_min), max: Number(row.negotiable_max) }
        : null,
    images: row.images ?? [],
  };
}

export async function fetchPublishedProperties(): Promise<DbProperty[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data as unknown as PropertyRow[]).map(mapRowToProperty);
}

export async function fetchPropertyById(id: string): Promise<DbProperty | null> {
  const { data, error } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapRowToProperty(data as unknown as PropertyRow) : null;
}

export async function fetchMyProperties(): Promise<DbProperty[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as PropertyRow[]).map(mapRowToProperty);
}

export type NewPropertyInput = {
  title: string;
  description: string;
  type: string;
  dealType: "بيع" | "إيجار";
  price: number;
  pricePerM: number;
  area: number;
  negotiableMin: number | null;
  negotiableMax: number | null;
  governorate: string;
  district: string;
  basin: string;
  plot: string;
  zoning: string;
  features: string[];
  images: string[];
  coordinates: string;
  score: number;
  regulatory: RegulatoryData;
};

export async function createProperty(input: NewPropertyInput): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("يجب تسجيل الدخول لنشر العقار");

  const areaId = await resolveAreaId(input.district, input.governorate);

  const { data, error } = await supabase
    .from("properties")
    .insert({
      owner_id: userId,
      title_ar: input.title,
      desc_ar: input.description,
      type: input.type,
      deal_type: input.dealType,
      price: input.price,
      price_per_m: input.pricePerM,
      area_m2: input.area,
      negotiable_min: input.negotiableMin,
      negotiable_max: input.negotiableMax,
      governorate: input.governorate,
      district: input.district,
      district_normalized: normalizeArabic(input.district),
      basin: input.basin,
      plot: input.plot,
      zoning: input.zoning,
      area_id: areaId,
      features: input.features,
      images: input.images,
      coordinates: input.coordinates,
      score: input.score,
      details: { regulatory: input.regulatory },
      status: "published",
    })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

async function resolveAreaId(district: string, governorate: string): Promise<string | null> {
  const normalized = normalizeArabic(district);
  if (!normalized) return null;
  const { data } = await supabase
    .from("areas")
    .select("id")
    .eq("name_normalized", normalized)
    .limit(1)
    .maybeSingle();
  if (data) return (data as { id: string }).id;
  const { data: gov } = await supabase
    .from("areas")
    .select("id")
    .eq("name_normalized", normalizeArabic(governorate))
    .limit(1)
    .maybeSingle();
  return gov ? (gov as { id: string }).id : null;
}

/** Compresses an image in the browser before upload (max 1600px, JPEG q0.8). */
export async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.8),
    );
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

/** Uploads images to the private property-images bucket and returns signed URLs. */
export async function uploadPropertyImages(files: File[]): Promise<string[]> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("يجب تسجيل الدخول لرفع الصور");

  const urls: string[] = [];
  for (const file of files) {
    const body = await compressImage(file);
    const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage.from("property-images").upload(path, body, {
      contentType: body.type || "image/jpeg",
      upsert: false,
    });
    if (error) throw error;
    const { data: signed } = await supabase.storage
      .from("property-images")
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    if (signed?.signedUrl) urls.push(signed.signedUrl);
  }
  return urls;
}

export async function fetchFavorites(): Promise<string[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase.from("favorites").select("property_id");
  if (error) return [];
  return (data as { property_id: string }[]).map((row) => row.property_id);
}

export async function toggleFavorite(propertyId: string, isFavorite: boolean): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("سجّل الدخول لحفظ المفضلة");
  if (isFavorite) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("property_id", propertyId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("favorites")
      .insert({ user_id: userId, property_id: propertyId });
    if (error) throw error;
  }
}

export async function createInquiry(propertyId: string, message: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("سجّل الدخول لإرسال الاستفسار");
  const { error } = await supabase
    .from("inquiries")
    .insert({ property_id: propertyId, user_id: userId, message });
  if (error) throw error;
}

export async function registerView(propertyId: string): Promise<void> {
  await supabase.rpc("increment_property_views", { _property_id: propertyId });
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/** Uploads already-previewed images (data URLs) to storage and returns signed URLs. */
export async function uploadImageDataUrls(items: { name: string; url: string }[]): Promise<string[]> {
  const files: File[] = [];
  for (const item of items) {
    if (!item.url.startsWith("data:image/")) continue;
    const blob = await (await fetch(item.url)).blob();
    files.push(new File([blob], item.name, { type: blob.type }));
  }
  if (!files.length) return [];
  return uploadPropertyImages(files);
}
