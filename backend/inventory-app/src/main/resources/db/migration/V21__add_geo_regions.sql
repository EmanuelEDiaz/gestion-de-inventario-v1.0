-- V21: Geo regions (Cuba)
-- Estructura administrativa: país → provincias → municipios
-- 16 provincias (+ Isla de la Juventud), ~168 municipios

CREATE TABLE IF NOT EXISTS geo_regions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(3) NOT NULL,
    level       VARCHAR(20) NOT NULL CHECK (level IN ('country', 'province', 'municipality')),
    name        VARCHAR(200) NOT NULL,
    parent_id   UUID REFERENCES geo_regions(id),
    latitude    NUMERIC(10,7),
    longitude   NUMERIC(10,7),
    active      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_geo_regions_country_code ON geo_regions(country_code);
CREATE INDEX IF NOT EXISTS idx_geo_regions_parent_id ON geo_regions(parent_id);
CREATE INDEX IF NOT EXISTS idx_geo_regions_level ON geo_regions(level);

-- País
INSERT INTO geo_regions (country_code, level, name, parent_id, latitude, longitude, active)
VALUES ('CU', 'country', 'Cuba', NULL, 21.5000000, -80.0000000, TRUE);

-- Provincias
INSERT INTO geo_regions (country_code, level, name, parent_id, latitude, longitude, active)
SELECT 'CU', 'province', 'Pinar del Río',          (SELECT id FROM geo_regions WHERE level='country' AND country_code='CU'), 22.4120000, -83.6960000, TRUE
UNION ALL SELECT 'CU', 'province', 'Artemisa',               (SELECT id FROM geo_regions WHERE level='country' AND country_code='CU'), 22.8130000, -82.7620000, TRUE
UNION ALL SELECT 'CU', 'province', 'La Habana',               (SELECT id FROM geo_regions WHERE level='country' AND country_code='CU'), 23.1130000, -82.3660000, TRUE
UNION ALL SELECT 'CU', 'province', 'Mayabeque',               (SELECT id FROM geo_regions WHERE level='country' AND country_code='CU'), 22.9680000, -82.1510000, TRUE
UNION ALL SELECT 'CU', 'province', 'Matanzas',                (SELECT id FROM geo_regions WHERE level='country' AND country_code='CU'), 23.0410000, -81.5770000, TRUE
UNION ALL SELECT 'CU', 'province', 'Cienfuegos',              (SELECT id FROM geo_regions WHERE level='country' AND country_code='CU'), 22.1460000, -80.4360000, TRUE
UNION ALL SELECT 'CU', 'province', 'Villa Clara',             (SELECT id FROM geo_regions WHERE level='country' AND country_code='CU'), 22.4070000, -79.9650000, TRUE
UNION ALL SELECT 'CU', 'province', 'Sancti Spíritus',         (SELECT id FROM geo_regions WHERE level='country' AND country_code='CU'), 21.9300000, -79.4430000, TRUE
UNION ALL SELECT 'CU', 'province', 'Ciego de Ávila',          (SELECT id FROM geo_regions WHERE level='country' AND country_code='CU'), 21.8400000, -78.7620000, TRUE
UNION ALL SELECT 'CU', 'province', 'Camagüey',                (SELECT id FROM geo_regions WHERE level='country' AND country_code='CU'), 21.3810000, -77.9070000, TRUE
UNION ALL SELECT 'CU', 'province', 'Las Tunas',               (SELECT id FROM geo_regions WHERE level='country' AND country_code='CU'), 20.9600000, -76.9510000, TRUE
UNION ALL SELECT 'CU', 'province', 'Holguín',                 (SELECT id FROM geo_regions WHERE level='country' AND country_code='CU'), 20.8870000, -76.2630000, TRUE
UNION ALL SELECT 'CU', 'province', 'Granma',                  (SELECT id FROM geo_regions WHERE level='country' AND country_code='CU'), 20.3790000, -76.6430000, TRUE
UNION ALL SELECT 'CU', 'province', 'Santiago de Cuba',        (SELECT id FROM geo_regions WHERE level='country' AND country_code='CU'), 20.0200000, -75.8290000, TRUE
UNION ALL SELECT 'CU', 'province', 'Guantánamo',              (SELECT id FROM geo_regions WHERE level='country' AND country_code='CU'), 20.1440000, -75.2090000, TRUE
UNION ALL SELECT 'CU', 'province', 'Isla de la Juventud',     (SELECT id FROM geo_regions WHERE level='country' AND country_code='CU'), 21.7480000, -82.7620000, TRUE;

-- Municipios de Pinar del Río
INSERT INTO geo_regions (country_code, level, name, parent_id, active)
SELECT 'CU', 'municipality', 'Consolación del Sur',  (SELECT id FROM geo_regions WHERE level='province' AND name='Pinar del Río' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Guane',                (SELECT id FROM geo_regions WHERE level='province' AND name='Pinar del Río' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'La Palma',             (SELECT id FROM geo_regions WHERE level='province' AND name='Pinar del Río' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Los Palacios',         (SELECT id FROM geo_regions WHERE level='province' AND name='Pinar del Río' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Mantua',               (SELECT id FROM geo_regions WHERE level='province' AND name='Pinar del Río' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Minas de Matahambre',  (SELECT id FROM geo_regions WHERE level='province' AND name='Pinar del Río' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Pinar del Río',        (SELECT id FROM geo_regions WHERE level='province' AND name='Pinar del Río' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Sandino',              (SELECT id FROM geo_regions WHERE level='province' AND name='Pinar del Río' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'San Juan y Martínez',  (SELECT id FROM geo_regions WHERE level='province' AND name='Pinar del Río' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'San Luis',             (SELECT id FROM geo_regions WHERE level='province' AND name='Pinar del Río' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Viñales',              (SELECT id FROM geo_regions WHERE level='province' AND name='Pinar del Río' AND country_code='CU'), TRUE;

-- Municipios de Artemisa
INSERT INTO geo_regions (country_code, level, name, parent_id, active)
SELECT 'CU', 'municipality', 'Alquízar',             (SELECT id FROM geo_regions WHERE level='province' AND name='Artemisa' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Artemisa',              (SELECT id FROM geo_regions WHERE level='province' AND name='Artemisa' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Bahía Honda',           (SELECT id FROM geo_regions WHERE level='province' AND name='Artemisa' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Bauta',                (SELECT id FROM geo_regions WHERE level='province' AND name='Artemisa' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Caimito',              (SELECT id FROM geo_regions WHERE level='province' AND name='Artemisa' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Candelaria',           (SELECT id FROM geo_regions WHERE level='province' AND name='Artemisa' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Guanajay',             (SELECT id FROM geo_regions WHERE level='province' AND name='Artemisa' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Güira de Melena',      (SELECT id FROM geo_regions WHERE level='province' AND name='Artemisa' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Mariel',               (SELECT id FROM geo_regions WHERE level='province' AND name='Artemisa' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'San Antonio de los Baños', (SELECT id FROM geo_regions WHERE level='province' AND name='Artemisa' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'San Cristóbal',        (SELECT id FROM geo_regions WHERE level='province' AND name='Artemisa' AND country_code='CU'), TRUE;

-- Municipios de La Habana
INSERT INTO geo_regions (country_code, level, name, parent_id, active)
SELECT 'CU', 'municipality', 'Arroyo Naranjo',       (SELECT id FROM geo_regions WHERE level='province' AND name='La Habana' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Boyeros',               (SELECT id FROM geo_regions WHERE level='province' AND name='La Habana' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Centro Habana',         (SELECT id FROM geo_regions WHERE level='province' AND name='La Habana' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Cerro',                 (SELECT id FROM geo_regions WHERE level='province' AND name='La Habana' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Cotorro',               (SELECT id FROM geo_regions WHERE level='province' AND name='La Habana' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Diez de Octubre',      (SELECT id FROM geo_regions WHERE level='province' AND name='La Habana' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Guanabacoa',           (SELECT id FROM geo_regions WHERE level='province' AND name='La Habana' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Habana del Este',      (SELECT id FROM geo_regions WHERE level='province' AND name='La Habana' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Habana Vieja',         (SELECT id FROM geo_regions WHERE level='province' AND name='La Habana' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'La Lisa',              (SELECT id FROM geo_regions WHERE level='province' AND name='La Habana' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Marianao',             (SELECT id FROM geo_regions WHERE level='province' AND name='La Habana' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Playa',                (SELECT id FROM geo_regions WHERE level='province' AND name='La Habana' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Plaza de la Revolución', (SELECT id FROM geo_regions WHERE level='province' AND name='La Habana' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Regla',                (SELECT id FROM geo_regions WHERE level='province' AND name='La Habana' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'San Miguel del Padrón', (SELECT id FROM geo_regions WHERE level='province' AND name='La Habana' AND country_code='CU'), TRUE;

-- Municipios de Mayabeque
INSERT INTO geo_regions (country_code, level, name, parent_id, active)
SELECT 'CU', 'municipality', 'Batabanó',             (SELECT id FROM geo_regions WHERE level='province' AND name='Mayabeque' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Bejucal',               (SELECT id FROM geo_regions WHERE level='province' AND name='Mayabeque' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Güines',                (SELECT id FROM geo_regions WHERE level='province' AND name='Mayabeque' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Jaruco',                (SELECT id FROM geo_regions WHERE level='province' AND name='Mayabeque' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Madruga',               (SELECT id FROM geo_regions WHERE level='province' AND name='Mayabeque' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Melena del Sur',        (SELECT id FROM geo_regions WHERE level='province' AND name='Mayabeque' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Nueva Paz',             (SELECT id FROM geo_regions WHERE level='province' AND name='Mayabeque' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Quivicán',              (SELECT id FROM geo_regions WHERE level='province' AND name='Mayabeque' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'San José de las Lajas', (SELECT id FROM geo_regions WHERE level='province' AND name='Mayabeque' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'San Nicolás de Bari',   (SELECT id FROM geo_regions WHERE level='province' AND name='Mayabeque' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Santa Cruz del Norte',  (SELECT id FROM geo_regions WHERE level='province' AND name='Mayabeque' AND country_code='CU'), TRUE;

-- Municipios de Matanzas
INSERT INTO geo_regions (country_code, level, name, parent_id, active)
SELECT 'CU', 'municipality', 'Calimete',             (SELECT id FROM geo_regions WHERE level='province' AND name='Matanzas' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Cárdenas',              (SELECT id FROM geo_regions WHERE level='province' AND name='Matanzas' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Ciénaga de Zapata',     (SELECT id FROM geo_regions WHERE level='province' AND name='Matanzas' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Colón',                 (SELECT id FROM geo_regions WHERE level='province' AND name='Matanzas' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Jagüey Grande',         (SELECT id FROM geo_regions WHERE level='province' AND name='Matanzas' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Jovellanos',            (SELECT id FROM geo_regions WHERE level='province' AND name='Matanzas' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Limonar',               (SELECT id FROM geo_regions WHERE level='province' AND name='Matanzas' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Los Arabos',            (SELECT id FROM geo_regions WHERE level='province' AND name='Matanzas' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Martí',                 (SELECT id FROM geo_regions WHERE level='province' AND name='Matanzas' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Matanzas',              (SELECT id FROM geo_regions WHERE level='province' AND name='Matanzas' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Pedro Betancourt',      (SELECT id FROM geo_regions WHERE level='province' AND name='Matanzas' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Perico',                (SELECT id FROM geo_regions WHERE level='province' AND name='Matanzas' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Unión de Reyes',        (SELECT id FROM geo_regions WHERE level='province' AND name='Matanzas' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Varadero',              (SELECT id FROM geo_regions WHERE level='province' AND name='Matanzas' AND country_code='CU'), TRUE;

-- Municipios de Cienfuegos
INSERT INTO geo_regions (country_code, level, name, parent_id, active)
SELECT 'CU', 'municipality', 'Abreus',               (SELECT id FROM geo_regions WHERE level='province' AND name='Cienfuegos' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Aguada de Pasajeros',   (SELECT id FROM geo_regions WHERE level='province' AND name='Cienfuegos' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Cienfuegos',            (SELECT id FROM geo_regions WHERE level='province' AND name='Cienfuegos' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Cruces',                (SELECT id FROM geo_regions WHERE level='province' AND name='Cienfuegos' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Cumanayagua',           (SELECT id FROM geo_regions WHERE level='province' AND name='Cienfuegos' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Lajas',                 (SELECT id FROM geo_regions WHERE level='province' AND name='Cienfuegos' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Palmira',               (SELECT id FROM geo_regions WHERE level='province' AND name='Cienfuegos' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Rodas',                 (SELECT id FROM geo_regions WHERE level='province' AND name='Cienfuegos' AND country_code='CU'), TRUE;

-- Municipios de Villa Clara
INSERT INTO geo_regions (country_code, level, name, parent_id, active)
SELECT 'CU', 'municipality', 'Caibarién',            (SELECT id FROM geo_regions WHERE level='province' AND name='Villa Clara' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Camajuaní',            (SELECT id FROM geo_regions WHERE level='province' AND name='Villa Clara' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Cifuentes',            (SELECT id FROM geo_regions WHERE level='province' AND name='Villa Clara' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Corralillo',           (SELECT id FROM geo_regions WHERE level='province' AND name='Villa Clara' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Encrucijada',          (SELECT id FROM geo_regions WHERE level='province' AND name='Villa Clara' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Manicaragua',          (SELECT id FROM geo_regions WHERE level='province' AND name='Villa Clara' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Placetas',             (SELECT id FROM geo_regions WHERE level='province' AND name='Villa Clara' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Quemado de Güines',    (SELECT id FROM geo_regions WHERE level='province' AND name='Villa Clara' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Ranchuelo',            (SELECT id FROM geo_regions WHERE level='province' AND name='Villa Clara' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Remedios',             (SELECT id FROM geo_regions WHERE level='province' AND name='Villa Clara' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Sagua la Grande',      (SELECT id FROM geo_regions WHERE level='province' AND name='Villa Clara' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Santa Clara',          (SELECT id FROM geo_regions WHERE level='province' AND name='Villa Clara' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Santo Domingo',        (SELECT id FROM geo_regions WHERE level='province' AND name='Villa Clara' AND country_code='CU'), TRUE;

-- Municipios de Sancti Spíritus
INSERT INTO geo_regions (country_code, level, name, parent_id, active)
SELECT 'CU', 'municipality', 'Cabaiguán',            (SELECT id FROM geo_regions WHERE level='province' AND name='Sancti Spíritus' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Fomento',              (SELECT id FROM geo_regions WHERE level='province' AND name='Sancti Spíritus' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Jatibonico',           (SELECT id FROM geo_regions WHERE level='province' AND name='Sancti Spíritus' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'La Sierpe',            (SELECT id FROM geo_regions WHERE level='province' AND name='Sancti Spíritus' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Sancti Spíritus',      (SELECT id FROM geo_regions WHERE level='province' AND name='Sancti Spíritus' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Taguasco',             (SELECT id FROM geo_regions WHERE level='province' AND name='Sancti Spíritus' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Trinidad',             (SELECT id FROM geo_regions WHERE level='province' AND name='Sancti Spíritus' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Yaguajay',             (SELECT id FROM geo_regions WHERE level='province' AND name='Sancti Spíritus' AND country_code='CU'), TRUE;

-- Municipios de Ciego de Ávila
INSERT INTO geo_regions (country_code, level, name, parent_id, active)
SELECT 'CU', 'municipality', 'Baraguá',              (SELECT id FROM geo_regions WHERE level='province' AND name='Ciego de Ávila' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Bolivia',              (SELECT id FROM geo_regions WHERE level='province' AND name='Ciego de Ávila' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Chambas',              (SELECT id FROM geo_regions WHERE level='province' AND name='Ciego de Ávila' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Ciego de Ávila',      (SELECT id FROM geo_regions WHERE level='province' AND name='Ciego de Ávila' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Ciro Redondo',         (SELECT id FROM geo_regions WHERE level='province' AND name='Ciego de Ávila' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Florencia',            (SELECT id FROM geo_regions WHERE level='province' AND name='Ciego de Ávila' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Majagua',              (SELECT id FROM geo_regions WHERE level='province' AND name='Ciego de Ávila' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Morón',                (SELECT id FROM geo_regions WHERE level='province' AND name='Ciego de Ávila' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Primero de Enero',     (SELECT id FROM geo_regions WHERE level='province' AND name='Ciego de Ávila' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Venezuela',            (SELECT id FROM geo_regions WHERE level='province' AND name='Ciego de Ávila' AND country_code='CU'), TRUE;

-- Municipios de Camagüey
INSERT INTO geo_regions (country_code, level, name, parent_id, active)
SELECT 'CU', 'municipality', 'Camagüey',              (SELECT id FROM geo_regions WHERE level='province' AND name='Camagüey' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Carlos Manuel de Céspedes', (SELECT id FROM geo_regions WHERE level='province' AND name='Camagüey' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Esmeralda',            (SELECT id FROM geo_regions WHERE level='province' AND name='Camagüey' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Florida',              (SELECT id FROM geo_regions WHERE level='province' AND name='Camagüey' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Guáimaro',             (SELECT id FROM geo_regions WHERE level='province' AND name='Camagüey' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Jimaguayú',            (SELECT id FROM geo_regions WHERE level='province' AND name='Camagüey' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Minas',                (SELECT id FROM geo_regions WHERE level='province' AND name='Camagüey' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Najasa',               (SELECT id FROM geo_regions WHERE level='province' AND name='Camagüey' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Nuevitas',             (SELECT id FROM geo_regions WHERE level='province' AND name='Camagüey' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Santa Cruz del Sur',   (SELECT id FROM geo_regions WHERE level='province' AND name='Camagüey' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Sibanicú',             (SELECT id FROM geo_regions WHERE level='province' AND name='Camagüey' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Sierra de Cubitas',    (SELECT id FROM geo_regions WHERE level='province' AND name='Camagüey' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Vertientes',           (SELECT id FROM geo_regions WHERE level='province' AND name='Camagüey' AND country_code='CU'), TRUE;

-- Municipios de Las Tunas
INSERT INTO geo_regions (country_code, level, name, parent_id, active)
SELECT 'CU', 'municipality', 'Amancio',              (SELECT id FROM geo_regions WHERE level='province' AND name='Las Tunas' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Colombia',             (SELECT id FROM geo_regions WHERE level='province' AND name='Las Tunas' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Jesús Menéndez',      (SELECT id FROM geo_regions WHERE level='province' AND name='Las Tunas' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Jobabo',              (SELECT id FROM geo_regions WHERE level='province' AND name='Las Tunas' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Las Tunas',           (SELECT id FROM geo_regions WHERE level='province' AND name='Las Tunas' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Majibacoa',           (SELECT id FROM geo_regions WHERE level='province' AND name='Las Tunas' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Manatí',              (SELECT id FROM geo_regions WHERE level='province' AND name='Las Tunas' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Puerto Padre',        (SELECT id FROM geo_regions WHERE level='province' AND name='Las Tunas' AND country_code='CU'), TRUE;

-- Municipios de Holguín
INSERT INTO geo_regions (country_code, level, name, parent_id, active)
SELECT 'CU', 'municipality', 'Antilla',              (SELECT id FROM geo_regions WHERE level='province' AND name='Holguín' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Báguanos',             (SELECT id FROM geo_regions WHERE level='province' AND name='Holguín' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Banes',                (SELECT id FROM geo_regions WHERE level='province' AND name='Holguín' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Cacocum',              (SELECT id FROM geo_regions WHERE level='province' AND name='Holguín' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Calixto García',       (SELECT id FROM geo_regions WHERE level='province' AND name='Holguín' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Cueto',                (SELECT id FROM geo_regions WHERE level='province' AND name='Holguín' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Frank País',           (SELECT id FROM geo_regions WHERE level='province' AND name='Holguín' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Gibara',               (SELECT id FROM geo_regions WHERE level='province' AND name='Holguín' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Holguín',              (SELECT id FROM geo_regions WHERE level='province' AND name='Holguín' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Mayarí',               (SELECT id FROM geo_regions WHERE level='province' AND name='Holguín' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Moa',                  (SELECT id FROM geo_regions WHERE level='province' AND name='Holguín' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Rafael Freyre',        (SELECT id FROM geo_regions WHERE level='province' AND name='Holguín' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Sagua de Tánamo',     (SELECT id FROM geo_regions WHERE level='province' AND name='Holguín' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Urbano Noris',         (SELECT id FROM geo_regions WHERE level='province' AND name='Holguín' AND country_code='CU'), TRUE;

-- Municipios de Granma
INSERT INTO geo_regions (country_code, level, name, parent_id, active)
SELECT 'CU', 'municipality', 'Bartolomé Masó',       (SELECT id FROM geo_regions WHERE level='province' AND name='Granma' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Bayamo',               (SELECT id FROM geo_regions WHERE level='province' AND name='Granma' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Buey Arriba',          (SELECT id FROM geo_regions WHERE level='province' AND name='Granma' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Campechuela',          (SELECT id FROM geo_regions WHERE level='province' AND name='Granma' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Cauto Cristo',         (SELECT id FROM geo_regions WHERE level='province' AND name='Granma' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Guisa',                (SELECT id FROM geo_regions WHERE level='province' AND name='Granma' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Jiguaní',              (SELECT id FROM geo_regions WHERE level='province' AND name='Granma' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Manzanillo',           (SELECT id FROM geo_regions WHERE level='province' AND name='Granma' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Media Luna',           (SELECT id FROM geo_regions WHERE level='province' AND name='Granma' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Niquero',              (SELECT id FROM geo_regions WHERE level='province' AND name='Granma' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Pilón',                (SELECT id FROM geo_regions WHERE level='province' AND name='Granma' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Río Cauto',            (SELECT id FROM geo_regions WHERE level='province' AND name='Granma' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Yara',                 (SELECT id FROM geo_regions WHERE level='province' AND name='Granma' AND country_code='CU'), TRUE;

-- Municipios de Santiago de Cuba
INSERT INTO geo_regions (country_code, level, name, parent_id, active)
SELECT 'CU', 'municipality', 'Contramaestre',        (SELECT id FROM geo_regions WHERE level='province' AND name='Santiago de Cuba' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Guamá',                (SELECT id FROM geo_regions WHERE level='province' AND name='Santiago de Cuba' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Mella',                (SELECT id FROM geo_regions WHERE level='province' AND name='Santiago de Cuba' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Palma Soriano',        (SELECT id FROM geo_regions WHERE level='province' AND name='Santiago de Cuba' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'San Luis',             (SELECT id FROM geo_regions WHERE level='province' AND name='Santiago de Cuba' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Santiago de Cuba',     (SELECT id FROM geo_regions WHERE level='province' AND name='Santiago de Cuba' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Segundo Frente',       (SELECT id FROM geo_regions WHERE level='province' AND name='Santiago de Cuba' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Songo-La Maya',        (SELECT id FROM geo_regions WHERE level='province' AND name='Santiago de Cuba' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Tercer Frente',        (SELECT id FROM geo_regions WHERE level='province' AND name='Santiago de Cuba' AND country_code='CU'), TRUE;

-- Municipios de Guantánamo
INSERT INTO geo_regions (country_code, level, name, parent_id, active)
SELECT 'CU', 'municipality', 'Baracoa',              (SELECT id FROM geo_regions WHERE level='province' AND name='Guantánamo' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Caimanera',           (SELECT id FROM geo_regions WHERE level='province' AND name='Guantánamo' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'El Salvador',          (SELECT id FROM geo_regions WHERE level='province' AND name='Guantánamo' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Guantánamo',           (SELECT id FROM geo_regions WHERE level='province' AND name='Guantánamo' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Imías',                (SELECT id FROM geo_regions WHERE level='province' AND name='Guantánamo' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Maisí',                (SELECT id FROM geo_regions WHERE level='province' AND name='Guantánamo' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Manuel Tames',         (SELECT id FROM geo_regions WHERE level='province' AND name='Guantánamo' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Niceto Pérez',         (SELECT id FROM geo_regions WHERE level='province' AND name='Guantánamo' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'San Antonio del Sur',  (SELECT id FROM geo_regions WHERE level='province' AND name='Guantánamo' AND country_code='CU'), TRUE
UNION ALL SELECT 'CU', 'municipality', 'Yateras',              (SELECT id FROM geo_regions WHERE level='province' AND name='Guantánamo' AND country_code='CU'), TRUE;

-- Municipio de Isla de la Juventud (especial)
INSERT INTO geo_regions (country_code, level, name, parent_id, active)
SELECT 'CU', 'municipality', 'Isla de la Juventud',  (SELECT id FROM geo_regions WHERE level='province' AND name='Isla de la Juventud' AND country_code='CU'), TRUE;

-- System setting for default country
INSERT INTO system_settings (key, value, value_type, is_public, description)
VALUES ('geo.default-country', 'CU', 'string', TRUE, 'Código ISO 3166-1 alpha-2 del país por defecto para direcciones estructuradas')
ON CONFLICT (key) DO NOTHING;
