import { Bell } from "lucide-react";
import UserMenu from "@/components/UserMenu";

export default function TopBar({ userEmail }: { userEmail: string }) {
  return (
    <header className="flex items-center justify-between px-4 py-4 md:px-10 border-b border-border/70 bg-white/70 app-shell">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Agenda Clinica
        </p>
        <h1 className="text-xl font-semibold">Gestion diaria</h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="h-10 w-10 rounded-full border border-border bg-white flex items-center justify-center">
          <Bell className="h-4 w-4" />
        </button>
        <UserMenu email={userEmail} />
      </div>
    </header>
  );
}
