import { RuntypeHelpers, create, RuntypeBase } from '../runtype';

export interface NeverBase extends RuntypeBase<never> {
  readonly tag: 'never';
}
export interface Never extends RuntypeHelpers<never>, NeverBase {}

/**
 * Validates nothing (unknown fails).
 */
export const Never: Never = create<Never>(
  value => ({
    success: false,
    message: `Expected nothing, but was ${value === null ? value : typeof value}`,
  }),
  { tag: 'never' },
);
