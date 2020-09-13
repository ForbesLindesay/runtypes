import { create, Codec } from '../runtype';
import showValue from '../showValue';

export interface Function extends Codec<(...args: any[]) => any> {
  readonly tag: 'function';
}

/**
 * Construct a runtype for functions.
 */
export const Function: Function = create<Function>(
  value =>
    typeof value === 'function'
      ? { success: true, value }
      : {
          success: false,
          message: `Expected function, but was ${showValue(value)}`,
        },
  { tag: 'function' },
);
