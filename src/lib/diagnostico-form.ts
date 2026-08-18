/** Definiciones compartidas del formulario de carga de diagnóstico. */

export type Modo = "A" | "B";

export const MODOS = [
  {
    value: "A" as const,
    titulo: "Con pantalla compartida",
    detalle: "Tengo acceso a su panel de Meta Ads y a su tienda. Puedo verificar los números.",
  },
  {
    value: "B" as const,
    titulo: "Solo conversado",
    detalle: "Sin acceso al panel. Los datos salen de lo que cuenta el prospecto.",
  },
];

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

export const CANTIDAD_CAMPANAS = [
  { value: "pocas", label: "Pocas" },
  { value: "varias", label: "Varias" },
  { value: "muchas", label: "Muchas" },
] as const;

export type DatosDiagnostico = {
  // Identificación (compartido)
  nombre_tienda: string;
  vertical: string;
  plataforma: string;
  plan_plataforma: string;
  vende_mercado_libre: boolean;
  // Medición (compartido)
  tiene_pixel: boolean | null;
  // Medición · modo A (observado en pantalla)
  facturacion_pixel: number | null;
  capi_estado: string;
  // Medición · modo B (declarado)
  tiene_analytics: boolean | null;
  numeros_meta_coinciden: boolean | null;

  // Economía (compartido)
  facturacion_mensual: number | null;
  ticket_promedio: number | null;
  costo_envio_promedio: number | null;
  pasarela: string;
  inversion_meta: number | null;
  inversion_google: number | null;
  // Productos (compartido; en modo B sólo el principal lleva costo y precio)
  producto_1_nombre: string;
  producto_1_costo: number | null;
  producto_1_precio: number | null;
  producto_1_pct_facturacion: number | null;
  producto_2_nombre: string;
  producto_2_costo: number | null;
  producto_2_precio: number | null;
  producto_2_pct_facturacion: number | null;
  producto_3_nombre: string;
  producto_3_costo: number | null;
  producto_3_precio: number | null;
  producto_3_pct_facturacion: number | null;
  reparto_pauta: string;
  // Cuenta · modo A
  conjuntos_activos: number | null;
  presupuesto_diario: number | null;
  // Cuenta · modo B
  gasto_diario: number | null;
  cantidad_campanas: string;
  // Cuenta · datos leídos del CSV de Meta (modo A)
  csv_gasto_total: number | null;
  csv_frecuencia_promedio: number | null;
  csv_ctr_global: number | null;
  csv_conjuntos_bajo_gasto: number | null;
  csv_dias_periodo: number | null;

  // Web
  visitas_mensuales: number | null;
  carritos_abandonados: number | null;
  recuperacion_carrito: boolean | null;
  retargeting_abandono: boolean | null;
  // Contenido (compartido, cualitativo)
  frecuencia_creativos: string;
  formato_creativos: string;
  angulo_que_funciona: string;
  dolor_cliente: string;
  consultas_por_organico: boolean | null;
  // Mercado Libre (compartido, condicional)
  ml_pct_facturacion: number | null;
  ml_productos_publicados: number | null;
  ml_product_ads: boolean | null;
  ml_inversion_product_ads: number | null;
};

export type NotasDiagnostico = Record<string, string>;

export const DATOS_INICIALES: DatosDiagnostico = {
  nombre_tienda: "",
  vertical: "",
  plataforma: "",
  plan_plataforma: "",
  vende_mercado_libre: false,
  tiene_pixel: null,
  facturacion_pixel: null,
  capi_estado: "",
  tiene_analytics: null,
  numeros_meta_coinciden: null,

  facturacion_mensual: null,
  ticket_promedio: null,
  costo_envio_promedio: null,
  pasarela: "",
  inversion_meta: null,
  inversion_google: null,
  producto_1_nombre: "",
  producto_1_costo: null,
  producto_1_precio: null,
  producto_1_pct_facturacion: null,
  producto_2_nombre: "",
  producto_2_costo: null,
  producto_2_precio: null,
  producto_2_pct_facturacion: null,
  producto_3_nombre: "",
  producto_3_costo: null,
  producto_3_precio: null,
  producto_3_pct_facturacion: null,
  reparto_pauta: "",
  conjuntos_activos: null,
  presupuesto_diario: null,
  gasto_diario: null,
  cantidad_campanas: "",
  csv_gasto_total: null,
  csv_frecuencia_promedio: null,
  csv_ctr_global: null,
  csv_conjuntos_bajo_gasto: null,
  csv_dias_periodo: null,

  visitas_mensuales: null,
  carritos_abandonados: null,
  recuperacion_carrito: null,
  retargeting_abandono: null,
  frecuencia_creativos: "",
  formato_creativos: "",
  angulo_que_funciona: "",
  dolor_cliente: "",
  consultas_por_organico: null,
  ml_pct_facturacion: null,
  ml_productos_publicados: null,
  ml_product_ads: null,
  ml_inversion_product_ads: null,
};

export const BLOQUES = [
  { id: "identificacion", label: "Identificación" },
  { id: "medicion", label: "Medición" },
  { id: "economia", label: "Economía" },
  { id: "productos", label: "Productos" },
  { id: "cuenta", label: "Cuenta" },
  { id: "web", label: "Web" },
  { id: "contenido", label: "Contenido" },
  { id: "mercado_libre", label: "Mercado Libre" },
] as const;

export type BloqueId = (typeof BLOQUES)[number]["id"];

const CAMPOS_COMUNES: Record<BloqueId, (keyof DatosDiagnostico)[]> = {
  identificacion: ["nombre_tienda", "vertical", "plataforma", "plan_plataforma"],
  medicion: [],
  economia: [
    "facturacion_mensual",
    "ticket_promedio",
    "costo_envio_promedio",
    "pasarela",
    "inversion_meta",
    "inversion_google",
  ],
  productos: [],
  cuenta: [],
  web: [],
  contenido: [
    "frecuencia_creativos",
    "formato_creativos",
    "angulo_que_funciona",
    "dolor_cliente",
    "consultas_por_organico",
  ],
  mercado_libre: [
    "ml_pct_facturacion",
    "ml_productos_publicados",
    "ml_product_ads",
    "ml_inversion_product_ads",
  ],
};

/** Campos que cuentan para el indicador de completitud de cada pestaña, según el modo. */
export function camposPorBloque(modo: Modo, bloque: BloqueId): (keyof DatosDiagnostico)[] {
  const base = CAMPOS_COMUNES[bloque];
  if (bloque === "medicion") return modo === "A" ? ["facturacion_pixel", "capi_estado"] : [];
  if (bloque === "productos") {
    const nombres: (keyof DatosDiagnostico)[] = [
      "producto_1_nombre",
      "producto_2_nombre",
      "producto_3_nombre",
      "producto_1_pct_facturacion",
      "producto_2_pct_facturacion",
      "producto_3_pct_facturacion",
    ];
    return modo === "A"
      ? [
          ...nombres,
          "producto_1_costo",
          "producto_1_precio",
          "producto_2_costo",
          "producto_2_precio",
          "producto_3_costo",
          "producto_3_precio",
        ]
      : [...nombres, "producto_1_costo", "producto_1_precio"];
  }
  if (bloque === "cuenta") {
    return modo === "A" ? ["conjuntos_activos", "presupuesto_diario"] : ["gasto_diario", "cantidad_campanas"];
  }
  if (bloque === "web")
    return modo === "A" ? ["visitas_mensuales", "carritos_abandonados"] : ["carritos_abandonados"];
  return base;
}

export function estaCompleto(valor: unknown) {
  if (valor === null || valor === undefined) return false;
  if (typeof valor === "string") return valor.trim() !== "";
  return true;
}

export function contarCompletos(datos: DatosDiagnostico, modo: Modo, bloque: BloqueId) {
  const campos = camposPorBloque(modo, bloque);
  return {
    completos: campos.filter((c) => estaCompleto(datos[c])).length,
    total: campos.length,
  };
}

/** Campos que NO se conservan al cambiar de modo (son exclusivos del otro modo). */
export const CAMPOS_EXCLUSIVOS: Record<Modo, (keyof DatosDiagnostico)[]> = {
  A: [
    "facturacion_pixel",
    "capi_estado",
    "conjuntos_activos",
    "presupuesto_diario",
    "visitas_mensuales",
    "csv_gasto_total",
    "csv_frecuencia_promedio",
    "csv_ctr_global",
    "csv_conjuntos_bajo_gasto",
    "csv_dias_periodo",
  ],
  B: ["tiene_analytics", "numeros_meta_coinciden", "gasto_diario", "cantidad_campanas"],

};

export const CLAVE_BORRADOR = "velocentum:borrador-diagnostico";

export const ESTADOS_CAPI = [
  { value: "activa", label: "Activa" },
  { value: "ausente", label: "Ausente" },
  { value: "no_se_sabe", label: "No se sabe" },
] as const;

/** Dónde sale cada dato: ayuda para el vendedor arriba de los campos. */
export const ORIGEN_DATOS: Record<BloqueId, string> = {
  identificacion: "Conversado. El plan se ve en el panel del cliente.",
  medicion:
    "Events Manager, pestaña Resumen. Ojo que Meta solo guarda unos dos meses de historial.",
  economia: "Tiendanube: Estadísticas, Visión general.",
  productos: "Tiendanube: Estadísticas, Productos. Ahí están las unidades vendidas de cada uno.",
  cuenta:
    "Meta Ads Manager: filtrá el mes, activá 'Con entrega', desglosá por conjunto de anuncios y exportá.",
  web: "Las visitas salen de Tiendanube, Estadísticas, Visión general. Los carritos abandonados, de Tiendanube, sección Carritos abandonados.",
  contenido: "Todo conversado.",
  mercado_libre: "Conversado, más el panel de Product Ads si lo tiene.",
};
