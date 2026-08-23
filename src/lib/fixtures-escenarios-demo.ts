/**
 * ESCENARIOS DEMOSTRATIVOS — LOOP NOCTURNO, bloque 1 (2026-08-22).
 *
 * Seis diagnósticos completos, con números plausibles y coherentes entre
 * sí, pensados para juzgar si la LECTURA DEL NEGOCIO que arma el sistema
 * (hallazgos, servicios recomendados, prioridades) es defendible frente al
 * dueño de la tienda — no para verificar que el cálculo dé bien (eso ya lo
 * cubren `fixtures-casos.ts` y el resto de la suite de regresión).
 *
 * NUNCA usar estos datos como valor esperado de una prueba de regresión:
 * son ficticios, diseñados a mano para producir un patrón de negocio
 * reconocible, no una captura real de ningún cliente. Ver
 * `src/lib/fixtures-escenarios-demo.test.ts` para la prueba que verifica
 * que ningún archivo de regresión los importa.
 *
 * Todas las comisiones de canal van CARGADAS COMO VERIFICADAS
 * (`canal_tienda_comision_pct`/`canal_ml_comision_pct`) a propósito: así el
 * margen de cada escenario se puede recalcular a mano con una sola fórmula
 * (`1 - costo/precio - comisión - envío`), sin depender de ningún benchmark
 * de plataforma ni de configuración externa.
 */
import { DATOS_INICIALES, type DatosDiagnostico } from "./diagnostico-form";
import type { ConfiguracionCalculo } from "./calculo-diagnostico";

/** Config propia de estos escenarios: nunca se comparte con `configuracionRegresionFase2`. */
export const configuracionEscenariosDemo: ConfiguracionCalculo = {
  reserva_default: 0.35,
  umbrales_cr_por_ticket: [{ hasta: null, verde: 0.018, rojo: 0.01 }],
  delta_medicion: { verde: 0.1, rojo: 0.2 },
  tope_fuga_individual: 0.25,
  tope_fuga_total: 0.4,
  mejora_agregado_pts: 2,
  mejora_checkout_pts: 10,
  mejora_compra_pts: 10,
};

const CONTENIDO_NEUTRO = {
  frecuencia_creativos: "Cada 2-3 semanas",
  formato_creativos: "Imagen y video corto",
  angulo_que_funciona: "Antes y después del producto en uso",
  dolor_cliente: "Duda por el tamaño y quiere ver reseñas antes de decidir",
  consultas_por_organico: true,
};

/**
 * 1 · MARKETPLACE FUERTE, TIENDA FLOJA.
 * Mercado Libre factura bien con margen sano (33%); la tienda propia tiene
 * tráfico (150.000 visitas) pero casi no convierte (150 pedidos, CR global
 * 0,1%). Ambos canales declarados, cobertura 100% (30% tienda + 70% ML).
 */
export const escenarioMarketplaceFuerteTiendaFloja: DatosDiagnostico = {
  ...DATOS_INICIALES,
  ...CONTENIDO_NEUTRO,
  nombre_tienda: "Demo · Marketplace fuerte, tienda floja",
  vertical: "indumentaria",
  plataforma: "tiendanube",
  plan_plataforma: "impulso",
  pasarela: "mercado_pago",
  vende_mercado_libre: true,
  facturacion_mensual: 10_000_000,
  ticket_promedio: 20_000,
  absorbe_costo_envio: false,
  producto_1_nombre: "Campera de invierno",
  producto_1_costo: 10_000,
  producto_1_precio: 20_000,
  producto_1_pct_facturacion: 100,
  canal_tienda_pct: 30,
  canal_tienda_comision_pct: 3,
  canal_ml_pct: 70,
  canal_ml_comision_pct: 17,
  visitas_mensuales: 150_000,
  agregados_carrito: 4_000,
  checkouts_iniciados: 600,
  inversion_meta: 150_000,
  inversion_google: 150_000,
  conjuntos_activos: 4,
  presupuesto_diario: 10_000,
  ml_product_ads: true,
  ml_inversion_product_ads: 200_000,
  ml_ventas_product_ads: 2_000_000,
  ml_tiene_clips: true,
};

/**
 * 2 · MARGEN ALTO, VOLUMEN BAJO.
 * Ticket alto (300.000), margen amplio (67%), pocas ventas (10/mes). El
 * piso mensual que necesita un solo conjunto para salir de aprendizaje
 * (~28M) supera varias veces la facturación total (3M).
 */
export const escenarioMargenAltoVolumenBajo: DatosDiagnostico = {
  ...DATOS_INICIALES,
  ...CONTENIDO_NEUTRO,
  nombre_tienda: "Demo · Margen alto, volumen bajo",
  vertical: "deco_hogar",
  plataforma: "tiendanube",
  plan_plataforma: "esencial",
  pasarela: "mercado_pago",
  facturacion_mensual: 3_000_000,
  ticket_promedio: 300_000,
  absorbe_costo_envio: false,
  producto_1_nombre: "Sillón de diseño",
  producto_1_costo: 90_000,
  producto_1_precio: 300_000,
  producto_1_pct_facturacion: 100,
  canal_tienda_pct: 100,
  canal_tienda_comision_pct: 3,
  visitas_mensuales: 3_000,
  agregados_carrito: 200,
  checkouts_iniciados: 50,
  inversion_meta: 400_000,
  inversion_google: 200_000,
  conjuntos_activos: 1,
  presupuesto_diario: 20_000,
};

/**
 * 3 · MARGEN FINO, VOLUMEN ALTO.
 * Ticket bajo (8.000), margen ajustado (~9% después de envío), muchas
 * ventas (5.000/mes). El piso para un conjunto (~145k) es fácil de cubrir
 * con la facturación (40M): puede escalar, pero el margen es tan fino que
 * cualquier costo no contemplado (envío, descuento) lo empuja a pérdida.
 */
export const escenarioMargenFinoVolumenAlto: DatosDiagnostico = {
  ...DATOS_INICIALES,
  ...CONTENIDO_NEUTRO,
  nombre_tienda: "Demo · Margen fino, volumen alto",
  vertical: "alimentos",
  plataforma: "tiendanube",
  plan_plataforma: "esencial",
  pasarela: "mercado_pago",
  facturacion_mensual: 40_000_000,
  ticket_promedio: 8_000,
  absorbe_costo_envio: true,
  costo_envio_promedio: 300,
  producto_1_nombre: "Combo de snacks saludables",
  producto_1_costo: 6_800,
  producto_1_precio: 8_000,
  producto_1_pct_facturacion: 100,
  canal_tienda_pct: 100,
  canal_tienda_comision_pct: 2,
  visitas_mensuales: 300_000,
  agregados_carrito: 15_000,
  checkouts_iniciados: 7_000,
  inversion_meta: 2_000_000,
  inversion_google: 1_000_000,
  conjuntos_activos: 3,
  presupuesto_diario: 100_000,
};

/**
 * 4 · ROAS BUENO, MARGEN NEGATIVO.
 * Las campañas muestran MER 15x (parece un resultado excelente), pero el
 * producto se vende POR DEBAJO del costo una vez descontada la comisión
 * (costo 10.200 sobre precio 10.000, comisión 5%): margen de contribución
 * -7%. El cliente que sólo mira el ROAS cree que le va bien; pierde plata
 * en cada venta.
 */
export const escenarioRoasBuenoMargenNegativo: DatosDiagnostico = {
  ...DATOS_INICIALES,
  ...CONTENIDO_NEUTRO,
  nombre_tienda: "Demo · ROAS bueno, margen negativo",
  vertical: "electronica",
  plataforma: "tiendanube",
  plan_plataforma: "esencial",
  pasarela: "mercado_pago",
  facturacion_mensual: 15_000_000,
  ticket_promedio: 10_000,
  absorbe_costo_envio: false,
  producto_1_nombre: "Auricular bluetooth",
  producto_1_costo: 10_200,
  producto_1_precio: 10_000,
  producto_1_pct_facturacion: 100,
  canal_tienda_pct: 100,
  canal_tienda_comision_pct: 5,
  visitas_mensuales: 100_000,
  agregados_carrito: 8_000,
  checkouts_iniciados: 2_500,
  inversion_meta: 700_000,
  inversion_google: 300_000,
  conjuntos_activos: 3,
  presupuesto_diario: 33_000,
};

/**
 * 5 · TODO SANO.
 * Margen bueno (57%), MER (25x) muy por encima del breakeven, funnel
 * razonable, contenido activo (4/4 respuestas positivas). Un negocio que
 * funciona: no se le carga estructura de cuenta (conjuntos/presupuesto)
 * para no mezclar un problema que el escenario no busca ilustrar.
 */
export const escenarioTodoSano: DatosDiagnostico = {
  ...DATOS_INICIALES,
  ...CONTENIDO_NEUTRO,
  nombre_tienda: "Demo · Todo sano",
  vertical: "cosmetica",
  plataforma: "tiendanube",
  plan_plataforma: "impulso",
  pasarela: "mercado_pago",
  facturacion_mensual: 25_000_000,
  ticket_promedio: 100_000,
  absorbe_costo_envio: false,
  producto_1_nombre: "Set de skincare premium",
  producto_1_costo: 40_000,
  producto_1_precio: 100_000,
  producto_1_pct_facturacion: 100,
  canal_tienda_pct: 100,
  canal_tienda_comision_pct: 3,
  visitas_mensuales: 15_000,
  agregados_carrito: 1_200,
  checkouts_iniciados: 500,
  inversion_meta: 600_000,
  inversion_google: 400_000,
  retencion_canal_email: true,
  retencion_canal_whatsapp: true,
  retencion_canal_retargeting: true,
  retencion_recuperacion_pct_actual: 25,
};

/**
 * 6 · SOLO ORGÁNICO.
 * Factura sin invertir un peso en pauta (`inversion_meta`/`inversion_google`
 * en 0 explícito, no ausente) y sin vender en Mercado Libre: sin ningún
 * historial publicitario. Margen sano (51%) sostenido por tráfico orgánico.
 */
export const escenarioSoloOrganico: DatosDiagnostico = {
  ...DATOS_INICIALES,
  ...CONTENIDO_NEUTRO,
  nombre_tienda: "Demo · Solo orgánico",
  vertical: "deportes",
  plataforma: "tiendanube",
  plan_plataforma: "esencial",
  pasarela: "mercado_pago",
  vende_mercado_libre: false,
  facturacion_mensual: 8_000_000,
  ticket_promedio: 15_000,
  absorbe_costo_envio: false,
  producto_1_nombre: "Botines de fútbol",
  producto_1_costo: 7_000,
  producto_1_precio: 15_000,
  producto_1_pct_facturacion: 100,
  canal_tienda_pct: 100,
  canal_tienda_comision_pct: 2.5,
  canal_ml_no_aplica: true,
  visitas_mensuales: 40_000,
  agregados_carrito: 3_500,
  checkouts_iniciados: 1_200,
  inversion_meta: 0,
  inversion_google: 0,
};

/** Los seis, en el orden en que se describieron en la instrucción. */
export const ESCENARIOS_DEMOSTRATIVOS = [
  { id: "1-marketplace-fuerte-tienda-floja", nombre: "Marketplace fuerte, tienda floja", datos: escenarioMarketplaceFuerteTiendaFloja },
  { id: "2-margen-alto-volumen-bajo", nombre: "Margen alto, volumen bajo", datos: escenarioMargenAltoVolumenBajo },
  { id: "3-margen-fino-volumen-alto", nombre: "Margen fino, volumen alto", datos: escenarioMargenFinoVolumenAlto },
  { id: "4-roas-bueno-margen-negativo", nombre: "ROAS bueno, margen negativo", datos: escenarioRoasBuenoMargenNegativo },
  { id: "5-todo-sano", nombre: "Todo sano", datos: escenarioTodoSano },
  { id: "6-solo-organico", nombre: "Solo orgánico", datos: escenarioSoloOrganico },
] as const;
