import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ACENTOS_WEB_V1, PALETA_WEB_V1 } from "./velocentum-web-v1";
import {
  UMBRAL_AA_GRANDE,
  UMBRAL_AA_TEXTO,
  contrasteRedondeado,
  relacionDeContraste,
} from "./contraste";
import { resolverColor, variablesRaiz } from "./leer-css";

/**
 * Verificación automática de contraste del tema `velocentum-web/v1` (BV4
 * F2b). Reemplaza a la de `velocentum-crystal/v1`, con el mismo patrón.
 *
 * Mide los colores tal como los resuelve `src/styles.css` —siguiendo
 * `var()` y `color-mix()`—, no una copia: si alguien cambia un rol o un
 * porcentaje de rebajado en la hoja, esto lo mide de nuevo.
 *
 * Bloqueante: cada par de texto (AA 4,5:1) y cada par gráfico (3:1: bordes
 * de control, foco, indicadores) que la pantalla usa. No bloqueante pero
 * fijado: los límites medidos que explican las reglas del contrato.
 */
const AQUI = dirname(fileURLToPath(import.meta.url));
const hoja = variablesRaiz(readFileSync(join(AQUI, "../../styles.css"), "utf-8"));
const color = (variable: string) => resolverColor(hoja, variable);

type Par = [nombre: string, frente: string, fondo: string, umbral: number];

const TEXTO: Par[] = [
  // Superficies claras: fondo crema, tarjeta blanca y los dos rebajados.
  ["texto sobre fondo", "--foreground", "--background", UMBRAL_AA_TEXTO],
  ["texto sobre tarjeta", "--card-foreground", "--card", UMBRAL_AA_TEXTO],
  ["texto sobre menú", "--popover-foreground", "--popover", UMBRAL_AA_TEXTO],
  ["texto sobre superficie suave", "--foreground", "--muted", UMBRAL_AA_TEXTO],
  ["texto sobre hover", "--accent-foreground", "--accent", UMBRAL_AA_TEXTO],
  ["texto sobre secundario", "--secondary-foreground", "--secondary", UMBRAL_AA_TEXTO],
  ["texto sobre violeta suave", "--foreground", "--violeta-suave", UMBRAL_AA_TEXTO],
  ["texto de apoyo sobre fondo", "--muted-foreground", "--background", UMBRAL_AA_TEXTO],
  ["texto de apoyo sobre tarjeta", "--muted-foreground", "--card", UMBRAL_AA_TEXTO],
  ["texto de apoyo sobre superficie suave", "--muted-foreground", "--muted", UMBRAL_AA_TEXTO],
  ["texto de apoyo sobre violeta suave", "--muted-foreground", "--violeta-suave", UMBRAL_AA_TEXTO],
  // Violeta como texto: links, selección, "Lo resuelve", servicios.
  ["violeta sobre fondo", "--primary", "--background", UMBRAL_AA_TEXTO],
  ["violeta sobre tarjeta", "--primary", "--card", UMBRAL_AA_TEXTO],
  ["violeta sobre superficie suave", "--primary", "--muted", UMBRAL_AA_TEXTO],
  // `text-violet` es `--color-violet` → `--acento-4`.
  ["violeta sobre violeta suave", "--acento-4", "--violeta-suave", UMBRAL_AA_TEXTO],
  // Rellenos con su par (DH-4, DH-5): CTA, estados y capítulos.
  ["CTA: texto sobre violeta", "--primary-foreground", "--primary", UMBRAL_AA_TEXTO],
  ["error: texto sobre bermellón", "--destructive-foreground", "--destructive", UMBRAL_AA_TEXTO],
  ["azul con su par", "--texto-sobre-1", "--acento-1", UMBRAL_AA_TEXTO],
  ["bermellón con su par", "--texto-sobre-2", "--acento-2", UMBRAL_AA_TEXTO],
  ["verde con su par", "--texto-sobre-3", "--acento-3", UMBRAL_AA_TEXTO],
  ["violeta con su par", "--texto-sobre-4", "--acento-4", UMBRAL_AA_TEXTO],
  ["amarillo con su par", "--texto-sobre-5", "--acento-5", UMBRAL_AA_TEXTO],
  // Navy: navegación y acceso (DH-3).
  ["navegación: blanco sobre navy", "--sidebar-foreground", "--sidebar", UMBRAL_AA_TEXTO],
  [
    "navegación: blanco sobre ítem activo",
    "--sidebar-accent-foreground",
    "--sidebar-accent",
    UMBRAL_AA_TEXTO,
  ],
  ["navegación: blanco sobre hover", "--sidebar-foreground", "--navy-hover", UMBRAL_AA_TEXTO],
  ["navegación: apoyo sobre navy", "--navy-texto-2", "--sidebar", UMBRAL_AA_TEXTO],
  ["navegación: apoyo sobre hover", "--navy-texto-2", "--navy-hover", UMBRAL_AA_TEXTO],
  ["acceso: claim y descriptor sobre navy", "--logo-blanco", "--navy", UMBRAL_AA_TEXTO],
];

const GRAFICO: Par[] = [
  ["borde de control sobre fondo", "--input", "--background", UMBRAL_AA_GRANDE],
  ["borde de control sobre tarjeta", "--input", "--card", UMBRAL_AA_GRANDE],
  ["foco sobre fondo", "--ring", "--background", UMBRAL_AA_GRANDE],
  ["foco sobre tarjeta", "--ring", "--card", UMBRAL_AA_GRANDE],
  ["foco sobre violeta suave", "--ring", "--violeta-suave", UMBRAL_AA_GRANDE],
  ["foco en la navegación", "--sidebar-ring", "--sidebar", UMBRAL_AA_GRANDE],
  ["casilla y radio: borde violeta sobre tarjeta", "--primary", "--card", UMBRAL_AA_GRANDE],
  ["barra de avance sobre su riel", "--acento-4", "--muted", UMBRAL_AA_GRANDE],
  ["contorno tinta de los indicadores de estado", "--tinta", "--background", UMBRAL_AA_GRANDE],
  ["V bicolor: pata bermellón sobre navy", "--acento-2", "--navy", UMBRAL_AA_GRANDE],
  ["V bicolor: pata violeta sobre navy", "--acento-4", "--navy", UMBRAL_AA_GRANDE],
];

describe("contraste de velocentum-web/v1 — texto (AA 4,5:1)", () => {
  it.each(TEXTO)("%s", (_n, frente, fondo, umbral) => {
    expect(relacionDeContraste(color(frente), color(fondo))).toBeGreaterThanOrEqual(umbral);
  });
});

describe("contraste de velocentum-web/v1 — gráfico y bordes de control (3:1)", () => {
  it.each(GRAFICO)("%s", (_n, frente, fondo, umbral) => {
    expect(relacionDeContraste(color(frente), color(fondo))).toBeGreaterThanOrEqual(umbral);
  });
});

describe("contraste — límites medidos que explican el contrato", () => {
  const { fondo, blanco, tinta, texto2, navy, cielo } = PALETA_WEB_V1;
  const { azul, bermellon, verde, violeta, amarillo } = ACENTOS_WEB_V1;

  it("los pares de texto de tokens.css dan lo que el archivo declara", () => {
    expect(contrasteRedondeado(tinta, fondo)).toBe(18.14);
    expect(contrasteRedondeado(texto2, fondo)).toBe(5.23);
    expect(contrasteRedondeado(azul.color, azul.texto)).toBe(4.56);
    expect(contrasteRedondeado(bermellon.color, bermellon.texto)).toBe(5.09);
    expect(contrasteRedondeado(verde.color, verde.texto)).toBe(8.44);
    expect(contrasteRedondeado(violeta.color, violeta.texto)).toBe(5);
    expect(contrasteRedondeado(amarillo.color, amarillo.texto)).toBe(11.56);
  });

  it("navy y cielo, que tokens.css no mide (DH-4)", () => {
    expect(contrasteRedondeado(navy, blanco)).toBe(15.64);
    expect(contrasteRedondeado(navy, fondo)).toBe(15.25);
    expect(contrasteRedondeado(cielo, tinta)).toBe(7.63);
  });

  it("CTA violeta, no azul: el azul como texto chico sobre el fondo no llega (DH-5)", () => {
    expect(contrasteRedondeado(azul.color, fondo)).toBe(4.45);
    expect(relacionDeContraste(azul.color, fondo)).toBeLessThan(UMBRAL_AA_TEXTO);
    expect(contrasteRedondeado(violeta.color, fondo)).toBe(4.88);
    expect(relacionDeContraste(violeta.color, fondo)).toBeGreaterThanOrEqual(UMBRAL_AA_TEXTO);
  });

  it("los estados no van como texto chico sobre el fondo: por eso son relleno con su par (DH-5)", () => {
    expect(contrasteRedondeado(bermellon.color, fondo)).toBe(3.56);
    expect(contrasteRedondeado(amarillo.color, fondo)).toBe(1.57);
    expect(contrasteRedondeado(verde.color, fondo)).toBe(2.15);
    for (const c of [bermellon.color, amarillo.color, verde.color]) {
      expect(relacionDeContraste(c, fondo)).toBeLessThan(UMBRAL_AA_TEXTO);
    }
  });

  it("sobre navy ningún acento de CTA sirve como texto: la navegación va en blanco", () => {
    expect(contrasteRedondeado(violeta.color, navy)).toBe(3.13);
    expect(contrasteRedondeado(azul.color, navy)).toBe(3.43);
    expect(relacionDeContraste(violeta.color, navy)).toBeLessThan(UMBRAL_AA_TEXTO);
  });

  it("los filetes son separadores, no bordes de control: quedan por debajo de 3:1", () => {
    // Si un borde tiene que calificar como componente, usa --input (texto de apoyo).
    expect(contrasteRedondeado(color("--border"), color("--background"))).toBe(1.35);
  });

  it("el rebajado de superficie suave es el más alto que deja pasar al violeta como texto", () => {
    // Margen medido: 4 % deja al violeta en 4,51:1; con 5 % bajaría de 4,5.
    expect(contrasteRedondeado(color("--primary"), color("--muted"))).toBe(4.51);
  });

  it("deja el reporte completo como salida legible", () => {
    const filas = [...TEXTO, ...GRAFICO].map(([nombre, frente, fondo, umbral]) => {
      const valor = contrasteRedondeado(color(frente), color(fondo));
      return `${valor >= umbral ? "PASA" : "FALLA"}  ${valor.toFixed(2)}:1  (min ${umbral})  ${nombre}  ${color(frente)} sobre ${color(fondo)}`;
    });
    // eslint-disable-next-line no-console
    console.log("\n" + filas.join("\n") + "\n");
    expect(filas.every((f) => f.startsWith("PASA"))).toBe(true);
  });
});
