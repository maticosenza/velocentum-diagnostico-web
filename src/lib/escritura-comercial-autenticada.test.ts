/**
 * BV4 · preflight del gate de F2a — la escritura comercial pasa por el cliente
 * autenticado del middleware, sujeto a RLS, y no por `supabaseAdmin`, que usa
 * service role y saltea RLS.
 *
 * Registrado como **H-8** en `docs/bv4-hallazgos-diferidos.md`: ninguna prueba
 * ejerce esta escritura contra una base real, y por eso las 1128 pruebas
 * pasaban sin `SUPABASE_SERVICE_ROLE_KEY` en el entorno mientras el flujo del
 * navegador se caía. Esta prueba **no** cubre ese hueco: fija la dependencia,
 * para que una regresión futura —volver a `supabaseAdmin` "por ahora"— rompa
 * la suite en vez de pasar inadvertida.
 *
 * Por eso lee la fuente en vez de invocar los server functions: lo que se
 * quiere fijar es de dónde sale el cliente, y eso se ve en el archivo sin
 * necesidad de levantar el runtime de TanStack ni una base.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Los tres server functions que escriben en `diagnostico.propuesta`. */
const ESCRITORES_COMERCIALES = [
  "paquetes.functions.ts",
  "propuesta.functions.ts",
  "seleccion-comercial-v2.functions.ts",
] as const;

function fuenteDe(archivo: string): string {
  return readFileSync(join(RAIZ, "src", "lib", archivo), "utf8");
}

/**
 * Identificadores sobre los que se encadena `.from(...)` en un archivo, sea en
 * la misma línea o en la siguiente (el estilo del repo corta ahí).
 */
function clientesUsados(fuente: string): Set<string> {
  return new Set([...fuente.matchAll(/\b([A-Za-z_$][\w$]*)\s*\n?\s*\.from\(/g)].map((m) => m[1]!));
}

describe("H-8 · la escritura comercial obtiene su cliente por la vía autenticada", () => {
  it.each(ESCRITORES_COMERCIALES)("%s no toca el cliente de service role", (archivo) => {
    const fuente = fuenteDe(archivo);
    expect(fuente).not.toContain("supabaseAdmin");
    expect(fuente).not.toContain("client.server");
  });

  it.each(ESCRITORES_COMERCIALES)("%s autentica con el middleware", (archivo) => {
    const fuente = fuenteDe(archivo);
    expect(fuente).toContain(
      'import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware"',
    );
    expect(fuente).toContain(".middleware([requireSupabaseAuth])");
    // El cliente sale del contexto que arma ese middleware, no de un import.
    expect(fuente).toContain("const { supabase } = context;");
  });

  it.each(ESCRITORES_COMERCIALES)("%s lee y escribe con el mismo cliente", (archivo) => {
    const fuente = fuenteDe(archivo);
    expect(clientesUsados(fuente)).toEqual(new Set(["supabase"]));
  });

  it.each(ESCRITORES_COMERCIALES)("%s sigue teniendo una escritura que fijar", (archivo) => {
    // Sin esto, borrar el `update` dejaría verdes a las tres pruebas de arriba.
    expect(fuenteDe(archivo)).toContain(".update({ propuesta: aGuardar as unknown as never })");
  });
});
