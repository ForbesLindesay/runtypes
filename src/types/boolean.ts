import { RuntypeBase, create, RuntypeHelpers } from '../runtype';

export interface BooleanBase extends RuntypeBase<boolean> {
  readonly tag: 'boolean';
}
export interface Boolean extends RuntypeHelpers<boolean>, BooleanBase {}

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
