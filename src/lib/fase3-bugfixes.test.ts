import { describe, expect, it } from "vitest";
import {
  calcularDiagnostico,
  evaluarEstadoCreativos,
  type ConfiguracionCalculo,
} from "./calculo-diagnostico";
import { DATOS_INICIALES, notasVisibles, type DatosDiagnostico } from "./diagnostico-form";
import { mapearHallazgos } from "./propuesta";

const cfg: ConfiguracionCalculo = {
  reserva_default: 0.35,
  comision_plataforma: { tiendanube_esencial: 0 },
  comision_pasarela: { mercado_pago: 0 },
};

const base: DatosDiagnostico = {
  ...DATOS_INICIALES,
  nombre_tienda: "Prueba fase 3",
  plataforma: "tiendanube",
  plan_plataforma: "esencial",
  pasarela: "mercado_pago",
  ticket_promedio: 100,
  costo_envio_promedio: 0,
  producto_1_nombre: "Producto",
  producto_1_costo: 70,
  producto_1_precio: 100,
  producto_1_pct_facturacion: 100,
};

function ids(d: DatosDiagnostico) {
  const resultado = calcularDiagnostico(d, cfg);
  return mapearHallazgos(d, resultado.derivados, resultado.estados_bloque, resultado.fugas).map(
    (hallazgo) => hallazgo.id,
  );
}

describe("fase 3 · evidencia de los hallazgos", () => {
  it("un 0 o una respuesta negativa nunca deja Contenido en verde", () => {
    expect(
      evaluarEstadoCreativos({
        ...base,
        frecuencia_creativos: "0",
        formato_creativos: "No",
        angulo_que_funciona: "No sé",
        dolor_cliente: "No está claro",
      }),
    ).toBe("rojo");
  });

  it("distingue contenido completo, parcial y ausente", () => {
    expect(evaluarEstadoCreativos(base)).toBe("sin_datos");
    expect(evaluarEstadoCreativos({ ...base, frecuencia_creativos: "2 por mes" })).toBe("amarillo");
    expect(
      evaluarEstadoCreativos({
        ...base,
        frecuencia_creativos: "2 por mes",
        formato_creativos: "Video y carrusel",
        angulo_que_funciona: "Durabilidad",
        dolor_cliente: "Reposición frecuente",
      }),
    ).toBe("verde");
  });

  it("no critica el plan ni los clips sin campos que aporten evidencia", () => {
    const hallazgos = ids({ ...base, vende_mercado_libre: true });
    expect(hallazgos).not.toContain("plan_plataforma");
    expect(hallazgos).not.toContain("clips_ml");
  });

  it("solo advierte por cuotas cuando participación y costo están confirmados", () => {
    expect(ids(base)).not.toContain("cuotas");
    expect(ids({ ...base, financiacion_pct_ventas: 50 })).not.toContain("cuotas");
    expect(ids({ ...base, financiacion_pct_ventas: 50, financiacion_costo_pct: 10 })).toContain(
      "cuotas",
    );
  });
});

describe("fase 3 · notas visibles", () => {
  it("filtra vacíos y conserva el orden y las etiquetas del formulario", () => {
    expect(
      notasVisibles({
        contenido: "  Publica videos una vez por semana.  ",
        identificacion: "Cliente referido.",
        economia: "   ",
      }),
    ).toEqual([
      { bloque: "identificacion", etiqueta: "Identificación", texto: "Cliente referido." },
      {
        bloque: "contenido",
        etiqueta: "Contenido",
        texto: "Publica videos una vez por semana.",
      },
    ]);
  });
});
