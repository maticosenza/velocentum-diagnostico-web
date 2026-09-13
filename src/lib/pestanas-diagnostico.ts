/**
 * Pestañas de la pantalla de detalle del diagnóstico. Reorganizan lo que la
 * pantalla ya mostraba; no calculan nada nuevo. La pestaña activa vive en la
 * URL (`?pestana=`) para no perderse al recargar; Resumen es la de defecto y
 * no ensucia la URL.
 */

import type { EstadosBloque, Fuga } from "./calculo-diagnostico";
import { bloquesSemaforo, etiquetaCampo, type PerimetroVista } from "./vista-diagnostico";

export const PESTANAS = ["resumen", "detalle", "propuesta", "proyeccion", "comercial"] as const;
export type Pestana = (typeof PESTANAS)[number];

export const ETIQUETA_PESTANA: Record<Pestana, string> = {
  resumen: "Resumen",
  detalle: "Detalle",
  propuesta: "Propuesta",
  proyeccion: "Proyección",
  comercial: "Comercial",
};

export const PESTANA_POR_DEFECTO: Pestana = "resumen";

/** Lo que llega en `?pestana=`, validado. Cualquier otra cosa cae en Resumen. */
export function pestanaDesdeBusqueda(valor: unknown): Pestana {
  return typeof valor === "string" && (PESTANAS as readonly string[]).includes(valor)
    ? (valor as Pestana)
    : PESTANA_POR_DEFECTO;
}

export const NOMBRE_CANAL: Record<string, string> = {
  tienda_propia: "Tienda propia",
  mercado_libre: "Mercado Libre",
};

/** Títulos de las píldoras del semáforo, compartidos con "Qué falta". */
export const TITULO_BLOQUE: Record<keyof EstadosBloque, string> = {
  medicion: "Medición",
  economia: "Economía",
  cuenta: "Cuenta",
  funnel_web: "Funnel web",
  creativos: "Contenido",
};

export type QueFalta = {
  /** Datos que piden las fugas que no se pudieron calcular, con nombre legible. */
  datos: string[];
  /** Píldoras del semáforo que aplican al perímetro y están en "Sin datos". */
  bloques: string[];
};

/**
 * Qué falta para completar el diagnóstico: los mismos faltantes que la
 * pantalla ya nombra en "No se pudo calcular. Faltan: …" y las mismas
 * píldoras que ya muestra en "Sin datos". Un bloque fuera del perímetro no
 * falta: no aplica.
 */
export function queFaltaDiagnostico(
  fugas: Fuga[],
  estados: Partial<EstadosBloque>,
  perimetro: PerimetroVista,
): QueFalta {
  const datos = [
    ...new Set(fugas.filter((f) => f.calculable === false).flatMap((f) => f.faltantes)),
  ].map(etiquetaCampo);
  const bloques = bloquesSemaforo(perimetro)
    .filter((id) => (estados[id] ?? "sin_datos") === "sin_datos")
    .map((id) => TITULO_BLOQUE[id]);
  return { datos: [...new Set(datos)], bloques };
}
