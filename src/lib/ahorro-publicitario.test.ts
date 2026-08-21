import { describe, expect, it } from "vitest";
import { AHORRO_PUBLICITARIO_MANUAL } from "./fixtures-impactos-manual";
import { consolidarAhorroPublicitario } from "./ahorro-publicitario";

describe("consolidarAhorroPublicitario", () => {
  it("caso A: solapamiento sin tope, usa el máximo, nunca la suma", () => {
    const c = AHORRO_PUBLICITARIO_MANUAL.casoA_solapamientoSinTope;
    const resultado = consolidarAhorroPublicitario({
      gastoNoRentable: c.gastoNoRentable,
      sobrefragmentacion: c.sobrefragmentacion,
      inversionElegible: c.inversionElegible,
    });
    expect(resultado).toEqual({
      calculable: true,
      montoMensual: c.consolidadoEsperado,
      origen: c.origenEsperado,
    });
    expect((resultado as { montoMensual: number }).montoMensual).not.toBe(
      c.sumaIncompatibleQueNuncaDebeAparecer,
    );
  });

  it("caso B: el máximo supera la inversión elegible, se topea", () => {
    const c = AHORRO_PUBLICITARIO_MANUAL.casoB_topeAplicado;
    const resultado = consolidarAhorroPublicitario({
      gastoNoRentable: c.gastoNoRentable,
      sobrefragmentacion: c.sobrefragmentacion,
      inversionElegible: c.inversionElegible,
    });
    expect(resultado).toEqual({
      calculable: true,
      montoMensual: c.consolidadoEsperado,
      origen: "sobrefragmentacion",
    });
  });

  it("caso C: sólo una fuga calculable, se usa esa sola (no se inventa la otra como cero)", () => {
    const c = AHORRO_PUBLICITARIO_MANUAL.casoC_soloUnaCalculable;
    const resultado = consolidarAhorroPublicitario({
      gastoNoRentable: c.gastoNoRentable,
      sobrefragmentacion: c.sobrefragmentacion,
      inversionElegible: c.inversionElegible,
    });
    expect(resultado).toEqual({
      calculable: true,
      montoMensual: c.consolidadoEsperado,
      origen: c.origenEsperado,
    });
  });

  it("caso D1: sin inversión publicitaria declarada, no calculable (no es un cero)", () => {
    const c = AHORRO_PUBLICITARIO_MANUAL.casoD1_sinInversionPublicitaria;
    const resultado = consolidarAhorroPublicitario({
      gastoNoRentable: c.gastoNoRentable,
      sobrefragmentacion: c.sobrefragmentacion,
      inversionElegible: c.inversionElegible,
    });
    expect(resultado.calculable).toBe(c.calculableEsperado);
    if (!resultado.calculable) expect(resultado.motivo).toMatch(/inversión publicitaria/);
  });

  it("caso D2: hay inversión pero ningún ahorro calculable, no calculable (no es un cero)", () => {
    const c = AHORRO_PUBLICITARIO_MANUAL.casoD2_inversionSinAhorroCalculable;
    const resultado = consolidarAhorroPublicitario({
      gastoNoRentable: c.gastoNoRentable,
      sobrefragmentacion: c.sobrefragmentacion,
      inversionElegible: c.inversionElegible,
    });
    expect(resultado.calculable).toBe(c.calculableEsperado);
  });

  it("nunca suma gasto_no_rentable y sobrefragmentación", () => {
    const resultado = consolidarAhorroPublicitario({
      gastoNoRentable: 100_000,
      sobrefragmentacion: 100_000,
      inversionElegible: 1_000_000,
    });
    expect(resultado).toEqual({ calculable: true, montoMensual: 100_000, origen: "gasto_no_rentable" });
  });
});
