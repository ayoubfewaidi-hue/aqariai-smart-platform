import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  BadgeCheck,
  CheckCircle2,
  FileImage,
  FileText,
  Hash,
  Megaphone,
  Paperclip,
  Rocket,
  ScanLine,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import {
  EmptyState,
  ErrorNote,
  Field,
  GlassCard,
  GoldButton,
  SectionTitle,
  SiteFooter,
  SiteHeader,
  Skeleton,
  Stat,
} from "@/components/ui-kit";
import { extractPlanData, generateMarketing, type MarketingPackage, type PlanData } from "@/lib/ai.functions";
import { fmt } from "@/lib/data";

export const Route = createFileRoute("/seller")({
  head: () => ({
    meta: [
      { title: "بوابة البائع | عقاري AI" },
      {
        name: "description",
        content:
          "ارفع مخطط أرضك ليستخرج الذكاء الاصطناعي المساحة ورقم القطعة والحوض والقرية والتنظيم، ثم ولّد حزمة تسويقية وانشرها بضغطة.",
      },
      { property: "og:title", content: "بوابة البائع | عقاري AI" },
      {
        property: "og:description",
        content: "استخراج بيانات المخطط، مرفقات موثّقة، وتسويق تلقائي لعقارك.",
      },
    ],
  }),
  component: SellerPortal,
});

type PropertyForm = {
  area: string;
  plot: string;
  basin: string;
  village: string;
  city: string;
  coordinates: string;
  zoning: string;
  price: string;
  type: string;
  features: string;
};

const EMPTY_FORM: PropertyForm = {
  area: "",
  plot: "",
  basin: "",
  village: "",
  city: "عمّان",
  coordinates: "",
  zoning: "",
  price: "",
  type: "أرض",
  features: "",
};

type Attachment = {
  id: string;
  name: string;
  category: string;
  url: string;
  isImage: boolean;
  verified: boolean;
};

const CATEGORIES = [
  "صورة المخطط",
  "ترخيص البناء",
  "وثيقة الملكية",
  "صور إضافية",
  "مستندات أخرى",
];

function SellerPortal() {
  const extract = useServerFn(extractPlanData);
  const marketing = useServerFn(generateMarketing);

  const [planPreview, setPlanPreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<PlanData | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<PropertyForm>(EMPTY_FORM);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [category, setCategory] = useState<string>("صورة المخطط");

  const [pkg, setPkg] = useState<MarketingPackage | null>(null);
  const [pkgLoading, setPkgLoading] = useState(false);
  const [pkgError, setPkgError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [dragging, setDragging] = useState(false);

  const planInput = useRef<HTMLInputElement>(null);
  const filesInput = useRef<HTMLInputElement>(null);

  const set = (k: keyof PropertyForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handlePlanFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("يرجى رفع صورة للمخطط (JPG أو PNG).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("حجم الصورة كبير، الحد الأقصى 8 ميجابايت.");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setPlanPreview(dataUrl);
    setExtracted(null);
    setConfirmed(false);
    setError(null);
    setExtracting(true);
    try {
      const data = await extract({ data: { imageDataUrl: dataUrl } });
      setExtracted(data);
      setForm((f) => ({
        ...f,
        area: data.area || f.area,
        plot: data.plot || f.plot,
        basin: data.basin || f.basin,
        village: data.village || f.village,
        coordinates: data.coordinates || f.coordinates,
        zoning: data.zoning || f.zoning,
      }));
      setAttachments((a) => [
        ...a,
        {
          id: crypto.randomUUID(),
          name: file.name,
          category: "صورة المخطط",
          url: dataUrl,
          isImage: true,
          verified: true,
        },
      ]);
      toast.success("تم استخراج بيانات المخطط");
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر تحليل المخطط.");
    } finally {
      setExtracting(false);
    }
  }

  async function handleAttachments(files: FileList | null) {
    if (!files?.length) return;
    const next: Attachment[] = [];
    for (const file of Array.from(files).slice(0, 8)) {
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`${file.name}: الحجم أكبر من 8 ميجابايت`);
        continue;
      }
      const isImage = file.type.startsWith("image/");
      next.push({
        id: crypto.randomUUID(),
        name: file.name,
        category,
        url: isImage ? await fileToDataUrl(file) : "",
        isImage,
        verified: false,
      });
    }
    setAttachments((a) => [...a, ...next]);
    if (next.length) toast.success(`تم إضافة ${next.length} مرفق`);
  }

  const areaNum = Number(form.area.replace(/[^\d.]/g, "")) || 0;
  const priceNum = Number(form.price.replace(/[^\d.]/g, "")) || 0;
  const pricePerM = areaNum && priceNum ? Math.round(priceNum / areaNum) : 0;
  const ready = areaNum > 0 && priceNum > 0 && form.village.trim().length > 0;

  async function buildMarketing() {
    setPkgError(null);
    setPkgLoading(true);
    setPublished(false);
    try {
      const result = await marketing({
        data: {
          type: form.type,
          village: form.village,
          city: form.city,
          area: form.area,
          price: form.price,
          zoning: form.zoning,
          features: form.features,
        },
      });
      setPkg(result);
      toast.success("جهّزنا الحزمة التسويقية");
    } catch (e) {
      setPkgError(e instanceof Error ? e.message : "تعذر توليد التسويق.");
    } finally {
      setPkgLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl space-y-10 px-4 py-10">
        <SectionTitle
          eyebrow="بوابة البائع"
          title="ارفع مخطط الأرض ودع الذكاء يكمل الباقي"
          desc="خطوة واحدة للرفع، والاستخراج والتحليل والتسويق تحدث تلقائياً."
        />

        {/* 1. Upload plan */}
        <GlassCard strong className="fade-up space-y-4">
          <StepHead n={1} title="ارفع مخطط الأرض" icon={<ScanLine className="size-4" />} />
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void handlePlanFile(file);
            }}
            onClick={() => planInput.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${
              dragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/60"
            }`}
          >
            <UploadCloud className="mx-auto size-9 text-primary" />
            <p className="mt-3 text-sm font-bold">اسحب صورة المخطط وأفلتها هنا</p>
            <p className="mt-1 text-xs text-muted-foreground">أو اضغط للاختيار — JPG / PNG حتى 8MB</p>
            <input
              ref={planInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handlePlanFile(file);
                e.target.value = "";
              }}
            />
          </div>

          {planPreview ? (
            <img
              src={planPreview}
              alt="معاينة مخطط الأرض المرفوع"
              className="max-h-64 w-full rounded-xl border border-border object-contain"
            />
          ) : null}

          {extracting ? (
            <div className="space-y-2">
              <p className="text-sm text-primary">جارٍ قراءة المخطط واستخراج البيانات…</p>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-2/3" />
            </div>
          ) : null}

          {error ? <ErrorNote message={error} /> : null}

          {extracted && !extracting ? (
            <div className="fade-up space-y-3 rounded-2xl border border-primary/35 bg-primary/5 p-4">
              <p className="text-sm font-bold">
                استخرجنا البيانات التالية من المخطط .. هل هي صحيحة؟
                <span className="ms-2 text-xs font-normal text-muted-foreground">
                  (دقة تقديرية {Math.round(extracted.confidence)}%)
                </span>
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  ["المساحة", form.area],
                  ["رقم القطعة", form.plot],
                  ["الحوض", form.basin],
                  ["القرية", form.village],
                  ["الإحداثيات", form.coordinates],
                  ["التنظيم", form.zoning],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-border bg-background/30 px-3 py-2">
                    <p className="text-[11px] text-muted-foreground">{k}</p>
                    <p className="text-sm font-semibold">{v || "غير ظاهر في المخطط"}</p>
                  </div>
                ))}
              </div>
              {extracted.notes ? (
                <p className="text-xs text-muted-foreground">ملاحظة الذكاء: {extracted.notes}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <GoldButton onClick={() => setConfirmed(true)}>
                  <CheckCircle2 className="size-4" /> نعم، صحيحة
                </GoldButton>
                <GoldButton
                  variant="outline"
                  onClick={() => {
                    setConfirmed(false);
                    toast.info("عدّل الحقول في الخطوة الثانية بالأسفل");
                  }}
                >
                  أريد التعديل
                </GoldButton>
              </div>
              {confirmed ? (
                <p className="text-xs font-semibold text-secondary-foreground">
                  ✓ تم تأكيد البيانات ونقلها إلى بيانات العقار.
                </p>
              ) : null}
            </div>
          ) : null}
        </GlassCard>

        {/* 2. Data */}
        <GlassCard className="fade-up space-y-4">
          <StepHead n={2} title="بيانات العقار (قابلة للتعديل)" icon={<FileText className="size-4" />} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="المساحة (م²)" value={form.area} onChange={set("area")} placeholder="1000" />
            <Field label="رقم القطعة" value={form.plot} onChange={set("plot")} placeholder="1178" />
            <Field label="الحوض" value={form.basin} onChange={set("basin")} placeholder="حوض 4" />
            <Field label="القرية / الحي" value={form.village} onChange={set("village")} placeholder="دابوق" />
            <Field label="المدينة" value={form.city} onChange={set("city")} />
            <Field label="الإحداثيات" value={form.coordinates} onChange={set("coordinates")} placeholder="31.98, 35.80" />
            <Field label="التنظيم" value={form.zoning} onChange={set("zoning")} placeholder="سكن ب" />
            <Field label="السعر المطلوب (د.أ)" value={form.price} onChange={set("price")} placeholder="520000" />
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">نوع العقار</span>
              <select
                value={form.type}
                onChange={(e) => set("type")(e.target.value)}
                className="w-full rounded-xl border border-input bg-background/40 px-3 py-2.5 text-sm outline-none focus:border-primary/70"
              >
                {["أرض", "فيلا", "شقة", "مشروع"].map((t) => (
                  <option key={t} value={t} className="bg-card">
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Field
            label="المميزات (افصل بفاصلة)"
            value={form.features}
            onChange={set("features")}
            placeholder="شارعان، إطلالة مفتوحة، خدمات واصلة"
          />
        </GlassCard>

        {/* 3. Attachments */}
        <GlassCard className="fade-up space-y-4">
          <StepHead n={3} title="المرفقات والمستندات" icon={<Paperclip className="size-4" />} />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  category === c
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <GoldButton variant="outline" onClick={() => filesInput.current?.click()}>
            <UploadCloud className="size-4" /> إضافة ملفات إلى «{category}»
          </GoldButton>
          <input
            ref={filesInput}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              void handleAttachments(e.target.files);
              e.target.value = "";
            }}
          />

          {attachments.length === 0 ? (
            <EmptyState
              icon={<FileImage className="size-8" />}
              title="لا توجد مرفقات بعد"
              desc="أضف صورة المخطط، ترخيص البناء، وثيقة الملكية أو صوراً إضافية لزيادة ثقة المشترين."
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {attachments.map((a) => (
                <li key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-background/30 p-3">
                  {a.isImage && a.url ? (
                    <img src={a.url} alt={a.name} className="size-14 rounded-lg object-cover" />
                  ) : (
                    <span className="grid size-14 place-items-center rounded-lg bg-accent text-primary">
                      <FileText className="size-6" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{a.name}</p>
                    <p className="text-[11px] text-muted-foreground">{a.category}</p>
                  </div>
                  <button
                    onClick={() =>
                      setAttachments((list) =>
                        list.map((x) => (x.id === a.id ? { ...x, verified: !x.verified } : x)),
                      )
                    }
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                      a.verified
                        ? "bg-secondary text-secondary-foreground"
                        : "border border-primary/40 text-primary hover:bg-primary/10"
                    }`}
                  >
                    <BadgeCheck className="size-3.5" /> {a.verified ? "موثّق" : "تحقق"}
                  </button>
                  <button
                    onClick={() => setAttachments((list) => list.filter((x) => x.id !== a.id))}
                    aria-label={`حذف ${a.name}`}
                    className="text-muted-foreground transition hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[11px] text-muted-foreground">
            تُحفظ المرفقات في هذه الجلسة فقط. لتخزين دائم ومشاركة مع المشترين نحتاج تشغيل التخزين
            السحابي للمنصة.
          </p>
        </GlassCard>

        {/* 4. Analysis */}
        <GlassCard className="fade-up space-y-4">
          <StepHead n={4} title="مراجعة النتائج والتحليل" icon={<Hash className="size-4" />} />
          {!ready ? (
            <EmptyState
              icon={<Hash className="size-8" />}
              title="أكمل المساحة والسعر والمنطقة"
              desc="بعد تعبئة هذه الحقول سنحسب سعر المتر ومؤشرات التحليل فوراً."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="سعر المتر" value={`${fmt(pricePerM)} د.أ`} />
              <Stat label="السعر الإجمالي" value={`${fmt(priceNum)} د.أ`} />
              <Stat label="المساحة" value={`${fmt(areaNum)} م²`} hint={form.zoning || "تنظيم غير محدد"} />
              <Stat
                label="مستوى الجاهزية"
                value={`${Math.min(100, 40 + attachments.length * 12 + (extracted ? 20 : 0))}%`}
                hint="يزيد بإضافة المرفقات"
              />
            </div>
          )}
        </GlassCard>

        {/* 5 & 6. Marketing + publish */}
        <GlassCard strong className="fade-up space-y-4">
          <StepHead n={5} title="توليد التسويق والنشر" icon={<Megaphone className="size-4" />} />
          <div className="flex flex-wrap gap-2">
            <GoldButton onClick={buildMarketing} loading={pkgLoading} disabled={!ready}>
              <Megaphone className="size-4" /> ولّد الحزمة التسويقية
            </GoldButton>
            <GoldButton
              variant="emerald"
              disabled={!pkg}
              onClick={() => {
                setPublished(true);
                toast.success("تم نشر العقار على القنوات المقترحة");
              }}
            >
              <Rocket className="size-4" /> انشر الآن
            </GoldButton>
          </div>
          {!ready ? (
            <p className="text-xs text-muted-foreground">أكمل بيانات العقار لتفعيل التوليد.</p>
          ) : null}
          {pkgError ? <ErrorNote message={pkgError} /> : null}

          {pkgLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-8 w-2/3" />
            </div>
          ) : null}

          {pkg && !pkgLoading ? (
            <div className="fade-up space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-bold text-primary">٣ عناوين إعلانية</p>
                {pkg.titles.map((t) => (
                  <p key={t} className="rounded-xl border border-border bg-background/30 px-3 py-2 text-sm">
                    {t}
                  </p>
                ))}
              </div>
              <div>
                <p className="mb-1 text-xs font-bold text-primary">الوصف التسويقي</p>
                <p className="rounded-xl border border-border bg-background/30 p-3 text-sm leading-relaxed">
                  {pkg.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {pkg.hashtags.map((h) => (
                  <span key={h} className="rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold text-primary">
                    {h}
                  </span>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat label="قنوات النشر" value={pkg.channels.join(" · ")} />
                <Stat label="الميزانية المقترحة" value={pkg.budget} />
                <Stat label="أفضل وقت للنشر" value={pkg.postingTime} />
                <Stat label="استراتيجية التسعير" value={pkg.pricingStrategy} />
                <Stat label="المدة المتوقعة للبيع" value={pkg.expectedTimeToSell} />
                <Stat label="الجمهور المستهدف" value={pkg.audience} />
              </div>
            </div>
          ) : null}

          {published ? (
            <p className="fade-up rounded-xl border border-secondary/60 bg-secondary/20 px-4 py-3 text-sm font-bold">
              🎉 عقارك منشور الآن ويظهر للمشترين المطابقين مع درجة مطابقة محسوبة.
            </p>
          ) : null}
        </GlassCard>
      </main>
      <SiteFooter />
    </div>
  );
}

function StepHead({ n, title, icon }: { n: number; title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-8 place-items-center rounded-xl bg-primary/15 text-sm font-black text-primary">
        {n}
      </span>
      <h3 className="flex items-center gap-2 text-base font-bold">
        <span className="text-primary">{icon}</span>
        {title}
      </h3>
    </div>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("تعذر قراءة الملف"));
    reader.readAsDataURL(file);
  });
}
