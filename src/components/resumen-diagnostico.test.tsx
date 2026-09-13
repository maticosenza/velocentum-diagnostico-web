/**
 * Resumen del detalle, en render estático (mismo criterio que
 * `panel-seleccion-comercial.test.tsx`). Muestra margen y breakeven, y las
 * métricas del o los canales que el cliente sí tiene: lo que no tiene, o no
 * usa para pautar, no aparece.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CanalDerivado, Derivados } from "@/lib/calculo-diagnostico";
import type { PerimetroVista } from "@/lib/vista-diagnostico";
import { ResumenMetricas, SeccionQueFalta } from "./resumen-diagnostico";

const TODO: PerimetroVista = {
  tiendaPropia: true,
  mercadoLibre: true,
  pautaTienda: true,
  pautaMeta: true,
  productAds: true,
  funnelWeb: true,
};

function canal(id: "tienda_propia" | "mercado_libre", cambios: Partial<CanalDerivado> = {}) {
  return {
    id,
    estado: "declarado",
    pct: 50,
    comision_efectiva: 0.1325,
    mer: 4.1,
    roas_pauta: 6.2,
    ...cambios,
  } as CanalDerivado;
}

const derivados = {
  margen_contribucion: 0.312,
  breakeven_roas: 3.21,
  cr_tienda: 0.0145,
  mer_tienda_propia: 5.5,
  canales: [canal("tienda_propia"), canal("mercado_libre")],
} as unknown as Derivados;

const render = (p: PerimetroVista, d: Derivados = derivados) =>
  renderToStaticMarkup(<ResumenMetricas derivados={d} perimetro={p} />);

describe("Resumen: métricas según el perímetro", () => {
  it("con los dos canales muestra margen, breakeven y las métricas de cada canal", () => {
    const html = render(TODO);
    for (const texto of [
      "Margen total (negocio completo)",
      "Breakeven ROAS",
      "Tienda propia",
      "Conversión de la tienda",
      "MER tienda propia (Meta + Google)",
      "Mercado Libre",
      "Comisión efectiva",
      "MER del canal",
      "ROAS de Product Ads",
    ])
      expect(html).toContain(texto);
  });

  it("sin Mercado Libre no aparece nada del canal", () => {
    const html = render({ ...TODO, mercadoLibre: false, productAds: false });
    expect(html).toContain("Conversión de la tienda");
    for (const texto of ["Mercado Libre", "Comisión efectiva", "ROAS de Product Ads"])
      expect(html).not.toContain(texto);
  });

  it("sin tienda propia no aparecen conversión ni MER tienda propia", () => {
    const html = render({ ...TODO, tiendaPropia: false, pautaTienda: false, funnelWeb: false });
    expect(html).toContain("Comisión efectiva");
    for (const texto of ["Tienda propia", "Conversión de la tienda", "MER tienda propia"])
      expect(html).not.toContain(texto);
  });

  it("sin pauta en Meta ni Google la tienda no muestra MER", () => {
    const html = render({ ...TODO, pautaTienda: false });
    expect(html).toContain("Conversión de la tienda");
    expect(html).not.toContain("MER tienda propia");
  });

  it("sin Product Ads Mercado Libre muestra la comisión pero no MER ni ROAS de Product Ads", () => {
    const html = render({ ...TODO, productAds: false });
    expect(html).toContain("Comisión efectiva");
    expect(html).not.toContain("MER del canal");
    expect(html).not.toContain("ROAS de Product Ads");
  });

  it("un canal en no aplica no aparece aunque el perímetro lo deje pasar", () => {
    const d = {
      ...derivados,
      canales: [canal("tienda_propia"), canal("mercado_libre", { estado: "no_aplica" })],
    } as unknown as Derivados;
    expect(render(TODO, d)).not.toContain("Mercado Libre");
  });

  it("Mercado Libre sin participación declarada lo dice en vez de mostrar filas vacías", () => {
    const d = {
      ...derivados,
      canales: [canal("mercado_libre", { estado: "ausente" })],
    } as unknown as Derivados;
    const html = render(TODO, d);
    expect(html).toContain("Sin datos");
    expect(html).toContain("sin métricas para mostrar");
    expect(html).not.toContain("Comisión efectiva");
  });

  it("sin ningún canal lo dice en vez de quedar en blanco", () => {
    const html = render({
      ...TODO,
      tiendaPropia: false,
      pautaTienda: false,
      funnelWeb: false,
      mercadoLibre: false,
      productAds: false,
    });
    expect(html).toContain("Breakeven ROAS");
    expect(html).toContain("No hay métricas de canal para mostrar");
  });

  it("un margen retenido se muestra como guión, igual que en Economía", () => {
    const d = { ...derivados, margen_contribucion: null } as unknown as Derivados;
    expect(render(TODO, d)).toContain("—");
  });
});

describe("Resumen: qué falta", () => {
  it("con todo cargado lo dice", () => {
    const html = renderToStaticMarkup(<SeccionQueFalta falta={{ datos: [], bloques: [] }} />);
    expect(html).toContain("no falta nada");
  });

  it("lista los datos por cargar y los bloques sin datos", () => {
    const html = renderToStaticMarkup(
      <SeccionQueFalta falta={{ datos: ["visitas mensuales"], bloques: ["Medición"] }} />,
    );
    expect(html).toContain("Visitas mensuales");
    expect(html).toContain("Medición");
    expect(html).not.toContain("no falta nada");
  });
});
