import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutList, FilePlus2, PanelLeftClose, PanelLeft, LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { CLAVE_BORRADOR, borradorConDatos } from "@/lib/diagnostico-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import logoVelocentum from "@/assets/velocentum-icon.png";

const items = [
  { title: "Diagnósticos", url: "/", icon: LayoutList, exact: true },
  { title: "Nuevo diagnóstico", url: "/diagnosticos/nuevo", icon: FilePlus2, exact: false },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  // Borrador con datos que se va a descartar al cerrar sesión, mientras se confirma.
  const [descartar, setDescartar] = useState<{ nombreTienda: string } | null>(null);

  /**
   * El borrador del formulario vive en localStorage con una clave sin usuario: si sobrevive,
   * quien entre después en este navegador lo retoma (H-51). Si tiene algo cargado pide
   * confirmación, con el mismo criterio que Cancelar; si no, cierra directo.
   */
  function pedirCerrarSesion() {
    let crudo: string | null = null;
    try {
      crudo = window.localStorage.getItem(CLAVE_BORRADOR);
    } catch {
      // Sin acceso a localStorage no hay borrador que proteger.
    }
    const borrador = borradorConDatos(crudo);
    if (borrador) setDescartar(borrador);
    else void cerrarSesion();
  }

  async function cerrarSesion() {
    setDescartar(null);
    window.localStorage.removeItem(CLAVE_BORRADOR);
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
    // Otra vez: si el formulario estaba abierto, un autoguardado pendiente pudo reescribirlo
    // mientras se esperaba a Supabase. Fuera de la ruta privada ya no queda quién lo escriba.
    window.localStorage.removeItem(CLAVE_BORRADOR);
  }

  const isActive = (url: string, exact: boolean) =>
    exact ? pathname === url : pathname.startsWith(url);

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-4">
        <img
          src={logoVelocentum}
          alt="Velocentum"
          className="size-7 shrink-0 rounded-[6px] object-contain"
        />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium leading-5 text-foreground">Velocentum</p>
            <p className="truncate text-[11.5px] leading-4 text-muted-foreground">
              Diagnóstico e-commerce
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {!collapsed && (
          <p className="px-2 pb-2 pt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
            Trabajo
          </p>
        )}
        {items.map((item) => {
          const active = isActive(item.url, item.exact);
          return (
            <Link
              key={item.url}
              to={item.url}
              title={item.title}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-2.5 py-2.5 text-[14px] transition-colors",
                active
                  ? "bg-violet-soft font-medium text-violet"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-[18px] shrink-0" strokeWidth={1.75} />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-border p-3">
        <button
          type="button"
          onClick={pedirCerrarSesion}
          title="Cerrar sesión"
          className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-[13.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-[18px] shrink-0" strokeWidth={1.75} />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-[13.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
        >
          {collapsed ? (
            <PanelLeft className="size-[18px]" strokeWidth={1.75} />
          ) : (
            <PanelLeftClose className="size-[18px]" strokeWidth={1.75} />
          )}
          {!collapsed && <span>Contraer</span>}
        </button>
      </div>

      <AlertDialog
        open={descartar !== null}
        onOpenChange={(abierto) => !abierto && setDescartar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {descartar?.nombreTienda
                ? `¿Cerrar sesión y descartar el borrador de ${descartar.nombreTienda}?`
                : "¿Cerrar sesión y descartar el borrador?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {descartar?.nombreTienda ? "" : "Todavía no tiene nombre de tienda. "}Hay un
              diagnóstico sin guardar en este navegador. Al cerrar sesión se borra, para que no lo
              retome quien entre después, y no se puede recuperar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={() => void cerrarSesion()}>
              Cerrar sesión y descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
