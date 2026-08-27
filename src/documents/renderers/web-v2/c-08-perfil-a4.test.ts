/**
 * C-08 (Bloque 3 Funcional): vista previa del perfil A4 en el renderer
 * web — antes el renderer estaba fijo a "pantalla" sin ninguna forma de
 * ver la composición de impresión sin descargar el PDF
 * (`docs/visual/matriz-hallazgos.md` C-08). Testeable directamente, sin
 * UI: el componente acepta `profile` y cambia su composición.
 */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildDiagnosticoDocumentV2 } from "../../templates/velocentum-v2/diagnostico";
import { buildMulticanalContext } from "../../templates/velocentum-v2/test-fixtures";
import { DocumentWebRendererV2 } from "./document-renderer";

describe("C-08: vista previa del perfil A4 en el renderer web", () => {
  const model = buildDiagnosticoDocumentV2(buildMulticanalContext());

  it("sin `profile`, usa 'pantalla' por defecto — composición existente, sin cambios", () => {
    const html = renderToStaticMarkup(React.createElement(DocumentWebRendererV2, { model }));
    expect(html).toContain('data-profile="pantalla"');
    expect(html).toContain("vdoc2--pantalla");
    expect(html).not.toContain("vdoc2--impresion");
  });

  it("con `profile: \"impresion\"`, la composición cambia a la vista previa A4", () => {
    const html = renderToStaticMarkup(React.createElement(DocumentWebRendererV2, { model, profile: "impresion" }));
    expect(html).toContain('data-profile="impresion"');
    expect(html).toContain("vdoc2--impresion");
    expect(html).not.toContain("vdoc2--pantalla");
  });

  it("los dos perfiles producen composiciones distintas (no el mismo HTML)", () => {
    const pantalla = renderToStaticMarkup(React.createElement(DocumentWebRendererV2, { model, profile: "pantalla" }));
    const impresion = renderToStaticMarkup(
      React.createElement(DocumentWebRendererV2, { model, profile: "impresion" }),
    );
    expect(pantalla).not.toBe(impresion);
  });
});
