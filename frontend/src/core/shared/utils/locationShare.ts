export interface ShareablePlace {
  name: string;
  lat: number;
  lng: number;
  address?: string;
}

export interface ShareLinks {
  googleMaps: string;
  waze: string;
  whatsapp: string;
  copyText: string;
}

export function buildShareLinks(place: ShareablePlace): ShareLinks {
  const mapsUrl = `https://maps.google.com/?q=${place.lat},${place.lng}`;
  return {
    googleMaps: mapsUrl,
    waze: `https://waze.com/ul?ll=${place.lat},${place.lng}&navigate=yes`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`📍 ${place.name}${place.address ? ' — ' + place.address : ''}: ${mapsUrl}`)}`,
    copyText: `${place.name} — ${place.address ?? `${place.lat},${place.lng}`} — ${mapsUrl}`,
  };
}
