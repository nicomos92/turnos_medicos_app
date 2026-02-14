import { createSupabaseServerClient } from "@/lib/supabase/server";
import PatientsClient from "./PatientsClient";

export const dynamic = "force-dynamic";

export default async function PacientesPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: patients }, { data: socialInsurances }] = await Promise.all([
    supabase
      .from("patients")
      .select("id, full_name, dni, phone, email, notes, social_insurance_id, social_insurance_number, social_insurance:social_insurances(id, name, plan)")
      .order("full_name"),
    supabase.from("social_insurances").select("id, name, plan").order("name"),
  ]);

  return (
    <PatientsClient
      patients={(patients ?? []) as never[]}
      socialInsurances={(socialInsurances ?? []) as never[]}
    />
  );
}
