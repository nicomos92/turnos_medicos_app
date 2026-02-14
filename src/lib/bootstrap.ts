import type { User } from "@supabase/supabase-js";

type SupabaseClientLike = {
  from: (table: string) => any;
};

function buildClinicName(user: User) {
  const emailName = user.email?.split("@")[0] ?? "principal";
  return `Establecimiento ${emailName}`;
}

function buildFullName(user: User) {
  const metadataName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined);
  return metadataName || "Administrador";
}

export async function ensureClinicBootstrap(supabase: SupabaseClientLike, user: User) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, active_clinic_id")
    .eq("id", user.id)
    .maybeSingle();

  let clinicId = profile?.active_clinic_id as string | null;

  if (!profile) {
    clinicId = crypto.randomUUID();

    const { error: clinicError } = await supabase.from("clinics").insert({
      id: clinicId,
      name: buildClinicName(user),
    });
    if (clinicError) throw clinicError;

    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      active_clinic_id: clinicId,
      full_name: buildFullName(user),
      email: user.email ?? "",
      role: "clinic_admin",
    });
    if (profileError) throw profileError;

    const { error: membershipError } = await supabase.from("clinic_memberships").insert({
      profile_id: user.id,
      clinic_id: clinicId,
      role: "clinic_admin",
    });
    // If membership insert is blocked by RLS drift, keep onboarding alive.
    if (membershipError && membershipError.code !== "23505") {
      console.warn("membership bootstrap warning", membershipError);
    }
  }

  if (!clinicId) {
    return;
  }

  const { count, error: countError } = await supabase
    .from("professionals")
    .select("id", { count: "exact", head: true });

  if (countError) {
    console.warn("seed bootstrap warning", countError);
    return;
  }

  if ((count ?? 0) > 0) {
    return;
  }

  try {
    const { data: osde } = await supabase
    .from("social_insurances")
    .select("id")
    .eq("name", "OSDE")
    .maybeSingle();

    const osdeId = osde?.id ?? null;

    const { data: rooms } = await supabase
    .from("consult_rooms")
    .insert([
      { clinic_id: clinicId, name: "Consultorio 1", location_hint: "Planta baja" },
      { clinic_id: clinicId, name: "Consultorio 2", location_hint: "Primer piso" },
    ])
    .select("id, name");

    const roomOneId = rooms?.find((x: { name: string }) => x.name === "Consultorio 1")?.id;

    const { data: createdProfessionals, error: professionalsError } = await supabase
    .from("professionals")
    .insert([
      {
        clinic_id: clinicId,
        full_name: "Dra. Ana Ruiz",
        specialty: "Clinica medica",
        email: "ana@demo.com",
        phone: "+54 11 5555-1111",
        color: "#0f766e",
      },
      {
        clinic_id: clinicId,
        full_name: "Dr. Pablo Soto",
        specialty: "Cardiologia",
        email: "pablo@demo.com",
        phone: "+54 11 5555-2222",
        color: "#2563eb",
      },
    ])
    .select("id, full_name");
    if (professionalsError || !createdProfessionals) throw professionalsError;

    const { data: createdPatients, error: patientsError } = await supabase
    .from("patients")
    .insert([
      {
        clinic_id: clinicId,
        full_name: "Mariana Lopez",
        dni: "32123456",
        phone: "+54 11 5555-3333",
        email: "mariana@demo.com",
        notes: "Paciente con hipertension controlada.",
        social_insurance_id: osdeId,
        social_insurance_number: "OSD-9881",
      },
      {
        clinic_id: clinicId,
        full_name: "Carlos Mendez",
        dni: "30222333",
        phone: "+54 11 5555-4444",
        email: "carlos@demo.com",
        notes: "Solicita recordatorios por WhatsApp.",
      },
    ])
    .select("id");
    if (patientsError || !createdPatients) throw patientsError;

    const ana = createdProfessionals.find((p: { full_name: string }) => p.full_name.includes("Ana"));
    const pablo = createdProfessionals.find((p: { full_name: string }) => p.full_name.includes("Pablo"));

    if (ana?.id && pablo?.id) {
      await supabase.from("availability").insert([
        { clinic_id: clinicId, professional_id: ana.id, day_of_week: 1, start_time: "08:00", end_time: "14:00" },
        { clinic_id: clinicId, professional_id: pablo.id, day_of_week: 2, start_time: "09:00", end_time: "17:00" },
      ]);
    }

    if (ana?.id && createdPatients[0]?.id) {
      const start = new Date();
      start.setDate(start.getDate() + 1);
      start.setHours(9, 0, 0, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 30);

      const { data: appointment } = await supabase
      .from("appointments")
      .insert({
        clinic_id: clinicId,
        consult_room_id: roomOneId ?? null,
        professional_id: ana.id,
        patient_id: createdPatients[0].id,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        status: "confirmado",
        notes: "Control mensual",
      })
      .select("id")
      .single();

      await supabase.from("medical_visits").insert({
      clinic_id: clinicId,
      appointment_id: appointment?.id ?? null,
      patient_id: createdPatients[0].id,
      professional_id: ana.id,
      visit_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      reason: "Control anual",
      diagnosis: "Sin hallazgos relevantes",
      treatment: "Continuar seguimiento",
      notes: "Sin complicaciones",
      amount_paid: 25000,
      payment_method: "efectivo",
      });
    }
  } catch (error) {
    console.warn("demo seed bootstrap warning", error);
  }
}
