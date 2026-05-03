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

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: Placement;
  delay?: number;
  className?: string;
}

const Tooltip = memo(
  forwardRef<HTMLSpanElement, TooltipProps>(function Tooltip(
    { content, children, placement = 'top', delay = 300, className },
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
      if (floatingRef.current) {
        refs.setFloating(floatingRef.current);
      }
    }, [isOpen, refs]);

    const hover = useHover(context, {
      move: false,
      delay: { open: delay, close: 0 },
    });

    const focus = useFocus(context);
    const dismiss = useDismiss(context);
    const role = useRole(context, { role: 'tooltip' });

    const { getReferenceProps, getFloatingProps } = useInteractions([
      hover,
      focus,
      dismiss,
      role,
    ]);

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
                'z-50 max-w-xs rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg',
                'animate-in fade-in-0 zoom-in-95 duration-200',
                'data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95',
                'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
                'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                className
              )}
              style={floatingStyles}
              {...getFloatingProps()}
              data-side={placement.split('-')[0]}
              data-closed=""
            >
              {content}
            </div>,
            document.body
          )}
      </>
    );
  })
);

interface TooltipWrapperProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delayDuration?: number;
}

function TooltipWrapper({ content, children, side = 'top', delayDuration = 300 }: TooltipWrapperProps) {
  const placementMap: Record<string, Placement> = {
    top: 'top',
    right: 'right',
    bottom: 'bottom',
    left: 'left',
  };

  return (
    <Tooltip content={content} placement={placementMap[side]} delay={delayDuration}>
      {children}
    </Tooltip>
  );
}

export { Tooltip, TooltipWrapper };