import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  BadgeCheck,
  CheckCircle2,
  Eye,
  FileImage,
  FileText,
  Hash,
  Megaphone,
  Paperclip,
  Rocket,
  ScanLine,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
import { supabase } from "@/integrations/supabase/client";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  mimeType: string;
  size: number;
  path?: string;
  isImage: boolean;
  isPdf: boolean;
  verified: boolean;
  progress: number;
  status: "uploading" | "uploaded" | "error";
};

type PreviewFile = {
  name: string;
  url: string;
  mimeType: string;
};

const CATEGORIES = [
  "صورة المخطط",
  "ترخيص البناء",
  "وثيقة الملكية",
  "صور إضافية",
  "مستندات أخرى",
];

const ACCEPTED_FILE_TYPES = ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg";
const MAX_UPLOAD_SIZE = 15 * 1024 * 1024;
const MAX_UPLOAD_FILES = 5;

function SellerPortal() {
  const extract = useServerFn(extractPlanData);
  const marketing = useServerFn(generateMarketing);

  const [planPreview, setPlanPreview] = useState<PreviewFile | null>(null);
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
  const [viewer, setViewer] = useState<PreviewFile | null>(null);

  const planInput = useRef<HTMLInputElement>(null);
  const filesInput = useRef<HTMLInputElement>(null);

  const set = (k: keyof PropertyForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handlePlanFiles(fileList: FileList | File[]) {
    const files = validateFiles(Array.from(fileList));
    const primary = files.at(0);
    if (!primary) return;

    const dataUrl = await fileToDataUrl(primary.file);
    setPlanPreview({ name: primary.file.name, url: dataUrl, mimeType: primary.mimeType });
    setExtracted(null);
    setConfirmed(false);
    setError(null);
    files.forEach((item, index) => {
      if (index === 0) void uploadAttachment(item.file, "صورة المخطط", dataUrl, primary.mimeType);
      else void uploadAttachment(item.file, "صورة المخطط", undefined, item.mimeType);
    });
    setExtracting(true);
    try {
      const data = await extract({
        data: { fileDataUrl: dataUrl, fileName: primary.file.name, mimeType: primary.mimeType },
      });
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
      toast.success("تم استخراج بيانات الملف");
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر تحليل الملف.");
    } finally {
      setExtracting(false);
    }
  }

  async function handleAttachments(files: FileList | null) {
    if (!files?.length) return;
    const valid = validateFiles(Array.from(files));
    valid.forEach((item) => void uploadAttachment(item.file, category, undefined, item.mimeType));
  }

  async function uploadAttachment(file: File, selectedCategory: string, knownDataUrl?: string, knownMimeType?: string) {
    const mimeType = knownMimeType || getMimeType(file);
    if (!mimeType) return;
    const dataUrl = knownDataUrl || (await fileToDataUrl(file));
    const id = crypto.randomUUID();
    const isImage = mimeType.startsWith("image/");
    const isPdf = mimeType === "application/pdf";
    setAttachments((items) => [
      ...items,
      {
        id,
        name: file.name,
        category: selectedCategory,
        url: dataUrl,
        mimeType,
        size: file.size,
        isImage,
        isPdf,
        verified: false,
        progress: 8,
        status: "uploading",
      },
    ]);

    const timer = setInterval(() => {
      setAttachments((items) =>
        items.map((item) =>
          item.id === id && item.status === "uploading"
            ? { ...item, progress: Math.min(88, item.progress + 16) }
            : item,
        ),
      );
    }, 240);

    try {
      const path = `seller-uploads/${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage.from("seller-documents").upload(path, file, {
        contentType: mimeType,
        upsert: false,
      });
      if (uploadError) throw uploadError;
      setAttachments((items) =>
        items.map((item) =>
          item.id === id ? { ...item, path, progress: 100, status: "uploaded", verified: true } : item,
        ),
      );
      toast.success(`${file.name}: تم الرفع والتحقق`);
    } catch (uploadError) {
      setAttachments((items) =>
        items.map((item) => (item.id === id ? { ...item, progress: 100, status: "error", verified: false } : item)),
      );
      toast.error(uploadError instanceof Error ? uploadError.message : `تعذر رفع ${file.name}`);
    } finally {
      clearInterval(timer);
    }
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
          desc="ارفع وثيقة سند أو مخططاً تنظيمياً أو سجلاً — ندعم جميع الصيغ"
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
              if (e.dataTransfer.files?.length) void handlePlanFiles(e.dataTransfer.files);
            }}
            onClick={() => planInput.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
              dragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/60"
            }`}
          >
            <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-primary/35 bg-primary/10">
              <UploadCloud className="size-8 text-primary" />
            </div>
            <p className="mt-4 text-base font-black">اسحب المخطط هنا أو اختر ملفاً</p>
            <p className="mt-1 text-sm text-muted-foreground">PDF / PNG / JPG — بحد أقصى 15 ميجابايت</p>
            <div className="mt-4 flex justify-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/12 px-3 py-1 text-xs font-bold text-destructive">
                <FileText className="size-3.5" /> PDF
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-chart-3/15 px-3 py-1 text-xs font-bold text-chart-3">
                <FileImage className="size-3.5" /> Images
              </span>
            </div>
            <input
              ref={planInput}
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) void handlePlanFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {planPreview ? (
            <div className="fade-up overflow-hidden rounded-2xl border border-border bg-background/30">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <FileBadge mimeType={planPreview.mimeType} />
                  <p className="truncate text-sm font-bold">{planPreview.name}</p>
                </div>
                <GoldButton variant="outline" className="px-3 py-2" onClick={() => setViewer(planPreview)}>
                  <Eye className="size-4" /> عرض
                </GoldButton>
              </div>
              {planPreview.mimeType === "application/pdf" ? (
                <PdfPreview file={planPreview} className="h-72 w-full" />
              ) : (
                <img
                  src={planPreview.url}
                  alt="معاينة مخطط الأرض المرفوع"
                  className="max-h-72 w-full object-contain"
                />
              )}
            </div>
          ) : null}

          {extracting ? (
            <div className="space-y-2">
              <p className="text-sm text-primary">جارٍ قراءة الملف واستخراج البيانات…</p>
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
                    <p className="text-sm font-semibold">{v || "غير ظاهر في الملف"}</p>
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
                type="button"
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
            accept={ACCEPTED_FILE_TYPES}
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
                <li key={a.id} className="grid gap-3 rounded-xl border border-border bg-background/30 p-3 sm:grid-cols-[4.5rem_1fr_auto_auto] sm:items-center">
                  <button
                    type="button"
                    onClick={() => setViewer({ name: a.name, url: a.url, mimeType: a.mimeType })}
                    className="relative size-16 overflow-hidden rounded-lg border border-border bg-accent text-primary"
                    aria-label={`عرض ${a.name}`}
                  >
                    {a.isImage ? (
                      <img src={a.url} alt={a.name} className="size-full object-cover" />
                    ) : a.isPdf ? (
                      <PdfPreview file={{ name: a.name, url: a.url, mimeType: a.mimeType }} compact className="size-full" />
                    ) : (
                      <FileText className="m-auto mt-5 size-6" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <FileBadge mimeType={a.mimeType} />
                      <p className="truncate text-sm font-semibold">{a.name}</p>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {a.category} · {formatSize(a.size)}
                    </p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background/60">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          a.status === "error" ? "bg-destructive" : "bg-secondary"
                        }`}
                        style={{ width: `${a.progress}%` }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewer({ name: a.name, url: a.url, mimeType: a.mimeType })}
                    className="inline-flex items-center justify-center gap-1 rounded-full border border-primary/40 px-2.5 py-1 text-[11px] font-bold text-primary transition hover:bg-primary/10"
                  >
                    <Eye className="size-3.5" /> عرض
                  </button>
                  <button
                    type="button"
                    disabled={a.status === "uploading"}
                    className={`inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-70 ${
                      a.status === "error"
                        ? "border border-destructive/40 text-destructive"
                        : a.verified
                          ? "bg-secondary text-secondary-foreground"
                          : "border border-primary/40 text-primary"
                    }`}
                  >
                    <BadgeCheck className="size-3.5" />
                    {a.status === "uploading" ? "جارٍ الرفع" : a.status === "error" ? "لم يكتمل" : "تحقق"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttachments((list) => list.filter((x) => x.id !== a.id))}
                    aria-label={`حذف ${a.name}`}
                    className="justify-self-start text-muted-foreground transition hover:text-destructive sm:justify-self-center"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[11px] text-muted-foreground">
            تُحفظ المرفقات في مساحة آمنة خاصة، وتظهر شارة تحقق بعد اكتمال الرفع بنجاح.
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
      {viewer ? <FileViewer file={viewer} onClose={() => setViewer(null)} /> : null}
    </div>
  );
}

function StepHead({ n, title, icon }: { n: number; title: string; icon: ReactNode }) {
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

function FileBadge({ mimeType }: { mimeType: string }) {
  const isPdf = mimeType === "application/pdf";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-black ${
        isPdf ? "bg-destructive/12 text-destructive" : "bg-chart-3/15 text-chart-3"
      }`}
    >
      {isPdf ? <FileText className="size-3" /> : <FileImage className="size-3" />}
      {isPdf ? "PDF" : "IMG"}
    </span>
  );
}

function FileViewer({ file, onClose }: { file: PreviewFile; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xl">
      <div className="glass-strong flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <FileBadge mimeType={file.mimeType} />
            <p className="truncate text-sm font-bold">{file.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق المعاينة"
            className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        {file.mimeType === "application/pdf" ? (
          <PdfPreview file={file} className="h-[76vh] w-full" />
        ) : (
          <img src={file.url} alt={file.name} className="max-h-[76vh] w-full object-contain p-4" />
        )}
      </div>
    </div>
  );
}

function PdfPreview({ file, compact, className }: { file: PreviewFile; compact?: boolean; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function renderFirstPage() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
        const loadingTask = pdfjs.getDocument({ data: dataUrlToBytes(file.url) });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: compact ? 0.32 : 1.35 });
        const context = canvas.getContext("2d");
        if (!context || cancelled) return;

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        await loadingTask.destroy();
      } catch (error) {
        console.error("PDF preview failed", error);
        if (!cancelled) setFailed(true);
      }
    }

    void renderFirstPage();
    return () => {
      cancelled = true;
    };
  }, [compact, file.url]);

  return (
    <div className={`grid place-items-center overflow-hidden bg-background/50 ${className ?? ""}`}>
      {failed ? (
        <div className="text-center text-xs text-muted-foreground">
          <FileText className="mx-auto mb-2 size-8 text-destructive" />
          تعذر عرض الصفحة الأولى
        </div>
      ) : (
        <canvas ref={canvasRef} className="max-h-full max-w-full rounded-lg bg-background" aria-label={`معاينة ${file.name}`} />
      )}
    </div>
  );
}

function validateFiles(files: File[]) {
  if (files.length > MAX_UPLOAD_FILES) toast.error(`يمكن رفع ${MAX_UPLOAD_FILES} ملفات كحد أقصى في كل مرة.`);
  return files.slice(0, MAX_UPLOAD_FILES).flatMap((file) => {
    const mimeType = getMimeType(file);
    if (!mimeType) {
      toast.error(`${file.name}: ندعم PDF و PNG و JPG فقط`);
      return [];
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      toast.error(`${file.name}: الحجم أكبر من 15 ميجابايت`);
      return [];
    }
    return [{ file, mimeType }];
  });
}

function getMimeType(file: File) {
  if (["application/pdf", "image/png", "image/jpeg"].includes(file.type)) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  return "";
}

function safeFileName(name: string) {
  return name.replace(/[^\p{L}\p{N}._-]+/gu, "-").replace(/-+/g, "-").slice(0, 90);
}

function formatSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function dataUrlToBytes(dataUrl: string) {
  const encoded = dataUrl.split(",").at(1);
  if (!encoded) return new Uint8Array();
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("تعذر قراءة الملف"));
    reader.readAsDataURL(file);
  });
}
