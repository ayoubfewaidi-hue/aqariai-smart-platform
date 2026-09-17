import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg"];

const UploadInput = z.object({
  fileDataUrl: z.string().min(30),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive().max(MAX_FILE_SIZE),
  category: z.string().min(1),
});

function decodeDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("صيغة الملف غير مدعومة.");

  const mimeType = match[1] ?? "";
  const encoded = match[2] ?? "";
  const bytes = Uint8Array.from(Buffer.from(encoded, "base64"));
  return { mimeType, bytes };
}

function safeName(name: string) {
  return name.replace(/[^\p{L}\p{N}._-]+/gu, "-").replace(/-+/g, "-").slice(0, 90);
}

export const uploadSellerDocument = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => UploadInput.parse(input))
  .handler(async ({ data }) => {
    if (!ALLOWED_MIME_TYPES.includes(data.mimeType)) {
      throw new Error("ندعم PDF و PNG و JPG فقط.");
    }

    const decoded = decodeDataUrl(data.fileDataUrl);
    if (decoded.mimeType !== data.mimeType) {
      throw new Error("نوع الملف لا يطابق محتواه.");
    }
    if (decoded.bytes.byteLength > MAX_FILE_SIZE) {
      throw new Error("حجم الملف يتجاوز 15 ميجابايت.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `seller-uploads/${Date.now()}-${crypto.randomUUID()}-${safeName(data.fileName)}`;
    const { error } = await supabaseAdmin.storage.from("seller-documents").upload(path, decoded.bytes, {
      contentType: data.mimeType,
      upsert: false,
      metadata: { category: data.category, originalName: data.fileName },
    });

    if (error) throw new Error(`تعذر حفظ الملف: ${error.message}`);
    return { path, verified: true };
  });