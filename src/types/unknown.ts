import { RuntypeBase, RuntypeHelpers, create } from '../runtype';

export interface UnknownBase extends RuntypeBase<unknown> {
  readonly tag: 'unknown';
}
export interface Unknown extends RuntypeHelpers<unknown>, UnknownBase {}

/**
 * Validates anything, but provides no new type information about it.
 */
export const Unknown: Unknown = create<Unknown>(value => ({ success: true, value }), {
  tag: 'unknown',
});
