"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const statusColors = {
  pendiente: "#f2c94c",
  confirmado: "#38bdf8",
  cancelado: "#94a3b8",
  atendido: "#34d399",
};

type Row = {
  id: string;
  start_at: string;
  status: keyof typeof statusColors;
  professional: { full_name: string } | null;
};

export default function DashboardClient({ appointments }: { appointments: Row[] }) {
  const total = appointments.length;
  const cancelaciones = appointments.filter((x) => x.status === "cancelado").length;

  const byProfessional = appointments.reduce<Record<string, number>>((acc, row) => {
    const key = row.professional?.full_name ?? "Sin asignar";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const professionalData = Object.entries(byProfessional).map(([name, value]) => ({ name, value }));

  const byStatus = appointments.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});

  const statusData = Object.entries(byStatus).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Metricas base del consultorio.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card><p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Turnos</p><p className="mt-2 text-3xl font-semibold">{total}</p></Card>
        <Card><p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Cancelaciones</p><p className="mt-2 text-3xl font-semibold">{cancelaciones}</p></Card>
        <Card><p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Profesionales</p><p className="mt-2 text-3xl font-semibold">{professionalData.length}</p></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Turnos por profesional</h3><Badge variant="info">Resumen</Badge></div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={professionalData}><Tooltip /><Bar dataKey="value" fill="#0f766e" radius={[8, 8, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Estados</h3><Badge variant="warning">Seguimiento</Badge></div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}>
                  {statusData.map((entry) => (<Cell key={entry.name} fill={statusColors[entry.name as keyof typeof statusColors] ?? "#94a3b8"} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
