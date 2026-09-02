# BV4 · Preflight del gate de F2a — handoff

1. **Commit candidato local** en la punta de `feat/bv4-rebranding`, sobre
   `6035ebf`. Su hash va en el `LEEME.txt` del ZIP, no acá: un commit no
   puede contener su propio hash. Sin push. No es
   fase ni ronda de F2a: F2a sigue cerrada en `04db2fb`
   (`bv4-f2a-candidato-preSupabase`) y su límite de rondas no se consumió.
2. **QA:** `npm test` **83 archivos / 1140 pruebas + 1 todo** verdes (base
   82 / 1128 + 1; +1 archivo, +12 pruebas, cero regresiones) · `tsc --noEmit`
   exit 0 · `vite build` exit 0 con los **mismos warnings, uno por uno**, que
   el log crudo del ZIP de F2a.
3. **Qué cambió:** los tres server functions comerciales
   (`paquetes`, `propuesta`, `seleccion-comercial-v2`) escriben con
   `context.supabase` —el cliente autenticado del middleware, sujeto a RLS— en
   vez de `supabaseAdmin` (service role). Tres líneas por archivo, más un
   comentario. Cero cambios de lógica, validaciones, formas de datos o mensajes.
4. **Los cuatro PDFs del gate dan SHA-256 idéntico** a los del ZIP de F2a: el
   arreglo no tocó el render, y queda probado en vez de afirmado.
5. **Cobertura nueva (H-8):** `escritura-comercial-autenticada.test.ts` fija
   que los tres toman el cliente por la vía autenticada. Verificada por
   mutación: revertir un archivo la pone en rojo.
6. **`supabaseAdmin` quedó sin un solo importador en `src/`.** Se reporta, no
   se borra: `client.server.ts` es archivo generado.
7. **Documentación:** sección **0-bis · Prerrequisitos de entorno** en
   `docs/bv4-f2a-gate-navegador.md` (H-7) y `docs/bv4-hallazgos-diferidos.md`
   nuevo con H-6 a H-10. Sólo nombres de variables, ningún valor.
8. **Qué queda abierto:** H-6 (el handoff de F2a describe mal los warnings;
   deuda: migrar a `.validator()`), H-9 (RLS sin chequeo de propiedad en tres
   tablas; pide migraciones y aprobación aparte), H-10 (claves publishable en
   el historial; limpiarlo exige reescribirlo y el repo está en Lovable).
9. **Invariantes respetados:** cero migraciones, `.env` intacto,
   `MOTOR_DOCUMENTAL_ACTIVO` en `"v1"`, `TEMA_DOCUMENTAL_ACTIVO` en
   `"velocentum-light-v1"`, ningún archivo fuera de alcance.
10. **El gate ya es ejecutable en local**: alcanzan las cuatro variables que
    el `.env` ya tiene. Si un guardado falla ahora, el sospechoso es la
    política de RLS (H-9), no el código.
