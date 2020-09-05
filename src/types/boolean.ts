import { create, RuntypeHelpers } from '../runtype';

export interface Boolean extends RuntypeHelpers<boolean> {
  readonly tag: 'boolean';
}

/**
 * Validates that a value is a boolean.
 */
export const Boolean: Boolean = create<Boolean>(
  value =>
    typeof value === 'boolean'
      ? { success: true, value }
      : {
          success: false,
          message: `Expected boolean, but was ${value === null ? value : typeof value}`,
        },
  { tag: 'boolean' },
);
