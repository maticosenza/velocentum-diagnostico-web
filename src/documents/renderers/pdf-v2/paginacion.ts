/**
 * Bloque Visual 2.2.3 — renderizado en dos pasadas para la marca de
 * continuación de una tarjeta de escenario (`ScenarioCard`,
 * `document.tsx`). Autorizado expresamente por la auditoría externa de
 * esta ronda, con límites no negociables (L1-L7 del prompt):
 *
 *  - Sólo dentro de `velocentum-v2` (este archivo vive en
 *    `renderers/pdf-v2/`, junto al componente que consume su resultado).
 *  - La pasada 1 (`renderToBuffer` con un mapa de marcadores vacío o con
 *    el mapa de un intento anterior) es la que MIDE: se parsea con
 *    `pdfjs` la salida real ya renderizada — nunca se estima una altura
 *    ni se consulta `subPageNumber` u otro mecanismo interno no
 *    documentado de `@react-pdf/renderer`. Esas dos vías se probaron y
 *    se descartaron en la ronda 2.2.2 (ver
 *    docs/visual/handoff-ronda-2.2.2.md, sección 7) — no se vuelven a
 *    intentar acá.
 *  - La pasada 2 renderiza el documento definitivo consumiendo ese mapa;
 *    es siempre la que se entrega.
 *  - Insertar el marcador cambia el alto de la tarjeta y puede desplazar
 *    el quiebre real (L7): `renderPdfV2ConDosPasadas` resuelve esto
 *    volviendo a medir la salida de cada intento y comparándola contra
 *    el mapa que se usó para producirla — si no coinciden, el mapa
 *    medido se usa como entrada del siguiente intento (equivale a
 *    "reservar el espacio de la marca también en la medición": el
 *    siguiente intento ya renderiza CON el marcador en el lugar
 *    detectado, así que si el layout no se mueve más, ese mismo intento
 *    converge y es el que se entrega). Acotado a `MAX_INTENTOS` — nunca
 *    itera indefinidamente; si no converge, el llamador decide (cláusula
 *    de corte del prompt).
 */
import { createRequire } from "node:module";
import { renderToBuffer } from "@react-pdf/renderer";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { LABELS_ESCENARIO, LABELS_MAGNITUD, TITULO_SUPUESTOS_CON_DAGA } from "../../semantica-v2/etiquetas";
import type { DocumentModelV2, EscenarioV2 } from "../../templates/velocentum-v2/types";
import {
  createPdfDocumentElementV2,
  MAPA_PAGINACION_VACIO_V2,
  type LimiteContinuacionV2Bloque,
  type MapaPaginacionV2,
  type PdfProfileV2,
  type TipoPalancaV2,
} from "./document";

export type { LimiteContinuacionV2Bloque, MapaPaginacionV2, TipoPalancaV2 } from "./document";

const require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");

const GRUPOS_ORDEN: readonly TipoPalancaV2[] = ["facturacion_incremental", "contribucion_incremental", "ahorro_publicitario"];

function escaparRegExp(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type Cursor = { pagina: number; offset: number };

/** Busca `patron` a partir de `cursor` (nunca hacia atrás, nunca cruza una coincidencia previa). */
function buscarDesde(paginas: string[], cursor: Cursor, patron: RegExp): Cursor | null {
  for (let pagina = cursor.pagina; pagina < paginas.length; pagina++) {
    const desde = pagina === cursor.pagina ? cursor.offset : 0;
    const resto = paginas[pagina]!.slice(desde);
    const match = resto.match(patron);
    if (match && match.index !== undefined) {
      return { pagina, offset: desde + match.index + match[0].length };
    }
  }
  return null;
}

async function textoPorPagina(buffer: Buffer): Promise<string[]> {
  const documento = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const paginas: string[] = [];
  for (let pagina = 1; pagina <= documento.numPages; pagina++) {
    const contenido = await documento.getPage(pagina).then((p) => p.getTextContent());
    paginas.push(contenido.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  return paginas;
}

/**
 * Mide, sobre el PDF real ya renderizado (`buffer`), en qué página cae
 * cada bloque de cada tarjeta de escenario "larga" del `model`, y de ahí
 * deriva qué bloques son el primer elemento de una página nueva (L4:
 * medición real, nunca estimación). Recorre las tarjetas en el mismo
 * orden en que se renderizan (`largas`, dentro de cada sección con un
 * bloque "scenarios") y, dentro de cada tarjeta, sus bloques en el mismo
 * orden en que aparecen en el JSX de `ScenarioCard` — la búsqueda nunca
 * retrocede, así que dos tarjetas con las mismas etiquetas (p. ej. dos
 * documentos con "CONSERVADOR") nunca se confunden entre sí.
 */
export async function medirPaginacionV2(model: DocumentModelV2, buffer: Buffer): Promise<MapaPaginacionV2> {
  const paginas = await textoPorPagina(buffer);
  const mapa = new Map<EscenarioV2["id"], Set<LimiteContinuacionV2Bloque>>();
  let cursor: Cursor = { pagina: 0, offset: 0 };

  for (const section of model.sections) {
    for (const block of section.blocks) {
      if (block.type !== "scenarios") continue;
      // Ancla el cursor al título de ESTA sección antes de buscar
      // cualquier tarjeta: sin esto, el nombre de un escenario puede
      // coincidir antes con una mención incidental en otra sección (p.
      // ej. "ESCENARIO CONSERVADOR" en el resumen comercial) y anclar mal
      // la página del header. Si no se encuentra (no debería pasar con
      // un modelo real), se sigue desde donde estaba.
      if (section.title) {
        cursor = buscarDesde(paginas, cursor, new RegExp(escaparRegExp(section.title))) ?? cursor;
      }
      const largas = block.items.filter((item) => !item.esCorta);
      for (const item of largas) {
        const nombre = LABELS_ESCENARIO[item.id].toUpperCase();
        // El header real es "{NOMBRE} {BADGE}" (confianza) inmediatamente
        // adyacentes — nunca sólo el nombre suelto: evita confundir el
        // header con cualquier otra mención del nombre del escenario
        // (p. ej. el marcador de continuación "{NOMBRE} (CONTINUACIÓN)",
        // que no lleva badge después).
        const posicionHeader = buscarDesde(
          paginas,
          cursor,
          new RegExp(`\\b${escaparRegExp(nombre)}\\s+(ALTA|MEDIA|BAJA|BLOQUEADA)\\b`),
        );
        if (!posicionHeader) continue; // no debería ocurrir con un modelo real; sin header no hay nada que medir
        cursor = posicionHeader;
        let paginaAnterior = posicionHeader.pagina;
        const marcadores = new Set<LimiteContinuacionV2Bloque>();

        // Métricas son incondicionales (toda tarjeta las renderiza, corta o
        // larga). La nota de reinversión (S8, Bloque 3 Funcional) sólo se
        // renderiza si `ahorroPublicitario90d` es "calculado" — cuando no
        // lo es, `buscarDesde` no encuentra el texto y `posicion` queda
        // `undefined`; el `if (posicion)` de abajo ya lo tolera sin marcar
        // nada, no hace falta ningún cambio en la lógica de medición.
        {
          const posicion = buscarDesde(paginas, cursor, /Contribución incremental 90 días/);
          if (posicion) {
            if (posicion.pagina !== paginaAnterior) {
              marcadores.add("metricas");
              paginaAnterior = posicion.pagina;
            }
            cursor = posicion;
          }
        }
        {
          const posicion = buscarDesde(paginas, cursor, /El presupuesto liberado por consolidación de pauta/);
          if (posicion) {
            if (posicion.pagina !== paginaAnterior) {
              marcadores.add("nota");
              paginaAnterior = posicion.pagina;
            }
            cursor = posicion;
          }
        }
        // Cada fila de mes ya se parte individualmente entre páginas
        // (D-4, sin cambios de esta ronda) — Mes 1 lo cubre "tabla"; cada
        // mes SIGUIENTE es su propio candidato independiente.
        item.mensual.forEach((mes, index) => {
          const posicionMes = buscarDesde(paginas, cursor, new RegExp(`Mes ${mes.mes}\\b`));
          if (!posicionMes) return;
          if (posicionMes.pagina !== paginaAnterior) {
            marcadores.add(index === 0 ? "tabla" : `mes:${mes.mes}`);
            paginaAnterior = posicionMes.pagina;
          }
          cursor = posicionMes;
        });

        for (const tipo of GRUPOS_ORDEN) {
          const cantidad = item.palancas.filter((p) => p.tipo === tipo).length;
          if (cantidad === 0) continue;
          const etiqueta = LABELS_MAGNITUD[tipo];
          // El mismo texto de etiqueta aparece hasta CUATRO veces antes
          // del título real del grupo: la métrica del header ("… 90
          // días"), la fila de la tabla apilada de impresión (misma
          // etiqueta seguida de su valor), y el encabezado de columna de
          // la tabla no apilada de pantalla (misma etiqueta seguida del
          // encabezado de la columna siguiente). Ninguna de esas tres
          // lleva ":" cerca — un título real de grupo SIEMPRE va seguido
          // de al menos una línea de palanca ("Nombre: $monto (periodo)")
          // — así que exigir un ":" a poca distancia distingue el título
          // real sin necesidad de enumerar cada forma de valor posible.
          const posicion = buscarDesde(paginas, cursor, new RegExp(`${escaparRegExp(etiqueta)}(?=[^:]{1,60}:)`));
          if (posicion) {
            if (posicion.pagina !== paginaAnterior) {
              marcadores.add(`grupo:${tipo}`);
              paginaAnterior = posicion.pagina;
            }
            cursor = posicion;
          }
        }

        if (item.supuestos.length > 0) {
          const posicion = buscarDesde(paginas, cursor, new RegExp(escaparRegExp(TITULO_SUPUESTOS_CON_DAGA)));
          if (posicion) {
            if (posicion.pagina !== paginaAnterior) {
              marcadores.add("supuestos");
              paginaAnterior = posicion.pagina;
            }
            cursor = posicion;
          }
        }

        mapa.set(item.id, marcadores);
      }
    }
  }
  return mapa;
}

function mapasIguales(a: MapaPaginacionV2, b: MapaPaginacionV2): boolean {
  if (a.size !== b.size) return false;
  for (const [id, marcadoresA] of a) {
    const marcadoresB = b.get(id);
    if (!marcadoresB || marcadoresA.size !== marcadoresB.size) return false;
    for (const marcador of marcadoresA) {
      if (!marcadoresB.has(marcador)) return false;
    }
  }
  return true;
}

export type ResultadoDosPasadasV2 = {
  buffer: Buffer;
  mapa: MapaPaginacionV2;
  intentos: number;
  convergio: boolean;
};

/** Techo de intentos (L7): nunca itera indefinidamente. */
const MAX_INTENTOS = 4;

/**
 * Orquesta el renderizado en dos pasadas (L1-L7). El primer intento
 * renderiza sin ningún marcador (pasada 1, L2) y mide. Si el mapa medido
 * coincide con el mapa usado para renderizar, ese mismo buffer YA es el
 * definitivo (pasada 2, L3) — típicamente ocurre en el segundo intento
 * (el primero sin marcas, el segundo ya con el mapa medido). Si insertar
 * los marcadores desplaza el quiebre (L7), el mapa recién medido
 * alimenta el siguiente intento — equivalente a "reservar el espacio de
 * la marca también en la medición" — hasta converger o agotar
 * `MAX_INTENTOS`.
 */
export async function renderPdfV2ConDosPasadas(
  model: DocumentModelV2,
  profile: PdfProfileV2,
): Promise<ResultadoDosPasadasV2> {
  let mapaActual: MapaPaginacionV2 = MAPA_PAGINACION_VACIO_V2;
  let bufferActual: Buffer | null = null;
  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    bufferActual = Buffer.from(await renderToBuffer(createPdfDocumentElementV2(model, profile, mapaActual)));
    const mapaMedido = await medirPaginacionV2(model, bufferActual);
    if (mapasIguales(mapaMedido, mapaActual)) {
      return { buffer: bufferActual, mapa: mapaActual, intentos: intento, convergio: true };
    }
    mapaActual = mapaMedido;
  }
  return { buffer: bufferActual!, mapa: mapaActual, intentos: MAX_INTENTOS, convergio: false };
}
