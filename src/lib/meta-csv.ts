/** Lectura del CSV exportado de Meta Ads Manager (informe dinámico). */

export type ResumenCsvMeta = {
  filas: number;
  conjuntos_activos: number;
  conto_campanas: boolean;
  gasto_total: number;
  dias: number;
  dias_estimados: boolean;
  presupuesto_diario: number;
  frecuencia_promedio: number | null;
  ctr_global: number | null;
  conjuntos_bajo_gasto: number;
  advertencias: string[];
};

/** Parser de CSV que respeta comillas dobles y saltos de línea dentro de campos. */
export function parsearCsv(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = "";
  let enComillas = false;
  const limpio = texto.replace(/^\uFEFF/, "");

  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i]!;
    if (enComillas) {
      if (c === '"') {
        if (limpio[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          enComillas = false;
        }
      } else {
        campo += c;
      }
      continue;
    }
    if (c === '"') {
      enComillas = true;
    } else if (c === "," || c === ";") {
      fila.push(campo);
      campo = "";
    } else if (c === "\n") {
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = "";
    } else if (c === "\r") {
      // ignorar
    } else {
      campo += c;
    }
  }
  if (campo !== "" || fila.length > 0) {
    fila.push(campo);
    filas.push(fila);
  }
  return filas.filter((f) => f.some((v) => v.trim() !== ""));
}

function normalizar(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function numero(valor: string | undefined): number | null {
  if (valor === undefined) return null;
  const limpio = valor.replace(/\s/g, "").replace(/[^\d.,-]/g, "");
  if (limpio === "") return null;
  // Meta usa punto decimal; sacamos las comas de miles.
  const n = Number(limpio.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function fecha(valor: string | undefined): number | null {
  if (!valor) return null;
  const t = Date.parse(valor.trim());
  return Number.isFinite(t) ? t : null;
}

export class ErrorCsvMeta extends Error {}

export function leerCsvMeta(texto: string): ResumenCsvMeta {
  const filas = parsearCsv(texto);
  if (filas.length < 2) {
    throw new ErrorCsvMeta("El archivo está vacío o no tiene filas de datos.");
  }
  const encabezado = (filas[0] ?? []).map(normalizar);
  const idx = (predicado: (h: string) => boolean) => encabezado.findIndex(predicado);
  const exacto = (nombre: string) => idx((h) => h === normalizar(nombre));
  const empieza = (nombre: string) => idx((h) => h.startsWith(normalizar(nombre)));

  const iGasto = empieza("Importe gastado");
  if (iGasto === -1) {
    throw new ErrorCsvMeta(
      'No encontramos la columna de importe gastado. Exportá el informe incluyendo "Importe gastado".',
    );
  }

  const iConjunto = exacto("Nombre del conjunto de anuncios");
  const iCampana = exacto("Nombre de la campaña");
  const iFrecuencia = exacto("Frecuencia");
  const iImpresiones = exacto("Impresiones");
  const iClics = exacto("Clics en el enlace");
  const iInicio = empieza("Inicio del informe");
  const iFin = empieza("Fin del informe");
  const iDia = idx((h) => h === "dia" || h === "fecha");

  const contoCampanas = iConjunto === -1;
  const iAgrupador = contoCampanas ? iCampana : iConjunto;
  if (iAgrupador === -1) {
    throw new ErrorCsvMeta(
      "El archivo no tiene columna de conjunto de anuncios ni de campaña. Volvé a exportarlo desglosado.",
    );
  }

  const advertencias: string[] = [];
  if (contoCampanas) {
    advertencias.push(
      "El archivo no trae conjuntos de anuncios: contamos campañas distintas. Es una aproximación.",
    );
  }

  const gastoPorGrupo = new Map<string, number>();
  const dias = new Set<string>();
  let gastoTotal = 0;
  let impresiones = 0;
  let clics = 0;
  let frecuenciaPonderada = 0;
  let gastoConFrecuencia = 0;
  let minFecha: number | null = null;
  let maxFecha: number | null = null;

  for (const fila of filas.slice(1)) {
    const gasto = numero(fila[iGasto]) ?? 0;
    const clave = (fila[iAgrupador] ?? "").trim() || "(sin nombre)";
    gastoTotal += gasto;
    gastoPorGrupo.set(clave, (gastoPorGrupo.get(clave) ?? 0) + gasto);

    if (iImpresiones !== -1) impresiones += numero(fila[iImpresiones]) ?? 0;
    if (iClics !== -1) clics += numero(fila[iClics]) ?? 0;
    if (iFrecuencia !== -1) {
      const f = numero(fila[iFrecuencia]);
      if (f !== null && gasto > 0) {
        frecuenciaPonderada += f * gasto;
        gastoConFrecuencia += gasto;
      }
    }
    if (iDia !== -1) {
      const d = (fila[iDia] ?? "").trim();
      if (d) dias.add(d);
    }
    for (const i of [iInicio, iFin]) {
      if (i === -1) continue;
      const t = fecha(fila[i]);
      if (t === null) continue;
      minFecha = minFecha === null ? t : Math.min(minFecha, t);
      maxFecha = maxFecha === null ? t : Math.max(maxFecha, t);
    }
  }

  if (gastoTotal <= 0) {
    throw new ErrorCsvMeta("El archivo no tiene importes gastados mayores a cero.");
  }

  let cantidadDias: number | null = null;
  if (dias.size > 0) cantidadDias = dias.size;
  else if (minFecha !== null && maxFecha !== null) {
    cantidadDias = Math.round((maxFecha - minFecha) / 86400000) + 1;
  }
  const diasEstimados = cantidadDias === null || cantidadDias <= 0;
  if (diasEstimados) {
    advertencias.push(
      "No pudimos determinar el período del informe: dividimos el gasto por 30 días.",
    );
  }
  const diasFinal = diasEstimados ? 30 : cantidadDias!;

  const activos = [...gastoPorGrupo.values()].filter((g) => g > 0);
  const bajoGasto = activos.filter((g) => g < gastoTotal * 0.02).length;

  return {
    filas: filas.length - 1,
    conjuntos_activos: activos.length,
    conto_campanas: contoCampanas,
    gasto_total: Math.round(gastoTotal),
    dias: diasFinal,
    dias_estimados: diasEstimados,
    presupuesto_diario: Math.round(gastoTotal / diasFinal),
    frecuencia_promedio:
      gastoConFrecuencia > 0
        ? Math.round((frecuenciaPonderada / gastoConFrecuencia) * 100) / 100
        : null,
    ctr_global: impresiones > 0 ? Math.round((clics / impresiones) * 10000) / 100 : null,
    conjuntos_bajo_gasto: bajoGasto,
    advertencias,
  };
}
