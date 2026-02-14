import { createSupabaseServerClient } from "@/lib/supabase/server";
import VisitasClient from "./VisitasClient";

export const dynamic = "force-dynamic";

export default async function VisitasPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: visits }, { data: patients }, { data: professionals }, { data: appointments }, { data: attachments }] =
    await Promise.all([
      supabase
        .from("medical_visits")
        .select("id, visit_at, reason, diagnosis, treatment, notes, amount_paid, payment_method, patient:patients(id, full_name), professional:professionals(id, full_name, specialty)")
        .order("visit_at", { ascending: false })
        .limit(100),
      supabase.from("patients").select("id, full_name, dni, phone, email, notes, social_insurance_id, social_insurance_number").order("full_name"),
      supabase.from("professionals").select("id, full_name, specialty, email, phone, color").order("full_name"),
      supabase.from("appointments").select("id").order("start_at", { ascending: false }).limit(200),
      supabase.from("visit_attachments").select("id, visit_id, file_name, file_url, mime_type").order("created_at", { ascending: false }),
    ]);

  return (
    <VisitasClient
      visits={(visits ?? []) as never[]}
      patients={(patients ?? []) as never[]}
      professionals={(professionals ?? []) as never[]}
      appointments={(appointments ?? []) as never[]}
      attachments={(attachments ?? []) as never[]}
    />
  );
}
