# BV4 · Migración de la política RLS de UPDATE en `diagnostico` — handoff

1. **Commit candidato local** en la punta de `feat/bv4-rebranding`, sobre
   `805333c`. Sin push, **sin aplicar**. Excepción autorizada al invariante
   "sin migraciones de esquema"; no es fase ni consume rondas de F2a.
2. **Qué se creó:** una migración,
   `supabase/migrations/20260902214642_45081e33-0147-4038-a8a9-4d68f2e983f3.sql`,
   con la política de UPDATE que le falta a `public.diagnostico` para el rol
   `authenticated`: `USING (auth.uid() = creado_por)` **y**
   `WITH CHECK (auth.uid() = creado_por)`. Nombre siguiendo la convención en
   español de las existentes.
3. **Riesgo del punto 3 del prompt: descartado por esquema, no por consulta.**
   `creado_por` es `uuid NOT NULL REFERENCES auth.users(id)` desde la migración
   de creación de la tabla, y ninguna de las cuatro posteriores la alteró. El
   `types.ts` generado desde la base real la declara `creado_por: string`, sin
   `| null`. No puede haber filas viejas que la política deje inaccesibles.
4. **QA:** `npm test` 83 archivos / 1140 pruebas + 1 todo, verdes;
   `tsc --noEmit` exit 0. Sin cambios de código: la migración es SQL.
5. **Quién aplica — respondido, y la respuesta cambia la secuencia.** Las cinco
   migraciones existentes las commiteó `gpt-engineer-app[bot]` **junto con
   `types.ts` regenerado**. El flujo va de **Lovable al repo**, no al revés:
   Lovable aplica en la base y después sincroniza el archivo. Escribir el
   archivo en una rama que no se pushea no aplica absolutamente nada.
6. **Camino a seguir, para decisión de Matías:** ejecutar el SQL del archivo
   del punto 2 —tal cual, es el SQL exacto— desde el SQL editor del panel
   Cloud, o pedírselo a Lovable. **No se ejecutó nada contra la base.**
7. **Riesgo de secuencia a tener presente:** si Lovable genera su propia
   migración por el mismo cambio y la commitea a `main`, van a existir dos
   archivos creando la misma política. Por eso el SQL empieza con un
   `DROP POLICY IF EXISTS`: re-aplicarlo no falla con "policy already exists".
8. **Correcciones de la auditoría cerradas** en
   `docs/bv4-hallazgos-diferidos.md`: **H-11** (los cinco errores
   `prettier/prettier` preexistentes, con el porqué de no corregirlos) y
   **H-12** (`supabaseAdmin` sin importadores; deuda registrada, no borrada).
9. **H-9 actualizado** con la tabla de políticas verificada en el panel, y
   marcado **parcialmente encaminado**: el criterio de propiedad ya está
   aplicado en un punto. Siguen pendientes las políticas con `true` de las tres
   tablas, cada una con su propia migración y aprobación.
10. **Invariantes respetados:** no se tocaron `configuracion`, `oportunidad`,
    las otras tres políticas de `diagnostico`, las cinco migraciones
    existentes, ni una línea de código. Motor en `"v1"`, tema en
    `"velocentum-light-v1"`, `.env` intacto, ningún valor de entorno impreso.
