import type { EstadoBloque } from "@/lib/calculo-diagnostico";
import { cn } from "@/lib/utils";

const COLOR: Record<EstadoBloque, string> = {
  verde: "bg-estado-verde",
  amarillo: "bg-estado-amarillo",
  rojo: "bg-estado-rojo",
  sin_datos: "bg-estado-sin-datos",
};

export const ETIQUETA_ESTADO: Record<EstadoBloque, string> = {
  verde: "En orden",
  amarillo: "A revisar",
  rojo: "Crítico",
  sin_datos: "Sin datos",
};

/**
 * El color del estado va con su par (DH-5): contorno tinta, porque verde y
 * amarillo no llegan a 3:1 contra el fondo como elemento gráfico.
 */
export function EstadoPunto({ estado, className }: { estado: EstadoBloque; className?: string }) {
  return (
    <span
      aria-label={ETIQUETA_ESTADO[estado]}
      className={cn(
        "inline-block size-2.5 shrink-0 rounded-full ring-1 ring-foreground",
        COLOR[estado],
        className,
      )}
    />
  );
}
