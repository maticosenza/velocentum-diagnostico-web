/** Definiciones compartidas del formulario de carga de diagnóstico. */

export const VERTICALES = [
  { value: "indumentaria", label: "Indumentaria" },
  { value: "cosmetica", label: "Cosmética" },
  { value: "deco_hogar", label: "Deco y hogar" },
  { value: "electronica", label: "Electrónica" },
  { value: "deportes", label: "Deportes" },
  { value: "alimentos", label: "Alimentos" },
  { value: "otro", label: "Otro" },
] as const;

export const PLATAFORMAS = [
  { value: "tiendanube", label: "Tiendanube" },
  { value: "shopify", label: "Shopify" },
  { value: "empretienda", label: "Empretienda" },
  { value: "woocommerce", label: "WooCommerce" },
  { value: "vtex", label: "VTEX" },
  { value: "desarrollo_propio", label: "Desarrollo propio" },
  { value: "otro", label: "Otro" },
] as const;

export const PLANES_POR_PLATAFORMA: Record<string, { value: string; label: string }[]> = {
  tiendanube: [
    { value: "inicial", label: "Inicial" },
    { value: "esencial", label: "Esencial" },
    { value: "impulso", label: "Impulso" },
  ],
  shopify: [
    { value: "basic", label: "Basic" },
    { value: "grow", label: "Grow" },
    { value: "advanced", label: "Advanced" },
    { value: "plus", label: "Plus" },
  ],
};

export const PASARELAS = [
  { value: "mercado_pago", label: "Mercado Pago" },
  { value: "pago_nube", label: "Pago Nube" },
  { value: "mobbex", label: "Mobbex" },
  { value: "talo", label: "Talo" },
  { value: "otra", label: "Otra" },
] as const;

export type DatosDiagnostico = {
  // Identificación
  nombre_tienda: string;
  vertical: string;
  plataforma: string;
  plan_plataforma: string;
  vende_mercado_libre: boolean;
  // Medición
  ventas_backoffice: number | null;
  facturacion_pixel: number | null;
  // Economía
  facturacion_mensual: number | null;
  ticket_promedio: number | null;
  costo_producto_pct: number | null;
  costo_envio_promedio: number | null;
  pasarela: string;
  inversion_meta: number | null;
  inversion_google: number | null;
  // Cuenta
  conjuntos_activos: number | null;
  presupuesto_diario: number | null;
  frecuencia_30d: number | null;
  // Web y creativos
  sesiones_mensuales: number | null;
  cr_tienda: number | null;
  creativos_nuevos_mes: number | null;
  techo_operativo: number | null;
  // Mercado Libre
  ml_pct_facturacion: number | null;
};

export type NotasDiagnostico = Record<string, string>;

export const DATOS_INICIALES: DatosDiagnostico = {
  nombre_tienda: "",
  vertical: "",
  plataforma: "",
  plan_plataforma: "",
  vende_mercado_libre: false,
  ventas_backoffice: null,
  facturacion_pixel: null,
  facturacion_mensual: null,
  ticket_promedio: null,
  costo_producto_pct: null,
  costo_envio_promedio: null,
  pasarela: "",
  inversion_meta: null,
  inversion_google: null,
  conjuntos_activos: null,
  presupuesto_diario: null,
  frecuencia_30d: null,
  sesiones_mensuales: null,
  cr_tienda: null,
  creativos_nuevos_mes: null,
  techo_operativo: null,
  ml_pct_facturacion: null,
};

export const BLOQUES = [
  { id: "identificacion", label: "Identificación" },
  { id: "medicion", label: "Medición" },
  { id: "economia", label: "Economía" },
  { id: "cuenta", label: "Cuenta" },
  { id: "web_creativos", label: "Web y creativos" },
  { id: "mercado_libre", label: "Mercado Libre" },
] as const;

export type BloqueId = (typeof BLOQUES)[number]["id"];

/** Campos que cuentan para el indicador de completitud de cada pestaña. */
export const CAMPOS_POR_BLOQUE: Record<BloqueId, (keyof DatosDiagnostico)[]> = {
  identificacion: ["nombre_tienda", "vertical", "plataforma", "plan_plataforma"],
  medicion: ["ventas_backoffice", "facturacion_pixel"],
  economia: [
    "facturacion_mensual",
    "ticket_promedio",
    "costo_producto_pct",
    "costo_envio_promedio",
    "pasarela",
    "inversion_meta",
    "inversion_google",
  ],
  cuenta: ["conjuntos_activos", "presupuesto_diario", "frecuencia_30d"],
  web_creativos: ["sesiones_mensuales", "cr_tienda", "creativos_nuevos_mes", "techo_operativo"],
  mercado_libre: ["ml_pct_facturacion"],
};

export function estaCompleto(valor: unknown) {
  if (valor === null || valor === undefined) return false;
  if (typeof valor === "string") return valor.trim() !== "";
  return true;
}

export function contarCompletos(datos: DatosDiagnostico, bloque: BloqueId) {
  const campos = CAMPOS_POR_BLOQUE[bloque];
  return {
    completos: campos.filter((c) => estaCompleto(datos[c])).length,
    total: campos.length,
  };
}

export const CLAVE_BORRADOR = "velocentum:borrador-diagnostico";
