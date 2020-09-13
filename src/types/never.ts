import { Codec, create } from '../runtype';
import showValue from '../showValue';

export interface Never extends Codec<never> {
  readonly tag: 'never';
}

/**
 * Validates nothing (unknown fails).
 */
export const Never: Never = create(
  value => ({
    success: false,
    message: `Expected nothing, but was ${showValue(value)}`,
  }),
  { tag: 'never' },
) as any;
