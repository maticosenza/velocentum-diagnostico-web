import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MensajeEstado } from "@/components/mensaje-estado";
import { LogotipoBlanco } from "@/components/logotipo-blanco";

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
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* DH-3: el acceso es un momento de marca, en navy con el logotipo blanco.
          DH-11: descriptor debajo del wordmark, fuera de su zona libre; el claim en
          Anton, en un bloque propio, nunca pegado al logo. */}
      <section className="flex flex-col justify-between gap-12 bg-navy px-8 py-10 text-[var(--logo-blanco)] lg:w-1/2 lg:px-14 lg:py-14">
        <div>
          <LogotipoBlanco alto={28} className="block" />
          <p className="mt-3 font-mono text-[12px] leading-4 tracking-[0.04em]">
            Equipo de crecimiento
          </p>
        </div>
        <p className="max-w-[13ch] font-display text-[44px] font-normal uppercase leading-[1.02] sm:text-[64px]">
          Estamos en el negocio de hacer crecer negocios
        </p>
      </section>

      <main className="flex flex-1 items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8">
          <h1 className="text-[20px] font-semibold text-foreground">Ingresá a tu cuenta</h1>
          <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
            Herramienta interna. El acceso lo da el administrador del equipo.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
              <MensajeEstado tono="error" role="alert" className="text-[12px] leading-5">
                {error}
              </MensajeEstado>
            )}

            <Button type="submit" className="w-full" disabled={cargando}>
              {cargando ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
