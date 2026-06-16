-- V28: Add version column to geo_regions (required by @Version annotation in GeoRegionEntity)
ALTER TABLE geo_regions ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 0;
