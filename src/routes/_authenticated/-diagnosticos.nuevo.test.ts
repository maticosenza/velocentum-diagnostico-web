/**
 * H-52 — "Editar y recalcular" (`?desde=<id>`) y "Nuevo diagnóstico" son la misma ruta. El
 * router usa `remountDeps` como key del componente: si la key no cambia al pasar de uno a otro,
 * el estado del diagnóstico de origen sobrevive y "Guardar" crea una versión del anterior.
 *
 * Sin arnés de interacción en el repo: se verifica la key que arma el router
 * (`JSON.stringify` del resultado, `@tanstack/react-router` `Match.js`), no el guardado.
 */
import { describe, expect, it } from "vitest";
import { Route } from "./diagnosticos.nuevo";

function key(search: { desde?: string }): string | undefined {
  const remountDeps = Route.options.remountDeps as
    ((opt: { search: { desde?: string } }) => unknown) | undefined;
  const deps = remountDeps?.({ search });
  return deps ? JSON.stringify(deps) : undefined;
}

describe("diagnosticos/nuevo · remontaje por `desde` (H-52)", () => {
  it("declara remountDeps: sin él el componente se reusa entre editar y nuevo", () => {
    expect(key({})).toBeDefined();
  });

  it("de editar a nuevo cambia la key", () => {
    expect(key({ desde: "a" })).not.toBe(key({}));
  });

  it("entre dos ediciones distintas cambia la key", () => {
    expect(key({ desde: "a" })).not.toBe(key({ desde: "b" }));
  });

  it("nuevo a nuevo conserva la key: el borrador en curso no se remonta", () => {
    expect(key({})).toBe(key({}));
  });
});
