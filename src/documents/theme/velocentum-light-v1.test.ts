import { describe, expect, it } from "vitest";
import { VELOCENTUM_LIGHT_V1 } from "./velocentum-light-v1";

describe("tema documental Velocentum", () => {
  it("mantiene el tema claro, versionado y con estados no dependientes sólo del violeta", () => {
    expect(VELOCENTUM_LIGHT_V1.id).toBe("velocentum-light/v1");
    expect(VELOCENTUM_LIGHT_V1.colors.background).toBe("#FAF9FF");
    expect(VELOCENTUM_LIGHT_V1.colors.surface).toBe("#FFFFFF");
    expect(
      new Set([
        VELOCENTUM_LIGHT_V1.colors.success,
        VELOCENTUM_LIGHT_V1.colors.warning,
        VELOCENTUM_LIGHT_V1.colors.risk,
      ]).size,
    ).toBe(3);
  });
});
