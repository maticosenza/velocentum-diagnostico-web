import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logoVelocentum from "@/assets/velocentum-icon.png";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ingresar · Velocentum · Diagnóstico e-commerce" },
      { name: "description", content: "Acceso interno al Diagnóstico e-commerce de Velocentum." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Ingresar · Velocentum · Diagnóstico e-commerce" },
      { property: "og:description", content: "Acceso interno al Diagnóstico e-commerce." },
    ],
  }),
  component: PantallaLogin,
});

function PantallaLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setCargando(false);

    if (authError) {
      setError(
        authError.message.toLowerCase().includes("invalid")
          ? "El email o la contraseña no son correctos. Fijate y probá de nuevo."
          : "No pudimos iniciar la sesión. Intentá de nuevo en unos segundos.",
      );
      return;
    }
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8">
        <div className="flex items-center gap-2.5">
          <img src={logoVelocentum} alt="Velocentum" className="size-7 shrink-0 object-contain" />
          <div>
            <p className="text-[14px] font-medium leading-5 text-foreground">Velocentum</p>
            <p className="text-[11.5px] leading-4 text-muted-foreground">Diagnóstico e-commerce</p>
          </div>
        </div>

        <h1 className="mt-7 text-[18px] font-medium text-foreground">Ingresá a tu cuenta</h1>
        <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
          Herramienta interna. El acceso lo da el administrador del equipo.
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[12px] font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vos@velocentum.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[12px] font-medium">
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="text-[12px] leading-5 text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" size="sm" className="w-full" disabled={cargando}>
            {cargando ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
