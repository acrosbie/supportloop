import { getAuth, NO_ORG } from "@/lib/auth";
import { getAiActivity } from "@/lib/data";
import AiActivityView from "@/components/operator/AiActivityView";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI activity" };

export default async function AiActivityPage() {
  const me = await getAuth();
  const activity = await getAiActivity(me?.orgId ?? NO_ORG);
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <AiActivityView {...activity} />
    </div>
  );
}
