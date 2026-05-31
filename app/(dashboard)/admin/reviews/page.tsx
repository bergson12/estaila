import { listTesterReviews } from "@/lib/actions/tester-review";
import { AdminReviews, type AdminReviewRow } from "@/components/admin/admin-reviews";
import { getDict } from "@/lib/i18n/server";

export const metadata = { title: "Reseñas de testers" };

export default async function AdminReviewsPage() {
  const [reviews, t] = await Promise.all([listTesterReviews(), getDict()]); // requireAdmin dentro

  const rows: AdminReviewRow[] = reviews.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    status: r.status,
    overall: r.overall,
    positive: r.positive,
    negative: r.negative,
    improvements: r.improvements,
    user: { name: r.user.name, email: r.user.email, image: r.user.image },
    ratings: r.ratings.map((rt) => ({
      id: rt.id,
      moduleId: rt.moduleId,
      rating: rt.rating,
      note: rt.note,
    })),
    images: r.images.map((im) => ({
      id: im.id,
      imageUrl: im.imageUrl,
      caption: im.caption,
      moduleId: im.moduleId,
    })),
  }));

  const newCount = rows.filter((r) => r.status === "NEW").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t.adminPanel.testerReviewsTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.adminPanel.testerReviewsLead} · {rows.length} {t.adminPanel.inTotal}
          {newCount ? ` · ${newCount} ${t.adminPanel.newFem}` : ""}
        </p>
      </header>
      <AdminReviews reviews={rows} />
    </div>
  );
}
