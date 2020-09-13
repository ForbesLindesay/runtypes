import { create, Codec } from '../runtype';
import showValue from '../showValue';

export interface String extends Codec<string> {
  readonly tag: 'string';
}

/**
 * Validates that a value is a string.
 */
export const String: String = create<String>(
  value =>
    typeof value === 'string'
      ? { success: true, value }
      : {
          success: false,
          message: `Expected string, but was ${showValue(value)}`,
        },
  { tag: 'string' },
);
