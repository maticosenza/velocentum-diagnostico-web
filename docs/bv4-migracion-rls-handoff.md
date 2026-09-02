# BV4 · Migración de la política RLS de UPDATE en `diagnostico` — handoff

1. **Commit candidato local** en la punta de `feat/bv4-rebranding`, sobre
   `805333c`. Sin push. Excepción autorizada al invariante "sin migraciones de
   esquema"; no es fase ni consume rondas de F2a. **Aplicada por Matías el
   2026-09-02** desde el panel Cloud y verificada ahí mismo: `diagnostico` pasó
   de 3 a 4 políticas, la de UPDATE con `USING (auth.uid() = creado_por)`.
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
5. **Quién aplica.** Lo verificado es una sola cosa: las cinco migraciones
   existentes las commiteó `gpt-engineer-app[bot]` **junto con `types.ts`
   regenerado**, o sea que **Lovable escribe al repo**. De ahí se **infiere**
   —no se prueba— que aplica primero en la base y sincroniza después. Lo que
   esa evidencia **no** descarta es que Lovable además *lea* migraciones que le
   lleguen por el repo: nunca se probó el sentido contrario, sólo no se lo
   observó. Lo único categórico es que nada de `feat/bv4-rebranding` puede
   llegarle, porque la rama no se pushea.
6. **Camino que se siguió:** Matías ejecutó el SQL del archivo del punto 2
   —tal cual, es el SQL exacto— desde el SQL editor del panel Cloud. **Este
   agente no ejecutó nada contra la base**, ni antes ni después.
7. **Riesgo de secuencia, ahora registrado como H-13:** si Lovable genera su
   propia migración por el mismo cambio y la commitea a `main`, van a existir
   dos archivos creando la misma política, en dos ramas ya divergidas. El
   `DROP POLICY IF EXISTS` con el que empieza el SQL mitiga el **fallo de
   ejecución**, no la **duplicación**.
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
