'use client';

interface CreateImagePreviewProps {
  src: string;
  alt: string;
}

export function CreateImagePreview({ src, alt }: CreateImagePreviewProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-black/5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <span className="absolute left-3 top-3 rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-amber-950">
        Principal
      </span>
    </div>
  );
}
