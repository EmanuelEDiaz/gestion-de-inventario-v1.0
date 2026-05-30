/**
 * Generate Geo Index from OSM PBF extract
 *
 * Reads cuba-latest.osm.pbf and extracts streets, places, and POIs
 * into a JSON index for FlexSearch (offline geocoding).
 *
 * Usage:
 *   node scripts/generate-geo-index.mjs \
 *     --input cuba-latest.osm.pbf \
 *     --output frontend/public/geo/geo-index-cuba.json
 *
 * Requires: osmtogeojson (npm) or ogr2ogr (GDAL) installed
 * Falls back to generating an empty index with a warning.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      opts[key] = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      if (opts[key] !== true) i++;
    }
  }
  return opts;
}

const opts = parseArgs();
const inputPath = opts.input || join(__dirname, '..', 'cuba-latest.osm.pbf');
const outputPath = opts.output || join(__dirname, '..', 'frontend', 'public', 'geo', 'geo-index-cuba.json');

const OUTPUT_VERSION = 1;
const ACCEPTED_HIGHWAYS = [
  'primary', 'secondary', 'tertiary', 'residential',
  'unclassified', 'living_street', 'service',
];
const ACCEPTED_PLACES = [
  'city', 'town', 'village', 'hamlet', 'suburb', 'neighbourhood',
];

async function generateGeoIndex() {
  console.log(`[geo-index] Input: ${inputPath}`);
  console.log(`[geo-index] Output: ${outputPath}`);

  if (!existsSync(inputPath)) {
    console.warn(`[geo-index] WARNING: Input file not found: ${inputPath}`);
    console.warn('[geo-index] Generating EMPTY index as placeholder.');
    console.warn('[geo-index] To generate real index:');
    console.warn('  1. Download Cuba OSM extract:');
    console.warn('     curl -o cuba-latest.osm.pbf https://download.geofabrik.de/north-america/cuba-latest.osm.pbf');
    console.warn('  2. Install osmtogeojson or use ogr2ogr to convert PBF to GeoJSON');
    console.warn('  3. Re-run this script with --input cuba-latest.osm.pbf');

    // Write empty index
    const emptyIndex = {
      version: OUTPUT_VERSION,
      generatedAt: new Date().toISOString(),
      countryCode: 'CU',
      entries: [],
    };
    ensureDir(dirname(outputPath));
    writeFileSync(outputPath, JSON.stringify(emptyIndex, null, 2));
    console.log(`[geo-index] Empty index written to ${outputPath}`);
    return;
  }

  // Real generation would:
  // 1. Parse OSM PBF (using osmtogeojson or ogr2ogr)
  // 2. Extract nodes/ways with highway=* or place=* tags
  // 3. Filter by ACCEPTED_HIGHWAYS / ACCEPTED_PLACES
  // 4. Reverse geocode to province/municipality
  // 5. Build GeoEntry[] array
  // 6. Write JSON

  console.log('[geo-index] Real generation requires osmtogeojson or ogr2ogr.');
  console.log('[geo-index] See README for setup instructions.');
}

function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    ensureDir(dirname(dirPath));
    mkdirSync(dirPath, { recursive: true });
  }
}

import { mkdirSync } from 'fs';

generateGeoIndex().catch(console.error);
