import { createSupabaseServerClient } from "@/lib/supabase/server";
import EstablecimientosClient from "./EstablecimientosClient";

export const dynamic = "force-dynamic";

export default async function EstablecimientosPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: clinics }, { data: rooms }, { data: profile }] = await Promise.all([
    supabase.from("clinics").select("id, name, legal_name, created_at").order("name"),
    supabase.from("consult_rooms").select("id, clinic_id, name, location_hint").order("name"),
    supabase.from("profiles").select("role").eq("id", user?.id ?? "").maybeSingle(),
  ]);

  return (
    <EstablecimientosClient
      clinics={(clinics ?? []) as never[]}
      rooms={(rooms ?? []) as never[]}
      profileRole={(profile?.role as string | undefined) ?? "clinic_admin"}
    />
  );
}
