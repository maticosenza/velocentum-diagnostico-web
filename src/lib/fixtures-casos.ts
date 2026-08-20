import { DATOS_INICIALES, type DatosDiagnostico } from "./diagnostico-form";
import type { ConfiguracionCalculo } from "./calculo-diagnostico";

export const configuracionRegresionFase2: ConfiguracionCalculo = {
  reserva_default: 0.35,
  comision_plataforma: {
    tiendanube_inicial: 0.02,
    tiendanube_esencial: 0.01,
  },
  comision_pasarela: { mercado_pago: 0.05 },
  comision_marketplace: {
    mercado_libre: {
      comision: 0.1694,
      marketplace: "mercado_libre",
      pais: "AR",
      origen: "benchmark_provisional",
      provisional: true,
      verificado: false,
    },
  },
  umbrales_cr_por_ticket: [{ hasta: null, verde: 0.018, rojo: 0.01 }],
  delta_medicion: { verde: 0.1, rojo: 0.2 },
  tope_fuga_individual: 0.25,
  tope_fuga_total: 0.4,
  mejora_agregado_pts: 2,
  mejora_checkout_pts: 10,
  mejora_compra_pts: 10,
};

/**
 * Casos de regresion compartidos de la fase 2.
 *
 * Son entradas verificables, no resultados derivados del motor. Mantener una
 * sola definicion evita que una entrega corrija un caso mientras otra sigue
 * probando una copia desactualizada.
 */
export const casoSnakeStore: DatosDiagnostico = {
  ...DATOS_INICIALES,
  nombre_tienda: "Snake Store",
  plataforma: "tiendanube",
  plan_plataforma: "inicial",
  pasarela: "mercado_pago",
  ticket_promedio: 225226,
  costo_envio_promedio: 11000,
  producto_1_nombre: "Campera Puffer",
  producto_1_costo: 40000,
  producto_1_precio: 180000,
  producto_1_pct_facturacion: 30,
  producto_2_nombre: "Chaleco Tiffany",
  producto_2_costo: 35000,
  producto_2_precio: 125000,
  producto_2_pct_facturacion: 20,
  producto_3_nombre: "Calza Street",
  producto_3_costo: 20000,
  producto_3_precio: 85000,
  producto_3_pct_facturacion: 10,
  canal_tienda_pct: 100,
  canal_ml_no_aplica: true,
};

/** B1: captura original de Titan Web, aun util para probar contradicciones. */
export const casoTitanWebB1: DatosDiagnostico = {
  ...DATOS_INICIALES,
  nombre_tienda: "Titan Web",
  plataforma: "tiendanube",
  plan_plataforma: "esencial",
  pasarela: "mercado_pago",
  vende_mercado_libre: true,
  facturacion_mensual: 50_000_000,
  ticket_promedio: 25000,
  costo_envio_promedio: 9000,
  producto_1_nombre: "Bolsa tostado",
  producto_1_costo: 5890,
  producto_1_precio: 11650,
  producto_1_pct_facturacion: 20,
  producto_2_nombre: "Molde pan lactal",
  producto_2_costo: 17330,
  producto_2_precio: 32990,
  producto_2_pct_facturacion: 20,
  producto_3_nombre: "Cintura extensible",
  producto_3_costo: 15700,
  producto_3_precio: 30390,
  producto_3_pct_facturacion: 20,
  canal_ml_pct: 100,
  canal_ml_facturacion: 50_000_000,
  canal_tienda_no_aplica: true,
  ml_inversion_product_ads: 1_800_000,
};

/** Estado intermedio de B1 usado para auditar envio antes del mix de canales. */
export const casoTitanWebB1AntesDeCanales: DatosDiagnostico = {
  ...casoTitanWebB1,
  vende_mercado_libre: false,
  canal_ml_pct: null,
  canal_ml_facturacion: null,
  canal_tienda_no_aplica: false,
  ml_inversion_product_ads: null,
};

/**
 * B2 queda deliberadamente sin datos hasta verificar envio neto y liquidacion.
 * No se rellena con la hipotesis del S6 porque eso la convertiria en un hecho.
 */
export const casoTitanWebB2Pendiente = {
  estado: "pendiente_verificacion" as const,
  faltantes: ["envio_neto_vendedor", "liquidacion_mercado_libre"] as const,
};

export const esperadosFase2 = {
  snakeStore: {
    componenteEnvio: 0.0488,
    margenesProducto: [0.6589, 0.6012, 0.6459],
    margenContribucion: 0.6375,
    breakevenRoas: 1.5686,
  },
  titanWebB1AntesDeComisionMarketplace: {
    componenteEnvio: 0.36,
    margenesProducto: [0.0744, 0.0547, 0.0634],
    margenContribucion: 0.0642,
    breakevenRoas: 15.585,
  },
  titanWebB1ConComisionMarketplace: {
    margenesProducto: [-0.035, -0.0547, -0.046],
    margenContribucion: -0.0452,
    merMarketplace: 27.78,
  },
} as const;
