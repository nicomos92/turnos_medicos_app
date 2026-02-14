"use client";

import { useRouter } from "next/navigation";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function UserMenu({ email }: { email: string }) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = supabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3 rounded-full border border-border bg-white px-4 py-2 text-sm">
      <span className="hidden sm:inline text-muted-foreground">{email}</span>
      <Button variant="ghost" size="sm" onClick={handleSignOut}>
        Salir
      </Button>
    </div>
  );
}
