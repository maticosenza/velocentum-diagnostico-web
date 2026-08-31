/**
 * Lockup tipográfico de la herramienta — BV4 F1, etapa 5.
 *
 * Isotipo (provisional, gate DH-6 pendiente) + "Velocentum" en Satoshi +
 * descriptor "Equipo de crecimiento" según DH-11.
 *
 * F1 construye el componente y sus variantes, y **no lo aplica a ninguna
 * superficie**: navegación, portadas y documentos son alcance de F2/F3.
 *
 * DH-11, respetado acá: el descriptor "Equipo de crecimiento" acompaña al
 * lockup; el claim "Estamos en el negocio de hacer crecer negocios"
 * **no se usa en F1** y no existe en este archivo.
 *
 * Colores: los toma del tema que se le pase. Por defecto usa
 * `velocentum-crystal/v1`, que es el tema de marca de BV4 — pero el
 * componente no decide nada: el tema activo de la aplicación lo sigue
 * fijando `theme/tema-activo.ts`, que en F1 arranca en `velocentum-light/v1`.
 */
import React from "react";
import { Text, View } from "@react-pdf/renderer";
import type { DocumentTheme } from "../types";
import { VELOCENTUM_CRYSTAL_V1 } from "../velocentum-crystal-v1";
import { IsotipoVelocentum, type EncuadreIsotipo } from "./isotipo";

/** Descriptor de DH-11. El claim institucional NO se usa en F1. */
export const DESCRIPTOR_VELOCENTUM = "Equipo de crecimiento";
export const WORDMARK_VELOCENTUM = "Velocentum";

export type VarianteLockup = "claro" | "oscuro";

export type PropsLockup = {
  /** Alto del isotipo en puntos. Toda la escala tipográfica sale de acá. */
  size?: number;
  /** Sobre superficie clara u oscura. Cambia sólo los colores del texto. */
  variante?: VarianteLockup;
  /** Con o sin el descriptor de DH-11. */
  descriptor?: boolean;
  /** Isotipo al lado del texto (horizontal) o encima (vertical). */
  orientacion?: "horizontal" | "vertical";
  /** Encuadre del isotipo. Ver `PROCEDENCIA.md`, 4.1 bis (b). */
  encuadre?: EncuadreIsotipo;
  /** Tema del que salen los colores. Por defecto, el tema de marca de BV4. */
  theme?: DocumentTheme;
};

/**
 * Colores del lockup por variante. `oscuro` usa los pares `onDark` del tema
 * de marca, que existen justamente porque el juego de 14 tokens original no
 * tenía modo oscuro; si el tema que se pasa no los declara, cae a `surface`.
 */
function colores(theme: DocumentTheme, variante: VarianteLockup) {
  if (variante === "oscuro") {
    return {
      wordmark: theme.colors.onDark?.text ?? theme.colors.surface,
      descriptor: theme.colors.onDark?.muted ?? theme.colors.surface,
    };
  }
  return {
    wordmark: theme.colors.ink,
    descriptor: theme.colors.muted,
  };
}

export function LockupVelocentum({
  size = 28,
  variante = "claro",
  descriptor = true,
  orientacion = "horizontal",
  encuadre = "natural",
  theme = VELOCENTUM_CRYSTAL_V1,
}: PropsLockup) {
  const c = colores(theme, variante);
  const horizontal = orientacion === "horizontal";
  // La escala tipográfica sale del alto del isotipo, no de números sueltos:
  // así el lockup mantiene su proporción a cualquier tamaño.
  const cuerpoWordmark = size * 0.78;
  const cuerpoDescriptor = size * 0.3;

  const texto = (
    <View style={{ flexDirection: "column", justifyContent: "center" }}>
      <Text
        style={{
          fontFamily: theme.typography.heading,
          fontWeight: theme.typography.weightBold,
          fontSize: cuerpoWordmark,
          color: c.wordmark,
          letterSpacing: -cuerpoWordmark * 0.02,
          lineHeight: 1,
        }}
      >
        {WORDMARK_VELOCENTUM}
      </Text>
      {descriptor ? (
        <Text
          style={{
            fontFamily: theme.typography.body,
            fontWeight: theme.typography.weightMedium,
            fontSize: cuerpoDescriptor,
            color: c.descriptor,
            letterSpacing: cuerpoDescriptor * 0.06,
            marginTop: size * 0.12,
            lineHeight: 1,
          }}
        >
          {DESCRIPTOR_VELOCENTUM}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View
      style={{
        flexDirection: horizontal ? "row" : "column",
        alignItems: horizontal ? "center" : "flex-start",
        gap: horizontal ? size * 0.42 : size * 0.34,
      }}
    >
      <IsotipoVelocentum size={size} encuadre={encuadre} />
      {texto}
    </View>
  );
}
