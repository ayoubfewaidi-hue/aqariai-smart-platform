import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { askAI, parseJsonBlock } from "./ai-gateway.server";

export type PlanData = {
  area: string;
  plot: string;
  basin: string;
  village: string;
  coordinates: string;
  zoning: string;
  notes: string;
  confidence: number;
};

const ExtractInput = z.object({
  fileDataUrl: z.string().min(30),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
});

export const extractPlanData = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ExtractInput.parse(input))
  .handler(async ({ data }): Promise<PlanData> => {
    const isPdf = data.mimeType === "application/pdf" || data.fileName.toLowerCase().endsWith(".pdf");
    const raw = await askAI({
      effort: "low",
      instructions:
        "أنت خبير في قراءة وثائق الأراضي الأردنية، خصوصاً وثائق تطبيق سند والمخططات التنظيمية وسجلات دائرة الأراضي. استخرج البيانات المكتوبة بدقة. أعِد JSON فقط دون أي نص إضافي بالمفاتيح: area, plot, basin, village, coordinates, zoning, notes, confidence. اترك القيمة نصاً فارغاً إذا لم تكن ظاهرة. confidence رقم من 0 إلى 100. التنظيم (zoning) استنتجه من الوثيقة أو من التنظيم المعتاد للمنطقة واذكر ذلك في notes.",
      parts: [
        {
          type: "input_text",
          text: "استخرج بيانات هذه القطعة من الملف المرفق: المساحة، رقم القطعة، الحوض، القرية، الإحداثيات، التنظيم. الملف قد يكون وثيقة سند أردنية أو مخططاً تنظيمياً أو سجلاً.",
        },
        isPdf
          ? { type: "input_file", filename: data.fileName, file_data: data.fileDataUrl }
          : { type: "input_image", image_url: data.fileDataUrl },
      ],
    });

    const parsed = parseJsonBlock<Partial<PlanData>>(raw);
    if (!parsed) throw new Error("تعذر قراءة المخطط بوضوح. جرّب صورة أوضح أو أدخل البيانات يدوياً.");

    return {
      area: String(parsed.area ?? ""),
      plot: String(parsed.plot ?? ""),
      basin: String(parsed.basin ?? ""),
      village: String(parsed.village ?? ""),
      coordinates: String(parsed.coordinates ?? ""),
      zoning: String(parsed.zoning ?? ""),
      notes: String(parsed.notes ?? ""),
      confidence: Number(parsed.confidence ?? 70),
    };
  });

export type MarketingPackage = {
  titles: string[];
  description: string;
  hashtags: string[];
  channels: string[];
  budget: string;
  postingTime: string;
  pricingStrategy: string;
  expectedTimeToSell: string;
  audience: string;
};

const MarketingInput = z.object({
  type: z.string(),
  village: z.string(),
  city: z.string(),
  area: z.string(),
  price: z.string(),
  zoning: z.string().optional().default(""),
  features: z.string().optional().default(""),
});

export const generateMarketing = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => MarketingInput.parse(input))
  .handler(async ({ data }): Promise<MarketingPackage> => {
    const raw = await askAI({
      effort: "low",
      instructions:
        "أنت مدير تسويق عقاري أردني محترف. أعِد JSON فقط بالمفاتيح: titles (3 عناوين إعلانية جاذبة), description (وصف تسويقي كامل 90-140 كلمة), hashtags (6 هاشتاقات عربية), channels (4 قنوات نشر مناسبة), budget (ميزانية إعلانية مقترحة بالدينار الأردني), postingTime (أفضل وقت وأيام للنشر), pricingStrategy (استراتيجية تسعير), expectedTimeToSell (المدة المتوقعة للبيع), audience (الجمهور المستهدف). كل النصوص بالعربية.",
      parts: [
        {
          type: "input_text",
          text: `النوع: ${data.type}\nالمنطقة: ${data.village} - ${data.city}\nالمساحة: ${data.area} م²\nالسعر المطلوب: ${data.price} دينار\nالتنظيم: ${data.zoning}\nالمميزات: ${data.features}`,
        },
      ],
    });

    const parsed = parseJsonBlock<Partial<MarketingPackage>>(raw);
    if (!parsed) throw new Error("تعذر توليد الحزمة التسويقية. حاول مرة أخرى.");

    const arr = (v: unknown, fallback: string[]) =>
      Array.isArray(v) && v.length ? v.map(String) : fallback;

    return {
      titles: arr(parsed.titles, ["فرصة عقارية مميزة"]).slice(0, 3),
      description: String(parsed.description ?? ""),
      hashtags: arr(parsed.hashtags, ["#عقارات_الأردن"]).slice(0, 8),
      channels: arr(parsed.channels, ["فيسبوك", "إنستغرام", "واتساب", "منصات العقارات"]).slice(0, 5),
      budget: String(parsed.budget ?? "—"),
      postingTime: String(parsed.postingTime ?? "—"),
      pricingStrategy: String(parsed.pricingStrategy ?? "—"),
      expectedTimeToSell: String(parsed.expectedTimeToSell ?? "—"),
      audience: String(parsed.audience ?? "—"),
    };
  });

const AdvisorInput = z.object({
  message: z.string().min(1),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string() }))
    .max(20)
    .optional()
    .default([]),
  catalog: z.string(),
  profile: z.string(),
});

export const askAdvisor = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AdvisorInput.parse(input))
  .handler(async ({ data }): Promise<{ reply: string }> => {
    const transcript = data.history.map((m) => `${m.role === "user" ? "المشتري" : "المستشار"}: ${m.text}`).join("\n");
    const reply = await askAI({
      effort: "low",
      instructions:
        "أنت مستشار عقاري أردني ذكي داخل منصة عقاري AI. أجب بالعربية بإيجاز (حتى 120 كلمة) ورشّح من العقارات المتاحة فقط، مع ذكر سبب الترشيح ونقطة المطابقة. لا تخترع عقارات غير موجودة. اقترح خطوة تالية واضحة مثل حجز معاينة. اكتب نصاً عادياً بدون أي تنسيق ماركداون ولا نجوم ولا رموز.",
      parts: [
        {
          type: "input_text",
          text: `العقارات المتاحة:\n${data.catalog}\n\nملف المشتري:\n${data.profile}\n\nالمحادثة السابقة:\n${transcript}\n\nسؤال المشتري: ${data.message}`,
        },
      ],
    });
    const clean = reply.replace(/\*\*/g, "").replace(/^#+\s*/gm, "").trim();
    return { reply: clean || "لم أتمكن من صياغة إجابة الآن، جرّب صياغة سؤالك بشكل مختلف." };
  });
