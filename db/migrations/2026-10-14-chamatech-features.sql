-- ChamaTech: campos e tabelas das fases de segurança, avaliações e notificações.
-- Rode sobre um banco que já tenha as tabelas base do Better Auth e do ChamaTech.
-- Seguro para reexecução. Não exclui nem sobrescreve dados existentes; novas
-- colunas recebem os defaults indicados abaixo.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF to_regclass('"user"') IS NULL THEN
    RAISE EXCEPTION 'Tabela "user" não encontrada. Gere/aplique primeiro o schema do Better Auth.';
  END IF;
  IF to_regclass('reviews') IS NULL THEN
    RAISE EXCEPTION 'Tabela reviews não encontrada. Aplique primeiro o schema base do ChamaTech.';
  END IF;
  IF to_regclass('notifications') IS NULL THEN
    RAISE EXCEPTION 'Tabela notifications não encontrada. Aplique primeiro o schema base do ChamaTech.';
  END IF;
END $$;

-- Aceite de termos e preferência de notificações para as contas.
ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS terms_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_notifications boolean NOT NULL DEFAULT true;

-- Registro permanente de ações administrativas sensíveis.
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id text NOT NULL REFERENCES "user"(id),
  action text NOT NULL,
  target_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at
  ON admin_audit_logs (created_at DESC);

-- Resposta única do técnico e moderação sem apagar a avaliação.
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS technician_reply text,
  ADD COLUMN IF NOT EXISTS replied_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_by text REFERENCES "user"(id),
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz;

-- O schema base já impõe UNIQUE(service_id). Se uma instalação antiga não tiver
-- essa regra, cria o índice necessário; em caso de duplicatas, aborta sem removê-las.
DO $$
DECLARE
  service_id_attnum smallint;
  has_unique_service_index boolean;
BEGIN
  SELECT attnum INTO service_id_attnum
    FROM pg_attribute
   WHERE attrelid = 'reviews'::regclass
     AND attname = 'service_id'
     AND NOT attisdropped;

  SELECT EXISTS (
    SELECT 1
      FROM pg_index
     WHERE indrelid = 'reviews'::regclass
       AND indisunique
       AND indpred IS NULL
       AND indnkeyatts = 1
       AND indkey[0] = service_id_attnum
  ) INTO has_unique_service_index;

  IF NOT has_unique_service_index THEN
    IF EXISTS (
      SELECT service_id
        FROM reviews
       GROUP BY service_id
      HAVING count(*) > 1
    ) THEN
      RAISE EXCEPTION 'reviews contém mais de uma avaliação por chamado; resolva as duplicatas antes da migração.';
    END IF;

    EXECUTE 'CREATE UNIQUE INDEX idx_reviews_service_unique ON reviews (service_id)';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reviews_technician
  ON reviews (technician_id);
CREATE INDEX IF NOT EXISTS idx_reviews_public
  ON reviews (technician_id, created_at DESC)
  WHERE is_hidden = false;

-- Denúncias com uma denúncia por pessoa para cada avaliação.
CREATE TABLE IF NOT EXISTS review_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reporter_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 5 AND 500),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'resolved', 'dismissed')),
  reviewed_by text REFERENCES "user"(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_review_reports_open
  ON review_reports (created_at DESC)
  WHERE status = 'open';

-- Link direto do chamado na central de notificações.
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS href text;

COMMIT;
