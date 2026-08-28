/**
 * LOOP NOCTURNO, bloque 1 (2026-08-22): los seis escenarios demostrativos
 * nunca se usan como valor esperado de una prueba de regresión — son datos
 * ficticios, diseñados para leerse como negocio, no como fixture de
 * cálculo. Esta prueba escanea el repositorio y falla si aparece cualquier
 * import de `fixtures-escenarios-demo` fuera de la lista explícita de
 * archivos permitidos (este mismo archivo y el generador de documentos de
 * revisión visual). Si alguien agrega un import nuevo, esta prueba lo
 * obliga a una decisión consciente, no a un acoplamiento silencioso.
 *
 * También corre un chequeo de higiene mínimo sobre los seis escenarios
 * (arrancan, no tiran excepciones, el motor los puede calcular) — NO
 * verifica que la lectura de negocio sea "correcta": eso es juicio
 * humano, documentado en docs/loop-nocturno-2026-08-22-escenarios.md.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calcularDiagnostico } from "./calculo-diagnostico";
import { mapearHallazgos } from "./propuesta";
import { ESCENARIOS_DEMOSTRATIVOS, configuracionEscenariosDemo } from "./fixtures-escenarios-demo";

const ARCHIVOS_PERMITIDOS = new Set([
  "fixtures-escenarios-demo.ts",
  "fixtures-escenarios-demo.test.ts",
  // Generador de los PDFs/propuestas de revisión visual del bloque 1 (script
  // de un solo uso, no forma parte de la suite de cálculo ni de regresión).
  "generar-pdfs-escenarios-demo.test.ts",
  // Bloque de corrección de las tres incoherencias que estos mismos seis
  // escenarios originaron (2026-08-23, decisión consciente, no acoplamiento
  // silencioso): verifica LECTURA de negocio (qué hallazgo aparece, con qué
  // prioridad, nunca "el margen da exactamente X"), no valores de cálculo
  // — mismo espíritu que el resto de este archivo, no una excepción a él.
  "correccion-incoherencias-escenarios.test.ts",
  // Generador de los 54 PDFs de revisión visual v2 del Bloque 3 Funcional
  // (2026-08-27, nueve casos desde AJUSTES a R-03) — mismo espíritu que el
  // generador hermano de v1 de arriba: decisión consciente y declarada, no
  // acoplamiento silencioso. Incorporado al repo (no descartable) porque
  // las verificaciones H1/H2/H3 de la ronda R-03 necesitan generar los
  // documentos reales para correr.
  "generar-pdfs-bloque-3.test.ts",
  // Bloque Visual 3.1 (2026-08-28, ronda correctiva): generador hermano de
  // renders web de los mismos nueve casos (C-3) y su prueba de
  // verificación (W1-W3) — mismo criterio que arriba, decisión consciente.
  "generar-web-bloque-3.test.ts",
  "bloque-visual-3-1-verificacion.test.ts",
  // Fase 14 (2026-08-28): X4 (E-20, barrido de ocupación) reutiliza los
  // mismos nueve casos para confirmar que ninguna página nueva colapsa
  // por debajo del piso absoluto — mismo criterio, decisión consciente.
  "fase-14-x1-x4-x5-x7.test.ts",
]);

function archivosFuente(dir: string, acc: string[] = []): string[] {
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    if (entrada.name === "node_modules" || entrada.name.startsWith(".")) continue;
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) {
      archivosFuente(ruta, acc);
    } else if (/\.(ts|tsx)$/.test(entrada.name)) {
      acc.push(ruta);
    }
  }
  return acc;
}

describe("los escenarios demostrativos nunca son referencia de cálculo en la suite de regresión", () => {
  it("ningún archivo fuera de la lista permitida importa fixtures-escenarios-demo", () => {
    const raiz = join(__dirname, "..");
    const archivos = archivosFuente(raiz);
    const conImport: string[] = [];
    for (const archivo of archivos) {
      if (archivo.endsWith("fixtures-escenarios-demo.ts")) continue;
      const contenido = readFileSync(archivo, "utf-8");
      if (/fixtures-escenarios-demo/.test(contenido)) conImport.push(archivo);
    }
    const nombresPermitidosEncontrados = conImport.filter((a) =>
      ARCHIVOS_PERMITIDOS.has(a.split("/").pop()!),
    );
    const noPermitidos = conImport.filter((a) => !ARCHIVOS_PERMITIDOS.has(a.split("/").pop()!));

    expect(noPermitidos).toEqual([]);
    // Sanity: confirmamos que la búsqueda realmente encuentra algo (si diera
    // vacío por un error de ruta, la prueba de arriba pasaría por las
    // razones equivocadas).
    expect(nombresPermitidosEncontrados.length).toBeGreaterThan(0);
  });

  it("ninguno de los seis escenarios aparece en fixtures-casos.ts ni en esperadosFase2", () => {
    const casos = readFileSync(join(__dirname, "fixtures-casos.ts"), "utf-8");
    for (const escenario of ESCENARIOS_DEMOSTRATIVOS) {
      expect(casos).not.toContain(escenario.datos.nombre_tienda);
    }
  });
});

describe("higiene mínima de los seis escenarios (no verifica coherencia de negocio, sólo que el motor los procesa)", () => {
  for (const escenario of ESCENARIOS_DEMOSTRATIVOS) {
    it(`${escenario.id}: el motor calcula sin excepciones y produce hallazgos`, () => {
      const resultado = calcularDiagnostico(escenario.datos, configuracionEscenariosDemo);
      expect(resultado).toBeDefined();
      const hallazgos = mapearHallazgos(
        escenario.datos,
        resultado.derivados,
        resultado.estados_bloque,
        resultado.fugas,
      );
      expect(Array.isArray(hallazgos)).toBe(true);
    });
  }

  it("cobertura de productos y de canales es 100% explícito en los seis (margen total calculable, no retenido)", () => {
    for (const escenario of ESCENARIOS_DEMOSTRATIVOS) {
      const resultado = calcularDiagnostico(escenario.datos, configuracionEscenariosDemo);
      expect(resultado.derivados.cobertura_productos, escenario.id).toBe(100);
      expect(resultado.derivados.margen_contribucion, escenario.id).not.toBeNull();
    }
  });
});
