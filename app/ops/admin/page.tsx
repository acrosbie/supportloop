import { requireRole } from "@/lib/auth";
import { getAllProfiles, getAllArticles } from "@/lib/data";
import AdminTeam from "@/components/admin/AdminTeam";
import AdminKb from "@/components/admin/AdminKb";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const me = await requireRole(["admin"]);
  const [profiles, articles] = await Promise.all([getAllProfiles(), getAllArticles()]);

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-1 text-muted">Manage the team and the knowledge base.</p>
      </div>

      <section>
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted">Team &amp; roles</h2>
        <div className="mt-3">
          <AdminTeam
            profiles={profiles.map((p) => ({ id: p.id, role: p.role, display_name: p.display_name }))}
            meId={me.id}
          />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted">Knowledge base ({articles.length})</h2>
        <div className="mt-3">
          <AdminKb
            articles={articles.map((a) => ({ id: a.id, title: a.title, body: a.body, category: a.category, status: a.status }))}
          />
        </div>
      </section>
    </div>
  );
}
