-- =====================================================
-- V6: Ajustes a Transfers
-- =====================================================

-- Renombrar completed_date a received_date para consistencia
ALTER TABLE transfers RENAME COLUMN completed_date TO received_date;

-- Actualizar el CHECK constraint para incluir CONFIRMED
ALTER TABLE transfers DROP CONSTRAINT IF EXISTS transfers_status_check;
ALTER TABLE transfers ADD CONSTRAINT transfers_status_check 
    CHECK (status IN ('DRAFT', 'CONFIRMED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'));
