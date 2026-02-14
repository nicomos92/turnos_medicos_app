export type Professional = {
  id: string;
  full_name: string;
  specialty: string;
  email: string | null;
  phone: string | null;
  color: string | null;
};

export type SocialInsurance = {
  id: string;
  name: string;
  plan: string | null;
};

export type Patient = {
  id: string;
  full_name: string;
  dni: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  social_insurance_id: string | null;
  social_insurance_number: string | null;
  social_insurance?: SocialInsurance | null;
};

export type Availability = {
  id: string;
  professional_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  timezone: string;
};

export type ConsultRoom = {
  id: string;
  name: string;
  location_hint: string | null;
};

export type Appointment = {
  id: string;
  start_at: string;
  end_at: string;
  status: "pendiente" | "confirmado" | "cancelado" | "atendido";
  notes: string | null;
  consult_room_id?: string | null;
  consult_room?: ConsultRoom | null;
  professional: Professional;
  patient: Patient;
};

export type MedicalVisit = {
  id: string;
  visit_at: string;
  reason: string | null;
  diagnosis: string | null;
  treatment: string | null;
  notes: string | null;
  amount_paid: number;
  payment_method: "efectivo" | "transferencia" | "tarjeta" | "otro";
  patient: Pick<Patient, "id" | "full_name">;
  professional: Pick<Professional, "id" | "full_name" | "specialty">;
};
