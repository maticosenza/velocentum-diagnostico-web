import { mezclar } from "./contraste";

/**
 * Lectura mínima de custom properties CSS, para que los tests del tema
 * comparen `tokens.css` y `src/styles.css` contra el tema en TS y midan el
 * contraste de los colores tal como los resuelve la hoja real. Sin
 * dependencias: solo entiende lo que esos dos archivos usan.
 */

const sinComentarios = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/**
 * Las variables de los bloques `:root { … }` de nivel superior, en orden;
 * la primera definición gana. Los `:root` dentro de `@media` quedan afuera
 * (se leen con `variablesEnMedia`).
 */
export function variablesRaiz(css: string): Map<string, string> {
  const plano = sinComentarios(css).replace(/@media[^{]*\{\s*:root\s*\{[^}]*\}\s*\}/g, "");
  const vars = new Map<string, string>();
  for (const bloque of plano.matchAll(/(?:^|[\s}]):root\s*\{([^}]*)\}/g)) {
    for (const [, nombre, valor] of bloque[1]!.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      if (!vars.has(nombre!)) vars.set(nombre!, valor!.trim());
    }
  }
  return vars;
}

/** Las variables que redefine el `:root` de un `@media` cuya condición contiene `condicion`. */
export function variablesEnMedia(css: string, condicion: string): Map<string, string> {
  const vars = new Map<string, string>();
  for (const [, cond, cuerpo] of sinComentarios(css).matchAll(
    /@media([^{]*)\{\s*:root\s*\{([^}]*)\}\s*\}/g,
  )) {
    if (!cond!.includes(condicion)) continue;
    for (const [, nombre, valor] of cuerpo!.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      vars.set(nombre!, valor!.trim());
    }
  }
  return vars;
}

/**
 * Resuelve una variable a `#RRGGBB`, siguiendo `var(--x)` y
 * `color-mix(in srgb, var(--a) N%, var(--b))`. Cualquier otra forma es un
 * error: si la hoja empieza a usar algo que esto no mide, el test lo dice.
 */
export function resolverColor(
  vars: Map<string, string>,
  nombre: string,
  visitados: string[] = [],
): string {
  if (visitados.includes(nombre))
    throw new Error(`Referencia circular: ${[...visitados, nombre].join(" → ")}`);
  const valor = vars.get(nombre);
  if (valor === undefined) throw new Error(`Variable no definida: ${nombre}`);
  const cadena = [...visitados, nombre];
  if (/^#[0-9a-fA-F]{6}$/.test(valor)) return valor.toUpperCase();
  const ref = valor.match(/^var\((--[\w-]+)\)$/);
  if (ref) return resolverColor(vars, ref[1]!, cadena);
  const mix = valor.match(
    /^color-mix\(in srgb,\s*var\((--[\w-]+)\)\s+(\d+(?:\.\d+)?)%,\s*var\((--[\w-]+)\)\)$/,
  );
  if (mix) {
    return mezclar(
      resolverColor(vars, mix[1]!, cadena),
      resolverColor(vars, mix[3]!, cadena),
      Number(mix[2]) / 100,
    );
  }
  throw new Error(`Valor de color no soportado en ${nombre}: "${valor}"`);
}
