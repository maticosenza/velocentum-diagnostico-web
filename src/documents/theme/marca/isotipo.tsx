/**
 * Isotipo de Velocentum para `@react-pdf/renderer` — BV4 F1, etapa 5.
 *
 * Mapea los datos de `isotipo.generated.ts` (transcripción exacta de
 * `isotipo-approved.svg`, sin redibujar nada) a primitivas de react-pdf.
 * Mismo criterio que `src/documents/renderers/pdf/marca.tsx`, que es el
 * precedente del repositorio para llevar un SVG de marca a PDF.
 *
 * **Uso provisional hasta el veredicto humano del gate DH-6.** F1 construye
 * el componente y NO lo aplica a ninguna superficie: navegación, portadas y
 * documentos son alcance de F2/F3.
 *
 * Limitaciones heredadas de react-pdf, documentadas en `PROCEDENCIA.md`
 * (4.1 bis a) y comparadas en `docs/bv4-f1-assets-pdf-vs-navegador.png`:
 * el resplandor (`feGaussianBlur`) no existe en PDF, y los filetes con
 * `stroke="url(#iso-edge)"` no salen con su degradado.
 */
import React from "react";
import { Defs, G, LinearGradient, Path, Stop, Svg } from "@react-pdf/renderer";
import {
  ISOTIPO_ENCUADRES,
  ISOTIPO_GRADIENTES,
  ISOTIPO_NODOS,
  ISOTIPO_RELACION,
  ISOTIPO_VIEWBOX,
  type NodoIsotipo,
} from "./isotipo.generated";

/**
 * Encuadre del glifo. `natural` usa el `viewBox` del asset (220 × 210, no
 * cuadrado). `cuadrado` y `circular` son los dos encuadres medidos en la
 * etapa 4.1 bis (b): centran el cuadrado en la caja de TINTA, no en el
 * `viewBox`, y nunca deforman el glifo.
 */
export type EncuadreIsotipo = "natural" | "cuadrado" | "circular";

function dibujar(nodo: NodoIsotipo, clave: string): React.ReactElement {
  if (nodo.tipo === "g") {
    return (
      <G key={clave} {...nodo.attrs}>
        {nodo.hijos.map((hijo, i) => dibujar(hijo, `${clave}.${i}`))}
      </G>
    );
  }
  return <Path key={clave} {...(nodo.attrs as unknown as { d: string })} />;
}

export function IsotipoVelocentum({
  size,
  encuadre = "natural",
}: {
  /**
   * ALTO del glifo en puntos. El ancho sale de la relación del asset — el
   * `viewBox` no es cuadrado (220 × 210), así que fijar el alto es lo único
   * que da una línea de base predecible al componerlo con texto.
   */
  size: number;
  encuadre?: EncuadreIsotipo;
}) {
  const viewBox = encuadre === "natural" ? ISOTIPO_VIEWBOX : ISOTIPO_ENCUADRES[encuadre];
  // En los encuadres cuadrados la caja es cuadrada por definición.
  const width = encuadre === "natural" ? size * ISOTIPO_RELACION : size;
  return (
    <Svg width={width} height={size} viewBox={viewBox}>
      <Defs>
        {ISOTIPO_GRADIENTES.map((g) => (
          <LinearGradient
            key={g.id}
            id={g.id}
            x1={g.x1}
            y1={g.y1}
            x2={g.x2}
            y2={g.y2}
            gradientUnits={g.gradientUnits}
          >
            {g.stops.map((s, i) => (
              <Stop key={i} offset={s.offset ?? 0} stopColor={s.stopColor} stopOpacity={s.stopOpacity ?? 1} />
            ))}
          </LinearGradient>
        ))}
      </Defs>
      {ISOTIPO_NODOS.map((n, i) => dibujar(n, String(i)))}
    </Svg>
  );
}
