"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import type { Availability, Professional } from "@/lib/types";
import { WEEK_DAYS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function ProfessionalsClient({
  professionals,
  availability,
}: {
  professionals: Professional[];
  availability: Availability[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Professional | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    specialty: "",
    email: "",
    phone: "",
    color: "#0f766e",
  });

  const [slotForm, setSlotForm] = useState({
    professional_id: "",
    day_of_week: "1",
    start_time: "09:00",
    end_time: "12:00",
  });
  const [slotError, setSlotError] = useState<string | null>(null);

  const slotsByProfessional = useMemo(() => {
    return availability.reduce<Record<string, Availability[]>>((acc, slot) => {
      acc[slot.professional_id] = [...(acc[slot.professional_id] ?? []), slot];
      return acc;
    }, {});
  }, [availability]);

  const openModal = (row?: Professional) => {
    setEditing(row ?? null);
    setError(null);
    setForm(
      row
        ? {
            full_name: row.full_name,
            specialty: row.specialty,
            email: row.email ?? "",
            phone: row.phone ?? "",
            color: row.color ?? "#0f766e",
          }
        : {
            full_name: "",
            specialty: "",
            email: "",
            phone: "",
            color: "#0f766e",
          }
    );
    setOpen(true);
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = supabaseBrowserClient();
    const payload = { ...form, email: form.email || null, phone: form.phone || null };
    const { error } = editing
      ? await supabase.from("professionals").update(payload).eq("id", editing.id)
      : await supabase.from("professionals").insert(payload);
    if (error) setError(error.message);
    else {
      setOpen(false);
      router.refresh();
    }
  };

  const onDelete = async (id: string) => {
    const supabase = supabaseBrowserClient();
    await supabase.from("professionals").delete().eq("id", id);
    router.refresh();
  };

  const onAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSlotError(null);
    if (!slotForm.professional_id) {
      setSlotError("Debes seleccionar un profesional.");
      return;
    }
    const supabase = supabaseBrowserClient();
    const { error } = await supabase.from("availability").insert({
      professional_id: slotForm.professional_id,
      day_of_week: Number(slotForm.day_of_week),
      start_time: slotForm.start_time,
      end_time: slotForm.end_time,
    });
    if (error) setSlotError(error.message);
    else router.refresh();
  };

  const onDeleteSlot = async (id: string) => {
    const supabase = supabaseBrowserClient();
    await supabase.from("availability").delete().eq("id", id);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Profesionales</h2>
          <p className="text-sm text-muted-foreground">CRUD + disponibilidad semanal.</p>
        </div>
        <Button onClick={() => openModal()}>Nuevo</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="py-2">Nombre</th>
                <th className="py-2">Especialidad</th>
                <th className="py-2">Email</th>
                <th className="py-2">Telefono</th>
                <th className="py-2">Disponibilidad</th>
                <th className="py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {professionals.map((p) => (
                <tr key={p.id}>
                  <td className="py-3">{p.full_name}</td>
                  <td className="py-3">{p.specialty}</td>
                  <td className="py-3">{p.email ?? "-"}</td>
                  <td className="py-3">{p.phone ?? "-"}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {(slotsByProfessional[p.id] ?? []).map((slot) => (
                        <Badge key={slot.id} variant="info">
                          {WEEK_DAYS.find((d) => d.value === slot.day_of_week)?.label} {slot.start_time.slice(0, 5)}-{slot.end_time.slice(0, 5)}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openModal(p)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(p.id)}>
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold">Disponibilidad por profesional</h3>
        <form onSubmit={onAddSlot} className="mt-4 grid gap-3 md:grid-cols-5">
          <Select
            value={slotForm.professional_id}
            onChange={(e) => setSlotForm((p) => ({ ...p, professional_id: e.target.value }))}
            required
          >
            <option value="">Profesional</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </Select>
          <Select
            value={slotForm.day_of_week}
            onChange={(e) => setSlotForm((p) => ({ ...p, day_of_week: e.target.value }))}
          >
            {WEEK_DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
          <Input
            type="time"
            value={slotForm.start_time}
            onChange={(e) => setSlotForm((p) => ({ ...p, start_time: e.target.value }))}
            required
          />
          <Input
            type="time"
            value={slotForm.end_time}
            onChange={(e) => setSlotForm((p) => ({ ...p, end_time: e.target.value }))}
            required
          />
          <Button type="submit">Agregar horario</Button>
        </form>
        {slotError ? (
          <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">{slotError}</p>
        ) : null}

        <div className="mt-4 space-y-2">
          {availability.map((slot) => (
            <div key={slot.id} className="flex items-center justify-between rounded-2xl border border-border p-3 text-sm">
              <span>
                {professionals.find((p) => p.id === slot.professional_id)?.full_name} - {WEEK_DAYS.find((d) => d.value === slot.day_of_week)?.label} {slot.start_time.slice(0, 5)}-{slot.end_time.slice(0, 5)}
              </span>
              <Button size="sm" variant="ghost" onClick={() => onDeleteSlot(slot.id)}>
                Quitar
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar profesional" : "Nuevo profesional"}>
        <form onSubmit={onSave} className="space-y-4">
          <Input label="Nombre" value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} required />
          <Input label="Especialidad" value={form.specialty} onChange={(e) => setForm((p) => ({ ...p, specialty: e.target.value }))} required />
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            <Input label="Telefono" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          </div>
          <Input label="Color agenda" type="color" value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} />
          {error ? <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">{error}</p> : null}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
