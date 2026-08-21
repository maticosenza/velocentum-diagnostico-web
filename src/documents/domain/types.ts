/**
 * Contratos puros del motor documental.
 *
 * Esta capa no calcula, no redacta con IA y no conoce React ni PDF. Su objetivo
 * es conservar la diferencia entre un valor real (incluido cero), un valor que
 * no se puede publicar y algo que no corresponde al negocio.
 */

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

/** Un mes del trimestre proyectado. El nivel es acumulativo (saturación), no incremental. */
export type MesEscenario90d = {
  mes: 1 | 2 | 3;
  facturacionProyectada: ValorPublicable<number>;
  /** Oportunidad habilitada ESE mes, ya incluida en `facturacionProyectada`. */
  oportunidadHabilitada: ValorPublicable<number>;
};

export type Escenario90d = {
  id: "conservador" | "base" | "potencial";
  visible: boolean;
  confianza: ConfianzaDocumento;
  contribucionAcumulada90d: ValorPublicable<number>;
  ritmoMensualDia90: ValorPublicable<number>;
  palancas: {
    id: string;
    nombre: string;
    contribucion: ValorPublicable<number>;
  }[];
  /** Vacío cuando el escenario está retenido. */
  mensual: MesEscenario90d[];
  supuestos: SupuestoDocumento[];
  restriccionesAplicadas: RestriccionDocumento[];
};

export type SeleccionComercial = {
  aprobadaManualmente: true;
  paqueteId: string;
  nombre: string;
  alcance: string[];
  exclusiones: string[];
  entregables: string[];
  duracionDias: number;
  precio: Evidencia<number>;
  formaPago: string;
  inicio: string | null;
  incluirPrecioEnPdf: boolean;
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
  roadmap: EtapaRoadmap[];
  servicios: ServicioDocumento[];
  comercial: SeleccionComercial | null;
  restricciones: RestriccionDocumento[];
  metodologia: SupuestoDocumento[];
};
