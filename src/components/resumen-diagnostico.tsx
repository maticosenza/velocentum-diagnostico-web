import type { ReactNode } from "react";
import type { CanalDerivado, Derivados } from "@/lib/calculo-diagnostico";
import { NOMBRE_CANAL, type QueFalta } from "@/lib/pestanas-diagnostico";
import { formatPorcentaje } from "@/lib/format";
import { GUION, numero, pct, type PerimetroVista } from "@/lib/vista-diagnostico";

export function Fila({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-border px-7 py-4 last:border-b-0">
      <dt className="text-[14.5px] text-muted-foreground">{label}</dt>
      <dd className="text-[16px] font-medium tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

/** El canal tal como lo pinta la tarjeta de Detalle: sin "no aplica" ni fuera del perímetro. */
function canalVisible(
  derivados: Derivados,
  id: "tienda_propia" | "mercado_libre",
  visible: boolean,
): CanalDerivado | undefined {
  if (!visible) return undefined;
  return (derivados.canales ?? []).find((c) => c.id === id && c.estado !== "no_aplica");
}

function ParticipacionCanal({ canal }: { canal: CanalDerivado | undefined }) {
  if (!canal) return null;
  return (
    <span className="text-[14px] tabular-nums text-muted-foreground">
      {canal.estado === "declarado"
        ? pct(typeof canal.pct === "number" ? canal.pct / 100 : null, 1)
        : "Sin datos"}
    </span>
  );
}

function Tarjeta({
  titulo,
  extra,
  children,
}: {
  titulo: string;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex items-baseline justify-between gap-3 border-b border-border px-7 py-5">
        <h2 className="text-[17px] font-medium text-foreground">{titulo}</h2>
        {extra}
      </header>
      {children}
    </section>
  );
}

/**
 * Resumen: margen y breakeven, y las métricas de los canales que el cliente
 * sí tiene. Es el único lugar de estos números: Detalle no los repite (salvo
 * la comisión efectiva de ML, que la tarjeta del canal califica, y el breakeven
 * y la conversión en las píldoras, donde explican el estado).
 */
export function ResumenMetricas({
  derivados,
  perimetro,
}: {
  derivados: Derivados;
  perimetro: PerimetroVista;
}) {
  const tienda = canalVisible(derivados, "tienda_propia", perimetro.tiendaPropia);
  const ml = canalVisible(derivados, "mercado_libre", perimetro.mercadoLibre);
  // MER y ROAS de Product Ads salen de los derivados del negocio, no del canal:
  // es la misma cuenta, pero existen aunque el canal no tenga participación
  // declarada, y Economía ya no los muestra.
  const filasProductAds =
    perimetro.productAds &&
    (ml?.estado === "declarado" ||
      typeof derivados.mer_marketplace === "number" ||
      typeof derivados.roas_product_ads === "number");

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Tarjeta titulo="Economía">
        <dl>
          <Fila
            label="Margen total (negocio completo)"
            value={pct(derivados.margen_contribucion)}
          />
          <Fila label="Breakeven ROAS" value={numero(derivados.breakeven_roas)} />
        </dl>
      </Tarjeta>

      {perimetro.tiendaPropia && (
        <Tarjeta
          titulo={NOMBRE_CANAL["tienda_propia"]!}
          extra={<ParticipacionCanal canal={tienda} />}
        >
          <dl>
            <Fila
              label="Conversión de la tienda"
              value={
                typeof derivados.cr_tienda === "number"
                  ? formatPorcentaje(derivados.cr_tienda * 100, 2)
                  : GUION
              }
            />
            {perimetro.pautaTienda && (
              <Fila
                label="MER tienda propia (Meta + Google)"
                value={numero(derivados.mer_tienda_propia)}
              />
            )}
          </dl>
        </Tarjeta>
      )}

      {ml && (
        <Tarjeta titulo={NOMBRE_CANAL["mercado_libre"]!} extra={<ParticipacionCanal canal={ml} />}>
          {ml.estado === "declarado" || filasProductAds ? (
            <dl>
              {ml.estado === "declarado" && (
                <Fila label="Comisión efectiva" value={pct(ml.comision_efectiva, 2)} />
              )}
              {filasProductAds && (
                <>
                  <Fila label="MER del canal" value={numero(derivados.mer_marketplace)} />
                  <Fila
                    label="ROAS de Product Ads"
                    value={
                      typeof derivados.roas_product_ads === "number"
                        ? numero(derivados.roas_product_ads)
                        : "Sin datos"
                    }
                  />
                </>
              )}
            </dl>
          ) : (
            <p className="px-7 py-5 text-[14px] text-muted-foreground">
              El canal no tiene participación declarada en el mix: sin métricas para mostrar.
            </p>
          )}
        </Tarjeta>
      )}

      {!perimetro.tiendaPropia && !ml && (
        <p className="rounded-lg border border-border bg-card px-7 py-5 text-[14px] leading-6 text-muted-foreground lg:col-span-2">
          No hay métricas de canal para mostrar: el cliente no vende por tienda propia ni tiene
          Mercado Libre cargado en este diagnóstico.
        </p>
      )}
    </div>
  );
}

const conMayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Resumen: lo que falta para completar el diagnóstico. */
export function SeccionQueFalta({ falta }: { falta: QueFalta }) {
  const completo = falta.datos.length === 0 && falta.bloques.length === 0;
  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="border-b border-border px-7 py-5">
        <h2 className="text-[17px] font-medium text-foreground">
          Qué falta para completar el diagnóstico
        </h2>
      </header>
      {completo ? (
        <p className="px-7 py-6 text-[14px] text-muted-foreground">
          Con los datos cargados no falta nada: todas las fugas se pudieron calcular y todos los
          bloques que aplican tienen datos.
        </p>
      ) : (
        <div className="grid gap-6 px-7 py-6 md:grid-cols-2">
          {falta.datos.length > 0 && (
            <div>
              <h3 className="font-mono text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Datos por cargar
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] leading-6 text-foreground">
                {falta.datos.map((d) => (
                  <li key={d}>{conMayuscula(d)}</li>
                ))}
              </ul>
            </div>
          )}
          {falta.bloques.length > 0 && (
            <div>
              <h3 className="font-mono text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Bloques del semáforo sin datos
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] leading-6 text-foreground">
                {falta.bloques.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
