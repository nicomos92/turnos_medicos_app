"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = supabaseBrowserClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage(error.message);
      } else {
        router.push("/app/dashboard");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage(
          "Revisa tu email para confirmar la cuenta. Luego podras iniciar sesion."
        );
      }
    }

    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    setMessage(null);
    const supabase = supabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/app/dashboard`,
      },
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Plataforma SaaS Medica
        </p>
        <h1 className="text-3xl font-semibold">Gestion de turnos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Centraliza profesionales, pacientes y disponibilidad con seguridad
          multi-consultorio.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Button type="submit" disabled={loading} className="w-full">
          {mode === "signin" ? "Ingresar" : "Crear cuenta"}
        </Button>
      </form>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
        disabled={loading}
      >
        Continuar con Google
      </Button>

      {message ? (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
          {message}
        </p>
      ) : null}

      <button
        type="button"
        className="text-sm text-muted-foreground"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
      >
        {mode === "signin"
          ? "No tienes cuenta? Crear una nueva"
          : "Ya tienes cuenta? Inicia sesion"}
      </button>
    </div>
  );
}
