import Link from "next/link";
import {
  CalendarDays,
  Users,
  UserSquare2,
  BarChart3,
  Building2,
  ClipboardPlus,
} from "lucide-react";

const navItems = [
  { href: "/app/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/app/turnos", label: "Turnos", icon: CalendarDays },
  { href: "/app/visitas", label: "Visitas", icon: ClipboardPlus },
  { href: "/app/profesionales", label: "Profesionales", icon: UserSquare2 },
  { href: "/app/pacientes", label: "Pacientes", icon: Users },
  { href: "/app/establecimientos", label: "Establecimientos", icon: Building2 },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 flex-col gap-6 px-6 py-8 border-r border-border/70 bg-white/70 app-shell">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
          Consultorios
        </p>
        <h2 className="text-lg font-semibold">Turnos Medicos</h2>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto text-xs text-muted-foreground">
        Sistema multi-consultorio con RLS.
      </div>
    </aside>
  );
}
