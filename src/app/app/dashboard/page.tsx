import { createSupabaseServerClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, start_at, status, professional:professionals(full_name)")
    .order("start_at", { ascending: false })
    .limit(100);

  return <DashboardClient appointments={(appointments ?? []) as never[]} />;
}
