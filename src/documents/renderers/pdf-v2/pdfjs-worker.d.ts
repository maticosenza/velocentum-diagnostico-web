/**
 * `pdfjs-dist` no publica una declaración de tipos para el build del
 * worker en sí (`pdf.d.mts` sólo cubre `pdf.mjs`) — sólo `paginacion.ts`
 * lo importa de forma estática (Fase 14.1, C-3), así que la declaración
 * vive junto a ese único consumidor.
 */
declare module "pdfjs-dist/legacy/build/pdf.worker.mjs" {
  export const WorkerMessageHandler: unknown;
}
