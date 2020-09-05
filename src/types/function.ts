import { RuntypeBase, create, RuntypeHelpers } from '../runtype';

export interface FunctionBase extends RuntypeBase<(...args: any[]) => any> {
  readonly tag: 'function';
}
export interface Function extends RuntypeHelpers<(...args: any[]) => any>, FunctionBase {}

/**
 * Construct a runtype for functions.
 */
export const Function: Function = create<Function>(
  value =>
    typeof value === 'function'
      ? { success: true, value }
      : {
          success: false,
          message: `Expected function, but was ${value === null ? value : typeof value}`,
        },
  { tag: 'function' },
);
