import { describe, expect, it } from "vitest";
import { VELOCENTUM_CRYSTAL_V1 } from "./velocentum-crystal-v1";
import {
  UMBRAL_AA_GRANDE,
  UMBRAL_AA_TEXTO,
  contrasteRedondeado,
  relacionDeContraste,
} from "./contraste";

/**
 * Verificación automática de contraste del tema de marca (BV4 F1, etapa 2).
 *
 * Bloqueante: los pares que el prompt de F1 exige, más los tres estados
 * funcionales sobre claro y sobre oscuro. Umbrales del contrato:
 * AA 4,5:1 texto normal, 3:1 texto grande o gráfico.
 *
 * No bloqueante pero fijado: un segundo describe con los límites medidos de
 * pares que el contrato NO exige pero que condicionan el uso del tema. Se
 * asientan como números exactos para que ningún cambio futuro los mueva en
 * silencio.
 */
const c = VELOCENTUM_CRYSTAL_V1.colors;
const onDark = c.onDark!;

type Par = [nombre: string, frente: string, fondo: string, umbral: number];

const PARES_EXIGIDOS: Par[] = [
  ["ink sobre surface", c.ink, c.surface, UMBRAL_AA_TEXTO],
  ["muted sobre surface", c.muted, c.surface, UMBRAL_AA_TEXTO],
  ["muted sobre surfaceSoft", c.muted, c.surfaceSoft, UMBRAL_AA_TEXTO],
  ["accentDeep sobre surface", c.accentDeep!, c.surface, UMBRAL_AA_TEXTO],
  ["surface sobre ink", c.surface, c.ink, UMBRAL_AA_TEXTO],
  ["accentSoft sobre ink", c.accentSoft!, c.ink, UMBRAL_AA_TEXTO],
  ["action sobre ink", c.action!, c.ink, UMBRAL_AA_TEXTO],
  // El único par del contrato con umbral de texto grande / gráfico: `action`
  // sobre blanco mide 3,16:1 y por eso jamás va como texto chico.
  ["action sobre surface (large/graphic)", c.action!, c.surface, UMBRAL_AA_GRANDE],
];

const FUNCIONALES_SOBRE_CLARO: Par[] = [
  ["successInk sobre surface", c.successInk!, c.surface, UMBRAL_AA_TEXTO],
  ["warningInk sobre surface", c.warningInk!, c.surface, UMBRAL_AA_TEXTO],
  ["riskInk sobre surface", c.riskInk!, c.surface, UMBRAL_AA_TEXTO],
  ["successInk sobre surfaceSoft", c.successInk!, c.surfaceSoft, UMBRAL_AA_TEXTO],
  ["warningInk sobre surfaceSoft", c.warningInk!, c.surfaceSoft, UMBRAL_AA_TEXTO],
  ["riskInk sobre surfaceSoft", c.riskInk!, c.surfaceSoft, UMBRAL_AA_TEXTO],
];

const FUNCIONALES_SOBRE_OSCURO: Par[] = [
  ["onDark.success sobre ink", onDark.success, c.ink, UMBRAL_AA_TEXTO],
  ["onDark.warning sobre ink", onDark.warning, c.ink, UMBRAL_AA_TEXTO],
  ["onDark.risk sobre ink", onDark.risk, c.ink, UMBRAL_AA_TEXTO],
  ["onDark.success sobre surfaceDark", onDark.success, c.surfaceDark!, UMBRAL_AA_TEXTO],
  ["onDark.warning sobre surfaceDark", onDark.warning, c.surfaceDark!, UMBRAL_AA_TEXTO],
  ["onDark.risk sobre surfaceDark", onDark.risk, c.surfaceDark!, UMBRAL_AA_TEXTO],
];

const TEXTO_SOBRE_OSCURO: Par[] = [
  ["onDark.text sobre ink", onDark.text, c.ink, UMBRAL_AA_TEXTO],
  ["onDark.text sobre surfaceDark", onDark.text, c.surfaceDark!, UMBRAL_AA_TEXTO],
  ["onDark.body sobre ink", onDark.body, c.ink, UMBRAL_AA_TEXTO],
  ["onDark.body sobre surfaceDark", onDark.body, c.surfaceDark!, UMBRAL_AA_TEXTO],
  ["onDark.muted sobre ink", onDark.muted, c.ink, UMBRAL_AA_TEXTO],
  ["onDark.muted sobre surfaceDark", onDark.muted, c.surfaceDark!, UMBRAL_AA_TEXTO],
];

describe("contraste del tema velocentum-crystal/v1 — pares exigidos", () => {
  it.each(PARES_EXIGIDOS)("%s alcanza el umbral", (_nombre, frente, fondo, umbral) => {
    expect(relacionDeContraste(frente, fondo)).toBeGreaterThanOrEqual(umbral);
  });
});

describe("contraste — estados funcionales sobre claro", () => {
  it.each(FUNCIONALES_SOBRE_CLARO)("%s alcanza AA", (_n, frente, fondo, umbral) => {
    expect(relacionDeContraste(frente, fondo)).toBeGreaterThanOrEqual(umbral);
  });

  it("los tres crudos NO llegan a AA sobre claro: por eso existe el par *Ink", () => {
    expect(relacionDeContraste(c.success, c.surface)).toBeLessThan(UMBRAL_AA_TEXTO);
    expect(relacionDeContraste(c.warning, c.surface)).toBeLessThan(UMBRAL_AA_TEXTO);
    expect(relacionDeContraste(c.risk, c.surface)).toBeLessThan(UMBRAL_AA_TEXTO);
  });
});

describe("contraste — estados funcionales y texto sobre oscuro", () => {
  it.each(FUNCIONALES_SOBRE_OSCURO)("%s alcanza AA", (_n, frente, fondo, umbral) => {
    expect(relacionDeContraste(frente, fondo)).toBeGreaterThanOrEqual(umbral);
  });

  it.each(TEXTO_SOBRE_OSCURO)("%s alcanza AA", (_n, frente, fondo, umbral) => {
    expect(relacionDeContraste(frente, fondo)).toBeGreaterThanOrEqual(umbral);
  });

  it("risk crudo NO llega sobre surfaceDark: por eso onDark.risk se deriva", () => {
    expect(relacionDeContraste(c.risk, c.surfaceDark!)).toBeLessThan(UMBRAL_AA_TEXTO);
    expect(contrasteRedondeado(c.risk, c.surfaceDark!)).toBe(4.06);
    expect(relacionDeContraste(onDark.risk, c.surfaceDark!)).toBeGreaterThanOrEqual(UMBRAL_AA_TEXTO);
  });

  it("muted crudo NO llega sobre oscuro: por eso onDark.muted se deriva", () => {
    expect(relacionDeContraste(c.muted, c.surfaceDark!)).toBeLessThan(UMBRAL_AA_TEXTO);
    expect(relacionDeContraste(onDark.muted, c.surfaceDark!)).toBeGreaterThanOrEqual(UMBRAL_AA_TEXTO);
  });
});

describe("contraste — límites medidos, no exigidos por el contrato", () => {
  it("accentDeep como texto chico sirve sobre surface y NO sobre surfaceSoft", () => {
    expect(contrasteRedondeado(c.accentDeep!, c.surface)).toBe(4.58);
    // Límite duro del tema, documentado en velocentum-crystal-v1.ts, regla 1:
    // sobre el neutro claro el acento profundo se queda a 4,21:1.
    expect(contrasteRedondeado(c.accentDeep!, c.surfaceSoft)).toBe(4.21);
    expect(relacionDeContraste(c.accentDeep!, c.surfaceSoft)).toBeLessThan(UMBRAL_AA_TEXTO);
  });

  it("action sobre blanco queda por debajo de AA de texto: 3,16:1", () => {
    expect(contrasteRedondeado(c.action!, c.surface)).toBe(3.16);
    expect(relacionDeContraste(c.action!, c.surface)).toBeLessThan(UMBRAL_AA_TEXTO);
    expect(relacionDeContraste(c.action!, c.surface)).toBeGreaterThanOrEqual(UMBRAL_AA_GRANDE);
  });

  it("los filetes son separadores, no componentes de UI: quedan por debajo de 3:1", () => {
    // Se asienta el número para que nadie los suponga accesibles como
    // borde de control. Si F2/F3 necesita un borde que SÍ califique, hay
    // que sumar un neutro de la familia DH-4, no reinterpretar estos.
    expect(contrasteRedondeado(c.borderLight!, c.surface)).toBe(1.21);
    expect(contrasteRedondeado(c.borderDark!, c.ink)).toBe(1.36);
    expect(contrasteRedondeado(c.surfaceDark!, c.ink)).toBe(1.11);
  });

  it("disabled queda por debajo de AA a propósito (WCAG 1.4.3 exime lo inactivo)", () => {
    expect(contrasteRedondeado(c.disabled!, c.surface)).toBe(2.25);
    expect(contrasteRedondeado(onDark.disabled, c.ink)).toBe(2.28);
  });

  it("deja el reporte completo de los pares exigidos como salida legible", () => {
    const filas = [...PARES_EXIGIDOS, ...FUNCIONALES_SOBRE_CLARO, ...FUNCIONALES_SOBRE_OSCURO, ...TEXTO_SOBRE_OSCURO].map(
      ([nombre, frente, fondo, umbral]) => {
        const valor = contrasteRedondeado(frente, fondo);
        return `${valor >= umbral ? "PASA" : "FALLA"}  ${valor.toFixed(2)}:1  (min ${umbral})  ${nombre}  ${frente} sobre ${fondo}`;
      },
    );
    // eslint-disable-next-line no-console
    console.log("\n" + filas.join("\n") + "\n");
    expect(filas.every((f) => f.startsWith("PASA"))).toBe(true);
  });
});
