import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { EmptyState, GlassCard, SiteFooter, SiteHeader } from "@/components/ui-kit";
import { requireAuth } from "@/lib/auth-guard";
import { fetchFavorites, fetchPropertyById, type DbProperty } from "@/lib/db";
import { fmt } from "@/lib/data";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "مفضلتي | عقاري AI" },
      { name: "description", content: "العقارات التي حفظتها في حسابك على عقاري AI." },
      { property: "og:title", content: "مفضلتي | عقاري AI" },
      { property: "og:description", content: "قائمة عقاراتك المفضلة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  beforeLoad: () => requireAuth(),
  component: FavoritesPage,
});

function FavoritesPage() {
  const [items, setItems] = useState<DbProperty[] | null>(null);

  useEffect(() => {
    void fetchFavorites()
      .then((ids) => Promise.all(ids.map((id) => fetchPropertyById(id).catch(() => null))))
      .then((rows) => setItems(rows.filter((r): r is DbProperty => !!r)));
  }, []);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-10">
        <h1 className="text-2xl font-black">مفضلتي</h1>
        {items === null ? (
          <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>
        ) : items.length === 0 ? (
          <EmptyState title="لا توجد عقارات محفوظة" description="احفظ العقارات من بوابة المشتري لتظهر هنا." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((p) => (
              <Link key={p.id} to="/property/$id" params={{ id: p.id }}>
                <GlassCard className="transition hover:border-primary">
                  <p className="font-bold">{p.title}</p>
                  <p className="mt-1 text-sm text-primary">{fmt(p.price)} د.أ</p>
                </GlassCard>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
