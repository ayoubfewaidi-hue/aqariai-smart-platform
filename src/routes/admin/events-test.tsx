import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { GlassCard, GoldButton, SiteFooter, SiteHeader } from "@/components/ui-kit";
import {
  countUnprocessedEvents,
  fetchRecentEvents,
  processUnprocessedEvents,
  type EventRow,
} from "@/lib/events";
import { requireAuth } from "@/lib/auth-guard";

export const Route = createFileRoute("/admin/events-test")({
  head: () => ({
    meta: [
      { title: "اختبار الأحداث | عقاري AI" },
      { name: "description", content: "صفحة داخلية لاختبار إطار معالجة الأحداث." },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  beforeLoad: () => requireAuth("admin"),
  component: EventsTestPage,
});

function EventsTestPage() {
  const [unprocessed, setUnprocessed] = useState(0);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [count, rows] = await Promise.all([countUnprocessedEvents(), fetchRecentEvents(10)]);
    setUnprocessed(count);
    setEvents(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function processNow() {
    setProcessing(true);
    const result = await processUnprocessedEvents();
    setProcessing(false);
    toast.success(`تمت معالجة ${result.processed} حدثاً${result.failed ? ` (فشل ${result.failed})` : ""}`);
    await refresh();
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-14">
        <div className="text-center">
          <h1 className="text-2xl font-black">اختبار إطار الأحداث</h1>
          <p className="mt-1 text-sm text-muted-foreground">صفحة داخلية مؤقتة — ستُحمى لاحقاً.</p>
        </div>

        <GlassCard strong className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">أحداث غير معالجة</p>
            <p className="text-3xl font-black text-primary">{loading ? "…" : unprocessed}</p>
          </div>
          <div className="flex gap-2">
            <GoldButton onClick={processNow} loading={processing}>
              <Zap className="size-4" /> معالجة الآن
            </GoldButton>
            <button
              type="button"
              onClick={() => void refresh()}
              className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-bold transition hover:border-primary hover:text-primary"
            >
              <RefreshCw className="size-4" /> تحديث
            </button>
          </div>
        </GlassCard>

        <GlassCard strong>
          <h2 className="mb-3 text-sm font-black">آخر 10 أحداث</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد أحداث بعد.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {events.map((event) => (
                <li key={event.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div>
                    <p className="text-sm font-bold" dir="ltr">{event.event_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleString("ar-JO")}
                    </p>
                  </div>
                  <span
                    className={
                      event.processed
                        ? "rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-400"
                        : "rounded-full bg-secondary/20 px-2.5 py-1 text-xs font-bold text-secondary"
                    }
                  >
                    {event.processed ? "معالج" : "بانتظار المعالجة"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </main>
      <SiteFooter />
    </div>
  );
}
