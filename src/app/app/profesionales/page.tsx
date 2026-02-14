import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProfessionalsClient from "./ProfessionalsClient";

export const dynamic = "force-dynamic";

export default async function ProfesionalesPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: professionals }, { data: availability }] = await Promise.all([
    supabase
      .from("professionals")
      .select("id, full_name, specialty, email, phone, color")
      .order("full_name"),
    supabase
      .from("availability")
      .select("id, professional_id, day_of_week, start_time, end_time, timezone")
      .order("day_of_week"),
  ]);

  return (
    <ProfessionalsClient
      professionals={(professionals ?? []) as never[]}
      availability={(availability ?? []) as never[]}
    />
  );
}
