'use client';

import { useState, forwardRef, useRef, memo, useEffect } from 'react';
import {
  useFloating,
  useHover,
  useFocus,
  useRole,
  useDismiss,
  useInteractions,
  autoUpdate,
  offset,
  flip,
  shift,
  type Placement,
} from '@floating-ui/react';
import { createPortal } from 'react-dom';
import { cn } from '@/presentation/shared/lib/utils';

// ─── Variant system ──────────────────────────────────────────────────────────

export type TooltipVariant = 'default' | 'info' | 'help' | 'tip' | 'warning';

/** SVG paths for Material Symbols icons */
const VARIANT_PATHS: Record<Exclude<TooltipVariant, 'default'>, string> = {
  info:    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
  help:    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z',
  tip:     'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z',
  warning: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
};

const VARIANT_COLORS: Record<Exclude<TooltipVariant, 'default'>, string> = {
  info:    'text-blue-400',
  help:    'text-violet-400',
  tip:     'text-amber-400',
  warning: 'text-orange-400',
};

function VariantIcon({ variant }: { variant: Exclude<TooltipVariant, 'default'> }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('mt-0.5 shrink-0', VARIANT_COLORS[variant])}
      aria-hidden
    >
      <path d={VARIANT_PATHS[variant]} />
    </svg>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(text).then(() => {
        setCopied(true); setTimeout(() => setCopied(false), 1500);
      })}
      className="ml-auto shrink-0 rounded p-1 hover:bg-white/10 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
      aria-label="Copiar texto"
    >
      {copied ? <span className="text-green-400 text-xs">✅</span> : <span className="text-gray-400 text-xs">📋</span>}
    </button>
  );
}

// ─── Rich content renderer ────────────────────────────────────────────────────

interface TooltipBody {
  content: React.ReactNode;
  description?: string;
  variant?: TooltipVariant;
  sectionIcon?: React.ReactNode;
  sectionName?: string;
  copyText?: string;
}

function TooltipBody({ content, description, variant, sectionIcon, sectionName, copyText }: TooltipBody) {
  const showIcon = variant && variant !== 'default';

  if (!showIcon && !description && !sectionIcon && !copyText) {
    return <>{content}</>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {sectionIcon && sectionName && (
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-400">
          {sectionIcon}
          <span>{sectionName}</span>
        </div>
      )}
      <div className="flex items-start gap-1.5">
        {showIcon && <VariantIcon variant={variant as Exclude<TooltipVariant, 'default'>} />}
        <span className="font-medium leading-tight">{content}</span>
        {copyText && <CopyButton text={copyText} />}
      </div>
      {description && (
        <>
          <div className="h-px bg-white/10" />
          <p className="text-xs leading-snug text-gray-300">{description}</p>
        </>
      )}
    </div>
  );
}

// ─── Core Tooltip ─────────────────────────────────────────────────────────────

interface TooltipProps {
  content: React.ReactNode;
  description?: string;
  variant?: TooltipVariant;
  children: React.ReactNode;
  placement?: Placement;
  delay?: number;
  className?: string;
  sectionIcon?: React.ReactNode;
  sectionName?: string;
  copyText?: string;
}

const Tooltip = memo(
  forwardRef<HTMLSpanElement, TooltipProps>(function Tooltip(
    { content, description, variant = 'default', children, placement = 'top', delay = 300, className, sectionIcon, sectionName, copyText },
    ref
  ) {
    const [isOpen, setIsOpen] = useState(false);
    const floatingRef = useRef<HTMLDivElement>(null);
    const { refs, floatingStyles, context } = useFloating({
      open: isOpen,
      onOpenChange: setIsOpen,
      placement,
      middleware: [
        offset(8),
        flip({ fallbackAxisSideDirection: 'start' }),
        shift({ padding: 8 }),
      ],
      whileElementsMounted: autoUpdate,
    });

    useEffect(() => {
      if (floatingRef.current) refs.setFloating(floatingRef.current);
    }, [isOpen, refs]);

    const hover   = useHover(context, { move: false, delay: { open: delay, close: 0 } });
    const focus   = useFocus(context);
    const dismiss = useDismiss(context);
    const role    = useRole(context, { role: 'tooltip' });

    const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role]);

    const isRich = Boolean(description) || (variant && variant !== 'default');

    return (
      <>
        <span ref={ref} {...getReferenceProps()}>
          {children}
        </span>
        {isOpen &&
          createPortal(
            <div
              ref={floatingRef}
              className={cn(
                'z-50 rounded-lg shadow-xl ring-1 ring-white/10',
                'animate-in fade-in-0 zoom-in-95 duration-150',
                isRich
                  ? 'max-w-[220px] bg-gray-900/95 px-3.5 py-2.5 text-sm text-white'
                  : 'max-w-xs bg-gray-900/95 px-2.5 py-1.5 text-xs text-white',
                className
              )}
              style={floatingStyles}
              {...getFloatingProps()}
            >
              <TooltipBody content={content} description={description} variant={variant} sectionIcon={sectionIcon} sectionName={sectionName} copyText={copyText} />
            </div>,
            document.body
          )}
      </>
    );
  })
);

// ─── TooltipWrapper ───────────────────────────────────────────────────────────

interface TooltipWrapperProps {
  content: React.ReactNode;
  description?: string;
  variant?: TooltipVariant;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delayDuration?: number;
  sectionIcon?: React.ReactNode;
  sectionName?: string;
  copyText?: string;
}

function TooltipWrapper({
  content,
  description,
  variant,
  children,
  side = 'top',
  delayDuration = 300,
  sectionIcon,
  sectionName,
  copyText,
}: TooltipWrapperProps) {
  const placementMap: Record<string, Placement> = {
    top: 'top', right: 'right', bottom: 'bottom', left: 'left',
  };

  return (
    <Tooltip
      content={content}
      description={description}
      variant={variant}
      placement={placementMap[side]}
      delay={delayDuration}
      sectionIcon={sectionIcon}
      sectionName={sectionName}
      copyText={copyText}
    >
      {children}
    </Tooltip>
  );
}

// ─── TooltipHint ──────────────────────────────────────────────────────────────
// Inline icon button that triggers a rich tooltip on hover.
// Use for contextual help inside UI — no extra state needed in the parent.

type HintVariant = Exclude<TooltipVariant, 'default'>;

export interface TooltipHintProps {
  title: string;
  description?: string;
  variant?: HintVariant;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

const HINT_COLORS: Record<HintVariant, string> = {
  info:    'text-gray-500 hover:text-blue-400',
  help:    'text-gray-500 hover:text-violet-400',
  tip:     'text-gray-500 hover:text-amber-400',
  warning: 'text-gray-500 hover:text-orange-400',
};

export function TooltipHint({
  title,
  description,
  variant = 'info',
  side = 'right',
  className,
}: TooltipHintProps) {
  return (
    <TooltipWrapper
      content={title}
      description={description}
      variant={variant}
      side={side}
      delayDuration={250}
    >
      <button
        type="button"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'inline-flex items-center justify-center rounded p-0.5 transition-colors',
          HINT_COLORS[variant],
          className
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d={VARIANT_PATHS[variant]} />
        </svg>
      </button>
    </TooltipWrapper>
  );
}

export { Tooltip, TooltipWrapper };