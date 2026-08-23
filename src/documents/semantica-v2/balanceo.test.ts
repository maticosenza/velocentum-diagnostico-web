import { describe, expect, it } from "vitest";
import { filasBalanceadas } from "./balanceo";

describe("filasBalanceadas", () => {
  it("nunca deja una última fila con un solo ítem cuando hay alternativa", () => {
    expect(filasBalanceadas(7, 3)).toEqual([4, 3]);
  });

  it("mantiene la distribución nominal cuando ya está balanceada", () => {
    expect(filasBalanceadas(9, 3)).toEqual([3, 3, 3]);
    expect(filasBalanceadas(6, 3)).toEqual([3, 3]);
  });

  it("no cambia nada cuando entra todo en una sola fila", () => {
    expect(filasBalanceadas(2, 3)).toEqual([2]);
    expect(filasBalanceadas(3, 3)).toEqual([3]);
  });

  it("maneja n=1", () => {
    expect(filasBalanceadas(1, 3)).toEqual([1]);
  });

  it("maneja n=0", () => {
    expect(filasBalanceadas(0, 3)).toEqual([]);
  });

  it("evita huérfano probando colsNominal-1 cuando +1 no alcanza", () => {
    // n=10, colsNominal=3: [3,3,3,1] huérfano; +1=4 -> [4,4,2] sin huérfano.
    expect(filasBalanceadas(10, 3)).toEqual([4, 4, 2]);
  });

  it("las filas siempre suman n", () => {
    for (let n = 1; n <= 20; n++) {
      for (const cols of [2, 3, 4]) {
        const filas = filasBalanceadas(n, cols);
        expect(filas.reduce((a, b) => a + b, 0)).toBe(n);
      }
    }
  });
});
