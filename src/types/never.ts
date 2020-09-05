import { RuntypeHelpers, create } from '../runtype';

export interface Never extends RuntypeHelpers<never> {
  readonly tag: 'never';
}

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
