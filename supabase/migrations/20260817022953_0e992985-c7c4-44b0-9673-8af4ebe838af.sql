ALTER TABLE public.diagnostico
  ADD COLUMN version integer NOT NULL DEFAULT 1,
  ADD COLUMN origen_diagnostico_id uuid NULL REFERENCES public.diagnostico(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_diagnostico_origen ON public.diagnostico(origen_diagnostico_id);