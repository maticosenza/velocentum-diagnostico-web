/**
 * Registro de fuentes para @react-pdf/renderer (bloque visual, 2026-08-22).
 *
 * Los archivos de fuente ya embebidos como data URI en base64
 * (`satoshi-datos.generated.ts`/`inter-datos.generated.ts`, generados desde
 * `src/assets/fuentes/`): cero dependencia de filesystem o red en runtime.
 * Es necesario acá porque el pipeline de fontkit que usa @react-pdf/renderer
 * para leer un archivo por ruta (`fontkit.open`/`openSync`) no está
 * disponible en el entorno de despliegue serverless/edge de este proyecto
 * (se ve como advertencia `IMPORT_IS_UNDEFINED` en cada build); un data URI
 * en cambio se resuelve enteramente en memoria, sin tocar el sistema de
 * archivos.
 *
 * Satoshi: licencia ITF Free Font License 2.0 (Fontshare) — permite
 * embeber en PDFs siempre que la fuente no pueda extraerse ni usarse
 * independientemente del documento (ver `src/assets/fuentes/satoshi/LICENSE.txt`).
 * Inter: SIL Open Font License 1.1 — permite embeber y redistribuir con
 * software libremente (ver `src/assets/fuentes/inter/LICENSE.txt`).
 */
import { Font } from "@react-pdf/renderer";
import { SATOSHI_DATA_URIS } from "./satoshi-datos.generated";
import { INTER_DATA_URIS } from "./inter-datos.generated";

type PesoEstilo = { weight: number; style: "normal" | "italic" };

const PESOS_SATOSHI: PesoEstilo[] = [
  { weight: 300, style: "normal" },
  { weight: 300, style: "italic" },
  { weight: 400, style: "normal" },
  { weight: 400, style: "italic" },
  { weight: 500, style: "normal" },
  { weight: 500, style: "italic" },
  { weight: 700, style: "normal" },
  { weight: 700, style: "italic" },
  { weight: 900, style: "normal" },
  { weight: 900, style: "italic" },
];

const PESOS_INTER: PesoEstilo[] = [
  { weight: 400, style: "normal" },
  { weight: 500, style: "normal" },
  { weight: 600, style: "normal" },
  { weight: 700, style: "normal" },
  { weight: 800, style: "normal" },
];

let registrado = false;

/** Idempotente: registrar más de una vez (varios renders en el mismo proceso) no duplica fuentes. */
export function registrarFuentesVelocentum(): void {
  if (registrado) return;
  registrado = true;

  Font.register({
    family: "Satoshi",
    fonts: PESOS_SATOSHI.map(({ weight, style }) => ({
      src: SATOSHI_DATA_URIS[`${weight}-${style}` as keyof typeof SATOSHI_DATA_URIS],
      fontWeight: weight,
      fontStyle: style,
    })),
  });

  Font.register({
    family: "Inter",
    fonts: PESOS_INTER.map(({ weight, style }) => ({
      src: INTER_DATA_URIS[`${weight}-${style}` as keyof typeof INTER_DATA_URIS],
      fontWeight: weight,
      fontStyle: style,
    })),
  });

  // Satoshi no trae itálica para 600/800; Inter no trae itálica en este
  // paquete (sólo se relevó estático 18pt sin itálicas, por pedido
  // explícito). CORRECCIÓN (auditoría 2026-08-23): a diferencia de lo que
  // decía este comentario antes, @react-pdf/renderer NO degrada al
  // peso/estilo más cercano si falta una combinación exacta — tira una
  // excepción real ("Could not resolve font for ..."). Cualquier estilo
  // nuevo que pida una combinación peso/estilo no registrada acá debe
  // verificarse contra `PESOS_SATOSHI`/`PESOS_INTER` arriba, o el render
  // de PDF falla en tiempo de ejecución, no en desarrollo.
}
