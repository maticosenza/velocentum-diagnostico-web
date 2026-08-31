/**
 * BV4 · F2a etapa 5 — la prueba que hace que "verbatim" signifique verbatim.
 *
 * No compara contra una copia escrita a mano: **lee el documento fuente**
 * (`docs/funcional/f2a-textos-servicios.md`, el §7 aportado por Matías) y lo
 * confronta carácter por carácter contra las constantes del módulo. Si
 * alguien reescribe, resume o "mejora" un texto en el código, la suite lo
 * frena; si el documento cambia, también, y entonces la decisión vuelve a ser
 * humana.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  LINEAS_CON_NOTA_DE_CONTENIDO,
  NOTA_AL_PIE_CONTENIDO,
  TEXTOS_SERVICIOS_V2,
  lineasSinTextoConfirmado,
  textoDeLinea,
  type TextoServicioV2,
} from "./textos-servicios-v2";
import { LINEAS_V2_IDS, lineaV2, type LineaId } from "./catalogo-v2";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const FUENTE = join(RAIZ, "docs", "funcional", "f2a-textos-servicios.md");

/** Parsea el markdown fuente a la misma forma que expone el módulo. */
function leerDocumentoFuente(): { bloques: Map<string, TextoServicioV2>; nota: string } {
  const texto = readFileSync(FUENTE, "utf8");
  const bloques = new Map<string, TextoServicioV2>();
  let nota = "";

  const secciones = texto.split(/^## /m).slice(1);
  for (const seccion of secciones) {
    const lineas = seccion.split("\n");
    const titulo = lineas[0]!.trim();

    if (titulo === "Nota al pie de la sección de contenido") {
      const entrecomillado = seccion.match(/"([\s\S]*?)"/);
      nota = entrecomillado![1]!.replace(/\s*\n\s*/g, " ").trim();
      continue;
    }

    const cursivas = [...seccion.matchAll(/^\*(.+)\*$/gm)].map((m) => m[1]!.trim());
    const entregables = lineas.filter((l) => l.startsWith("- ")).map((l) => l.slice(2).trim());

    bloques.set(titulo, {
      descripcion: cursivas[0]!,
      entregables,
      exclusion: cursivas[1] ?? null,
    });
  }
  return { bloques, nota };
}

const FUENTE_PARSEADA = leerDocumentoFuente();

describe("los diez textos son los del documento fuente, carácter por carácter", () => {
  it("el documento tiene exactamente los diez bloques del catálogo, con sus nombres", () => {
    expect([...FUENTE_PARSEADA.bloques.keys()]).toEqual(
      LINEAS_V2_IDS.map((id) => lineaV2(id as LineaId).nombre),
    );
  });

  for (const id of LINEAS_V2_IDS) {
    it(`${id}: descripción, entregables y exclusión idénticos al documento`, () => {
      const delDocumento = FUENTE_PARSEADA.bloques.get(lineaV2(id as LineaId).nombre)!;
      const delModulo = textoDeLinea(id as LineaId)!;
      expect(delModulo.descripcion).toBe(delDocumento.descripcion);
      expect([...delModulo.entregables]).toEqual(delDocumento.entregables);
      expect(delModulo.exclusion).toBe(delDocumento.exclusion);
    });
  }

  it("la nota al pie de contenido es la del documento", () => {
    expect(NOTA_AL_PIE_CONTENIDO).toBe(FUENTE_PARSEADA.nota);
  });
});

describe("las dos exclusiones confirmadas, y sólo esas dos", () => {
  it("influencer marketing y diseño web llevan exclusión; las otras ocho no", () => {
    const conExclusion = LINEAS_V2_IDS.filter(
      (id) => textoDeLinea(id as LineaId)!.exclusion !== null,
    );
    expect(conExclusion).toEqual(["influencer_marketing", "diseno_web"]);
  });

  it("dicen exactamente lo que dice el documento", () => {
    expect(textoDeLinea("influencer_marketing")!.exclusion).toBe(
      "No incluye honorarios de creadores ni envío de productos.",
    );
    expect(textoDeLinea("diseno_web")!.exclusion).toBe(
      "No incluye desarrollos web mayores: eso es Desarrollo web custom.",
    );
  });
});

describe("nada se rellena", () => {
  it("las diez líneas tienen texto confirmado al 2026-08-31", () => {
    expect(lineasSinTextoConfirmado()).toEqual([]);
  });

  it("ningún texto está vacío ni tiene entregables vacíos", () => {
    for (const id of LINEAS_V2_IDS) {
      const texto = textoDeLinea(id as LineaId)!;
      expect(texto.descripcion.length).toBeGreaterThan(0);
      expect(texto.entregables.length).toBeGreaterThan(0);
      for (const entregable of texto.entregables) expect(entregable.trim()).toBe(entregable);
    }
  });

  it("una línea desconocida no devuelve un texto inventado", () => {
    expect(textoDeLinea("linea_que_no_existe" as LineaId)).toBeNull();
  });

  it("el módulo cubre las diez líneas del catálogo, ni una más", () => {
    expect(Object.keys(TEXTOS_SERVICIOS_V2).sort()).toEqual([...LINEAS_V2_IDS].sort());
  });
});

describe("la nota al pie corresponde a las dos líneas de contenido", () => {
  it("audiovisual y estático, que son las que se cuentan en piezas", () => {
    expect(LINEAS_CON_NOTA_DE_CONTENIDO).toEqual(["contenido_audiovisual", "contenido_estatico"]);
  });
});
