/** Plataformas de redes sociales disponibles para proveedores */
export type SocialPlatform =
  | 'WHATSAPP'
  | 'TELEGRAM'
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'TIKTOK'
  | 'WEBSITE'
  | 'OTHER';

export interface SupplierSocialLink {
  id: string;
  supplierId: string;
  platform: SocialPlatform;
  url: string;
  label: string | null;
  sortOrder: number;
}

export interface AddSupplierSocialLinkData {
  platform: SocialPlatform;
  url: string;
  label?: string;
  sortOrder?: number;
}

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  WHATSAPP: 'WhatsApp',
  TELEGRAM: 'Telegram',
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  TIKTOK: 'TikTok',
  WEBSITE: 'Sitio web',
  OTHER: 'Otro',
};
