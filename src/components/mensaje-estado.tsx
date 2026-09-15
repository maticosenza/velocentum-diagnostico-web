import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export type TonoEstado = "error" | "advertencia" | "exito";

const INDICADOR: Record<TonoEstado, string> = {
  error: "bg-estado-rojo",
  advertencia: "bg-estado-amarillo",
  exito: "bg-estado-verde",
};

/**
 * Mensaje de estado según DH-5: el texto va en tinta y el color del estado
 * va en un indicador con contorno tinta, su par. Bermellón, amarillo y verde
 * no llegan a AA como texto chico sobre el fondo (3,56 / 1,57 / 2,15:1), así
 * que nunca son el color de la letra; y el color nunca va solo: lo acompaña
 * el mensaje.
 */
export function MensajeEstado({
  tono,
  className,
  children,
  ...props
}: { tono: TonoEstado } & ComponentPropsWithoutRef<"p">) {
  return (
    <p className={cn("flex items-start gap-2 text-foreground", className)} {...props}>
      <span
        aria-hidden
        className={cn(
          "mt-[0.45em] size-2 shrink-0 rounded-full ring-1 ring-foreground",
          INDICADOR[tono],
        )}
      />
      <span className="min-w-0">{children}</span>
    </p>
  );
}
