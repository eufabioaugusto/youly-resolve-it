-- Adicionar valores ao enum saque_status
ALTER TYPE saque_status ADD VALUE IF NOT EXISTS 'aprovado';
ALTER TYPE saque_status ADD VALUE IF NOT EXISTS 'rejeitado';
ALTER TYPE saque_status ADD VALUE IF NOT EXISTS 'pago';