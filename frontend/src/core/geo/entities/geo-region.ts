export interface GeoRegion {
  id: string;
  countryCode: string;
  level: 'country' | 'province' | 'municipality';
  name: string;
  latitude?: number;
  longitude?: number;
  active: boolean;
}

export interface ProvinceOption {
  id: string;
  name: string;
}

export interface MunicipalityOption {
  id: string;
  name: string;
}
