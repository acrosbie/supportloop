import { requirePermission, NO_ORG } from "@/lib/auth";
import { getAllProfiles, getAllArticles, getAllCustomFieldDefs } from "@/lib/data";
import { getOrgById, getOrgSettings } from "@/lib/org";
import AdminTeam from "@/components/admin/AdminTeam";
import AdminKb from "@/components/admin/AdminKb";
import InstallWidget from "@/components/admin/InstallWidget";
import AdminSettings from "@/components/admin/AdminSettings";
import CustomFieldsManager from "@/components/admin/CustomFieldsManager";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const me = await requirePermission("settings.manage");
  const orgId = me.orgId ?? NO_ORG;
  const [profiles, articles, org, settings, fieldDefs] = await Promise.all([
    getAllProfiles(orgId),
    getAllArticles(orgId),
    getOrgById(orgId),
    getOrgSettings(orgId),
    getAllCustomFieldDefs(orgId),
  ]);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const snippet = `<script src="${siteUrl}/embed.js" data-org="${org?.slug ?? ""}" async></script>`;

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-1 text-muted">Manage the team, the knowledge base, and your chat widget.</p>
      </div>

      <section>
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted">Workspace</h2>
        <div className="mt-3">
          <AdminSettings initial={settings} slug={org?.slug ?? ""} />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted">Custom fields</h2>
        <p className="mt-1 text-xs text-muted">Define fields that appear on customers, accounts, tickets, and docs.</p>
        <div className="mt-3">
          <CustomFieldsManager
            defs={fieldDefs.map((d) => ({
              id: d.id,
              entity: d.entity,
              key: d.key,
              label: d.label,
              type: d.type,
              options: d.options,
              required: d.required,
            }))}
          />
        </div>
      </section>

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
            articles={articles.map((a) => ({
              id: a.id,
              title: a.title,
              body: a.body,
              category: a.category,
              status: a.status,
              custom_fields: a.custom_fields ?? {},
            }))}
            docFields={fieldDefs
              .filter((d) => d.entity === "doc")
              .map((d) => ({ key: d.key, label: d.label, type: d.type, options: d.options, custom: true }))}
          />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted">Widget</h2>
        <div className="mt-3">
          <InstallWidget snippet={snippet} />
        </div>
      </section>
    </div>
  );
}
