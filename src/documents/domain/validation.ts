import type { DocumentContextV1, Evidencia, PoliticaEnvio, ValorPublicable } from "./types";

export type ProblemaValidacionDocumento = {
  path: string;
  mensaje: string;
};

function textoNoVacio(valor: unknown): valor is string {
  return typeof valor === "string" && valor.trim().length > 0;
}

function validarEvidencia(
  evidencia: Evidencia<unknown>,
  path: string,
): ProblemaValidacionDocumento[] {
  const problemas: ProblemaValidacionDocumento[] = [];
  if (evidencia.estado === "verificado" || evidencia.estado === "declarado") {
    if (evidencia.valor === null || evidencia.valor === undefined) {
      problemas.push({
        path: `${path}.valor`,
        mensaje: "La evidencia disponible necesita un valor.",
      });
    }
    if (typeof evidencia.valor === "number" && !Number.isFinite(evidencia.valor)) {
      problemas.push({ path: `${path}.valor`, mensaje: "El número debe ser finito." });
    }
  } else if ("motivo" in evidencia) {
    if (evidencia.valor !== null) {
      problemas.push({
        path: `${path}.valor`,
        mensaje: "La evidencia ausente o no aplicable debe valer null.",
      });
    }
    if (!textoNoVacio(evidencia.motivo)) {
      problemas.push({
        path: `${path}.motivo`,
        mensaje: "Falta explicar el estado de la evidencia.",
      });
    }
  }
  return problemas;
}

function validarValorPublicable(
  valor: ValorPublicable<unknown>,
  path: string,
): ProblemaValidacionDocumento[] {
  const problemas: ProblemaValidacionDocumento[] = [];
  if (valor.estado === "calculado") {
    if (valor.valor === null || valor.valor === undefined) {
      problemas.push({
        path: `${path}.valor`,
        mensaje: "Un valor calculado no puede estar vacío.",
      });
    }
    if (typeof valor.valor === "number" && !Number.isFinite(valor.valor)) {
      problemas.push({ path: `${path}.valor`, mensaje: "Un valor calculado debe ser finito." });
    }
    if (valor.evidenciaIds.length === 0) {
      problemas.push({
        path: `${path}.evidenciaIds`,
        mensaje: "Toda cifra publicable necesita trazabilidad.",
      });
    }
  } else if (valor.estado === "retenido") {
    if (valor.valor !== null) {
      problemas.push({
        path: `${path}.valor`,
        mensaje: "Un valor retenido debe valer null, nunca cero.",
      });
    }
    if (valor.motivos.length === 0 || valor.motivos.some((m) => !textoNoVacio(m))) {
      problemas.push({
        path: `${path}.motivos`,
        mensaje: "Falta explicar por qué se retuvo el valor.",
      });
    }
  } else if (valor.valor !== null) {
    problemas.push({ path: `${path}.valor`, mensaje: "Un valor no aplicable debe valer null." });
  }
  return problemas;
}

function validarEnvio(envio: PoliticaEnvio): ProblemaValidacionDocumento[] {
  if (envio.estado === "si") return validarEvidencia(envio.costoNeto, "envio.costoNeto");
  if (envio.estado === "no" && envio.costoNeto !== 0) {
    return [
      {
        path: "envio.costoNeto",
        mensaje: "Si el negocio no absorbe envío, el costo debe ser cero.",
      },
    ];
  }
  return [];
}

export function validarContextoDocumento(
  contexto: DocumentContextV1,
): ProblemaValidacionDocumento[] {
  const problemas: ProblemaValidacionDocumento[] = [];

  if (contexto.schemaVersion !== "document-context/1") {
    problemas.push({ path: "schemaVersion", mensaje: "Versión de contexto no soportada." });
  }
  for (const [path, valor] of [
    ["templateVersion", contexto.templateVersion],
    ["rulesetVersion", contexto.rulesetVersion],
    ["diagnostico.id", contexto.diagnostico.id],
    ["diagnostico.fecha", contexto.diagnostico.fecha],
    ["cliente.nombre", contexto.cliente.nombre],
  ] as const) {
    if (!textoNoVacio(valor)) problemas.push({ path, mensaje: "El texto es obligatorio." });
  }
  if (!Number.isInteger(contexto.diagnostico.version) || contexto.diagnostico.version < 1) {
    problemas.push({
      path: "diagnostico.version",
      mensaje: "La versión debe ser un entero positivo.",
    });
  }

  for (const [clave, cobertura] of Object.entries({
    general: contexto.cobertura.general,
    canales: contexto.cobertura.canales,
    productos: contexto.cobertura.productos,
  })) {
    if (!Number.isFinite(cobertura) || cobertura < 0 || cobertura > 100) {
      problemas.push({
        path: `cobertura.${clave}`,
        mensaje: "La cobertura debe estar entre 0 y 100.",
      });
    }
  }

  for (const [id, evidencia] of Object.entries(contexto.evidencia)) {
    problemas.push(...validarEvidencia(evidencia, `evidencia.${id}`));
  }
  for (const [id, valor] of Object.entries(contexto.actual)) {
    problemas.push(...validarValorPublicable(valor, `actual.${id}`));
  }
  problemas.push(...validarEnvio(contexto.envio));

  const idsHallazgo = new Set<string>();
  for (const [indice, hallazgo] of contexto.hallazgos.entries()) {
    if (!textoNoVacio(hallazgo.id)) {
      problemas.push({
        path: `hallazgos.${indice}.id`,
        mensaje: "El hallazgo necesita un ID estable.",
      });
    } else if (idsHallazgo.has(hallazgo.id)) {
      problemas.push({
        path: `hallazgos.${indice}.id`,
        mensaje: "El hallazgo está duplicado.",
      });
    } else {
      idsHallazgo.add(hallazgo.id);
    }
    if (hallazgo.monto) {
      problemas.push(...validarValorPublicable(hallazgo.monto, `hallazgos.${indice}.monto`));
    }
  }

  const idsEscenario = new Set<string>();
  for (const [indice, escenario] of contexto.escenarios90d.entries()) {
    if (idsEscenario.has(escenario.id)) {
      problemas.push({
        path: `escenarios90d.${indice}.id`,
        mensaje: "El escenario está duplicado.",
      });
    }
    idsEscenario.add(escenario.id);
    if (escenario.id === "potencial" && escenario.visible && escenario.confianza !== "alta") {
      problemas.push({
        path: `escenarios90d.${indice}.visible`,
        mensaje: "El escenario potencial requiere confianza alta.",
      });
    }
    for (const [magnitud, linea] of [
      ["facturacionIncremental", escenario.facturacionIncremental],
      ["contribucionIncremental", escenario.contribucionIncremental],
      ["ahorroPublicitario", escenario.ahorroPublicitario],
    ] as const) {
      problemas.push(
        ...validarValorPublicable(
          linea.acumulado90d,
          `escenarios90d.${indice}.${magnitud}.acumulado90d`,
        ),
        ...validarValorPublicable(
          linea.ritmoMensualDia90,
          `escenarios90d.${indice}.${magnitud}.ritmoMensualDia90`,
        ),
      );
    }
  }

  if (contexto.comercial && contexto.comercial.aprobadaManualmente !== true) {
    problemas.push({
      path: "comercial.aprobadaManualmente",
      mensaje: "La propuesta comercial siempre requiere aprobación manual.",
    });
  }

  return problemas;
}

export function assertContextoDocumento(contexto: DocumentContextV1): void {
  const problemas = validarContextoDocumento(contexto);
  if (problemas.length === 0) return;
  const detalle = problemas.map((p) => `${p.path}: ${p.mensaje}`).join("\n");
  throw new Error(`Contexto documental inválido:\n${detalle}`);
}
