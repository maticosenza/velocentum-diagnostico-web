import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import React from "react";
import { Document, Page, View, renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { registrarFuentesVelocentum } from "../fuentes/registrar-fuentes";
import { VELOCENTUM_CRYSTAL_V1 } from "../velocentum-crystal-v1";
import { contrasteRedondeado, UMBRAL_AA_GRANDE, UMBRAL_AA_TEXTO } from "../contraste";
import { TEMA_DOCUMENTAL_ACTIVO } from "../tema-activo";
import { LockupVelocentum, type PropsLockup } from "./lockup";

/**
 * Insumos de la muestra visual de BV4 F1 (etapa 6.1), generados con el
 * mecanismo que el repositorio ya usa para artefactos de QA: la prueba corre
 * siempre y verifica, y **sólo escribe a disco si se define
 * `VELOCENTUM_BV4_MUESTRA_DIR`** — mismo criterio que
 * `renderers/pdf/generar-pdfs-escenarios-demo.test.ts`.
 *
 * Escribe los renders REALES de PDF del lockup (no una imitación en HTML) y
 * el JSON de contrastes calculado por el propio `contraste.ts` sobre el
 * propio tema, para que la muestra no repita números a mano.
 *
 * `scripts/muestra-visual.mjs` consume esta salida y arma
 * `docs/bv4-f1-muestra-visual.html`.
 */
registrarFuentesVelocentum();

const T = VELOCENTUM_CRYSTAL_V1;
const c = T.colors;
const onDark = c.onDark!;

const PIEZAS: { nombre: string; fondo: string; ancho: number; alto: number; props: PropsLockup[] }[] = [
  {
    nombre: "lockup-claro", fondo: c.surface, ancho: 560, alto: 300,
    props: [
      { size: 44, variante: "claro" },
      { size: 30, variante: "claro" },
      { size: 24, variante: "claro", descriptor: false },
    ],
  },
  {
    nombre: "lockup-oscuro", fondo: c.ink, ancho: 560, alto: 300,
    props: [
      { size: 44, variante: "oscuro" },
      { size: 30, variante: "oscuro" },
      { size: 24, variante: "oscuro", descriptor: false },
    ],
  },
  {
    nombre: "lockup-vertical", fondo: c.surfaceSoft, ancho: 560, alto: 300,
    props: [
      { size: 40, variante: "claro", orientacion: "vertical" },
      { size: 40, variante: "claro", orientacion: "vertical", descriptor: false, encuadre: "cuadrado" },
    ],
  },
];

type Par = [nombre: string, frente: string, fondo: string, umbral: number, rol: string];
const PARES: Par[] = [
  ["ink / surface", c.ink, c.surface, UMBRAL_AA_TEXTO, "Texto principal sobre tarjeta"],
  ["muted / surface", c.muted, c.surface, UMBRAL_AA_TEXTO, "Texto secundario sobre tarjeta"],
  ["muted / surfaceSoft", c.muted, c.surfaceSoft, UMBRAL_AA_TEXTO, "Texto secundario sobre neutro"],
  ["accentDeep / surface", c.accentDeep!, c.surface, UMBRAL_AA_TEXTO, "Único acento legible como texto chico"],
  ["surface / ink", c.surface, c.ink, UMBRAL_AA_TEXTO, "Texto sobre fondo oscuro"],
  ["accentSoft / ink", c.accentSoft!, c.ink, UMBRAL_AA_TEXTO, "Acento suave sobre oscuro"],
  ["action / ink", c.action!, c.ink, UMBRAL_AA_TEXTO, "Acento de acción sobre oscuro"],
  ["action / surface", c.action!, c.surface, UMBRAL_AA_GRANDE, "Sólo CTA, display y gráfica"],
  ["successInk / surface", c.successInk!, c.surface, UMBRAL_AA_TEXTO, "Estado saludable, texto sobre claro"],
  ["warningInk / surface", c.warningInk!, c.surface, UMBRAL_AA_TEXTO, "Advertencia, texto sobre claro"],
  ["riskInk / surface", c.riskInk!, c.surface, UMBRAL_AA_TEXTO, "Riesgo, texto sobre claro"],
  ["successInk / surfaceSoft", c.successInk!, c.surfaceSoft, UMBRAL_AA_TEXTO, "Estado saludable sobre neutro"],
  ["warningInk / surfaceSoft", c.warningInk!, c.surfaceSoft, UMBRAL_AA_TEXTO, "Advertencia sobre neutro"],
  ["riskInk / surfaceSoft", c.riskInk!, c.surfaceSoft, UMBRAL_AA_TEXTO, "Riesgo sobre neutro"],
  ["onDark.text / ink", onDark.text, c.ink, UMBRAL_AA_TEXTO, "Texto principal sobre oscuro"],
  ["onDark.body / surfaceDark", onDark.body, c.surfaceDark!, UMBRAL_AA_TEXTO, "Cuerpo sobre tarjeta oscura"],
  ["onDark.muted / surfaceDark", onDark.muted, c.surfaceDark!, UMBRAL_AA_TEXTO, "Secundario sobre tarjeta oscura"],
  ["onDark.success / surfaceDark", onDark.success, c.surfaceDark!, UMBRAL_AA_TEXTO, "Estado saludable sobre oscuro"],
  ["onDark.warning / surfaceDark", onDark.warning, c.surfaceDark!, UMBRAL_AA_TEXTO, "Advertencia sobre oscuro"],
  ["onDark.risk / surfaceDark", onDark.risk, c.surfaceDark!, UMBRAL_AA_TEXTO, "Riesgo sobre oscuro (derivado)"],
];

describe("insumos de la muestra visual (BV4 F1, etapa 6.1)", () => {
  it("renderiza las piezas del lockup a PDF real y, con la variable puesta, las persiste", async () => {
    const dir = process.env["VELOCENTUM_BV4_MUESTRA_DIR"];
    if (dir) await mkdir(dir, { recursive: true });
    for (const pieza of PIEZAS) {
      const buffer = await renderToBuffer(
        <Document>
          <Page size={[pieza.ancho, pieza.alto]} style={{ backgroundColor: pieza.fondo, padding: 36 }}>
            <View style={{ gap: 26 }}>
              {pieza.props.map((p, i) => (
                <LockupVelocentum key={i} {...p} />
              ))}
            </View>
          </Page>
        </Document>,
      );
      expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
      if (dir) await writeFile(join(dir, `${pieza.nombre}.pdf`), buffer);
    }
  });

  it("emite el JSON de contrastes calculado por contraste.ts sobre el propio tema", async () => {
    const filas = PARES.map(([nombre, frente, fondo, umbral, rol]) => ({
      nombre, frente, fondo, umbral, rol,
      valor: contrasteRedondeado(frente, fondo),
      pasa: contrasteRedondeado(frente, fondo) >= umbral,
    }));
    expect(filas.every((f) => f.pasa)).toBe(true);
    const dir = process.env["VELOCENTUM_BV4_MUESTRA_DIR"];
    if (dir) {
      await mkdir(dir, { recursive: true });
      await writeFile(
        join(dir, "muestra-datos.json"),
        `${JSON.stringify({ tema: T, temaActivo: TEMA_DOCUMENTAL_ACTIVO, contrastes: filas }, null, 2)}\n`,
      );
    }
  });
});
