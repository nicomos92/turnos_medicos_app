"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";

type Clinic = { id: string; name: string; legal_name: string | null; created_at: string };
type Room = { id: string; clinic_id: string; name: string; location_hint: string | null };

export default function EstablecimientosClient({
  clinics,
  rooms,
  profileRole,
}: {
  clinics: Clinic[];
  rooms: Room[];
  profileRole: string;
}) {
  const router = useRouter();
  const canManageClinics = profileRole === "site_admin";
  const [clinicOpen, setClinicOpen] = useState(false);
  const [roomOpen, setRoomOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clinicForm, setClinicForm] = useState({ name: "", legal_name: "" });
  const [roomForm, setRoomForm] = useState({ clinic_id: "", name: "", location_hint: "" });

  const roomsByClinic = useMemo(() => {
    return rooms.reduce<Record<string, Room[]>>((acc, room) => {
      acc[room.clinic_id] = [...(acc[room.clinic_id] ?? []), room];
      return acc;
    }, {});
  }, [rooms]);

  const createClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageClinics) return;
    setError(null);
    const supabase = supabaseBrowserClient();
    const { error } = await supabase.from("clinics").insert({
      name: clinicForm.name,
      legal_name: clinicForm.legal_name || null,
    });
    if (error) setError(error.message);
    else {
      setClinicOpen(false);
      router.refresh();
    }
  };

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const supabase = supabaseBrowserClient();
    const { error } = await supabase.from("consult_rooms").insert({
      clinic_id: roomForm.clinic_id,
      name: roomForm.name,
      location_hint: roomForm.location_hint || null,
    });
    if (error) setError(error.message);
    else {
      setRoomOpen(false);
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Establecimientos</h2>
          <p className="text-sm text-muted-foreground">Clinicas y consultorios asociados.</p>
        </div>
        <div className="flex gap-2">
          {canManageClinics ? <Button onClick={() => setClinicOpen(true)}>Nuevo establecimiento</Button> : null}
          <Button variant="outline" onClick={() => setRoomOpen(true)}>Nuevo consultorio</Button>
        </div>
      </div>

      {!canManageClinics ? (
        <Card>
          <p className="text-sm text-amber-700">Solo el perfil `site_admin` puede crear establecimientos. Tu rol actual: {profileRole}.</p>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {clinics.map((clinic) => (
          <Card key={clinic.id}>
            <h3 className="text-lg font-semibold">{clinic.name}</h3>
            <p className="text-sm text-muted-foreground">{clinic.legal_name ?? "Sin razon social"}</p>
            <div className="mt-4 space-y-2">
              {(roomsByClinic[clinic.id] ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin consultorios cargados.</p>
              ) : (
                (roomsByClinic[clinic.id] ?? []).map((room) => (
                  <div key={room.id} className="rounded-2xl border border-border px-3 py-2 text-sm">
                    <p className="font-medium">{room.name}</p>
                    <p className="text-muted-foreground">{room.location_hint ?? "Sin ubicacion"}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        ))}
      </div>

      <Modal open={clinicOpen} onClose={() => setClinicOpen(false)} title="Nuevo establecimiento">
        <form onSubmit={createClinic} className="space-y-4">
          <Input label="Nombre" value={clinicForm.name} onChange={(e) => setClinicForm((p) => ({ ...p, name: e.target.value }))} required />
          <Input label="Razon social" value={clinicForm.legal_name} onChange={(e) => setClinicForm((p) => ({ ...p, legal_name: e.target.value }))} />
          {error ? <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">{error}</p> : null}
          <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setClinicOpen(false)}>Cancelar</Button><Button type="submit">Guardar</Button></div>
        </form>
      </Modal>

      <Modal open={roomOpen} onClose={() => setRoomOpen(false)} title="Nuevo consultorio">
        <form onSubmit={createRoom} className="space-y-4">
          <Select label="Establecimiento" value={roomForm.clinic_id} onChange={(e) => setRoomForm((p) => ({ ...p, clinic_id: e.target.value }))} required>
            <option value="">Selecciona</option>
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
            ))}
          </Select>
          <Input label="Nombre" value={roomForm.name} onChange={(e) => setRoomForm((p) => ({ ...p, name: e.target.value }))} required />
          <Input label="Ubicacion" value={roomForm.location_hint} onChange={(e) => setRoomForm((p) => ({ ...p, location_hint: e.target.value }))} />
          {error ? <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">{error}</p> : null}
          <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setRoomOpen(false)}>Cancelar</Button><Button type="submit">Guardar</Button></div>
        </form>
      </Modal>
    </div>
  );
}
