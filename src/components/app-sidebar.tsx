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
import logotipoBlanco from "@/assets/marca/web-v1/logo/velocentum-logotipo-blanco-tight.png";
import isotipoInterfaz from "@/assets/marca/web-v1/logo/velocentum-v-bicolor-ui.svg";

const items = [
  { title: "Diagnósticos", url: "/", icon: LayoutList, exact: true },
  { title: "Nuevo diagnóstico", url: "/diagnosticos/nuevo", icon: FilePlus2, exact: false },
];

/** Descriptor de DH-11. Junto al wordmark, "Velocentum" ya lo dice el logo. */
const DESCRIPTOR = "Equipo de crecimiento";

/** Ítem de la navegación sobre navy (DH-3): blanco, nunca un acento. */
const CLASE_ITEM =
  "flex items-center gap-3 rounded-md px-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring";

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
        "flex shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* DH-8 y DH-11: wordmark blanco sobre navy y, debajo, el descriptor del color del
          logo, alineado al borde de su tinta y fuera de su zona libre (25 % de su alto). */}
      <div
        className={cn(
          "flex h-20 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-3" : "px-5",
        )}
      >
        {collapsed ? (
          // Donde la V va sola, el texto va completo (DH-11): acá, en el nombre accesible.
          <img
            src={isotipoInterfaz}
            alt={`Velocentum · ${DESCRIPTOR}`}
            title={`Velocentum · ${DESCRIPTOR}`}
            className="h-6 w-auto"
          />
        ) : (
          <div className="min-w-0">
            <img src={logotipoBlanco} alt="Velocentum" className="block h-[18px] w-auto" />
            <p className="mt-2 font-mono text-[11px] leading-4 tracking-[0.04em] text-sidebar-foreground">
              {DESCRIPTOR}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {!collapsed && (
          <p className="px-2 pb-2 pt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-sidebar-muted-foreground">
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
              aria-current={active ? "page" : undefined}
              className={cn(
                CLASE_ITEM,
                "relative py-2.5 text-[14px]",
                active
                  ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                  : "text-sidebar-muted-foreground hover:bg-navy-hover hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="size-[18px] shrink-0" strokeWidth={1.75} />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={pedirCerrarSesion}
          title="Cerrar sesión"
          className={cn(
            CLASE_ITEM,
            "w-full py-2 text-[13.5px] text-sidebar-muted-foreground hover:bg-navy-hover hover:text-sidebar-foreground",
          )}
        >
          <LogOut className="size-[18px] shrink-0" strokeWidth={1.75} />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className={cn(
            CLASE_ITEM,
            "w-full py-2 text-[13.5px] text-sidebar-muted-foreground hover:bg-navy-hover hover:text-sidebar-foreground",
          )}
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
