"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function logout() {
    const sb = createSupabaseBrowser();
    await sb.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={logout} className={className}>
      <LogOut className="h-4 w-4" />
      Log out
    </Button>
  );
}
