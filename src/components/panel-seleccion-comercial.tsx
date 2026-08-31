/**
 * BV4 · F2a etapa 4 — panel de selección comercial v2.
 *
 * Las diez líneas facturables visibles SIEMPRE: las sugeridas por el
 * diagnóstico llegan marcadas y el resto desmarcado. Visible no es lo mismo
 * que seleccionada, y ninguna se esconde por no estar sugerida.
 *
 * Reglas que este componente hace cumplir en pantalla:
 *
 *  - **Cero hexadecimales propios.** Todo color sale de los tokens del tema
 *    activo (`bg-card`, `text-foreground`, `border-border`, `text-destructive`,
 *    …), cualquiera sea ese tema. El panel nace token-based sin forzar la
 *    activación de crystal.
 *  - **Los totales no se editan.** Se muestran calculados, en elementos de
 *    texto, nunca en un input. El único importe editable es el precio que
 *    carga el vendedor.
 *  - **Dos grupos de totales, jamás uno combinado** (Q10): "Inversión
 *    mensual" e "Inversión inicial / pago único", cada uno con su subtotal
 *    neto, su impuesto si corresponde y su total.
 *  - **Una línea seleccionada sin precio no vale cero**: se avisa aparte y
 *    el subtotal se declara parcial.
 *  - **Elegir TRACCIÓN o ESCALA no preselecciona Diseño web** (Q8). El nivel
 *    sólo mueve cantidades precargadas y el alcance de los agregados.
 *  - **La configuración fiscal se confirma a mano** (Q9) y sin eso la
 *    propuesta no se exporta; el aviso lo dice en el panel, y el candado
 *    real es el único que ya existe, en la exportación.
 */
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoneda } from "@/lib/format";
import { esCuantificable, lineaV2, type LineaId } from "@/lib/catalogo-v2";
import type { LineaSugeridaV2 } from "@/lib/catalogo-v2";
import { NOMBRES_NIVELES_DEFECTO, type IdNivel } from "@/lib/paquetes";
import { cambiarNivelV2, ETIQUETA_UNIDAD_V2, seleccionInicialV2 } from "@/lib/precargas-v2";
import {
  AGREGADOS_V2,
  agregadoDisponibleEn,
  alcanceDeAgregado,
  calcularTotalesV2,
  FISCAL_INICIAL,
  totalDeLinea,
  type ConfiguracionFiscalV2,
  type GrupoTotalesV2,
  type LineaSeleccionadaV2,
  type MonedaV2,
  type RutaDisenoWebV2,
  type SeleccionComercialV2,
  type SobreComercialV2,
} from "@/lib/seleccion-comercial-v2";

const NIVELES: readonly IdNivel[] = ["impulso", "traccion", "escala"];

const NOMBRE_NIVEL: Record<IdNivel, string> = {
  impulso: NOMBRES_NIVELES_DEFECTO[0],
  traccion: NOMBRES_NIVELES_DEFECTO[1],
  escala: NOMBRES_NIVELES_DEFECTO[2],
};

const ETIQUETA_RUTA: Record<RutaDisenoWebV2, string> = {
  b2c: "B2C",
  b2b: "B2B",
  ambas: "B2C y B2B",
};

function numeroDeInput(valor: string): number | null {
  if (valor.trim() === "") return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

export function PanelSeleccionComercial({
  sugeridas,
  sobreGuardado,
  guardando = false,
  onConfirmar,
}: {
  sugeridas: readonly LineaSugeridaV2[];
  sobreGuardado: SobreComercialV2 | null;
  guardando?: boolean;
  onConfirmar: (sobre: {
    moneda: MonedaV2;
    fiscal: ConfiguracionFiscalV2;
    seleccion: SeleccionComercialV2;
  }) => void;
}) {
  const [seleccion, setSeleccion] = useState<SeleccionComercialV2>(
    () => sobreGuardado?.seleccion ?? seleccionInicialV2({ nivel: "impulso", sugeridas }),
  );
  const [moneda, setMoneda] = useState<MonedaV2>(sobreGuardado?.moneda ?? "ARS");
  const [fiscal, setFiscal] = useState<ConfiguracionFiscalV2>(
    sobreGuardado?.fiscal ?? FISCAL_INICIAL,
  );

  const totales = useMemo(() => calcularTotalesV2(seleccion, fiscal), [seleccion, fiscal]);
  const justificacion = useMemo(
    () => new Map(sugeridas.map((s) => [s.lineaId, s.hallazgoIds])),
    [sugeridas],
  );

  function actualizarLinea(lineaId: LineaId, cambios: Partial<LineaSeleccionadaV2>) {
    setSeleccion((prev) => ({
      ...prev,
      lineas: prev.lineas.map((l) => (l.lineaId === lineaId ? { ...l, ...cambios } : l)),
    }));
  }

  function actualizarCantidad(lineaId: LineaId, cantidad: number | null) {
    setSeleccion((prev) => ({
      ...prev,
      lineas: prev.lineas.map((l) =>
        l.lineaId === lineaId && l.precio.modo === "unitario"
          ? { ...l, precio: { ...l.precio, cantidad } }
          : l,
      ),
    }));
  }

  function actualizarPrecio(lineaId: LineaId, valor: number | null) {
    setSeleccion((prev) => ({
      ...prev,
      lineas: prev.lineas.map((l) => {
        if (l.lineaId !== lineaId) return l;
        return l.precio.modo === "unitario"
          ? { ...l, precio: { ...l.precio, precioUnitario: valor } }
          : { ...l, precio: { modo: "total", precioLinea: valor } };
      }),
    }));
  }

  function alternarAgregado(agregadoId: (typeof AGREGADOS_V2)[number]["id"], incluido: boolean) {
    setSeleccion((prev) => {
      const otros = prev.agregados.filter((a) => a.agregadoId !== agregadoId);
      return { ...prev, agregados: [...otros, { agregadoId, incluido }] };
    });
  }

  const seleccionadas = seleccion.lineas.filter((l) => l.seleccionada).length;
  const puedeConfirmar = seleccionadas > 0 && !guardando;

  return (
    <section className="space-y-6">
      {/* Nivel y moneda ------------------------------------------------ */}
      <div className="flex flex-wrap items-end gap-6 rounded-lg border border-border bg-card p-5">
        <div className="space-y-1.5">
          <Label htmlFor="nivel-comercial" className="text-[12px] text-muted-foreground">
            Nivel
          </Label>
          <Select
            value={seleccion.nivel}
            onValueChange={(v) => setSeleccion((prev) => cambiarNivelV2(prev, v as IdNivel))}
          >
            <SelectTrigger id="nivel-comercial" className="h-9 w-44 text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NIVELES.map((nivel) => (
                <SelectItem key={nivel} value={nivel}>
                  {NOMBRE_NIVEL[nivel]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="moneda-propuesta" className="text-[12px] text-muted-foreground">
            Moneda
          </Label>
          <Select value={moneda} onValueChange={(v) => setMoneda(v as MonedaV2)}>
            <SelectTrigger id="moneda-propuesta" className="h-9 w-32 text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ARS">ARS</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="flex-1 text-[12px] leading-5 text-muted-foreground">
          El nivel ajusta las cantidades sugeridas y el alcance de los agregados. No preselecciona
          ninguna línea: lo que llega marcado viene de los hallazgos del diagnóstico.
        </p>
      </div>

      {/* Configuración fiscal ------------------------------------------ */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-[15px] font-medium text-foreground">Configuración fiscal</h3>
        <p className="mt-1 text-[12px] text-muted-foreground">
          No depende de la moneda: se define acá y se confirma a mano. Sin confirmar, la propuesta
          no se exporta.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="fiscal-aplica"
              checked={fiscal.aplicaImpuesto}
              onCheckedChange={(v) => setFiscal((f) => ({ ...f, aplicaImpuesto: v === true }))}
            />
            <Label htmlFor="fiscal-aplica" className="text-[13px] text-foreground">
              Aplica impuesto
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="fiscal-porcentaje" className="text-[13px] text-muted-foreground">
              Porcentaje
            </Label>
            <Input
              id="fiscal-porcentaje"
              type="number"
              min={0}
              max={100}
              step="0.01"
              className="h-9 w-24 text-[13px]"
              value={fiscal.porcentaje}
              disabled={!fiscal.aplicaImpuesto}
              onChange={(e) =>
                setFiscal((f) => ({ ...f, porcentaje: numeroDeInput(e.target.value) ?? 0 }))
              }
            />
            <span className="text-[13px] text-muted-foreground">%</span>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="fiscal-confirmada"
              checked={fiscal.confirmado}
              onCheckedChange={(v) => setFiscal((f) => ({ ...f, confirmado: v === true }))}
            />
            <Label htmlFor="fiscal-confirmada" className="text-[13px] text-foreground">
              Configuración fiscal confirmada
            </Label>
          </div>
        </div>

        {!fiscal.confirmado && (
          <p className="mt-3 text-[12px] text-destructive">
            Sin confirmar la configuración fiscal, la exportación de la propuesta queda bloqueada.
          </p>
        )}
      </div>

      {/* Las diez líneas ----------------------------------------------- */}
      <div className="rounded-lg border border-border bg-card">
        <header className="border-b border-border px-5 py-4">
          <h3 className="text-[15px] font-medium text-foreground">Líneas facturables</h3>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Las diez, siempre visibles. Las cantidades son sugerencia editable; los precios se
            cargan a mano y el total de cada línea se calcula solo.
          </p>
        </header>

        <ul className="divide-y divide-border">
          {seleccion.lineas.map((linea) => {
            const delCatalogo = lineaV2(linea.lineaId);
            const hallazgoIds = justificacion.get(linea.lineaId) ?? [];
            const total = totalDeLinea(linea);
            const cuantificable = esCuantificable(delCatalogo);
            return (
              <li key={linea.lineaId} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                  <div className="flex min-w-56 items-center gap-3">
                    <Checkbox
                      id={`linea-${linea.lineaId}`}
                      checked={linea.seleccionada}
                      onCheckedChange={(v) =>
                        actualizarLinea(linea.lineaId, { seleccionada: v === true })
                      }
                    />
                    <div>
                      <Label
                        htmlFor={`linea-${linea.lineaId}`}
                        className="text-[14px] font-medium text-foreground"
                      >
                        {delCatalogo.nombre}
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        {ETIQUETA_UNIDAD_V2[delCatalogo.unidad]}
                        {hallazgoIds.length > 0 && ` · sugerida por: ${hallazgoIds.join(", ")}`}
                      </p>
                    </div>
                  </div>

                  {cuantificable && linea.precio.modo === "unitario" && (
                    <div className="space-y-1">
                      <Label
                        htmlFor={`cantidad-${linea.lineaId}`}
                        className="block text-[11px] text-muted-foreground"
                      >
                        Cantidad
                      </Label>
                      <Input
                        id={`cantidad-${linea.lineaId}`}
                        type="number"
                        min={0}
                        className="h-9 w-24 text-[13px]"
                        placeholder="—"
                        value={linea.precio.cantidad ?? ""}
                        onChange={(e) =>
                          actualizarCantidad(linea.lineaId, numeroDeInput(e.target.value))
                        }
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label
                      htmlFor={`precio-${linea.lineaId}`}
                      className="block text-[11px] text-muted-foreground"
                    >
                      {cuantificable ? "Precio unitario" : "Precio de la línea"}
                    </Label>
                    <Input
                      id={`precio-${linea.lineaId}`}
                      type="number"
                      min={0}
                      className="h-9 w-36 text-[13px]"
                      placeholder="Sin cargar"
                      value={
                        linea.precio.modo === "unitario"
                          ? (linea.precio.precioUnitario ?? "")
                          : (linea.precio.precioLinea ?? "")
                      }
                      onChange={(e) =>
                        actualizarPrecio(linea.lineaId, numeroDeInput(e.target.value))
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor={`recurrencia-${linea.lineaId}`}
                      className="block text-[11px] text-muted-foreground"
                    >
                      Recurrencia
                    </Label>
                    <Select
                      value={linea.recurrencia}
                      onValueChange={(v) =>
                        actualizarLinea(linea.lineaId, {
                          recurrencia: v === "unica" ? "unica" : "mensual",
                        })
                      }
                    >
                      <SelectTrigger
                        id={`recurrencia-${linea.lineaId}`}
                        className="h-9 w-32 text-[13px]"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mensual">Mensual</SelectItem>
                        <SelectItem value="unica">Pago único</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {delCatalogo.admiteRuta && (
                    <div className="space-y-1">
                      <Label
                        htmlFor={`ruta-${linea.lineaId}`}
                        className="block text-[11px] text-muted-foreground"
                      >
                        Ruta
                      </Label>
                      <Select
                        value={linea.ruta ?? ""}
                        onValueChange={(v) =>
                          actualizarLinea(linea.lineaId, { ruta: v as RutaDisenoWebV2 })
                        }
                      >
                        <SelectTrigger
                          id={`ruta-${linea.lineaId}`}
                          className="h-9 w-36 text-[13px]"
                        >
                          <SelectValue placeholder="Sin definir" />
                        </SelectTrigger>
                        <SelectContent>
                          {(["b2c", "b2b", "ambas"] as const).map((ruta) => (
                            <SelectItem key={ruta} value={ruta}>
                              {ETIQUETA_RUTA[ruta]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="ml-auto space-y-1 text-right">
                    <span className="block text-[11px] text-muted-foreground">Total de línea</span>
                    <span className="block text-[14px] font-medium tabular-nums text-foreground">
                      {total === null ? "—" : formatMoneda(total, moneda)}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Agregados ------------------------------------------------------ */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-[15px] font-medium text-foreground">Agregados</h3>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Alcance incluido, no líneas facturables: no llevan precio y no entran en los subtotales.
          El alcance sigue al nivel elegido.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {AGREGADOS_V2.map((agregado) => {
            const disponible = agregadoDisponibleEn(agregado.id, seleccion.nivel);
            const alcance = alcanceDeAgregado(agregado.id, seleccion.nivel);
            const marcado =
              seleccion.agregados.find((a) => a.agregadoId === agregado.id)?.incluido === true;
            return (
              <div key={agregado.id} className="flex items-start gap-3">
                <Checkbox
                  id={`agregado-${agregado.id}`}
                  className="mt-0.5"
                  checked={marcado && disponible}
                  disabled={!disponible}
                  onCheckedChange={(v) => alternarAgregado(agregado.id, v === true)}
                />
                <div>
                  <Label
                    htmlFor={`agregado-${agregado.id}`}
                    className="text-[13px] text-foreground"
                  >
                    {agregado.nombre}
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    {!disponible
                      ? `Sólo en ${NOMBRE_NIVEL.escala}`
                      : (alcance ?? "Incluido / no incluido")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Los dos grupos de totales -------------------------------------- */}
      <div className="grid gap-4 md:grid-cols-2">
        <TarjetaTotales
          titulo="Inversión mensual"
          grupo={totales.mensual}
          moneda={moneda}
          fiscal={fiscal}
        />
        <TarjetaTotales
          titulo="Inversión inicial / pago único"
          grupo={totales.unica}
          moneda={moneda}
          fiscal={fiscal}
        />
      </div>

      {totales.lineasSinPrecio.length > 0 && (
        <p className="text-[12px] text-destructive" role="status">
          Subtotales parciales: {totales.lineasSinPrecio.length} línea
          {totales.lineasSinPrecio.length === 1 ? "" : "s"} seleccionada
          {totales.lineasSinPrecio.length === 1 ? "" : "s"} sin precio cargado (
          {totales.lineasSinPrecio.map((id) => lineaV2(id).nombre).join(", ")}). No se cuentan como
          cero.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="button"
          size="lg"
          className="h-11"
          disabled={!puedeConfirmar}
          onClick={() => onConfirmar({ moneda, fiscal, seleccion })}
        >
          {guardando ? "Guardando…" : "Confirmar selección comercial"}
        </Button>
        {seleccionadas === 0 && (
          <span className="text-[12px] text-muted-foreground">
            Marcá al menos una línea para poder confirmar.
          </span>
        )}
      </div>
    </section>
  );
}

/**
 * Un grupo de totales. Los tres valores son texto, nunca un input: son
 * calculados y no editables (Q6). Nunca se muestra una suma de los dos
 * grupos, porque no existe (Q10).
 */
function TarjetaTotales({
  titulo,
  grupo,
  moneda,
  fiscal,
}: {
  titulo: string;
  grupo: GrupoTotalesV2;
  moneda: MonedaV2;
  fiscal: ConfiguracionFiscalV2;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-[13px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {titulo}
      </h3>
      <dl className="mt-3 space-y-2 text-[13px]">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Subtotal neto</dt>
          <dd className="tabular-nums text-foreground">
            {formatMoneda(grupo.subtotalNeto, moneda)}
          </dd>
        </div>
        {grupo.impuesto !== null && (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">Impuesto ({fiscal.porcentaje} %)</dt>
            <dd className="tabular-nums text-foreground">{formatMoneda(grupo.impuesto, moneda)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-4 border-t border-border pt-2">
          <dt className="font-medium text-foreground">Total</dt>
          <dd className="text-[16px] font-medium tabular-nums text-foreground">
            {formatMoneda(grupo.total, moneda)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
