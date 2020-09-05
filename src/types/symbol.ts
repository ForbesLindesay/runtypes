import { RuntypeBase, RuntypeHelpers, create } from '../runtype';

export interface SymbolBase extends RuntypeBase<symbol> {
  readonly tag: 'symbol';
}
interface Sym extends RuntypeHelpers<symbol>, SymbolBase {}

/**
 * Validates that a value is a symbol.
 */
const Sym: Sym = create<Sym>(
  value =>
    typeof value === 'symbol'
      ? { success: true, value }
      : {
          success: false,
          message: `Expected symbol, but was ${value === null ? value : typeof value}`,
        },
  { tag: 'symbol' },
);

export { Sym as Symbol };
