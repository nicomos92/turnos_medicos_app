"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import type { Patient, SocialInsurance } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";

export default function PatientsClient({
  patients,
  socialInsurances,
}: {
  patients: Patient[];
  socialInsurances: SocialInsurance[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    dni: "",
    phone: "",
    email: "",
    notes: "",
    social_insurance_id: "",
    social_insurance_number: "",
  });

  const openModal = (row?: Patient) => {
    setEditing(row ?? null);
    setError(null);
    setForm(
      row
        ? {
            full_name: row.full_name,
            dni: row.dni ?? "",
            phone: row.phone ?? "",
            email: row.email ?? "",
            notes: row.notes ?? "",
            social_insurance_id: row.social_insurance_id ?? "",
            social_insurance_number: row.social_insurance_number ?? "",
          }
        : {
            full_name: "",
            dni: "",
            phone: "",
            email: "",
            notes: "",
            social_insurance_id: "",
            social_insurance_number: "",
          }
    );
    setOpen(true);
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = supabaseBrowserClient();
    const payload = {
      ...form,
      dni: form.dni || null,
      phone: form.phone || null,
      email: form.email || null,
      notes: form.notes || null,
      social_insurance_id: form.social_insurance_id || null,
      social_insurance_number: form.social_insurance_number || null,
    };
    const { error } = editing
      ? await supabase.from("patients").update(payload).eq("id", editing.id)
      : await supabase.from("patients").insert(payload);

    if (error) setError(error.message);
    else {
      setOpen(false);
      router.refresh();
    }
  };

  const onDelete = async (id: string) => {
    const supabase = supabaseBrowserClient();
    await supabase.from("patients").delete().eq("id", id);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Pacientes</h2>
          <p className="text-sm text-muted-foreground">CRUD + obra social.</p>
        </div>
        <Button onClick={() => openModal()}>Nuevo</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="py-2">Nombre</th>
                <th className="py-2">DNI</th>
                <th className="py-2">Obra social</th>
                <th className="py-2">Afiliado</th>
                <th className="py-2">Telefono</th>
                <th className="py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {patients.map((p) => (
                <tr key={p.id}>
                  <td className="py-3">{p.full_name}</td>
                  <td className="py-3">{p.dni ?? "-"}</td>
                  <td className="py-3">{p.social_insurance?.name ?? "-"}</td>
                  <td className="py-3">{p.social_insurance_number ?? "-"}</td>
                  <td className="py-3">{p.phone ?? "-"}</td>
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

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar paciente" : "Nuevo paciente"}>
        <form onSubmit={onSave} className="space-y-4">
          <Input label="Nombre" value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} required />
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="DNI" value={form.dni} onChange={(e) => setForm((p) => ({ ...p, dni: e.target.value }))} />
            <Input label="Telefono" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Obra social"
              value={form.social_insurance_id}
              onChange={(e) => setForm((p) => ({ ...p, social_insurance_id: e.target.value }))}
            >
              <option value="">Sin obra social</option>
              {socialInsurances.map((social) => (
                <option key={social.id} value={social.id}>
                  {social.name}{social.plan ? ` (${social.plan})` : ""}
                </option>
              ))}
            </Select>
            <Input
              label="Nro afiliado"
              value={form.social_insurance_number}
              onChange={(e) => setForm((p) => ({ ...p, social_insurance_number: e.target.value }))}
            />
          </div>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="text-xs uppercase tracking-[0.2em]">Observaciones</span>
            <textarea className="input-surface min-h-[100px] rounded-2xl px-4 py-3 text-sm" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </label>
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
