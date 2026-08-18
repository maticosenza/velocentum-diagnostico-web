import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function parseNumero(texto: string): number | null {
  const limpio = texto.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  if (limpio === "" || limpio === "-") return null;
  const n = Number(limpio);
  return Number.isFinite(n) ? n : null;
}

function conMiles(n: number) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n);
}

export function Campo({
  label,
  ayuda,
  obligatorio,
  children,
  htmlFor,
}: {
  label: string;
  ayuda?: string | undefined;
  obligatorio?: boolean | undefined;
  children: React.ReactNode;
  htmlFor?: string | undefined;
}) {

  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-[14px] font-medium leading-5 text-foreground/85">
        {label}
        {obligatorio && <span className="ml-0.5 text-primary">*</span>}
      </Label>
      {children}
      {ayuda && <p className="text-[12.5px] leading-4 text-muted-foreground">{ayuda}</p>}
    </div>
  );
}

/** Campo en pesos: muestra separador de miles con punto, guarda número. */
export function CampoPesos({
  label,
  value,
  onChange,
  ayuda,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  ayuda?: string;
}) {
  const id = useId();
  return (
    <Campo label={label} ayuda={ayuda} htmlFor={id}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-muted-foreground">
          $
        </span>
        <Input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          className="h-11 pl-7 text-[14px] tabular-nums"
          value={value === null ? "" : conMiles(value)}
          onChange={(e) => onChange(parseNumero(e.target.value))}
        />
      </div>
    </Campo>
  );
}

export function CampoNumero({
  label,
  value,
  onChange,
  decimales = 0,
  ayuda,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  decimales?: number;
  ayuda?: string;
}) {
  const id = useId();
  return (
    <Campo label={label} ayuda={ayuda} htmlFor={id}>
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        step={decimales > 0 ? 1 / 10 ** decimales : 1}
        className="h-11 text-[14px] tabular-nums"
        value={value === null ? "" : String(value)}
        onChange={(e) => onChange(parseNumero(e.target.value))}
      />
    </Campo>
  );
}

/** Porcentaje: símbolo al costado del campo, no adentro. */
export function CampoPorcentaje({
  label,
  value,
  onChange,
  ayuda,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  ayuda?: string;
}) {
  const id = useId();
  return (
    <Campo label={label} ayuda={ayuda} htmlFor={id}>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          className="h-11 text-[14px] tabular-nums"
          value={value === null ? "" : String(value)}
          onChange={(e) => onChange(parseNumero(e.target.value))}
        />
        <span className="shrink-0 text-[14px] text-muted-foreground">%</span>
      </div>
    </Campo>
  );
}

export function CampoTexto({
  label,
  value,
  onChange,
  obligatorio,
  ayuda,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  obligatorio?: boolean;
  ayuda?: string;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <Campo label={label} ayuda={ayuda} obligatorio={obligatorio} htmlFor={id}>
      <Input
        id={id}
        autoComplete="off"
        maxLength={160}
        placeholder={placeholder}
        className="h-11 text-[14px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Campo>
  );
}

/** Select nativo: más rápido con teclado que un combobox. */
export function CampoSelect({
  label,
  value,
  onChange,
  opciones,
  ayuda,
  placeholder = "Elegí una opción",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  opciones: readonly { value: string; label: string }[];
  ayuda?: string;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <Campo label={label} ayuda={ayuda} htmlFor={id}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-11 w-full rounded-md border border-input bg-background px-3 text-[14px] text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
          value === "" && "text-muted-foreground",
        )}
      >
        <option value="">{placeholder}</option>
        {opciones.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Campo>
  );
}

/**
 * Sí/No de tres estados: arranca sin nada seleccionado (null) para no dar por
 * respondido lo que nunca se preguntó. Tocar la opción activa la deselecciona.
 */
export function CampoSiNo({
  label,
  value,
  onChange,
  ayuda,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
  ayuda?: string;
}) {
  return (
    <Campo label={label} ayuda={ayuda}>
      <div className="flex gap-2">
        {[
          { v: true, l: "Sí" },
          { v: false, l: "No" },
        ].map((o) => (
          <button
            key={o.l}
            type="button"
            onClick={() => onChange(value === o.v ? null : o.v)}
            aria-pressed={value === o.v}
            className={cn(
              "h-11 flex-1 rounded-md border text-[14px] transition-colors",
              value === o.v
                ? "border-violet bg-violet-soft font-medium text-violet"
                : "border-input text-muted-foreground hover:bg-muted",
            )}
          >
            {o.l}
          </button>
        ))}
      </div>
    </Campo>
  );
}
