-- Demo data for a full clinic setup
insert into clinics (id, name, legal_name)
values ('11111111-1111-1111-1111-111111111111', 'Establecimiento Central', 'Central Salud S.A.')
on conflict (id) do nothing;

insert into social_insurances (id, name, plan)
values
  ('aaaaaaa1-1111-1111-1111-111111111111', 'OSDE', '210'),
  ('aaaaaaa2-2222-2222-2222-222222222222', 'Swiss Medical', 'SMG20'),
  ('aaaaaaa3-3333-3333-3333-333333333333', 'Particular', null)
on conflict (id) do nothing;

insert into consult_rooms (id, clinic_id, name, location_hint)
values
  ('77777777-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Consultorio 1', 'Planta baja'),
  ('77777777-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Consultorio 2', 'Primer piso')
on conflict (id) do nothing;

insert into professionals (id, clinic_id, full_name, specialty, email, phone, color)
values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Dra. Ana Ruiz', 'Clinica medica', 'ana@demo.com', '+54 11 5555-1111', '#0f766e'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Dr. Pablo Soto', 'Cardiologia', 'pablo@demo.com', '+54 11 5555-2222', '#2563eb')
on conflict (id) do nothing;

insert into patients (id, clinic_id, full_name, dni, phone, email, notes, social_insurance_id, social_insurance_number)
values
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Mariana Lopez', '32123456', '+54 11 5555-3333', 'mariana@demo.com', 'Paciente con hipertension controlada.', 'aaaaaaa1-1111-1111-1111-111111111111', 'OSD-9881'),
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Carlos Mendez', '30222333', '+54 11 5555-4444', 'carlos@demo.com', 'Solicita recordatorios por WhatsApp.', 'aaaaaaa2-2222-2222-2222-222222222222', 'SWM-1201')
on conflict (id) do nothing;

insert into availability (clinic_id, professional_id, day_of_week, start_time, end_time)
values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 1, '08:00', '14:00'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 3, '10:00', '18:00'),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 2, '09:00', '17:00'),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 4, '09:00', '15:00')
on conflict do nothing;

insert into appointments (id, clinic_id, consult_room_id, professional_id, patient_id, start_at, end_at, status, notes)
values
  ('66666666-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '77777777-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', now() + interval '1 day', now() + interval '1 day 30 minutes', 'confirmado', 'Control mensual.'),
  ('66666666-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '77777777-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', now() + interval '2 days', now() + interval '2 days 45 minutes', 'pendiente', 'Primer consulta.')
on conflict (id) do nothing;

insert into medical_visits (id, clinic_id, appointment_id, patient_id, professional_id, visit_at, reason, diagnosis, treatment, notes, amount_paid, payment_method)
values
  ('88888888-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '66666666-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', now() - interval '10 day', 'Control de HTA', 'Hipertension arterial compensada', 'Continuar tratamiento', 'Paciente estable', 30000, 'transferencia')
on conflict (id) do nothing;

insert into visit_attachments (clinic_id, visit_id, file_name, file_url, mime_type)
values
  ('11111111-1111-1111-1111-111111111111', '88888888-1111-1111-1111-111111111111', 'laboratorio.pdf', 'https://example.com/laboratorio.pdf', 'application/pdf')
on conflict do nothing;
