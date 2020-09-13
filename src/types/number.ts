import { Codec, create } from '../runtype';
import { showValueNonString } from '../showValue';

export interface Number extends Codec<number> {
  readonly tag: 'number';
}

/**
 * Validates that a value is a number.
 */
export const Number: Number = create<Number>(
  value =>
    typeof value === 'number'
      ? { success: true, value }
      : {
          success: false,
          message: `Expected number, but was ${showValueNonString(value)}`,
        },
  { tag: 'number' },
);
