import type {
  ConfianzaDocumento,
  Escenario90d,
  Evidencia,
  PoliticaEnvio,
  ValorPublicable,
} from "./types";

export function evidenciaDisponible<T>(
  evidencia: Evidencia<T>,
): evidencia is Extract<Evidencia<T>, { estado: "verificado" | "declarado" }> {
  return evidencia.estado === "verificado" || evidencia.estado === "declarado";
}

export function valorCalculado<T>(args: {
  valor: T;
  confianza: Exclude<ConfianzaDocumento, "bloqueada">;
  evidenciaIds: string[];
  supuestos?: string[];
}): ValorPublicable<T> {
  return {
    estado: "disponible",
    valor: args.valor,
    confianza: args.confianza,
    evidenciaIds: [...args.evidenciaIds],
    supuestos: [...(args.supuestos ?? [])],
  };
}

export function valorRetenido<T>(...motivos: string[]): ValorPublicable<T> {
  return {
    estado: "retenido",
    valor: null,
    confianza: "bloqueada",
    motivos,
  };
}

/**
 * Bloque 3 Funcional, D4 Eje 2: el dato de ENTRADA no está — nunca una
 * regla de negocio bloqueando un cálculo que sí sería posible con datos.
 * Ver `docs/funcional/contrato-bloque-3.md` sección 1 para el
 * discriminador explícito de cada call site.
 */
export function valorEvidenciaFaltante<T>(...motivos: string[]): ValorPublicable<T> {
  return {
    estado: "evidencia_faltante",
    valor: null,
    confianza: "bloqueada",
    motivos,
  };
}

export function valorNoAplica<T>(motivo: string): ValorPublicable<T> {
  return { estado: "no_aplica", valor: null, motivo };
}

/**
 * Convierte evidencia numérica en un valor publicable sin inventar un cero.
 * `no_disponible` queda retenido y `no_aplica` conserva su significado.
 */
export function publicarNumeroDesdeEvidencia(
  evidenciaId: string,
  evidencia: Evidencia<number>,
  confianza: Exclude<ConfianzaDocumento, "bloqueada"> = "media",
): ValorPublicable<number> {
  if (evidencia.estado === "no_aplica") return valorNoAplica(evidencia.motivo);
  if (evidencia.estado === "no_disponible") return valorRetenido(evidencia.motivo);
  if (!evidenciaDisponible(evidencia) || !Number.isFinite(evidencia.valor)) {
    return valorRetenido("El valor no es numérico o finito.");
  }
  return valorCalculado({
    valor: evidencia.valor,
    confianza,
    evidenciaIds: [evidenciaId],
  });
}

export type EntradaPoliticaEnvio = {
  /** También acepta el booleano/null de `DatosDiagnostico.absorbe_costo_envio`. */
  estado?: "si" | "no" | "no_confirmado" | boolean | null;
  costoNeto?: Evidencia<number> | null;
  /** Campo histórico `costo_envio_promedio`, que representaba el neto del vendedor. */
  costoNetoLegacy?: number | null;
};

/**
 * Adaptador conservador para diagnósticos nuevos y anteriores.
 * La decisión nueva siempre gana. Sin decisión ni dato legado, queda pendiente.
 */
export function resolverPoliticaEnvio(entrada: EntradaPoliticaEnvio): PoliticaEnvio {
  if (entrada.estado === "no" || entrada.estado === false) {
    return { estado: "no", costoNeto: 0, mostrarEnDocumentos: false };
  }

  if (entrada.estado === "no_confirmado") {
    return { estado: "no_confirmado", costoNeto: null, mostrarEnDocumentos: false };
  }

  if (entrada.estado === "si" || entrada.estado === true) {
    return {
      estado: "si",
      costoNeto: entrada.costoNeto ?? {
        estado: "no_disponible",
        valor: null,
        motivo: "El negocio absorbe el envío, pero falta confirmar el costo neto.",
      },
      mostrarEnDocumentos: true,
    };
  }

  const legado = entrada.costoNetoLegacy;
  if (typeof legado === "number" && Number.isFinite(legado) && legado >= 0) {
    if (legado === 0) {
      return { estado: "no", costoNeto: 0, mostrarEnDocumentos: false };
    }
    return {
      estado: "si",
      costoNeto: {
        estado: "declarado",
        valor: legado,
        fuente: "campo_legado_costo_envio_promedio",
        periodo: null,
      },
      mostrarEnDocumentos: true,
    };
  }

  return { estado: "no_confirmado", costoNeto: null, mostrarEnDocumentos: false };
}

/** Sólo se menciona el envío cuando el vendedor lo absorbe y hay un monto utilizable. */
export function debeMostrarEnvio(envio: PoliticaEnvio): boolean {
  return envio.estado === "si" && evidenciaDisponible(envio.costoNeto);
}

/**
 * La ausencia de costo confirmado no bloquea una proyección comercial, pero sí
 * cualquier cifra presentada como rentabilidad o contribución neta.
 */
export function envioBloqueaRentabilidad(envio: PoliticaEnvio): boolean {
  if (envio.estado === "no") return false;
  if (envio.estado === "no_confirmado") return true;
  return !evidenciaDisponible(envio.costoNeto) || !Number.isFinite(envio.costoNeto.valor);
}

export function valorEsPublicable<T>(valor: ValorPublicable<T>): boolean {
  return valor.estado === "disponible";
}

/** El escenario potencial sólo puede mostrarse con cobertura/confianza alta. */
export function escenarioPuedeMostrarse(escenario: Escenario90d): boolean {
  if (!escenario.visible) return false;
  if (escenario.id === "potencial" && escenario.confianza !== "alta") return false;
  return true;
}
