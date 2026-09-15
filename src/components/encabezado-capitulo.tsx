import type { AcentoWeb } from "@/documents/theme/velocentum-web-v1";
import { cn } from "@/lib/utils";

/** Relleno del acento con su par de texto obligatorio (DH-4). */
const RELLENO: Record<AcentoWeb, string> = {
  azul: "bg-acento-1 text-texto-sobre-1",
  bermellon: "bg-acento-2 text-texto-sobre-2",
  verde: "bg-acento-3 text-texto-sobre-3",
  violeta: "bg-acento-4 text-texto-sobre-4",
  amarillo: "bg-acento-5 text-texto-sobre-5",
};

const FILETE: Record<AcentoWeb, string> = {
  azul: "bg-acento-1",
  bermellon: "bg-acento-2",
  verde: "bg-acento-3",
  violeta: "bg-acento-4",
  amarillo: "bg-acento-5",
};

/**
 * Encabezado de capítulo (DH-3): el acento identifica el capítulo en el
 * encabezado de la sección y no entra al cuerpo. Va siempre como relleno con
 * su par, porque como texto sobre el fondo solo el violeta llega a AA; el
 * filete es decorativo. Etiqueta en Geist Mono, "01 · RESUMEN" (DH-9).
 */
export function EncabezadoCapitulo({
  numero,
  titulo,
  acento,
}: {
  numero: number;
  titulo: string;
  acento: AcentoWeb;
}) {
  return (
    <div className="flex items-center gap-4">
      <p
        className={cn(
          "shrink-0 rounded-full px-3.5 py-1 font-mono text-[12px] font-medium uppercase tracking-[0.08em]",
          RELLENO[acento],
        )}
      >
        {String(numero).padStart(2, "0")} · {titulo}
      </p>
      <span aria-hidden className={cn("h-0.5 flex-1 rounded-full", FILETE[acento])} />
    </div>
  );
}
