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
  zoningType: string;
  buildingRatio: string;
  far: string;
  allowedFloors: string;
  heights: string;
  frontSetback: string;
  sideSetback: string;
  rearSetback: string;
  minSubdivision: string;
  minGreenSpace: string;
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
        "أنت خبير في قراءة وثائق الأراضي الأردنية، خصوصاً وثائق تطبيق سند والمخططات التنظيمية وسجلات دائرة الأراضي وأمانة عمان الكبرى. استخرج البيانات المكتوبة بدقة. أعِد JSON فقط دون أي نص إضافي بالمفاتيح: area, plot, basin, village, coordinates, zoning, zoningType, buildingRatio, far, allowedFloors, heights, frontSetback, sideSetback, rearSetback, minSubdivision, minGreenSpace, notes, confidence. اترك القيمة نصاً فارغاً إذا لم تكن ظاهرة. confidence رقم من 0 إلى 100. التنظيم والاشتراطات التنظيمية استنتجها من الوثيقة أولاً، وإن لم تظهر اذكر الافتراض بوضوح في notes.",
      parts: [
        {
          type: "input_text",
          text: "استخرج بيانات هذه القطعة من الملف المرفق: المساحة، رقم القطعة، الحوض، القرية، الإحداثيات، التنظيم، نسبة البناء، معامل الاستغلال FAR، عدد الأدوار، الارتفاعات، الارتدادات، الحد الأدنى للفرز، والحد الأدنى للمسطح الأخضر. الملف قد يكون وثيقة سند أردنية أو مخططاً تنظيمياً أو سجلاً.",
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
      zoningType: String(parsed.zoningType ?? parsed.zoning ?? ""),
      buildingRatio: String(parsed.buildingRatio ?? ""),
      far: String(parsed.far ?? ""),
      allowedFloors: String(parsed.allowedFloors ?? ""),
      heights: String(parsed.heights ?? ""),
      frontSetback: String(parsed.frontSetback ?? ""),
      sideSetback: String(parsed.sideSetback ?? ""),
      rearSetback: String(parsed.rearSetback ?? ""),
      minSubdivision: String(parsed.minSubdivision ?? ""),
      minGreenSpace: String(parsed.minGreenSpace ?? ""),
      notes: String(parsed.notes ?? ""),
      confidence: Number(parsed.confidence ?? 70),
    };
  });

export type MarketingPackage = {
  titles: string[];
  description: string;
  descriptionParagraphs: string[];
  hashtags: string[];
  channels: string[];
  budget: string;
  postingTime: string;
  pricingStrategy: string;
  expectedTimeToSell: string;
  audience: string;
  urgency: string;
  socialProof: string;
  scarcity: string;
  competitiveEdge: string;
  artOfWar: {
    demandTiming: string;
    knowClient: string;
    differentiate: string;
    deepStrike: string;
  };
};

const MarketingInput = z.object({
  type: z.string(),
  village: z.string(),
  city: z.string(),
  area: z.string(),
  price: z.string(),
  pricePerM: z.string().optional().default(""),
  negotiableRange: z.string().optional().default(""),
  zoning: z.string().optional().default(""),
  regulatorySummary: z.string().optional().default(""),
  features: z.string().optional().default(""),
});

export const generateMarketing = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => MarketingInput.parse(input))
  .handler(async ({ data }): Promise<MarketingPackage> => {
    const raw = await askAI({
      effort: "low",
      instructions:
        "أنت مدير تسويق عقاري أردني محترف وخبير في فن الإقناع. أعِد JSON فقط بالمفاتيح: titles (3 عناوين بالترتيب: عاطفي، منطقي، عاجل), descriptionParagraphs (3 فقرات: جذب عاطفي، تفاصيل فنية، دعوة عاجلة), description (ادمج الفقرات الثلاث بنص واحد), hashtags (10 إلى 15 هاشتاقاً), channels (5 قنوات نشر مناسبة), budget, postingTime, pricingStrategy, expectedTimeToSell, audience, urgency, socialProof, scarcity, competitiveEdge, artOfWar وفيه demandTiming, knowClient, differentiate, deepStrike. طبّق AIDA، محفزات عاطفية مثل فرصة لا تتكرر واستثمر مستقبلك، الندرة، الإلحاح، والإثبات الاجتماعي. اذكر داخل الوصف: تمت مراجعة المخطط التنظيمي للقطعة .. التنظيم: سكن أخضر ج بأحكام خاصة .. إمكانيات تطوير متعددة، أو استخدم التنظيم الفعلي إن توفر. كل النصوص بالعربية ومناسبة للسوق الأردني.",
      parts: [
        {
          type: "input_text",
          text: `النوع: ${data.type}\nالمنطقة: ${data.village} - ${data.city}\nالمساحة: ${data.area} م²\nالسعر الإجمالي المطلوب: ${data.price} دينار\nسعر المتر: ${data.pricePerM} د.أ/م²\nنطاق التفاوض: ${data.negotiableRange || "غير محدد"}\nالتنظيم: ${data.zoning}\nبيانات المخطط التنظيمي: ${data.regulatorySummary}\nالمميزات: ${data.features}`,
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
      descriptionParagraphs: arr(parsed.descriptionParagraphs, [String(parsed.description ?? "")]).slice(0, 3),
      hashtags: arr(parsed.hashtags, ["#عقارات_الأردن", "#عقاري_آي", "#AqariAi"]).slice(0, 15),
      channels: arr(parsed.channels, ["فيسبوك", "إنستغرام", "واتساب", "منصات العقارات"]).slice(0, 5),
      budget: String(parsed.budget ?? "—"),
      postingTime: String(parsed.postingTime ?? "—"),
      pricingStrategy: String(parsed.pricingStrategy ?? "—"),
      expectedTimeToSell: String(parsed.expectedTimeToSell ?? "—"),
      audience: String(parsed.audience ?? "—"),
      urgency: String(parsed.urgency ?? "الفرص المماثلة تتحرك سريعاً عند تسعيرها بذكاء."),
      socialProof: String(parsed.socialProof ?? "هناك طلب نشط من مستثمرين يبحثون عن أراضٍ بهذه المواصفات."),
      scarcity: String(parsed.scarcity ?? "مناطق محدودة تجمع بين هذا السعر وإمكانيات التطوير."),
      competitiveEdge: String(parsed.competitiveEdge ?? "سعر متر واضح مع بيانات تنظيمية موثقة."),
      artOfWar: {
        demandTiming: String(parsed.artOfWar?.demandTiming ?? "اضرب حين يكون الطلب مرتفعاً: الخميس والجمعة مساءً."),
        knowClient: String(parsed.artOfWar?.knowClient ?? "اعرف عميلك: استهدف المستثمر الجاد والعائلة الباحثة عن توسع."),
        differentiate: String(parsed.artOfWar?.differentiate ?? "ميّز نفسك: اعرض التنظيم والسعر بالمتر بوضوح."),
        deepStrike: String(parsed.artOfWar?.deepStrike ?? "اضرب في العمق: وزّع الميزانية على القنوات الأعلى نية شراء."),
      },
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
