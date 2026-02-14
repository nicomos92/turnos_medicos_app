"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import type { MedicalVisit, Patient, Professional } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";

type Attachment = {
  id: string;
  visit_id: string;
  file_name: string;
  file_url: string;
  mime_type: string | null;
};

export default function VisitasClient({
  visits,
  patients,
  professionals,
  appointments,
  attachments,
}: {
  visits: MedicalVisit[];
  patients: Patient[];
  professionals: Professional[];
  appointments: { id: string }[];
  attachments: Attachment[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    appointment_id: "",
    patient_id: "",
    professional_id: "",
    visit_at: new Date().toISOString().slice(0, 16),
    reason: "",
    diagnosis: "",
    treatment: "",
    notes: "",
    amount_paid: "0",
    payment_method: "efectivo",
    attachment_name: "",
    attachment_url: "",
  });

  const attachmentsByVisit = useMemo(() => {
    return attachments.reduce<Record<string, Attachment[]>>((acc, file) => {
      acc[file.visit_id] = [...(acc[file.visit_id] ?? []), file];
      return acc;
    }, {});
  }, [attachments]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const supabase = supabaseBrowserClient();

    const { data: visit, error } = await supabase
      .from("medical_visits")
      .insert({
        appointment_id: form.appointment_id || null,
        patient_id: form.patient_id,
        professional_id: form.professional_id,
        visit_at: new Date(form.visit_at).toISOString(),
        reason: form.reason || null,
        diagnosis: form.diagnosis || null,
        treatment: form.treatment || null,
        notes: form.notes || null,
        amount_paid: Number(form.amount_paid || 0),
        payment_method: form.payment_method,
      })
      .select("id")
      .single();

    if (error || !visit) {
      setError(error?.message ?? "No se pudo crear la visita.");
      return;
    }

    if (form.attachment_name && form.attachment_url) {
      const { error: attachmentError } = await supabase.from("visit_attachments").insert({
        visit_id: visit.id,
        file_name: form.attachment_name,
        file_url: form.attachment_url,
      });
      if (attachmentError) {
        setError(attachmentError.message);
        return;
      }
    }

    setOpen(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Visitas medicas</h2>
          <p className="text-sm text-muted-foreground">Historial clinico por paciente, adjuntos y cobros.</p>
        </div>
        <Button onClick={() => setOpen(true)}>Nueva visita</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="py-2">Fecha</th>
                <th className="py-2">Paciente</th>
                <th className="py-2">Profesional</th>
                <th className="py-2">Diagnostico</th>
                <th className="py-2">Importe</th>
                <th className="py-2">Adjuntos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visits.map((visit) => (
                <tr key={visit.id}>
                  <td className="py-3">{format(new Date(visit.visit_at), "dd/MM/yyyy HH:mm")}</td>
                  <td className="py-3">{visit.patient?.full_name}</td>
                  <td className="py-3">{visit.professional?.full_name}</td>
                  <td className="py-3">{visit.diagnosis ?? "-"}</td>
                  <td className="py-3">${Number(visit.amount_paid).toLocaleString("es-AR")}</td>
                  <td className="py-3">
                    {(attachmentsByVisit[visit.id] ?? []).length === 0 ? (
                      "-"
                    ) : (
                      <div className="flex flex-col gap-1">
                        {(attachmentsByVisit[visit.id] ?? []).map((file) => (
                          <a key={file.id} href={file.file_url} target="_blank" className="text-teal-700 underline" rel="noreferrer">
                            {file.file_name}
                          </a>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva visita">
        <form onSubmit={onCreate} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Select label="Paciente" value={form.patient_id} onChange={(e) => setForm((p) => ({ ...p, patient_id: e.target.value }))} required>
              <option value="">Selecciona</option>
              {patients.map((p) => (<option key={p.id} value={p.id}>{p.full_name}</option>))}
            </Select>
            <Select label="Profesional" value={form.professional_id} onChange={(e) => setForm((p) => ({ ...p, professional_id: e.target.value }))} required>
              <option value="">Selecciona</option>
              {professionals.map((p) => (<option key={p.id} value={p.id}>{p.full_name}</option>))}
            </Select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Select label="Turno relacionado" value={form.appointment_id} onChange={(e) => setForm((p) => ({ ...p, appointment_id: e.target.value }))}>
              <option value="">Sin turno</option>
              {appointments.map((a) => (<option key={a.id} value={a.id}>{a.id.slice(0, 8)}</option>))}
            </Select>
            <Input label="Fecha y hora" type="datetime-local" value={form.visit_at} onChange={(e) => setForm((p) => ({ ...p, visit_at: e.target.value }))} required />
          </div>

          <Input label="Motivo" value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} />
          <Input label="Diagnostico" value={form.diagnosis} onChange={(e) => setForm((p) => ({ ...p, diagnosis: e.target.value }))} />
          <Input label="Tratamiento" value={form.treatment} onChange={(e) => setForm((p) => ({ ...p, treatment: e.target.value }))} />
          <label className="flex flex-col gap-2 text-sm text-slate-700"><span className="text-xs uppercase tracking-[0.2em]">Notas</span><textarea className="input-surface min-h-[100px] rounded-2xl px-4 py-3 text-sm" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} /></label>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Importe cobrado" type="number" min="0" step="0.01" value={form.amount_paid} onChange={(e) => setForm((p) => ({ ...p, amount_paid: e.target.value }))} />
            <Select label="Metodo de pago" value={form.payment_method} onChange={(e) => setForm((p) => ({ ...p, payment_method: e.target.value }))}>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="otro">Otro</option>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Adjunto (nombre)" value={form.attachment_name} onChange={(e) => setForm((p) => ({ ...p, attachment_name: e.target.value }))} />
            <Input label="Adjunto (URL)" type="url" value={form.attachment_url} onChange={(e) => setForm((p) => ({ ...p, attachment_url: e.target.value }))} />
          </div>

          {error ? <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">{error}</p> : null}
          <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit">Guardar visita</Button></div>
        </form>
      </Modal>
    </div>
  );
}
