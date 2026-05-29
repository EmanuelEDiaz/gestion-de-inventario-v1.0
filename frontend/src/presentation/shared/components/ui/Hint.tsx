'use client';

import { TooltipHint } from './tooltip';
import type { TooltipHintProps } from './tooltip';

export type HintProps = TooltipHintProps;

export function Hint(props: HintProps) {
  return <TooltipHint {...props} />;
}
