ALTER TABLE public.diagnostico ADD COLUMN IF NOT EXISTS modo text NOT NULL DEFAULT 'A';
ALTER TABLE public.diagnostico ADD CONSTRAINT diagnostico_modo_check CHECK (modo IN ('A','B'));