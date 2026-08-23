/**
 * Símbolo y wordmark de Velocentum para @react-pdf/renderer (bloque visual,
 * 2026-08-22). Los mismos paths que `src/assets/marca/*.svg`, sin
 * modificar: react-pdf no puede importar un archivo .svg como imagen
 * rasterizada de forma directa y confiable en este entorno, así que se
 * reconstruyen acá como primitivas <Svg>/<Path>, copiando exactamente los
 * datos `d`/`transform` de los SVG fuente. El color se pasa como prop
 * (`fill`), nunca hardcodeado, para reutilizar el mismo componente en
 * violeta o blanco según la sección del documento.
 */
import { G, Path, Svg } from "@react-pdf/renderer";

/** Exportado sólo para la prueba que lo compara contra src/assets/marca/*.svg. */
export const SIMBOLO_PATHS = [
  "M0 1.5h6.5L20 24.5 33.5 1.5H40L20 37Z",
  "M6.5 1.5H27L18 17.5 16 6.5H9.2Z",
];

export function SimboloVelocentum({
  color,
  width = 40,
  height = 40,
}: {
  color: string;
  width?: number;
  height?: number;
}) {
  return (
    <Svg viewBox="0 0 40 40" width={width} height={height}>
      <G fill={color}>
        {SIMBOLO_PATHS.map((d, i) => (
          <Path key={i} d={d} />
        ))}
      </G>
    </Svg>
  );
}

/** Exportado sólo para la prueba que lo compara contra src/assets/marca/*.svg. */
export const WORDMARK_LETRAS: { d: string; transform: string }[] = [
  { d: "M200 0 4 533H119L256 137 269 86 282 137 418 533H527L331 0Z", transform: "translate(0 23) scale(.011 -.011)" },
  {
    d: "M538 174Q517 83 452 35T292-13Q174-13 106.5 61.5T39 266Q39 400 105.5 473.5T287 547Q402 547 468 473.5T534 272V246H148Q153 164 190 120T292 76Q399 76 426 174ZM287 458Q171 458 151 319H423Q413 387 378.5 422.5T287 458Z",
    transform: "translate(5.841 23) scale(.011 -.011)",
  },
  { d: "M65 0V720H172V0Z", transform: "translate(12.177 23) scale(.011 -.011)" },
  {
    d: "M39 266Q39 400 105.5 473.5T288 547Q404 547 470.5 472T537 266Q537 133 470.5 60T288-13Q172-13 105.5 61.5T39 266ZM288 77Q356 77 392 125.5T428 266Q428 358 391.5 407.5T288 457Q220 457 184 408T148 266Q148 175 184.5 126T288 77Z",
    transform: "translate(14.773 23) scale(.011 -.011)",
  },
  {
    d: "M516 347H409Q400 402 367 429.5T285 457Q218 457 183 407.5T148 266Q148 175 184.5 125.5T288 76Q389 76 413 179H519Q502 83 440 35T286-13Q171-13 105 61.5T39 266Q39 400 104.5 473.5T285 547Q377 547 440 495.5T516 347Z",
    transform: "translate(21.109 23) scale(.011 -.011)",
  },
  {
    d: "M538 174Q517 83 452 35T292-13Q174-13 106.5 61.5T39 266Q39 400 105.5 473.5T287 547Q402 547 468 473.5T534 272V246H148Q153 164 190 120T292 76Q399 76 426 174ZM287 458Q171 458 151 319H423Q413 387 378.5 422.5T287 458Z",
    transform: "translate(27.203 23) scale(.011 -.011)",
  },
  {
    d: "M65 0V533H172V462Q226 547 333 547Q418 547 465.5 498T513 356V0H407V334Q407 458 300 458Q242 458 207 415T172 313V0Z",
    transform: "translate(33.539 23) scale(.011 -.011)",
  },
  {
    d: "M79 159V450H7V533H79V656H186V533H301V450H186V165Q186 117 205 96T278 75H299V-3Q279-13 232-13Q79-13 79 159Z",
    transform: "translate(39.897 23) scale(.011 -.011)",
  },
  {
    d: "M401 221V533H507V0H401V72Q349-13 242-13Q159-13 112 35.5T65 177V533H172V199Q172 76 275 76Q331 76 366 119.5T401 221Z",
    transform: "translate(43.373 23) scale(.011 -.011)",
  },
  {
    d: "M65 0V533H172V465Q223 547 322 547Q433 547 472 455Q525 547 635 547Q715 547 761.5 498T808 356V0H701V334Q701 458 606 458Q554 458 522 414.5T490 313V0H383V334Q383 458 288 458Q236 458 204 414.5T172 313V0Z",
    transform: "translate(49.665 23) scale(.011 -.011)",
  },
];

export function WordmarkVelocentum({
  color,
  width = 180,
  height = 120,
}: {
  color: string;
  width?: number;
  height?: number;
}) {
  return (
    <Svg viewBox="0 0 60 40" width={width} height={height}>
      <G fill={color}>
        {WORDMARK_LETRAS.map((letra, i) => (
          <Path key={i} d={letra.d} transform={letra.transform} />
        ))}
      </G>
    </Svg>
  );
}
