/**
 * Invariantes estructurales de `mapearHallazgos`, independientes de cuáles
 * hallazgos concretos dispara cada combinación de datos. Si algún día dos
 * ramas del mapeo empujan el mismo ID, la propuesta y el documento
 * terminarían mostrando el mismo hallazgo duplicado sin que nada lo detecte
 * antes de llegar a producción — por eso el contrato se fija acá.
 */
import { describe, expect, it } from "vitest";
import { calcularDiagnostico, type ConfiguracionCalculo } from "./calculo-diagnostico";
import { DATOS_INICIALES, type DatosDiagnostico } from "./diagnostico-form";
import { casoSnakeStore, casoTitanWebB1, casoTitanWebB1AntesDeCanales } from "./fixtures-casos";
import { mapearHallazgos } from "./propuesta";

const CAPAS_VALIDAS = new Set(["servicio", "recomendacion", "contexto"]);

const cfgMinima: ConfiguracionCalculo = {
  reserva_default: 0.35,
  comision_plataforma: { tiendanube_esencial: 0 },
  comision_pasarela: { mercado_pago: 0 },
};

const baseCompleta: DatosDiagnostico = {
  ...DATOS_INICIALES,
  nombre_tienda: "Invariantes",
  plataforma: "tiendanube",
  plan_plataforma: "esencial",
  pasarela: "mercado_pago",
  facturacion_mensual: 8_000_000,
  ticket_promedio: 12_000,
  costo_envio_promedio: 0,
  producto_1_nombre: "Producto",
  producto_1_costo: 60,
  producto_1_precio: 100,
  vende_mercado_libre: true,
  ml_pct_facturacion: 40,
  ml_productos_publicados: 30,
  visitas_mensuales: 40_000,
  agregados_carrito: 4_000,
  checkouts_iniciados: 1_200,
  inversion_meta: 500_000,
  inversion_google: 200_000,
  conjuntos_activos: 4,
  presupuesto_diario: 12_000,
  frecuencia_creativos: "2 por mes",
};

/** Casos que ejercitan ramas distintas del mapeo, sin repetir el mismo camino. */
const CASOS: { nombre: string; datos: DatosDiagnostico }[] = [
  { nombre: "Snake Store", datos: casoSnakeStore },
  { nombre: "Titan Web B1", datos: casoTitanWebB1 },
  { nombre: "Titan Web antes de canales", datos: casoTitanWebB1AntesDeCanales },
  { nombre: "base sin nada cargado", datos: DATOS_INICIALES },
  { nombre: "base completa, todo negativo", datos: baseCompleta },
  {
    nombre: "base completa, todo positivo",
    datos: {
      ...baseCompleta,
      retargeting_abandono: true,
      ml_tiene_clips: true,
      consultas_por_organico: true,
      recuperacion_carrito: true,
    },
  },
  {
    nombre: "base completa, triestados en false explícito",
    datos: {
      ...baseCompleta,
      retargeting_abandono: false,
      ml_tiene_clips: false,
      angulo_que_funciona: "no sabe",
      dolor_cliente: "",
    },
  },
];

function hallazgosDe(datos: DatosDiagnostico) {
  const resultado = calcularDiagnostico(datos, cfgMinima);
  return mapearHallazgos(datos, resultado.derivados, resultado.estados_bloque, resultado.fugas);
}

describe("invariantes estructurales de mapearHallazgos", () => {
  it.each(CASOS)("no duplica IDs de hallazgo para: $nombre", ({ datos }) => {
    const ids = hallazgosDe(datos).map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(CASOS)("todo hallazgo tiene ID y título no vacíos para: $nombre", ({ datos }) => {
    for (const hallazgo of hallazgosDe(datos)) {
      expect(hallazgo.id.trim().length).toBeGreaterThan(0);
      expect(hallazgo.titulo.trim().length).toBeGreaterThan(0);
    }
  });

  it.each(CASOS)("toda capa es una de las tres válidas para: $nombre", ({ datos }) => {
    for (const hallazgo of hallazgosDe(datos)) {
      expect(CAPAS_VALIDAS.has(hallazgo.capa)).toBe(true);
    }
  });

  it.each(CASOS)("el servicio, cuando existe, no es texto vacío para: $nombre", ({ datos }) => {
    for (const hallazgo of hallazgosDe(datos)) {
      if (hallazgo.servicio !== null) {
        expect(hallazgo.servicio.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("Snake Store y el caso completo negativo disparan hallazgos distintos de cero", () => {
    // Guarda mínima contra un mapeo que silenciosamente deje de generar nada.
    expect(hallazgosDe(casoSnakeStore).length).toBeGreaterThan(0);
    expect(hallazgosDe(baseCompleta).length).toBeGreaterThan(0);
  });

  it("un diagnóstico vacío no afirma ningún hallazgo", () => {
    // Ningún campo cargado: no hay evidencia para sostener ningún hallazgo.
    expect(hallazgosDe(DATOS_INICIALES)).toEqual([]);
  });
});
