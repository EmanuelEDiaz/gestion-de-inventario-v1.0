'use client';

import { ExternalLink, Trash2 } from '@/presentation/shared/components/ui/icon-mapping';
import { SOCIAL_PLATFORM_LABELS, type SocialPlatform } from '@/core/supplier/entities/supplier-social-link';

interface SocialLinkItemProps {
  link: {
    id: string;
    platform: string;
    url: string;
    label?: string | null;
  };
  onRemove: (linkId: string) => void;
}

export function SocialLinkItem({ link, onRemove }: SocialLinkItemProps) {
  return (
    <li className="flex items-center justify-between rounded-lg border px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs font-semibold text-gray-500 uppercase w-20 shrink-0">
          {SOCIAL_PLATFORM_LABELS[link.platform as SocialPlatform]}
        </span>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-sm truncate hover:underline"
          title={link.url}
        >
          {link.label || link.url}
        </a>
        <ExternalLink className="h-3 w-3 text-gray-400 shrink-0" />
      </div>
      <button
        className="ml-2 p-1 rounded hover:bg-red-50"
        onClick={() => onRemove(link.id)}
        title="Eliminar enlace"
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </button>
    </li>
  );
}
