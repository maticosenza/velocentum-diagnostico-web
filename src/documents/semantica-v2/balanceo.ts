/**
 * Balanceo de grilla sin filas huérfanas (R-02,
 * contrato-composicion-v2.md sección 1.4). Un huérfano es una última fila
 * con un solo ítem cuando la cantidad nominal de columnas dejaría 2+ filas
 * completas y una casi vacía (ej. 7 ítems a 3 columnas → 3+3+1).
 *
 * Algoritmo: probar `colsNominal`; si deja huérfano, probar
 * `colsNominal + 1` y, si tampoco alcanza, `colsNominal - 1`; usar la
 * primera alternativa sin huérfano, sin alejarse más de 1 columna del
 * nominal (para no romper el ancho de tarjeta del perfil). Si ninguna
 * alternativa evita el huérfano, se devuelve la distribución nominal tal
 * cual (no hay forma de evitarlo sin una columna adicional mayor, y esa
 * expansión queda fuera de este algoritmo a propósito).
 */
export function filasBalanceadas(n: number, colsNominal: number): number[] {
  if (n <= 0) return [];
  if (colsNominal <= 0) return [n];

  const distribuir = (cols: number): number[] => {
    const filas: number[] = [];
    let restante = n;
    while (restante > 0) {
      const enEstaFila = Math.min(cols, restante);
      filas.push(enEstaFila);
      restante -= enEstaFila;
    }
    return filas;
  };

  const tieneHuerfano = (filas: number[]) => filas.length > 1 && filas[filas.length - 1] === 1;

  const candidatoNominal = distribuir(colsNominal);
  if (!tieneHuerfano(candidatoNominal)) return candidatoNominal;

  const candidatoMas = distribuir(colsNominal + 1);
  if (!tieneHuerfano(candidatoMas)) return candidatoMas;

  if (colsNominal > 1) {
    const candidatoMenos = distribuir(colsNominal - 1);
    if (!tieneHuerfano(candidatoMenos)) return candidatoMenos;
  }

  return candidatoNominal;
}
