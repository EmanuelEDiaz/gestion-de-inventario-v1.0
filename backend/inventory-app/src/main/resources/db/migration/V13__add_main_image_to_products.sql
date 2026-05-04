-- Add main_image column to products table (IF NOT EXISTS to be safe)
ALTER TABLE products ADD COLUMN IF NOT EXISTS main_image TEXT;

-- Backfill from existing primary images
UPDATE products p
SET main_image = pi.file_path
FROM product_images pi
WHERE pi.product_id = p.id
  AND pi.is_primary = true
  AND p.main_image IS NULL;
