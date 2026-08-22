import { describe, expect, it } from "vitest";
import { calcularDiagnostico, type ConfiguracionCalculo } from "../../lib/calculo-diagnostico";
import {
  casoSnakeStore,
  casoSnakeStoreCoberturaCompleta,
  configuracionRegresionFase2,
} from "../../lib/fixtures-casos";
import { calcularEscenarios90d, umbralDispersionDe } from "../../lib/escenarios-90d";
import type { DatosDiagnostico } from "../../lib/diagnostico-form";
import { politicaEnvioDocumento } from "./build-context";
import {
  FRASES_PROHIBIDAS,
  construirResumenComercial,
  fraseProhibidaEncontrada,
  redaccionRangoContribucion,
} from "./resumen-comercial";
import { escenariosDocumento } from "./escenarios-90d";
import { formatARS } from "../../lib/format";

const cfg: ConfiguracionCalculo = configuracionRegresionFase2;

/**
 * Snake Store con funnel completo, envío confirmado y catálogo declarado al
 * 100% explícito: genera contribución calculable en los tres escenarios
 * (margen total requiere 100% de cobertura de productos, no sólo de canales).
 */
const casoConOportunidad: DatosDiagnostico = {
  ...casoSnakeStoreCoberturaCompleta,
  facturacion_mensual: 22_522_600,
  visitas_mensuales: 5000,
  agregados_carrito: 1000,
  checkouts_iniciados: 300,
  absorbe_costo_envio: true,
};

function armar(datos: DatosDiagnostico, confianzaDocumento: "alta" | "media" | "baja" | "bloqueada" = "alta") {
  const resultado = calcularDiagnostico(datos, cfg);
  const envio = politicaEnvioDocumento(datos, resultado);
  const escenariosCalculados = calcularEscenarios90d(datos, resultado);
  const escenariosDoc = escenariosDocumento(datos, resultado, confianzaDocumento, envio);
  return construirResumenComercial({
    escenariosCalculados,
    escenariosDocumento: escenariosDoc,
    umbralDispersion: umbralDispersionDe({}),
  });
}

describe("construirResumenComercial", () => {
  it("la cifra dominante es contribución incremental del conservador, nunca facturación", () => {
    const resumen = armar(casoConOportunidad, "alta");
    expect(resumen.escenarioComunicado).toBe("conservador");
    expect(resumen.cifraPrincipal.estado).toBe("calculado");
    expect(resumen.limiteInferior.estado).toBe("calculado");
    // El límite superior, con confianza alta, es el escenario potencial.
    expect(resumen.idEscenarioLimiteSuperior).toBe("potencial");
    if (resumen.cifraPrincipal.estado === "calculado" && resumen.limiteInferior.estado === "calculado") {
      expect(resumen.cifraPrincipal.valor).toBe(resumen.limiteInferior.valor);
    }
  });

  it("con confianza media, potencial no está visible: el límite superior cae a base", () => {
    const resumen = armar(casoConOportunidad, "media");
    expect(resumen.idEscenarioLimiteSuperior).toBe("base");
  });

  it("arma la redacción obligatoria con la plantilla exacta aprobada, usando el rango real", () => {
    const resumen = armar(casoConOportunidad, "alta");
    expect(resumen.redaccion).not.toBeNull();
    expect(resumen.redaccion).toMatch(
      /^Con los datos disponibles y bajo estos supuestos, existe un rango de contribución incremental potencial de .+ a .+ durante los próximos 90 días\.$/,
    );
  });

  it("la redacción nunca contiene ninguna frase prohibida", () => {
    const resumen = armar(casoConOportunidad, "alta");
    expect(resumen.redaccion).not.toBeNull();
    expect(fraseProhibidaEncontrada(resumen.redaccion as string)).toBeNull();
  });

  it("fraseProhibidaEncontrada detecta cada una de las frases prohibidas, insensible a mayúsculas", () => {
    for (const frase of FRASES_PROHIBIDAS) {
      expect(fraseProhibidaEncontrada(`Con estos datos, ${frase.toUpperCase()} mucho dinero.`)).toBe(
        frase,
      );
    }
    expect(fraseProhibidaEncontrada("Existe un rango de contribución incremental potencial.")).toBeNull();
  });

  it("redaccionRangoContribucion arma exactamente la plantilla aprobada con montos formateados", () => {
    const texto = redaccionRangoContribucion(1_000_000, 2_500_000);
    expect(texto).toBe(
      `Con los datos disponibles y bajo estos supuestos, existe un rango de contribución incremental potencial de ${formatARS(1_000_000)} a ${formatARS(2_500_000)} durante los próximos 90 días.`,
    );
  });

  it("dispersión alta: retiene la cifra principal pero conserva el rango (limiteInferior/limiteSuperior)", () => {
    const resultado = calcularDiagnostico(casoConOportunidad, cfg);
    const envio = politicaEnvioDocumento(casoConOportunidad, resultado);
    const escenariosCalculados = calcularEscenarios90d(casoConOportunidad, resultado);
    const escenariosDoc = escenariosDocumento(casoConOportunidad, resultado, "alta", envio);

    // Umbral artificialmente bajo para forzar el disparo con datos reales
    // (con las curvas aprobadas el cociente real es ~1,57).
    const resumen = construirResumenComercial({
      escenariosCalculados,
      escenariosDocumento: escenariosDoc,
      umbralDispersion: 1.2,
    });

    expect(resumen.dispersion.alta).toBe(true);
    expect(resumen.dispersion.ratio).not.toBeNull();
    expect(resumen.dispersion.datosParaCerrarla.length).toBeGreaterThan(0);
    expect(resumen.cifraPrincipal.estado).toBe("retenido");
    // El rango sigue publicado: "se muestra el rango sin cifra principal", no se oculta todo.
    expect(resumen.limiteInferior.estado).toBe("calculado");
    expect(resumen.limiteSuperior.estado).toBe("calculado");
    expect(resumen.redaccion).not.toBeNull();
  });

  it("sin escenario conservador calculable, la cifra principal y el límite inferior quedan retenidos", () => {
    const resumen = armar(casoSnakeStore, "baja");
    expect(resumen.cifraPrincipal.estado).toBe("retenido");
    expect(resumen.limiteInferior.estado).toBe("retenido");
    expect(resumen.redaccion).toBeNull();
  });

  it("sin ninguna fuga calculable (ni base ni potencial tienen contribución), el límite superior también queda retenido", () => {
    // Snake Store sin funnel ni pauta, con envío ya resuelto (no aplica):
    // ninguno de los tres escenarios tiene contribución incremental
    // calculable por falta de oportunidad, no por envío/margen, así que ni
    // "potencial" ni "base" pueden servir de límite superior.
    const datos: DatosDiagnostico = { ...casoSnakeStore, absorbe_costo_envio: false };
    const resumen = armar(datos, "alta");
    expect(resumen.idEscenarioLimiteSuperior).toBeNull();
    // Cae al motivo propio de "base" (no hay oportunidad detectada), que es
    // más preciso que un mensaje genérico: base sí existe como escenario,
    // simplemente no tiene contribución calculable.
    expect(resumen.limiteSuperior.estado).toBe("retenido");
    if (resumen.limiteSuperior.estado === "retenido") {
      expect(resumen.limiteSuperior.motivos.join(" ")).toMatch(/No hay oportunidad/);
    }
    expect(resumen.redaccion).toBeNull();
  });

  it("margen bloqueado: la cifra principal queda retenida (contribución depende de margen)", () => {
    const datos: DatosDiagnostico = {
      ...casoConOportunidad,
      margen_declarado_min: 90,
      margen_declarado_max: 90,
      margen_declarado_confirmado: true,
    };
    const resumen = armar(datos, "alta");
    expect(resumen.cifraPrincipal.estado).toBe("retenido");
    if (resumen.cifraPrincipal.estado === "retenido") {
      expect(resumen.cifraPrincipal.motivos.join(" ")).toMatch(/contradice/);
    }
  });

  it("si ni base ni potencial existieran en el array de escenarios (fixture malformado), cae al motivo genérico de límite superior", () => {
    // Caso defensivo: no ocurre con la salida real de `escenariosDocumento`
    // (siempre trae los tres ids), pero sí puede ocurrir con un fixture
    // armado a mano que omite escenarios (como los de test-fixtures.ts).
    const resumen = construirResumenComercial({
      escenariosCalculados: [],
      escenariosDocumento: [],
      umbralDispersion: 2.5,
    });
    expect(resumen.idEscenarioLimiteSuperior).toBeNull();
    expect(resumen.limiteSuperior.estado).toBe("retenido");
    if (resumen.limiteSuperior.estado === "retenido") {
      expect(resumen.limiteSuperior.motivos.join(" ")).toMatch(/escenario de contexto/);
    }
    expect(resumen.cifraPrincipal.estado).toBe("retenido");
    expect(resumen.redaccion).toBeNull();
  });
});
