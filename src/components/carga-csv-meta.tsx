import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatARS } from "@/lib/format";
import { ErrorCsvMeta, leerCsvMeta, type ResumenCsvMeta } from "@/lib/meta-csv";

export function CargaCsvMeta({
  hayDatosCargados,
  onAplicar,
}: {
  hayDatosCargados: boolean;
  onAplicar: (r: ResumenCsvMeta) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [resumen, setResumen] = useState<ResumenCsvMeta | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onArchivo(archivo: File | null) {
    setError(null);
    setResumen(null);
    if (!archivo) return;
    try {
      const texto = await archivo.text();
      setResumen(leerCsvMeta(texto));
      setNombreArchivo(archivo.name);
    } catch (e) {
      setNombreArchivo(archivo.name);
      setError(
        e instanceof ErrorCsvMeta
          ? e.message
          : "No pudimos leer el archivo. Revisá que sea el CSV exportado de Meta Ads Manager.",
      );
    }
  }

  return (
    <div className="rounded-md border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[13px] text-foreground">Importar CSV de Meta Ads Manager</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Opcional. Precarga los campos y después los podés corregir a mano.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {nombreArchivo && (
            <span className="max-w-[220px] truncate text-[12px] text-muted-foreground">
              {nombreArchivo}
            </span>
          )}
          <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
            Elegir archivo
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => void onArchivo(e.target.files?.[0] ?? null)}
        />
      </div>

      {error && (
        <p className="mt-3 text-[13px] text-destructive" role="alert">
          {error} Podés seguir cargando los datos a mano.
        </p>
      )}

      {resumen && (
        <div className="mt-4 space-y-3 border-t border-border pt-3">
          <p className="text-[12px] uppercase tracking-wide text-muted-foreground">
            Esto leímos del archivo
          </p>
          <dl className="grid gap-2 text-[13px] sm:grid-cols-2">
            <Dato
              etiqueta={resumen.conto_campanas ? "Campañas con gasto" : "Conjuntos con gasto"}
              valor={String(resumen.conjuntos_activos)}
            />
            <Dato etiqueta="Gasto total" valor={formatARS(resumen.gasto_total)} />
            <Dato
              etiqueta={`Presupuesto diario (${resumen.dias} días)`}
              valor={formatARS(resumen.presupuesto_diario)}
            />
            <Dato
              etiqueta="Frecuencia promedio"
              valor={resumen.frecuencia_promedio === null ? "—" : String(resumen.frecuencia_promedio)}
            />
            <Dato
              etiqueta="CTR global"
              valor={resumen.ctr_global === null ? "—" : `${resumen.ctr_global}%`}
            />
            <Dato
              etiqueta="Conjuntos con menos del 2% del gasto"
              valor={String(resumen.conjuntos_bajo_gasto)}
            />
          </dl>

          {resumen.advertencias.map((a) => (
            <p key={a} className="text-[12px] text-[var(--estado-amarillo)]">
              {a}
            </p>
          ))}

          {hayDatosCargados && (
            <p className="text-[12px] text-[var(--estado-amarillo)]">
              Ya hay datos cargados en este bloque: si confirmás, se reemplazan.
            </p>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onAplicar(resumen);
                setResumen(null);
              }}
            >
              {hayDatosCargados ? "Reemplazar y aplicar" : "Aplicar al formulario"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setResumen(null)}>
              Descartar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded border border-border px-2.5 py-1.5">
      <dt className="text-[12px] text-muted-foreground">{etiqueta}</dt>
      <dd className="tabular-nums text-foreground">{valor}</dd>
    </div>
  );
}
