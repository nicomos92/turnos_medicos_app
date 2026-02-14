"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, startOfWeek } from "date-fns";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import type { Appointment, Availability, ConsultRoom, Patient, Professional } from "@/lib/types";
import { APPOINTMENT_STATUSES, END_HOUR, SLOT_MINUTES, START_HOUR } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

const hourHeight = 48;

export default function TurnosClient({
  appointments,
  professionals,
  patients,
  availability,
  consultRooms,
}: {
  appointments: Appointment[];
  professionals: Professional[];
  patients: Patient[];
  availability: Availability[];
  consultRooms: ConsultRoom[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [professionalFilter, setProfessionalFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    consult_room_id: "",
    professional_id: "",
    patient_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    start_time: "09:00",
    end_time: "09:30",
    status: "pendiente",
    notes: "",
  });

  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const byPro = professionalFilter ? appointment.professional.id === professionalFilter : true;
      const q = search.toLowerCase();
      const bySearch = q
        ? appointment.patient.full_name.toLowerCase().includes(q) || appointment.professional.full_name.toLowerCase().includes(q)
        : true;
      return byPro && bySearch;
    });
  }, [appointments, professionalFilter, search]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setFormError(null);

    const startAt = new Date(`${formState.date}T${formState.start_time}:00`);
    const endAt = new Date(`${formState.date}T${formState.end_time}:00`);

    if (endAt <= startAt) {
      setFormError("La hora de fin debe ser posterior a la hora de inicio.");
      setLoading(false);
      return;
    }

    const weekday = startAt.getDay();
    const slots = availability.filter((x) => x.professional_id === formState.professional_id && x.day_of_week === weekday);
    if (slots.length === 0) {
      setFormError("No hay disponibilidad para ese dia/profesional.");
      setLoading(false);
      return;
    }

    const isWithinAnySlot = slots.some((slot) => {
      const [sh, sm] = slot.start_time.split(":").map(Number);
      const [eh, em] = slot.end_time.split(":").map(Number);
      const s = new Date(startAt);
      const e = new Date(startAt);
      s.setHours(sh, sm, 0, 0);
      e.setHours(eh, em, 0, 0);
      return startAt >= s && endAt <= e;
    });

    if (!isWithinAnySlot) {
      setFormError("El turno no respeta la disponibilidad del profesional.");
      setLoading(false);
      return;
    }

    const supabase = supabaseBrowserClient();
    const { error } = await supabase.from("appointments").insert({
      consult_room_id: formState.consult_room_id || null,
      professional_id: formState.professional_id,
      patient_id: formState.patient_id,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      status: formState.status,
      notes: formState.notes || null,
    });

    if (error) setFormError(error.message);
    else {
      setOpen(false);
      router.refresh();
    }

    setLoading(false);
  };

  const hours = Array.from({ length: (END_HOUR - START_HOUR) * (60 / SLOT_MINUTES) }, (_, i) => i);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Turnos</h2>
          <p className="text-sm text-muted-foreground">Agenda semanal, filtro por profesional y consultorio.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Input placeholder="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={professionalFilter} onChange={(e) => setProfessionalFilter(e.target.value)}>
            <option value="">Todos</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </Select>
          <Button onClick={() => setOpen(true)}>Nuevo turno</Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border/80 bg-white">
          <div className="p-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">Hora</div>
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="p-3 text-sm font-medium">
              <p>{format(day, "EEE")}</p>
              <p className="text-xs text-muted-foreground">{format(day, "dd MMM")}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[80px_repeat(7,1fr)]">
          <div className="grid-line relative h-[576px] bg-white">
            {hours.filter((_, i) => i % 2 === 0).map((slot) => (
              <div key={slot} className="h-[48px] px-3 text-xs text-muted-foreground">
                {String(START_HOUR + slot / 2).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          {weekDays.map((day) => {
            const dayAppointments = filteredAppointments.filter((a) => {
              const d = new Date(a.start_at);
              return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate();
            });
            return (
              <div key={day.toISOString()} className="relative h-[576px] border-l border-border/70">
                <div className="grid-line absolute inset-0" />
                {dayAppointments.map((a) => {
                  const s = new Date(a.start_at);
                  const e = new Date(a.end_at);
                  const minutes = (s.getHours() - START_HOUR) * 60 + s.getMinutes();
                  const duration = (e.getTime() - s.getTime()) / 60000;
                  return (
                    <div key={a.id} className="absolute left-2 right-2 rounded-2xl p-3 text-xs text-white shadow-md" style={{ top: (minutes / 60) * hourHeight, height: (duration / 60) * hourHeight, backgroundColor: a.professional.color ?? "#0f766e" }}>
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em]"><span>{format(s, "HH:mm")}</span><span>{format(e, "HH:mm")}</span></div>
                      <p className="mt-2 text-sm font-semibold">{a.patient.full_name}</p>
                      <p>{a.professional.full_name}</p>
                      {a.consult_room?.name ? <p className="opacity-90">{a.consult_room.name}</p> : null}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Listado</h3><Badge variant="info">{filteredAppointments.length} turnos</Badge></div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.2em] text-muted-foreground"><tr><th className="py-2">Paciente</th><th className="py-2">Profesional</th><th className="py-2">Consultorio</th><th className="py-2">Inicio</th><th className="py-2">Fin</th><th className="py-2">Estado</th></tr></thead>
            <tbody className="divide-y divide-border">
              {filteredAppointments.map((a) => (
                <tr key={a.id}><td className="py-3">{a.patient.full_name}</td><td className="py-3">{a.professional.full_name}</td><td className="py-3">{a.consult_room?.name ?? "-"}</td><td className="py-3">{format(new Date(a.start_at), "dd/MM HH:mm")}</td><td className="py-3">{format(new Date(a.end_at), "HH:mm")}</td><td className="py-3"><Badge variant={(APPOINTMENT_STATUSES.find((s) => s.value === a.status)?.color as "success" | "warning" | "info" | "muted") ?? "muted"}>{APPOINTMENT_STATUSES.find((s) => s.value === a.status)?.label ?? a.status}</Badge></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo turno">
        <form onSubmit={handleCreate} className="space-y-4">
          <Select label="Consultorio" value={formState.consult_room_id} onChange={(e) => setFormState((p) => ({ ...p, consult_room_id: e.target.value }))}>
            <option value="">Sin asignar</option>
            {consultRooms.map((room) => (<option key={room.id} value={room.id}>{room.name}</option>))}
          </Select>
          <Select label="Profesional" value={formState.professional_id} onChange={(e) => setFormState((p) => ({ ...p, professional_id: e.target.value }))} required>
            <option value="">Selecciona</option>{professionals.map((p) => (<option key={p.id} value={p.id}>{p.full_name}</option>))}
          </Select>
          <Select label="Paciente" value={formState.patient_id} onChange={(e) => setFormState((p) => ({ ...p, patient_id: e.target.value }))} required>
            <option value="">Selecciona</option>{patients.map((p) => (<option key={p.id} value={p.id}>{p.full_name}</option>))}
          </Select>
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Fecha" type="date" value={formState.date} onChange={(e) => setFormState((p) => ({ ...p, date: e.target.value }))} required />
            <Input label="Hora inicio" type="time" value={formState.start_time} onChange={(e) => setFormState((p) => ({ ...p, start_time: e.target.value }))} required />
            <Input label="Hora fin" type="time" value={formState.end_time} onChange={(e) => setFormState((p) => ({ ...p, end_time: e.target.value }))} required />
          </div>
          <Select label="Estado" value={formState.status} onChange={(e) => setFormState((p) => ({ ...p, status: e.target.value }))}>
            {APPOINTMENT_STATUSES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
          </Select>
          <label className="flex flex-col gap-2 text-sm text-slate-700"><span className="text-xs uppercase tracking-[0.2em]">Notas</span><textarea className="input-surface min-h-[100px] rounded-2xl px-4 py-3 text-sm" value={formState.notes} onChange={(e) => setFormState((p) => ({ ...p, notes: e.target.value }))} /></label>
          {formError ? <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">{formError}</p> : null}
          <div className="flex items-center justify-end gap-3"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={loading}>Guardar</Button></div>
        </form>
      </Modal>
    </div>
  );
}
