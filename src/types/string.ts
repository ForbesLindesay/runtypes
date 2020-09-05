import { RuntypeBase, create, RuntypeHelpers } from '../runtype';

export interface StringBase extends RuntypeBase<string> {
  readonly tag: 'string';
}

export interface String extends RuntypeHelpers<string>, StringBase {}

/**
 * Validates that a value is a string.
 */
export const String: String = create<String>(
  value =>
    typeof value === 'string'
      ? { success: true, value }
      : {
          success: false,
          message: `Expected string, but was ${value === null ? value : typeof value}`,
        },
  { tag: 'string' },
);
