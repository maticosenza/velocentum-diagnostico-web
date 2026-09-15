# Fuente de valores del tema `velocentum-web/v1`

`tokens.css` es la **fuente de verdad** de los valores del tema (contrato
BV4, DH-4): "VELOCENTUM.COM — TOKENS V3". Provisto por Matías en
`.branding-nuevo/tokens.css` y copiado **sin modificar** el 2026-09-15
(BV4 F2b). No se edita: si un valor cambia, cambia acá primero por decisión
humana, y los tests lo propagan como falla hasta que el tema y `styles.css`
coinciden.

- SHA-256: `71119ee1b67e467562a7f4d1c091b6b03776703f5c209032dc59e5bb78f73faf`

El documento de uso, `Sistema de diseño.docx`, está en
`docs/branding-web-v1/` (SHA-256
`2656b36e009166ef0d77e5d7420216d8b6cef97188117de3c7be4f1f2777b2ec`). Si el
docx y `tokens.css` no coinciden en un valor, gana `tokens.css`; donde el
docx asigna usos que el contrato cambió (CTA, rosa), gana el contrato.

## Cómo se usa

- `../velocentum-web-v1.ts` declara el tema: cada token de acá que entra a la
  herramienta, con el mismo nombre y el mismo valor, más `--navy` (DH-4).
- `src/styles.css` lo aplica a la interfaz.
- `../velocentum-web-v1.test.ts` lee este archivo y `styles.css` y falla si
  un valor se separa, o si aparece un token nuevo sin decidir si entra.
- Lo que no entra, y por qué: el rosa `--marca` / `--texto-sobre-marca`
  (DH-5) y las mecánicas medidas en el sitio (`--sticky-servicios`,
  `--sticky-clientes`, `--alto-caso`, `--degradado-borde`,
  `--grid-gap-trabajos`, DH-13). La regla `.section-edge` no se copia a la
  interfaz: la herramienta no usa ondas en pantalla (DH-12); su sintaxis de
  máscara rige cuando se usen.
