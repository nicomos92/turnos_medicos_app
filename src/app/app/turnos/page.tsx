import { createSupabaseServerClient } from "@/lib/supabase/server";
import TurnosClient from "./TurnosClient";

export const dynamic = "force-dynamic";

export default async function TurnosPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: professionals }, { data: patients }, { data: availability }, { data: consultRooms }, { data: appointments }] =
    await Promise.all([
      supabase.from("professionals").select("id, full_name, specialty, email, phone, color").order("full_name"),
      supabase.from("patients").select("id, full_name, dni, phone, email, notes, social_insurance_id, social_insurance_number").order("full_name"),
      supabase.from("availability").select("id, professional_id, day_of_week, start_time, end_time, timezone"),
      supabase.from("consult_rooms").select("id, name, location_hint").order("name"),
      supabase
        .from("appointments")
        .select("id, start_at, end_at, status, notes, consult_room_id, consult_room:consult_rooms(id, name, location_hint), professional:professionals(id, full_name, specialty, email, phone, color), patient:patients(id, full_name, dni, phone, email, notes, social_insurance_id, social_insurance_number)")
        .order("start_at"),
    ]);

  return (
    <TurnosClient
      appointments={(appointments ?? []) as never[]}
      professionals={(professionals ?? []) as never[]}
      patients={(patients ?? []) as never[]}
      availability={(availability ?? []) as never[]}
      consultRooms={(consultRooms ?? []) as never[]}
    />
  );
}
