import logotipoBlanco from "@/assets/marca/web-v1/logo/velocentum-logotipo-blanco.svg";

/**
 * Wordmark blanco (DH-8) recortado a su tinta. El SVG trae el lienzo entero de
 * 2117×743, con margen transparente; el viewBox de afuera lo recorta a la misma
 * caja que tenía el PNG tight (1933×299: la tinta y 4 unidades de aire), sin
 * modificar el archivo. Así el borde de la caja es el de la tinta, que es donde
 * DH-11 alinea el descriptor y desde donde mide la zona libre.
 */
const LIENZO = { ancho: 2117, alto: 743 };
const CAJA = { x: 94, y: 204, ancho: 1933, alto: 299 };

export function LogotipoBlanco({ alto, className }: { alto: number; className?: string }) {
  return (
    <svg
      role="img"
      aria-label="Velocentum"
      viewBox={`${CAJA.x} ${CAJA.y} ${CAJA.ancho} ${CAJA.alto}`}
      width={(alto * CAJA.ancho) / CAJA.alto}
      height={alto}
      className={className}
    >
      <image href={logotipoBlanco} width={LIENZO.ancho} height={LIENZO.alto} />
    </svg>
  );
}
