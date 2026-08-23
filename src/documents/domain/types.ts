/**
 * Contratos puros del motor documental.
 *
 * Esta capa no calcula, no redacta con IA y no conoce React ni PDF. Su objetivo
 * es conservar la diferencia entre un valor real (incluido cero), un valor que
 * no se puede publicar y algo que no corresponde al negocio.
 */

import type { TipoImpactoClasificado } from "../../lib/impacto-economico";

export type EstadoEvidencia = "verificado" | "declarado" | "no_disponible" | "no_aplica";

export type Evidencia<T> =
  | {
      estado: "verificado" | "declarado";
      valor: T;
      fuente: string | null;
      periodo: string | null;
    }
  | {
      estado: "no_disponible" | "no_aplica";
      valor: null;
      motivo: string;
    };

export type ConfianzaDocumento = "alta" | "media" | "baja" | "bloqueada";

export type ValorPublicable<T> =
  | {
      estado: "calculado";
      valor: T;
      confianza: Exclude<ConfianzaDocumento, "bloqueada">;
      evidenciaIds: string[];
      supuestos: string[];
    }
  | {
      estado: "retenido";
      valor: null;
      confianza: "bloqueada";
      motivos: string[];
    }
  | {
      estado: "no_aplica";
      valor: null;
      motivo: string;
    };

/**
 * Decisión explícita sobre el costo de envío que absorbe el vendedor.
 *
 * Un diagnóstico anterior sin la decisión nueva se interpreta como
 * `no_confirmado`, nunca como `no`.
 */
export type PoliticaEnvio =
  | {
      estado: "no";
      costoNeto: 0;
      mostrarEnDocumentos: false;
    }
  | {
      estado: "si";
      costoNeto: Evidencia<number>;
      mostrarEnDocumentos: true;
    }
  | {
      estado: "no_confirmado";
      costoNeto: null;
      mostrarEnDocumentos: false;
    };

export type TipoDocumento = "diagnostico" | "proyeccion_90d" | "propuesta";
export type MonedaDocumento = "ARS";

export type HallazgoDocumento = {
  id: string;
  titulo: string;
  capa: "servicio" | "recomendacion" | "contexto";
  prioridad: "alta" | "media" | "baja";
  confianza: ConfianzaDocumento;
  evidenciaIds: string[];
  monto: ValorPublicable<number> | null;
  /**
   * De qué magnitud económica es este monto (corrección aprobada
   * 2026-08-21, punto 3: "magnitudes identificadas con su etiqueta"). `null`
   * para hallazgos sin monto (riesgos) o con un monto legado sin
   * clasificar.
   */
  magnitud: TipoImpactoClasificado | null;
  servicioId: string | null;
};

export type SupuestoDocumento = {
  id: string;
  etiqueta: string;
  valor: string;
  origen: "observado" | "declarado" | "configuracion" | "derivado";
  evidenciaId: string | null;
};

export type RestriccionDocumento = {
  id: string;
  etiqueta: string;
  detalle: string;
  bloquea: ("rentabilidad" | "escenario" | "escalamiento")[];
};

export type EtapaRoadmap = {
  id: string;
  etiqueta: string;
  desdeDia: number;
  hastaDia: number;
  acciones: string[];
  resultadoEsperado: string;
};

export type ServicioDocumento = {
  id: string;
  nombre: string;
  alcance: string[];
};

/**
 * Una magnitud del escenario (facturación incremental, contribución
 * incremental o ahorro publicitario), con su propia retención: una puede
 * estar calculada mientras otra del mismo escenario está retenida.
 */
export type LineaImpacto90d = {
  acumulado90d: ValorPublicable<number>;
  ritmoMensualDia90: ValorPublicable<number>;
  palancas: { id: string; nombre: string; monto: ValorPublicable<number> }[];
};

/**
 * Un mes del trimestre proyectado. El nivel es acumulativo (saturación), no
 * incremental. Las tres magnitudes habilitadas nunca se suman entre sí, y
 * `facturacionProyectada` nunca incluye contribución ni ahorro.
 */
export type MesEscenario90d = {
  mes: 1 | 2 | 3;
  facturacionProyectada: ValorPublicable<number>;
  facturacionIncrementalHabilitada: ValorPublicable<number>;
  contribucionIncrementalHabilitada: ValorPublicable<number>;
  ahorroPublicitarioHabilitado: ValorPublicable<number>;
};

export type Escenario90d = {
  id: "conservador" | "base" | "potencial";
  visible: boolean;
  confianza: ConfianzaDocumento;
  facturacionIncremental: LineaImpacto90d;
  contribucionIncremental: LineaImpacto90d;
  ahorroPublicitario: LineaImpacto90d;
  /** Vacío únicamente cuando las tres magnitudes están retenidas. */
  mensual: MesEscenario90d[];
  supuestos: SupuestoDocumento[];
  restriccionesAplicadas: RestriccionDocumento[];
};

/**
 * Cociente entre la contribución incremental acumulada a 90 días del
 * escenario potencial y la del conservador (corrección aprobada
 * 2026-08-21, punto 7). `alta` en true significa que el rango es demasiado
 * ancho para comunicar una cifra principal defendible.
 */
export type DispersionContribucion = {
  ratio: number | null;
  umbral: number;
  alta: boolean;
  /** Qué haría falta para acotar el rango. Vacío cuando `alta` es false. */
  datosParaCerrarla: string[];
};

/**
 * Resumen comercial de 90 días: la cifra dominante es SIEMPRE contribución
 * incremental (nunca facturación — corrección aprobada 2026-08-21, punto
 * 2), y el escenario comunicado es SIEMPRE el conservador (punto 6). Base y
 * potencial sólo aparecen como el límite superior de contexto, nunca como
 * encabezado. `null` en el `DocumentContextV1` de un diagnóstico: esa pieza
 * no proyecta (punto 3).
 *
 * Marca de supuesto (punto 5): no hay un campo agregado de "supuestos" acá
 * a propósito — `cifraPrincipal`, `limiteInferior` y `limiteSuperior` ya
 * son `ValorPublicable<number>`, y cada uno trae su propio `supuestos`
 * correcto (el de la rampa del escenario del que efectivamente salió ese
 * valor: conservador para los primeros dos, base o potencial para el
 * tercero según `idEscenarioLimiteSuperior`). El renderer debe marcar cada
 * valor por separado, nunca asumir un único supuesto para los tres.
 */
export type ResumenComercial90d = {
  escenarioComunicado: "conservador";
  /**
   * Cifra única de encabezado (punto 4). Retenida —nunca un número— cuando
   * la dispersión es alta (punto 7) o cuando el conservador no es
   * calculable; en ese caso sólo se publica el rango de abajo.
   */
  cifraPrincipal: ValorPublicable<number>;
  limiteInferior: ValorPublicable<number>;
  limiteSuperior: ValorPublicable<number>;
  idEscenarioLimiteSuperior: "base" | "potencial" | null;
  dispersion: DispersionContribucion;
  /**
   * Redacción obligatoria ya armada (punto 6): "Con los datos disponibles y
   * bajo estos supuestos, existe un rango de contribución incremental
   * potencial de X a Y durante los próximos 90 días." `null` cuando no hay
   * rango calculable que describir.
   */
  redaccion: string | null;
};

/** Mismas cuatro unidades que `UnidadServicio` en `src/lib/paquetes.ts`. */
export type UnidadServicioComercial = "campañas_activas" | "piezas_por_mes" | "campañas" | "alcance_descrito";

export type ServicioNivelComercial = {
  servicio: string;
  unidad: UnidadServicioComercial;
  /** null sólo cuando la unidad es "alcance_descrito": ese alcance no se cuantifica. */
  cantidad: number | null;
  /** Sólo para "alcance_descrito". */
  descripcion: string | null;
  /** Hallazgos concretos que justifican este servicio en este nivel. */
  hallazgoIds: string[];
};

export type NivelComercial = {
  id: string;
  nombre: string;
  servicios: ServicioNivelComercial[];
  /** Retenido hasta que el vendedor carga un precio manualmente: el sistema nunca inventa uno. */
  precio: ValorPublicable<number>;
};

/**
 * Escalera de paquetes ya confirmada manualmente por el vendedor (decisión
 * comercial 7, `docs/decisiones-pendientes.md`, resuelta 2026-08-22): hasta
 * tres niveles acumulativos (IMPULSO/TRACCIÓN/ESCALA por defecto, nombres
 * configurables), nunca un paquete único. `null` en el `DocumentContextV1`
 * hasta que exista una confirmación manual explícita — ver
 * `src/lib/paquetes.ts` (`EscaleraPaquetesConfirmada`) para el modelo
 * persistido del que se deriva.
 */
export type SeleccionComercial = {
  niveles: NivelComercial[];
};

export type MetricasActualesDocumento = {
  facturacion: ValorPublicable<number>;
  ticket: ValorPublicable<number>;
  pedidos: ValorPublicable<number>;
  margenTotal: ValorPublicable<number>;
  margenMuestra: ValorPublicable<number>;
  inversionTotal: ValorPublicable<number>;
  merTienda: ValorPublicable<number>;
  merMarketplace: ValorPublicable<number>;
  roasProductAds: ValorPublicable<number>;
};

/** Modelo común que consumen las tres plantillas versionadas. */
export type DocumentContextV1 = {
  schemaVersion: "document-context/1";
  templateVersion: string;
  rulesetVersion: string;
  tipoDocumento: TipoDocumento;

  diagnostico: {
    id: string;
    version: number;
    fecha: string;
  };

  cliente: {
    nombre: string;
    vertical: string | null;
    moneda: MonedaDocumento;
    periodo: "mensual";
  };

  modalidad: {
    minorista: boolean;
    mayorista: boolean;
  };

  /** Los porcentajes de cobertura se expresan de 0 a 100. */
  cobertura: {
    general: number;
    canales: number;
    productos: number;
    confianza: ConfianzaDocumento;
  };

  evidencia: Record<string, Evidencia<unknown>>;
  actual: MetricasActualesDocumento;
  envio: PoliticaEnvio;
  hallazgos: HallazgoDocumento[];
  escenarios90d: Escenario90d[];
  /**
   * `null` para un diagnóstico (esa pieza no proyecta — punto 3 de la
   * corrección aprobada 2026-08-21). Presente para proyección y propuesta.
   */
  resumenComercial: ResumenComercial90d | null;
  roadmap: EtapaRoadmap[];
  servicios: ServicioDocumento[];
  comercial: SeleccionComercial | null;
  restricciones: RestriccionDocumento[];
  metodologia: SupuestoDocumento[];
};
