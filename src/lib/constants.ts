export const APPOINTMENT_STATUSES = [
  { value: "pendiente", label: "Pendiente", color: "warning" },
  { value: "confirmado", label: "Confirmado", color: "info" },
  { value: "cancelado", label: "Cancelado", color: "muted" },
  { value: "atendido", label: "Atendido", color: "success" },
] as const;

export const START_HOUR = 8;
export const END_HOUR = 20;
export const SLOT_MINUTES = 30;

export const WEEK_DAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miercoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sabado" },
] as const;
