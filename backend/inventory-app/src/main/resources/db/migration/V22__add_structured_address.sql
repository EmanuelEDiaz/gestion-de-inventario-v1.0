-- V22: Structured address fields for suppliers and customers
-- Migración del campo address (texto libre) a columnas estructuradas

-- Proveedores
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS province     VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS municipality VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS street       TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS locality     VARCHAR(200);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS zip_code     VARCHAR(20);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS latitude     NUMERIC(10,7);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS longitude    NUMERIC(10,7);

-- Clientes
ALTER TABLE customers ADD COLUMN IF NOT EXISTS province     VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS municipality VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS street       TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS locality     VARCHAR(200);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS zip_code     VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS latitude     NUMERIC(10,7);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS longitude    NUMERIC(10,7);

-- Migrar datos existentes: address → street
UPDATE suppliers SET street = address WHERE street IS NULL AND address IS NOT NULL;
UPDATE customers SET street = address WHERE street IS NULL AND address IS NOT NULL;
